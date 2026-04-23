from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets' / 'branding'
ASSETS.mkdir(parents=True, exist_ok=True)

BG = '#1C1208'
SURFACE = '#3B2412'
GOLD = '#F2C572'
CREAM = '#FFF1D6'
STEAM = '#FFE6B5'
ACCENT = '#A95F2A'


def load_font(size: int):
    candidates = [
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
        '/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf',
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size=size)
        except OSError:
            continue
    return ImageFont.load_default()


def make_base(size: int):
    img = Image.new('RGBA', (size, size), BG)
    draw = ImageDraw.Draw(img)
    margin = int(size * 0.06)
    draw.rounded_rectangle((margin, margin, size - margin, size - margin), radius=int(size * 0.22), fill=SURFACE)
    return img, draw


def draw_mark(draw: ImageDraw.ImageDraw, size: int, include_wordmark: bool = False):
    center_x = size / 2
    cup_w = size * 0.42
    cup_h = size * 0.24
    cup_left = center_x - cup_w / 2
    cup_top = size * 0.44
    cup_right = center_x + cup_w / 2
    cup_bottom = cup_top + cup_h
    draw.rounded_rectangle((cup_left, cup_top, cup_right, cup_bottom), radius=size * 0.04, fill=GOLD)
    saucer_top = cup_bottom + size * 0.035
    draw.rounded_rectangle((center_x - size * 0.20, saucer_top, center_x + size * 0.20, saucer_top + size * 0.03), radius=size * 0.015, fill=ACCENT)
    draw.arc((cup_right - size * 0.03, cup_top + size * 0.03, cup_right + size * 0.10, cup_bottom - size * 0.03), start=270, end=90, fill=GOLD, width=max(2, int(size * 0.022)))

    for offset in (-0.09, 0.0, 0.09):
        x = center_x + size * offset
        draw.arc((x - size * 0.035, size * 0.19, x + size * 0.035, size * 0.43), start=100, end=260, fill=STEAM, width=max(2, int(size * 0.016)))

    font = load_font(int(size * 0.14))
    text = 'CE'
    bbox = draw.textbbox((0, 0), text, font=font)
    text_x = center_x - (bbox[2] - bbox[0]) / 2
    text_y = cup_top + size * 0.045
    draw.text((text_x, text_y), text, font=font, fill=BG)

    if include_wordmark:
        title_font = load_font(int(size * 0.075))
        subtitle_font = load_font(int(size * 0.04))
        title = 'CHAI EMPIRE'
        subtitle = 'Android placeholder brand pack'
        tb = draw.textbbox((0, 0), title, font=title_font)
        sb = draw.textbbox((0, 0), subtitle, font=subtitle_font)
        draw.text((center_x - (tb[2] - tb[0]) / 2, size * 0.74), title, font=title_font, fill=CREAM)
        draw.text((center_x - (sb[2] - sb[0]) / 2, size * 0.84), subtitle, font=subtitle_font, fill='#D7B98C')


def save_icon(name: str, size: int, include_wordmark: bool = False):
    img, draw = make_base(size)
    draw_mark(draw, size, include_wordmark=include_wordmark)
    img.save(ASSETS / name)


def save_adaptive_foreground():
    size = 1024
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    center = size / 2
    draw.ellipse((center - 250, center - 250, center + 250, center + 250), fill=GOLD)
    draw.rounded_rectangle((center - 190, center - 40, center + 120, center + 140), radius=36, fill=BG)
    draw.arc((center + 90, center - 10, center + 220, center + 110), start=270, end=90, fill=BG, width=34)
    for offset in (-70, 0, 70):
        x = center + offset
        draw.arc((x - 28, center - 250, x + 28, center - 60), start=100, end=260, fill=BG, width=18)
    img.save(ASSETS / 'adaptive-icon-foreground.png')


save_icon('icon.png', 1024)
save_icon('splash-icon.png', 1242, include_wordmark=True)
save_icon('favicon.png', 256)
save_adaptive_foreground()
print(f'Generated branding assets in {ASSETS}')
