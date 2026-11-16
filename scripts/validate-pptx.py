#!/usr/bin/env python3
"""
Forte Advice Design System — PowerPoint Validation

Validates a .pptx against tokens.json. Two modes:

  python3 scripts/validate-pptx.py                 # the templates in tokens.powerpoint.templates
  python3 scripts/validate-pptx.py my-deck.pptx    # any deck you have built

Checks, in both modes:
  1. The file exists and is a valid zip archive
  2. The slide master's colour scheme matches tokens.powerpoint.theme
  3. The theme fonts match tokens.powerpoint.fonts (Aptos / Aptos Display)
  4. No slide hardcodes a Latin font other than the theme fonts (rule 4)
  5. No slide hardcodes a colour outside the brand palette (rule 5)

Deck mode additionally checks:
  7. No slide still carries the template's filler text

Template mode additionally checks:
  6. Slide position == slideN.xml filename, so the example-slide index in
     powerpoint.md can be used directly as filenames when building a deck

Checks 4 and 5 are what make this useful on a deck rather than only on the
templates: the theme can be perfect while a pasted-in slide carries Calibri
and an off-brand hex. They read the slide XML directly, because a hardcoded
run property is exactly what python-pptx's object model hides behind
inheritance.

Exits non-zero on any mismatch, so it can run in CI alongside validate.js.
"""
import json
import os
import re
import sys
import xml.etree.ElementTree as ET
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

A = "{http://schemas.openxmlformats.org/drawingml/2006/main}"
MC = "{http://schemas.openxmlformats.org/markup-compatibility/2006}"
P = "{http://schemas.openxmlformats.org/presentationml/2006/main}"
R = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"

# Subtrees that never render. `mc:AlternateContent` holds fallbacks for other
# renderers and `a:extLst` holds application extensions such as a14:hiddenLine —
# the templates carry 3886 off-palette greys in there, none of them visible.
# Linting them would be 3886 false positives.
SKIP_SUBTREES = {f"{MC}AlternateContent", f"{A}extLst"}

SLIDE_RE = re.compile(r"^ppt/slides/slide(\d+)\.xml$")

errors = 0


def error(msg):
    global errors
    print(f"  ✗ ERROR: {msg}")
    errors += 1


def ok(msg):
    print(f"  ✓ {msg}")


def master_theme_xml(z):
    """Resolve the theme part referenced by slideMaster1 (not notes/handout themes)."""
    rels = z.read("ppt/slideMasters/_rels/slideMaster1.xml.rels").decode("utf-8")
    m = re.search(r'Target="\.\./theme/(theme\d+\.xml)"', rels)
    if not m:
        raise ValueError("slideMaster1 has no theme relationship")
    return z.read(f"ppt/theme/{m.group(1)}").decode("utf-8")


def visible_elements(root):
    """Walk the tree, skipping subtrees that never render."""
    if root.tag in SKIP_SUBTREES:
        return
    yield root
    for child in root:
        yield from visible_elements(child)


# ---------------------------------------------------------------------------
# 2 + 3. Theme colour scheme and fonts
# ---------------------------------------------------------------------------


def check_theme(z, expected_theme, expected_fonts):
    xml = master_theme_xml(z)

    scheme = re.search(r"<a:clrScheme.*?</a:clrScheme>", xml, re.S).group(0)
    slots = re.findall(r"<a:(\w+)><a:srgbClr val=\"([0-9A-Fa-f]{6})\"/></a:\1>", scheme)
    actual = {slot: f"#{val.upper()}" for slot, val in slots}

    mismatches = []
    for slot, expected in expected_theme.items():
        got = actual.get(slot)
        if got is None:
            mismatches.append(f"{slot}: missing (expected {expected})")
        elif got.upper() != expected.upper():
            mismatches.append(f"{slot}: {got} (tokens.json says {expected})")
    for slot in actual:
        if slot not in expected_theme:
            mismatches.append(f"{slot}: {actual[slot]} not declared in tokens.powerpoint.theme")

    if mismatches:
        for m in mismatches:
            error(f"color scheme — {m}")
    else:
        ok(f"color scheme matches tokens.powerpoint.theme ({len(expected_theme)} slots)")

    major = re.search(r"<a:majorFont><a:latin typeface=\"([^\"]+)\"", xml)
    minor = re.search(r"<a:minorFont><a:latin typeface=\"([^\"]+)\"", xml)
    for label, match, expected in [("major", major, expected_fonts["major"]),
                                   ("minor", minor, expected_fonts["minor"])]:
        got = match.group(1) if match else None
        if got != expected:
            error(f"{label} font is \"{got}\", expected \"{expected}\"")
        else:
            ok(f"{label} font: {got}")


# ---------------------------------------------------------------------------
# 4 + 5. Per-slide font and colour lint
# ---------------------------------------------------------------------------


