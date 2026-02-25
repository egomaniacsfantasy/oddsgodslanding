from pathlib import Path
from urllib.request import urlretrieve
from PIL import Image, ImageDraw, ImageFont

ROOT = Path('/Users/andrevlahakis/Documents/New project')
ASSETS = ROOT / 'assets'
ASSETS.mkdir(parents=True, exist_ok=True)

FONT_REG_URL = 'https://github.com/google/fonts/raw/main/ofl/instrumentserif/InstrumentSerif-Regular.ttf'
FONT_ITA_URL = 'https://github.com/google/fonts/raw/main/ofl/instrumentserif/InstrumentSerif-Italic.ttf'
FONT_REG_PATH = ASSETS / 'InstrumentSerif-Regular.ttf'
FONT_ITA_PATH = ASSETS / 'InstrumentSerif-Italic.ttf'

if not FONT_REG_PATH.exists():
    urlretrieve(FONT_REG_URL, FONT_REG_PATH)
if not FONT_ITA_PATH.exists():
    urlretrieve(FONT_ITA_URL, FONT_ITA_PATH)

# Canvas
W, H = 5600, 1800
bg = '#0e0c09'
img = Image.new('RGB', (W, H), bg)
draw = ImageDraw.Draw(img)

# Typography
size = 520
font_odds = ImageFont.truetype(str(FONT_REG_PATH), size=size)
font_gods = ImageFont.truetype(str(FONT_REG_PATH), size=size)

color_odds = (240, 230, 208)
color_gods = (250, 232, 199)

tracking = int(size * 0.13)
word_gap = int(size * 0.50)


def draw_tracked_text(draw_obj, text, x, y, font, color, tracking_px, faux_bold=0):
    cx = x
    for ch in text:
        if faux_bold > 0:
            for dx in range(faux_bold + 1):
                draw_obj.text((cx + dx, y), ch, font=font, fill=color)
        else:
            draw_obj.text((cx, y), ch, font=font, fill=color)
        bbox = draw_obj.textbbox((0, 0), ch, font=font)
        ch_w = bbox[2] - bbox[0]
        cx += ch_w + tracking_px
    return cx

# Measure total width using temporary draw
probe = Image.new('RGB', (10, 10))
probe_draw = ImageDraw.Draw(probe)

def measure_tracked(text, font, tracking_px):
    total = 0
    for idx, ch in enumerate(text):
        b = probe_draw.textbbox((0, 0), ch, font=font)
        total += b[2] - b[0]
        if idx < len(text) - 1:
            total += tracking_px
    return total

odds_w = measure_tracked('ODDS', font_odds, tracking)
gods_w = measure_tracked('GODS', font_gods, tracking)
full_w = odds_w + word_gap + gods_w

x0 = (W - full_w) // 2
y0 = (H - size) // 2 - 40

x_after_odds = draw_tracked_text(draw, 'ODDS', x0, y0, font_odds, color_odds, tracking, faux_bold=0)
draw_tracked_text(draw, 'GODS', x_after_odds + word_gap, y0, font_gods, color_gods, tracking, faux_bold=4)

# Export
png_path = ASSETS / 'odds-gods-wordmark-5600x1800.png'
jpg_path = ASSETS / 'odds-gods-wordmark-5600x1800.jpg'
img.save(png_path, format='PNG', optimize=True)
img.save(jpg_path, format='JPEG', quality=98, subsampling=0)

print(str(png_path))
print(str(jpg_path))
