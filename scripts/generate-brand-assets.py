#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生成 og.png 与 poster.png 两张品牌图，与文章封面共用同一套设计系统。

风格基准：scripts/generate-covers.py（蓝色渐变 / 半透明卡片 / 金黄点缀 / PingFang）
品牌名统一为 SITE.name「亲戚百科」；小程序码直接复用 public/images/wxacode.jpg，
不重新绘制，避免码失效。

用法：
  python3 scripts/generate-brand-assets.py
"""
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC = os.path.join(ROOT, 'public')
LOGO_WHITE = os.path.join(PUBLIC, 'images/logo-white.png')
WXACODE = os.path.join(PUBLIC, 'images/wxacode.jpg')
OG_OUT = os.path.join(PUBLIC, 'og.png')
POSTER_OUT = os.path.join(PUBLIC, 'images/poster.png')

DEEP = (28, 68, 176)
BASE = (46, 107, 239)
LIGHT = (75, 134, 255)
GOLD = (255, 216, 107)
WHITE = (255, 255, 255)
SOFT = (220, 232, 255)
FONT_PATH = '/System/Library/Fonts/PingFang.ttc'

BRAND = '亲戚百科'                 # 与 src/data/site.ts 的 SITE.name 保持一致
SITE_LINE = 'qinqi.wiki · 关系链可查'
DEMO_CHAIN = '母的母的兄'
DEMO_ANSWER = '舅外公'

WORD = {
    '父': '爸爸', '母': '妈妈', '兄': '哥哥', '姐': '姐姐', '夫': '老公',
    '妻': '老婆', '弟': '弟弟', '妹': '妹妹', '子': '儿子', '女': '女儿',
}


def font(size, weight='regular'):
    idx = {'regular': 0, 'medium': 2, 'semibold': 4, 'bold': 5}.get(weight, 0)
    for i in [idx, 0]:
        try:
            return ImageFont.truetype(FONT_PATH, size, index=i)
        except Exception:
            continue
    raise RuntimeError('找不到中文字体：' + FONT_PATH)


def background(w, h):
    """与文章封面一致的蓝色渐变 + 右上柔光圆 + 细点阵。"""
    img = Image.new('RGB', (w, h))
    d = ImageDraw.Draw(img)
    for y in range(h):
        t = y / (h - 1)
        color = tuple(int(DEEP[i] * (1 - t) + LIGHT[i] * t) for i in range(3))
        d.line((0, y, w, y), fill=color)
    overlay = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.ellipse((w * 0.63, -h * 0.38, w * 1.18, h * 0.59), fill=(255, 255, 255, 18))
    od.ellipse((w * 0.75, -h * 0.24, w * 1.10, h * 0.38), fill=(255, 255, 255, 14))
    for x in range(40, w, 56):
        for y in range(40, h, 56):
            od.ellipse((x, y, x + 2, y + 2), fill=(255, 255, 255, 26))
    return Image.alpha_composite(img.convert('RGBA'), overlay)


def card(d, x0, y0, x1, y1, radius=28):
    """半透明磨砂卡片：与文章封面右侧卡片完全相同的填充与描边。"""
    d.rounded_rectangle(
        (x0, y0, x1, y1), radius=radius,
        fill=(255, 255, 255, 34), outline=(255, 255, 255, 70), width=1,
    )


def pill(d, x, y, text, *, outline=False, size=21, pad=20, h=44):
    """白色实底胶囊（品牌）或描边胶囊（标签）。返回宽度。"""
    f = font(size, 'medium')
    tw = d.textlength(text, font=f)
    w = tw + pad * 2
    if outline:
        d.rounded_rectangle((x, y, x + w, y + h), radius=h / 2,
                            outline=(255, 255, 255, 150), width=1)
        fill = WHITE + (255,)
    else:
        d.rounded_rectangle((x, y, x + w, y + h), radius=h / 2, fill=WHITE + (255,))
        fill = BASE + (255,)
    d.text((x + pad, y + (h - size) / 2 - 2), text, font=f, fill=fill)
    return w


def draw_chain(d, x0, x1, cy, chain, *, diameter=58, step=96):
    """关系链节点：白圆 + 金黄末节点 + 「的」连线 + 日常说法，同封面。"""
    tokens = [t for t in chain.split('的') if t]
    n = len(tokens)
    start_x = x0 + (x1 - x0 - diameter - step * (n - 1)) / 2
    for i in range(n - 1):
        ax = start_x + diameter + i * step
        bx = start_x + (i + 1) * step
        d.line((ax, cy, bx, cy), fill=(255, 255, 255, 130), width=2)
        d.text(((ax + bx) / 2 - 7, cy - 36), '的', font=font(16), fill=(226, 238, 255))
    for i, token in enumerate(tokens):
        x = start_x + i * step
        last = i == n - 1
        fill = GOLD + (255,) if last else WHITE + (255,)
        d.ellipse((x, cy - diameter / 2, x + diameter, cy + diameter / 2), fill=fill)
        cf = font(27, 'semibold')
        tw = d.textlength(token, font=cf)
        d.text((x + diameter / 2 - tw / 2, cy - 19), token, font=cf,
               fill=(28, 68, 176) if last else BASE)
        hint = WORD.get(token, '')
        if hint:
            hw = d.textlength(hint, font=font(15))
            d.text((x + diameter / 2 - hw / 2, cy + diameter / 2 + 12), hint,
                   font=font(15), fill=(226, 238, 255))


def brand_mark(img, x, y, *, size=44, with_line=True):
    """左下 / 顶部品牌落款：白色 logo + 站名 + 站点说明。"""
    d = ImageDraw.Draw(img)
    if os.path.isfile(LOGO_WHITE):
        logo = Image.open(LOGO_WHITE).convert('RGBA').resize((size, size), Image.LANCZOS)
        img.paste(logo, (x, y), logo)
        bx = x + size + 12
    else:
        bx = x
    d.text((bx, y + 4), BRAND, font=font(24, 'semibold'), fill=WHITE + (255,))
    if with_line:
        d.text((bx, y + 38), SITE_LINE, font=font(16), fill=(206, 224, 255, 255))


def relation_card(d, x0, y0, x1, y1, *, cy=None, label_size=20, answer_size=40):
    """信息卡：关系链 → 通常叫 → 称呼。卡片高度固定 416，与文章封面同构。"""
    card(d, x0, y0, x1, y1)
    px = x0 + 32
    d.text((px, y0 + 28), '关 系 链', font=font(label_size, 'medium'), fill=(226, 238, 255, 255))
    cy = cy if cy is not None else y0 + 160
    draw_chain(d, x0 + 32, x1 - 32, cy, DEMO_CHAIN)
    sep_y = y0 + 254
    d.line((px, sep_y, x1 - 32, sep_y), fill=(255, 255, 255, 60), width=1)
    d.text((px, sep_y + 20), '通 常 叫', font=font(18, 'medium'), fill=(226, 238, 255, 255))
    d.text((px, sep_y + 52), DEMO_ANSWER, font=font(answer_size, 'semibold'), fill=GOLD + (255,))
    d.text((px, y1 - 46), DEMO_CHAIN, font=font(19), fill=(210, 226, 255, 255))


def make_og():
    """1200×630：与文章封面同构，仅标题换成站点主张。"""
    w, h = 1200, 630
    img = background(w, h)
    layer = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)

    pill(d, 72, 76, BRAND)
    hf = font(50, 'semibold')
    d.text((72, 160), '三姑六婆，', font=hf, fill=WHITE + (255,))
    d.text((72, 228), '一秒叫对', font=hf, fill=GOLD + (255,))
    d.text((74, 312), '关系链随便拼 · 通用 / 北方 / 广东叫法都能查',
           font=font(23), fill=SOFT + (255,))

    relation_card(d, 716, 132, 1132, 548, cy=292)
    img = Image.alpha_composite(img, layer)
    # og 只有 630 高（封面 675），落款上移并略缩小，避免底部说明被裁
    brand_mark(img, 72, 548, size=40)
    img.convert('RGB').save(OG_OUT, 'PNG', optimize=True)
    return OG_OUT, (w, h)


def make_poster():
    """1080×864：左信息卡 + 右小程序码卡，统一半透明卡片风格。"""
    w, h = 1080, 864
    img = background(w, h)
    layer = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)

    pill(d, 56, 44, BRAND)
    # 右上描边标签，右对齐
    tw = d.textlength('微信小程序', font=font(19, 'medium')) + 44
    tag_x = w - 56 - tw
    d.rounded_rectangle((tag_x, 46, w - 56, 86), radius=20,
                        outline=(255, 255, 255, 150), width=1)
    d.text((tag_x + 22, 55), '微信小程序', font=font(19, 'medium'),
           fill=WHITE + (255,))

    hf = font(48, 'semibold')
    d.text((56, 122), '三姑六婆，', font=hf, fill=WHITE + (255,))
    d.text((56, 184), '一秒叫对', font=hf, fill=GOLD + (255,))
    d.text((58, 264), '关系链随便拼 · 通用 / 北方 / 广东叫法都能查',
           font=font(22), fill=SOFT + (255,))

    relation_card(d, 56, 310, 600, 726, cy=470)
    card(d, 630, 310, 1024, 726)

    # 小程序码沿用站点原图：白色圆角底板只做衬底，不裁切码本身（保护三个定位圆）
    plate = None
    if os.path.isfile(WXACODE):
        plate = Image.new('RGBA', (270, 270), WHITE + (255,))
        pm = Image.new('L', (270, 270), 0)
        ImageDraw.Draw(pm).rounded_rectangle((0, 0, 269, 269), radius=24, fill=255)
        plate.putalpha(pm)
        code = Image.open(WXACODE).convert('RGB').resize((250, 250), Image.LANCZOS)
        plate.paste(code, (10, 10))

    def centered(text, y, size, color, weight='regular'):
        f = font(size, weight)
        tw = d.textlength(text, font=f)
        d.text(((630 + 1024 - tw) / 2, y), text, font=f, fill=color)

    centered('长按识别小程序码', 632, 21, WHITE + (255,), 'semibold')
    centered('打开就能算，走亲戚、写请帖、拜年不再卡壳', 664, 16, (210, 226, 255, 255))

    items = [
        ('单字关系链', '自由组合'),
        ('三种叫法', '通用 / 北方 / 广东'),
        ('互称合称', '两人怎么叫'),
    ]
    gap, top_y, box_h = 12, 748, 64
    box_w = (1024 - 56 - gap * 2) / 3
    for i, (main, sub) in enumerate(items):
        x = 56 + i * (box_w + gap)
        d.rounded_rectangle((x, top_y, x + box_w, top_y + box_h), radius=14,
                            fill=(255, 255, 255, 28), outline=(255, 255, 255, 70), width=1)
        d.text((x + 18, top_y + 10), main, font=font(17, 'semibold'), fill=WHITE + (255,))
        d.text((x + 18, top_y + 36), sub, font=font(14), fill=(206, 224, 255, 255))

    d.text((56, 830), BRAND + ' · 关系链一拼，称呼就出来',
           font=font(18), fill=(206, 224, 255, 255))

    img = Image.alpha_composite(img, layer)
    if plate is not None:
        img.alpha_composite(plate, (695, 340))
    img.convert('RGB').save(POSTER_OUT, 'PNG', optimize=True)
    return POSTER_OUT, (w, h)


def main():
    for fn in (make_og, make_poster):
        path, size = fn()
        print(f'{os.path.relpath(path, ROOT)} → {size[0]}×{size[1]} | {os.path.getsize(path) // 1024} KB')
    print('品牌名：' + BRAND)


if __name__ == '__main__':
    main()
