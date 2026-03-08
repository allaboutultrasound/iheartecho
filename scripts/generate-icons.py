#!/usr/bin/env python3
"""
Generate all required iOS and Android app icons and splash screens
for iHeartEcho Capacitor mobile app.
"""

import os
import sys
from PIL import Image, ImageDraw, ImageFilter

SOURCE_ICON = "/tmp/iheartecho-logo.png"
PROJECT_ROOT = "/home/ubuntu/iheartecho"

# ── iOS Icon Sizes ────────────────────────────────────────────────────────────
IOS_ICONS = [
    # (filename, size_px)
    ("Icon-20.png",    20),
    ("Icon-20@2x.png", 40),
    ("Icon-20@3x.png", 60),
    ("Icon-29.png",    29),
    ("Icon-29@2x.png", 58),
    ("Icon-29@3x.png", 87),
    ("Icon-40.png",    40),
    ("Icon-40@2x.png", 80),
    ("Icon-40@3x.png", 120),
    ("Icon-60@2x.png", 120),
    ("Icon-60@3x.png", 180),
    ("Icon-76.png",    76),
    ("Icon-76@2x.png", 152),
    ("Icon-83.5@2x.png", 167),
    ("Icon-1024.png",  1024),  # App Store
]

# ── Android Launcher Icon Sizes ───────────────────────────────────────────────
ANDROID_ICONS = [
    # (density_folder, size_px)
    ("mipmap-mdpi",    48),
    ("mipmap-hdpi",    72),
    ("mipmap-xhdpi",   96),
    ("mipmap-xxhdpi",  144),
    ("mipmap-xxxhdpi", 192),
]

# ── Splash Screen Sizes ───────────────────────────────────────────────────────
SPLASH_BG = "#0e1e2e"   # dark navy background
SPLASH_LOGO_FRACTION = 0.35  # logo takes 35% of the shorter dimension

IOS_SPLASH = [
    # (filename, width, height)
    ("Default@2x~universal~anyany.png", 2732, 2732),  # universal storyboard
]

ANDROID_SPLASH = [
    # (density_folder, width, height)
    ("drawable",        480,  800),
    ("drawable-land",   800,  480),
    ("drawable-port",   480,  800),
    ("drawable-hdpi",   480,  800),
    ("drawable-xhdpi",  720, 1280),
    ("drawable-xxhdpi", 960, 1600),
    ("drawable-xxxhdpi",1280, 1920),
]


