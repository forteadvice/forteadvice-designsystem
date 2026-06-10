#!/usr/bin/env python3
"""
Forte Advice Design System — PowerPoint Template Validation

Checks that the .pptx templates in assets/powerpoint/ stay in sync with
tokens.json:
  1. The slide master's color scheme matches tokens.powerpoint.theme
  2. The theme fonts match tokens.powerpoint.fonts (Aptos / Aptos Display)
  3. The template files exist and are valid zip archives

Usage:
  python3 scripts/validate-pptx.py

Exits non-zero on any mismatch, so it can run in CI alongside validate.js.
"""
import json
import os
import re
import sys
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

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


def validate_template(path, expected_theme, expected_fonts):
    name = os.path.basename(path)
    print(f"\nTemplate: {name}")

    abs_path = os.path.join(ROOT, path)
    if not os.path.exists(abs_path):
        error(f"{path} not found")
        return

    with zipfile.ZipFile(abs_path) as z:
        if z.testzip() is not None:
            error(f"{name} is corrupt")
            return
        xml = master_theme_xml(z)

    # 1. Color scheme
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

    # 2. Fonts
    major = re.search(r"<a:majorFont><a:latin typeface=\"([^\"]+)\"", xml)
    minor = re.search(r"<a:minorFont><a:latin typeface=\"([^\"]+)\"", xml)
    for label, match, expected in [("major", major, expected_fonts["major"]),
                                   ("minor", minor, expected_fonts["minor"])]:
        got = match.group(1) if match else None
        if got != expected:
            error(f"{label} font is \"{got}\", expected \"{expected}\"")
        else:
            ok(f"{label} font: {got}")


def main():
    with open(os.path.join(ROOT, "tokens.json")) as f:
        tokens = json.load(f)

    ppt = tokens.get("powerpoint")
    if not ppt:
        print("  ✗ ERROR: tokens.json has no \"powerpoint\" section")
        sys.exit(1)

    print("Validating PowerPoint templates against tokens.json...")
    for path in ppt["templates"]:
        validate_template(path, ppt["theme"], ppt["fonts"])

    print(f"\n{'─' * 50}")
    print(f"Results: {errors} error(s)")
    if errors:
        print("\nPowerPoint validation FAILED.")
        sys.exit(1)
    print("\nPowerPoint validation PASSED.")


if __name__ == "__main__":
    main()
