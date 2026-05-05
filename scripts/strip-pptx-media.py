#!/usr/bin/env python3
"""
Strip media from .pptx files, replacing all embedded images with tiny placeholders.
Preserves layout structure, theme, master slides, and image references.

Usage:
  python3 scripts/strip-pptx-media.py <input.pptx> <output.pptx>

Why: The Forte Advice PowerPoint templates ship with ~70MB of example photos
that aren't needed in the design system. Stripping them brings file size down
from ~75MB to ~5MB while keeping the template structure intact.
"""
import sys
import os
import zipfile
import shutil
import tempfile
import base64

# 1x1 transparent PNG (base64-encoded, known-good)
PNG_PLACEHOLDER = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
)
# 1x1 white JPEG (base64-encoded, known-good, ~125 bytes)
JPEG_PLACEHOLDER = base64.b64decode(
    "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEB"
    "AQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEB"
    "AQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAr/xAAUEAEA"
    "AAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhED"
    "EQA/AL+AB//Z"
)
# Empty SVG placeholder
SVG_PLACEHOLDER = b'<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"/>'


def get_placeholder(filename: str) -> bytes:
    ext = filename.lower().rsplit(".", 1)[-1]
    if ext in ("png",):
        return PNG_PLACEHOLDER
    if ext in ("jpg", "jpeg"):
        return JPEG_PLACEHOLDER
    if ext in ("svg",):
        return SVG_PLACEHOLDER
    return b""  # unknown format: empty bytes


def strip_pptx(input_path: str, output_path: str) -> None:
    if not os.path.exists(input_path):
        raise FileNotFoundError(input_path)

    in_size = os.path.getsize(input_path)
    replaced = 0
    kept = 0
    skipped = 0

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pptx") as tmp:
        tmp_path = tmp.name

    try:
        with zipfile.ZipFile(input_path, "r") as zin:
            with zipfile.ZipFile(tmp_path, "w", zipfile.ZIP_DEFLATED) as zout:
                for item in zin.infolist():
                    name = item.filename
                    is_media = name.startswith("ppt/media/")
                    if is_media:
                        ext = name.lower().rsplit(".", 1)[-1]
                        if ext in ("png", "jpg", "jpeg", "svg"):
                            placeholder = get_placeholder(name)
                            zout.writestr(name, placeholder)
                            replaced += 1
                            continue
                        else:
                            # Unknown media format — keep original
                            kept += 1
                    data = zin.read(name)
                    zout.writestr(item, data)
                    if not is_media:
                        skipped += 1

        shutil.move(tmp_path, output_path)
    except Exception:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
        raise

    out_size = os.path.getsize(output_path)
    print(f"  In:  {input_path} ({in_size / 1024 / 1024:.1f} MB)")
    print(f"  Out: {output_path} ({out_size / 1024 / 1024:.1f} MB)")
    print(f"  Replaced: {replaced} images / Kept media: {kept} / Other entries: {skipped}")
    print(f"  Reduction: {(1 - out_size / in_size) * 100:.1f}%")


def main():
    if len(sys.argv) != 3:
        print("Usage: python3 strip-pptx-media.py <input.pptx> <output.pptx>")
        sys.exit(1)
    strip_pptx(sys.argv[1], sys.argv[2])


if __name__ == "__main__":
    main()