def make_square_icon(source_path: str, size: int, bg_color: str = "#ffffff") -> Image.Image:
    """Create a square icon with white background and centered logo."""
    src = Image.open(source_path).convert("RGBA")
    # Pad to square
    max_dim = max(src.size)
    padded = Image.new("RGBA", (max_dim, max_dim), (0, 0, 0, 0))
    offset = ((max_dim - src.width) // 2, (max_dim - src.height) // 2)
    padded.paste(src, offset, src)

    # Resize to target
    icon = padded.resize((size, size), Image.LANCZOS)

    # Composite onto white background (iOS requires no alpha)
    bg = Image.new("RGB", (size, size), bg_color)
    if icon.mode == "RGBA":
        bg.paste(icon, mask=icon.split()[3])
    else:
        bg.paste(icon)
    return bg


def make_splash(source_path: str, width: int, height: int) -> Image.Image:
    """Create a splash screen with dark navy background and centered logo."""
    from PIL import ImageColor
    bg_rgb = ImageColor.getrgb(SPLASH_BG)
    splash = Image.new("RGB", (width, height), bg_rgb)

    src = Image.open(source_path).convert("RGBA")
    # Make logo square
    max_dim = max(src.size)
    padded = Image.new("RGBA", (max_dim, max_dim), (0, 0, 0, 0))
    offset_x = (max_dim - src.width) // 2
    offset_y = (max_dim - src.height) // 2
    padded.paste(src, (offset_x, offset_y), src)

    logo_size = int(min(width, height) * SPLASH_LOGO_FRACTION)
    logo = padded.resize((logo_size, logo_size), Image.LANCZOS)

    # Center on splash
    x = (width - logo_size) // 2
    y = (height - logo_size) // 2
    splash.paste(logo, (x, y), logo.split()[3])
    return splash


def ensure_dir(path: str):
    os.makedirs(path, exist_ok=True)


def generate_ios_icons():
    ios_icon_dir = os.path.join(PROJECT_ROOT, "ios/App/App/Assets.xcassets/AppIcon.appiconset")
    ensure_dir(ios_icon_dir)
    print(f"\n📱 Generating iOS icons → {ios_icon_dir}")
    for filename, size in IOS_ICONS:
        img = make_square_icon(SOURCE_ICON, size)
        out_path = os.path.join(ios_icon_dir, filename)
        img.save(out_path, "PNG")
        print(f"   ✓ {filename} ({size}×{size})")

    # Write Contents.json
    contents = generate_ios_contents_json()
    with open(os.path.join(ios_icon_dir, "Contents.json"), "w") as f:
        f.write(contents)
    print("   ✓ Contents.json")


def generate_ios_splash():
    splash_dir = os.path.join(PROJECT_ROOT, "ios/App/App/Assets.xcassets/Splash.imageset")
    ensure_dir(splash_dir)
    print(f"\n🖼  Generating iOS splash → {splash_dir}")
    for filename, w, h in IOS_SPLASH:
        img = make_splash(SOURCE_ICON, w, h)
        out_path = os.path.join(splash_dir, filename)
        img.save(out_path, "PNG")
        print(f"   ✓ {filename} ({w}×{h})")

    # Contents.json for splash
    splash_contents = '''{
  "images": [
    {
      "filename": "Default@2x~universal~anyany.png",
      "idiom": "universal",
      "scale": "2x"
    }
  ],
  "info": {
    "author": "xcode",
    "version": 1
  }
}'''
    with open(os.path.join(splash_dir, "Contents.json"), "w") as f:
        f.write(splash_contents)
    print("   ✓ Contents.json")


def generate_android_icons():
    android_res = os.path.join(PROJECT_ROOT, "android/app/src/main/res")
    print(f"\n🤖 Generating Android icons → {android_res}")
    for density, size in ANDROID_ICONS:
        folder = os.path.join(android_res, density)
        ensure_dir(folder)
        for filename in ["ic_launcher.png", "ic_launcher_round.png"]:
            img = make_square_icon(SOURCE_ICON, size)
            out_path = os.path.join(folder, filename)
            img.save(out_path, "PNG")
        print(f"   ✓ {density}/ic_launcher.png ({size}×{size})")


def generate_android_splash():
    android_res = os.path.join(PROJECT_ROOT, "android/app/src/main/res")
    print(f"\n🖼  Generating Android splash screens → {android_res}")
    for density, w, h in ANDROID_SPLASH:
        folder = os.path.join(android_res, density)
        ensure_dir(folder)
        img = make_splash(SOURCE_ICON, w, h)
        out_path = os.path.join(folder, "splash.png")
        img.save(out_path, "PNG")
        print(f"   ✓ {density}/splash.png ({w}×{h})")


def generate_ios_contents_json() -> str:
    """Generate the Contents.json for the iOS AppIcon asset catalog."""
    return '''{
  "images": [
    {"filename": "Icon-20.png",      "idiom": "iphone",  "scale": "1x", "size": "20x20"},
    {"filename": "Icon-20@2x.png",   "idiom": "iphone",  "scale": "2x", "size": "20x20"},
    {"filename": "Icon-20@3x.png",   "idiom": "iphone",  "scale": "3x", "size": "20x20"},
    {"filename": "Icon-29.png",      "idiom": "iphone",  "scale": "1x", "size": "29x29"},
    {"filename": "Icon-29@2x.png",   "idiom": "iphone",  "scale": "2x", "size": "29x29"},
    {"filename": "Icon-29@3x.png",   "idiom": "iphone",  "scale": "3x", "size": "29x29"},
    {"filename": "Icon-40@2x.png",   "idiom": "iphone",  "scale": "2x", "size": "40x40"},
    {"filename": "Icon-40@3x.png",   "idiom": "iphone",  "scale": "3x", "size": "40x40"},
    {"filename": "Icon-60@2x.png",   "idiom": "iphone",  "scale": "2x", "size": "60x60"},
    {"filename": "Icon-60@3x.png",   "idiom": "iphone",  "scale": "3x", "size": "60x60"},
    {"filename": "Icon-20.png",      "idiom": "ipad",    "scale": "1x", "size": "20x20"},
    {"filename": "Icon-20@2x.png",   "idiom": "ipad",    "scale": "2x", "size": "20x20"},
    {"filename": "Icon-29.png",      "idiom": "ipad",    "scale": "1x", "size": "29x29"},
    {"filename": "Icon-29@2x.png",   "idiom": "ipad",    "scale": "2x", "size": "29x29"},
    {"filename": "Icon-40.png",      "idiom": "ipad",    "scale": "1x", "size": "40x40"},
    {"filename": "Icon-40@2x.png",   "idiom": "ipad",    "scale": "2x", "size": "40x40"},
    {"filename": "Icon-76.png",      "idiom": "ipad",    "scale": "1x", "size": "76x76"},
    {"filename": "Icon-76@2x.png",   "idiom": "ipad",    "scale": "2x", "size": "76x76"},
    {"filename": "Icon-83.5@2x.png", "idiom": "ipad",    "scale": "2x", "size": "83.5x83.5"},
    {"filename": "Icon-1024.png",    "idiom": "ios-marketing", "scale": "1x", "size": "1024x1024"}
  ],
  "info": {"author": "xcode", "version": 1}
}'''


if __name__ == "__main__":
    print("🚀 iHeartEcho — Generating mobile app icons & splash screens")
    generate_ios_icons()
    generate_ios_splash()
    generate_android_icons()
    generate_android_splash()
    print("\n✅ All assets generated successfully!")