def check_slides(z, allowed_fonts, allowed_colors):
    slides = sorted(
        (n for n in z.namelist() if SLIDE_RE.match(n)),
        key=lambda n: int(SLIDE_RE.match(n).group(1)),
    )
    if not slides:
        error("no slides found in ppt/slides/")
        return

    bad_fonts = {}   # slide number -> {font: count}
    bad_colors = {}  # slide number -> {hex: count}

    for name in slides:
        num = int(SLIDE_RE.match(name).group(1))
        root = ET.fromstring(z.read(name))

        for el in visible_elements(root):
            # Only a:latin is checked. a:ea and a:cs are the East Asian and
            # complex-script fallbacks, which PowerPoint fills in on its own
            # and which do not set the font a reader sees.
            if el.tag == f"{A}latin":
                face = el.get("typeface", "")
                # "+mn-lt" / "+mj-lt" are references to the theme fonts, which
                # is exactly what we want slides to use.
                if face and not face.startswith("+") and face not in allowed_fonts:
                    bad_fonts.setdefault(num, {}).setdefault(face, 0)
                    bad_fonts[num][face] += 1
            elif el.tag == f"{A}srgbClr":
                val = (el.get("val") or "").upper()
                if val and val not in allowed_colors:
                    bad_colors.setdefault(num, {}).setdefault(val, 0)
                    bad_colors[num][val] += 1

    if bad_fonts:
        for num in sorted(bad_fonts):
            faces = ", ".join(f"{f} ({n} runs)" for f, n in sorted(bad_fonts[num].items()))
            error(f"slide {num} hardcodes a non-theme font: {faces}")
    else:
        ok(f"{len(slides)} slides use the theme fonts only")

    if bad_colors:
        for num in sorted(bad_colors):
            vals = ", ".join(f"#{c} ({n}x)" for c, n in sorted(bad_colors[num].items()))
            error(f"slide {num} hardcodes an off-palette colour: {vals}")
    else:
        ok(f"{len(slides)} slides use palette colours only")


# ---------------------------------------------------------------------------
# 7. Leftover template filler (decks only)
#
# The templates' example slides carry 158 distinct filler strings, and a lot of
# that text sits outside placeholders: 21 of the 33 non-placeholder text boxes
# are inside group shapes (the case cards on IMAGE: Four images and
# FOCUS x 4: Images), where OOXML does not allow placeholders at all, and 7 more
# are on BLANK: Burgundy, whose layout has no content placeholders to use. So an
# agent that dutifully fills slide.placeholders[idx] and stops will ship
# "Name Namesen" and "Caborepe porum exerume" in the finished deck. This is the
# check that catches that.
#
# It matches filler vocabulary rather than the template's exact strings, on
# purpose. The templates also contain real client names — Metro, Flokk,
# Hus Forbi, Hærvejen — and a deck about Metro should not fail for saying Metro.
# ---------------------------------------------------------------------------

FILLER_WORDS = re.compile(
    r"""(?ix)(
    lorem|ipsum|dolor|consectetur|adipiscing|donec|mauris|pharetra|dapibus|turpis|
    ullamcorper|rhoncus|nibh|facilisis|caborepe|porum|exerume|nobitio|nsequos|
    dellat|duntese|aspit|modignit|vollore|venditatur|sequasped|volorep|erspero|
    vidundic|quodignim|cuptasp|icabore|hendis|dipsam|cullania|eicae|moloriam|
    voluptio|voluptatume|fugiae|volorestis|evenditati|restect|incitae|molla|
    expliqu|aepella|boribus|consed|consequi|namesen|quisquis|dolupta|quatem|
    doluptati|iuntibus|nihita|incidunct|risus\s*enim|sit\s*amet
    )"""
)

FILLER_STUBS = re.compile(
    r"""(?ix)^(
    title(\s*\d+)?|titel|subtitle|client\s*name\s*/\s*project\s*name|category\s*tag|
    (first|second|third|fourth|fifth|sixth|seventh|eighth)\s+agenda|
    insert\s+short\s+one\s+liner.*|
    .*direct\s+quotation\s+or\s+data\s+value.*
    )$"""
)

# Footer, date and slide-number placeholders are template furniture, not content
# anyone is expected to rewrite.
FURNITURE = {"sldNum", "dt", "ftr"}


