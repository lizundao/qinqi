#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""重新生成 97 张文章封面：品牌蓝关系链信息图，替代旧版 AI 写实中国风摄影。

数据与文章同源：标题、栏目、主关系链、称呼全部从 src/content/docs/articles/*.mdx 读取，
因此「改文章 → 重跑封面」即可保持图文一致。

用法：
  python3 scripts/generate-covers.py --only tang-biao-qu-bie   # 出一张样张
  python3 scripts/generate-covers.py                            # 全量生成
"""
import argparse
import json
import os
import re
import sys
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARTICLES = os.path.join(ROOT, 'src/content/docs/articles')
OUT_DIR = os.path.join(ROOT, 'public/images/articles')
LOGO_WHITE = os.path.join(ROOT, 'public/images/logo-white.png')

W, H = 1200, 675
DEEP = (28, 68, 176)
BASE = (46, 107, 239)
LIGHT = (75, 134, 255)
GOLD = (255, 216, 107)
WHITE = (255, 255, 255)
SOFT = (220, 232, 255)
FONT_PATH = '/System/Library/Fonts/PingFang.ttc'

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


PUNCT = '，。、；：？！」』）】,.!?'

def wrap(draw, text, fnt, max_width, max_lines=3):
    lines, cur = [], ''
    for ch in text:
        # 标点不单独起行（中文排版忌讳）
        if draw.textlength(cur + ch, font=fnt) <= max_width or ch in PUNCT:
            cur += ch
        else:
            if cur:
                lines.append(cur)
            cur = ch
            if len(lines) >= max_lines:
                break
    if cur and len(lines) < max_lines:
        lines.append(cur)
    if len(lines) == max_lines and draw.textlength(''.join(lines), font=fnt) < draw.textlength(text, font=fnt):
        lines[-1] = lines[-1][:-1] + '…'
    return lines[:max_lines]


def title_lines(draw, title, fnt, max_width):
    # 优先在书名号后的冒号处断行，避免长标题出现孤字
    if '：' in title:
        left, right = title.split('：', 1)
        first = left + '：'
        if draw.textlength(first, font=fnt) <= max_width and draw.textlength(right, font=fnt) <= max_width:
            return [first, right]
    lines = wrap(draw, title, fnt, max_width, max_lines=3)
    # 末行只剩 1～2 字时，从前一行挪两字过来平衡
    if len(lines) > 1 and len(lines[-1]) <= 2 and len(lines[-2]) > 4:
        lines[-1] = lines[-2][-2:] + lines[-1]
        lines[-2] = lines[-2][:-2]
    return lines


def parse_article(path, slug):
    text = open(path, encoding='utf-8').read()
    title = json.loads(re.search(r'^title:\s*(.+)$', text, re.M).group(1))
    desc = json.loads(re.search(r'^description:\s*(.+)$', text, re.M).group(1))
    tags = json.loads(re.search(r'^tags:\s*(.+)$', text, re.M).group(1))
    chain_m = re.search(r'主链是 \*\*(.+?)\*\*', text)
    chain = chain_m.group(1) if chain_m else '父的兄'
    answer_m = re.search(r'\| `' + re.escape(chain) + r'` \|[^|]+\|([^|]+)\|', text)
    answer = answer_m.group(1).strip() if answer_m else '—'
    # 结论取 description 第一句
    conclusion = desc.split('。')[0].strip() + '。' if '。' in desc else desc[:48]
    return {
        'slug': slug,
        'title': title,
        'topic': tags[0] if tags else '亲戚常识',
        'chain': chain,
        'answer': answer,
        'conclusion': conclusion,
    }


def background():
    img = Image.new('RGB', (W, H))
    d = ImageDraw.Draw(img)
    for y in range(H):
        t = y / (H - 1)
        color = tuple(int(DEEP[i] * (1 - t) + LIGHT[i] * t) for i in range(3))
        d.line((0, y, W, y), fill=color)
    overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    # 右上柔光圆
    od.ellipse((760, -260, 1420, 400), fill=(255, 255, 255, 18))
    od.ellipse((900, -160, 1320, 260), fill=(255, 255, 255, 14))
    # 细点阵
    for x in range(40, W, 56):
        for y in range(40, H, 56):
            od.ellipse((x, y, x + 2, y + 2), fill=(255, 255, 255, 26))
    return Image.alpha_composite(img.convert('RGBA'), overlay)


def draw_card(img, item):
    overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    x0, y0, x1, y1 = 716, 132, 1132, 548
    d.rounded_rectangle((x0, y0, x1, y1), radius=28, fill=(255, 255, 255, 34), outline=(255, 255, 255, 70), width=1)
    d.text((748, 160), '关 系 链', font=font(20, 'medium'), fill=(226, 238, 255))

    tokens = [t for t in item['chain'].split('的') if t]
    # 单字链补一个「我」起点，避免卡片里只有一个孤零零的节点
    if len(tokens) == 1:
        tokens = ['我'] + tokens
    n = len(tokens)
    diameter = 58 if n <= 4 else 48
    step = min(96, (x1 - x0 - 90) / max(n - 1, 1))
    start_x = x0 + (x1 - x0 - diameter - step * (n - 1)) / 2
    cy = 292

    # 连线
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
        ch_color = (28, 68, 176) if last else BASE
        cf = font(27 if diameter == 58 else 23, 'semibold')
        tw = d.textlength(token, font=cf)
        d.text((x + diameter / 2 - tw / 2, cy - 19), token, font=cf, fill=ch_color)
        hint = WORD.get(token, '')
        if hint:
            hw = d.textlength(hint, font=font(15))
            d.text((x + diameter / 2 - hw / 2, cy + diameter / 2 + 12), hint, font=font(15), fill=(226, 238, 255))

    d.line((748, 386, 1100, 386), fill=(255, 255, 255, 60), width=1)
    d.text((748, 406), '通 常 叫', font=font(18, 'medium'), fill=(226, 238, 255))
    answer = item['answer']
    af = font(40 if len(answer) <= 7 else 32, 'semibold')
    d.text((748, 438), answer, font=af, fill=GOLD)
    d.text((748, 502), item['chain'], font=font(19), fill=(210, 226, 255))
    return Image.alpha_composite(img, overlay)


def render(item):
    img = background()
    img = draw_card(img, item)
    d = ImageDraw.Draw(img)

    # 栏目胶囊
    topic = item['topic']
    tf = font(21, 'medium')
    tw = d.textlength(topic, font=tf)
    d.rounded_rectangle((72, 86, 72 + tw + 40, 130), radius=22, fill=WHITE)
    d.text((92, 95), topic, font=tf, fill=BASE)

    # 主标题：长标题自动缩小字号，保证「标题：副题」两行均衡
    title_len = len(item['title'])
    hf_size = 50 if title_len <= 18 else (44 if title_len <= 23 else 40)
    hf = font(hf_size, 'semibold')
    lines = title_lines(d, item['title'], hf, 600)
    y = 170
    for line in lines:
        d.text((72, y), line, font=hf, fill=WHITE)
        y += hf_size + 18

    # 结论
    y += 14
    cf = font(23)
    for line in wrap(d, item['conclusion'], cf, 590, max_lines=2):
        d.text((74, y), line, font=cf, fill=SOFT)
        y += 36

    # 左下品牌
    if os.path.isfile(LOGO_WHITE):
        logo = Image.open(LOGO_WHITE).convert('RGBA').resize((44, 44), Image.LANCZOS)
        img.paste(logo, (72, 574), logo)
        bx = 128
    else:
        bx = 72
    d.text((bx, 578), '亲戚百科', font=font(24, 'semibold'), fill=WHITE)
    d.text((bx, 612), 'qinqi.wiki · 关系链可查', font=font(16), fill=(206, 224, 255))

    os.makedirs(OUT_DIR, exist_ok=True)
    out = os.path.join(OUT_DIR, item['slug'] + '.webp')
    img.convert('RGB').save(out, 'WEBP', quality=84, method=6)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--only', help='只生成指定 slug 的一张样张')
    args = ap.parse_args()

    slugs = [args.only] if args.only else sorted(
        f[:-4] for f in os.listdir(ARTICLES) if f.endswith('.mdx')
    )
    for slug in slugs:
        path = os.path.join(ARTICLES, slug + '.mdx')
        if not os.path.isfile(path):
            print('跳过（找不到文章）：' + slug, file=sys.stderr)
            continue
        item = parse_article(path, slug)
        out = render(item)
        print('%s → %s | %s → %s' % (slug, os.path.basename(out), item['chain'], item['answer']))
    print('完成，共 %d 张' % len(slugs))


if __name__ == '__main__':
    main()