def check_leftover_filler(z):
    slides = sorted(
        (n for n in z.namelist() if SLIDE_RE.match(n)),
        key=lambda n: int(SLIDE_RE.match(n).group(1)),
    )

    found = {}  # slide number -> [text, ...]
    for name in slides:
        num = int(SLIDE_RE.match(name).group(1))
        root = ET.fromstring(z.read(name))

        # Every paragraph on the slide, not just the ones directly inside a
        # p:sp — the agenda is an a:tbl inside a p:graphicFrame, and the case
        # cards are p:sp nested in p:grpSp. Both hold text that must be replaced.
        furniture_paras = set()
        for sp in root.iter(f"{P}sp"):
            ph = sp.find(f"{P}nvSpPr/{P}nvPr/{P}ph")
            if ph is not None and ph.get("type") in FURNITURE:
                furniture_paras.update(id(para) for para in sp.iter(f"{A}p"))

        for para in root.iter(f"{A}p"):
            if id(para) in furniture_paras:
                continue
            text = "".join(t.text or "" for t in para.iter(f"{A}t")).strip()
            if not text:
                continue
            if FILLER_WORDS.search(text) or FILLER_STUBS.match(text):
                found.setdefault(num, []).append(text)

    if not found:
        ok(f"{len(slides)} slides carry no leftover template text")
        return

    for num in sorted(found):
        texts = found[num]
        shown = "; ".join(f'"{t[:48]}"' for t in texts[:3])
        more = f" (+{len(texts) - 3} more)" if len(texts) > 3 else ""
        error(f"slide {num} still has template filler text: {shown}{more}")


# ---------------------------------------------------------------------------
# 6. Slide position == filename (templates only)
# ---------------------------------------------------------------------------


def check_slide_order(z):
    """
    powerpoint.md's example-slide index is written in slide positions, but the
    deck-building workflow addresses slides by filename (ppt/slides/slideN.xml).
    Those agree today. If a round-trip through PowerPoint ever renumbers the
    parts, the index silently starts pointing at the wrong slides, so it is
    worth asserting rather than assuming.
    """
    rels = z.read("ppt/_rels/presentation.xml.rels").decode("utf-8")
    rid_to_file = dict(re.findall(r'Id="(rId\d+)"[^>]*Target="slides/(slide\d+\.xml)"', rels))

    pres = ET.fromstring(z.read("ppt/presentation.xml"))
    sld_id_lst = pres.find(f"{P}sldIdLst")
    if sld_id_lst is None:
        error("presentation.xml has no sldIdLst")
        return

    mismatches = []
    for position, sld_id in enumerate(sld_id_lst, start=1):
        rid = sld_id.get(f"{R}id")
        filename = rid_to_file.get(rid)
        if filename != f"slide{position}.xml":
            mismatches.append(f"position {position} -> {filename}")

    if mismatches:
        shown = ", ".join(mismatches[:5])
        more = f" (+{len(mismatches) - 5} more)" if len(mismatches) > 5 else ""
        error(
            f"slide position does not match filename: {shown}{more}. "
            "The example-slide index in powerpoint.md is written in positions, "
            "so regenerate it with scripts/gen-pptx-layouts.py."
        )
    else:
        ok(f"slide position matches filename for all {len(sld_id_lst)} slides")


# ---------------------------------------------------------------------------


def validate(path, tokens, is_template):
    display = os.path.relpath(path, ROOT) if path.startswith(ROOT) else path
    print(f"\n{'Template' if is_template else 'Deck'}: {display}")

    if not os.path.exists(path):
        error(f"{display} not found")
        return

    ppt = tokens["powerpoint"]
    allowed_fonts = set(ppt["fonts"].values())
    # Rule 5 is "theme colour slots only"; the primitives are allowed too, since
    # they are the same brand palette the theme slots are drawn from.
    allowed_colors = {v.upper().lstrip("#") for v in ppt["theme"].values()}
    allowed_colors |= {v.upper().lstrip("#") for v in tokens["colors"]["primitives"].values()}

    try:
        with zipfile.ZipFile(path) as z:
            if z.testzip() is not None:
                error(f"{display} is corrupt")
                return
            check_theme(z, ppt["theme"], ppt["fonts"])
            check_slides(z, allowed_fonts, allowed_colors)
            if is_template:
                # The templates are filler by design — that is what makes them
                # templates — so only a derived deck is checked for it.
                check_slide_order(z)
            else:
                check_leftover_filler(z)
    except zipfile.BadZipFile:
        error(f"{display} is not a valid .pptx (bad zip)")


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    if any(a in ("-h", "--help") for a in sys.argv[1:]):
        print(__doc__.strip())
        return

    with open(os.path.join(ROOT, "tokens.json")) as f:
        tokens = json.load(f)

    if not tokens.get("powerpoint"):
        print("  ✗ ERROR: tokens.json has no \"powerpoint\" section")
        sys.exit(1)

    if args:
        print("Validating deck(s) against tokens.json...")
        targets = [(os.path.abspath(a), False) for a in args]
    else:
        print("Validating PowerPoint templates against tokens.json...")
        targets = [(os.path.join(ROOT, p), True) for p in tokens["powerpoint"]["templates"]]

    for path, is_template in targets:
        validate(path, tokens, is_template)

    print(f"\n{'─' * 50}")
    print(f"Results: {errors} error(s)")
    if errors:
        print("\nPowerPoint validation FAILED.")
        sys.exit(1)
    print("\nPowerPoint validation PASSED.")


if __name__ == "__main__":
    main()
