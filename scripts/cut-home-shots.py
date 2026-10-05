"""홈 2~4장 화면을 부품으로 잘라 카드 이미지로 만든다.

원본 한 장(assets/work/*-hero.png)을 통째로 쓰면 가장자리가 잘린 캡처로 보여서,
필터·표·검증 열처럼 의미 있는 부품만 잘라 둥근 카드로 만들고 index.html 에서 겹쳐 조합한다.
좌표는 원본 픽셀 기준이다. 원본을 다시 찍으면 좌표도 다시 잰다.

    python3 scripts/cut-home-shots.py
"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
WORK = ROOT / "assets" / "work"
OUT = WORK / "parts"

PAD = 36       # 부품을 흰 카드에 앉힐 때 여백
RADIUS = 28    # 카드 모서리


def rounded(img, radius=RADIUS):
    img = img.convert("RGBA")
    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, img.width - 1, img.height - 1), radius, fill=255)
    img.putalpha(mask)
    return img


def card(*crops, gap=24, pad=PAD):
    """잘라 낸 부품들을 위에서 아래로 쌓아 흰 카드 한 장으로 만든다."""
    w = max(c.width for c in crops) + pad * 2
    h = sum(c.height for c in crops) + gap * (len(crops) - 1) + pad * 2
    base = Image.new("RGB", (w, h), "white")
    y = pad
    for c in crops:
        base.paste(c, (pad, y))
        y += c.height + gap
    return rounded(base)


def fade_bottom(img, ratio=0.22):
    """아래가 잘린 부품은 끝을 투명하게 흐려 잘린 선이 안 보이게 한다."""
    img = img.convert("RGBA")
    a = img.getchannel("A")
    start = int(img.height * (1 - ratio))
    draw = ImageDraw.Draw(a)
    for y in range(start, img.height):
        t = (y - start) / (img.height - start)
        alpha = int(255 * (1 - t))
        row = a.crop((0, y, img.width, y + 1)).point(lambda v: min(v, alpha))
        a.paste(row, (0, y))
    img.putalpha(a)
    return img


def hstitch(img, spans):
    """표에서 남길 열 구간만 이어 붙인다. 사업자번호·계좌·대표자처럼 실데이터로 보일 수 있는 열을 뺀다."""
    parts = [img.crop((a, 0, b, img.height)) for a, b in spans]
    out = Image.new("RGB", (sum(p.width for p in parts), img.height), "white")
    x = 0
    for p in parts:
        out.paste(p, (x, 0))
        x += p.width
    return out


def bleed(img, left=0, right=0):
    """가장자리 한 줄을 늘려 여백을 만든다. 행 배경색(회색 머리줄·분홍 오류 행)이 그대로 이어진다."""
    out = Image.new("RGB", (img.width + left + right, img.height))
    out.paste(img, (left, 0))
    if left:
        out.paste(img.crop((0, 0, 1, img.height)).resize((left, img.height)), (0, 0))
    if right:
        out.paste(img.crop((img.width - 1, 0, img.width, img.height)).resize((right, img.height)), (left + img.width, 0))
    return out


def redraw_checks(img, x0, x1):
    """원본 체크 표시가 상자 안에서 왼쪽 위로 쏠려 있어, x0~x1 열의 파란 상자를 새로 그린다."""
    px = img.load()
    blue = lambda c: c[2] > 200 and c[0] < 80 and c[1] < 140
    rows, y = [], 0
    while y < img.height:
        if any(blue(px[x, y]) for x in range(x0, x1)):
            top = y
            while y < img.height and any(blue(px[x, y]) for x in range(x0, x1)):
                y += 1
            rows.append((top, y))
        y += 1
    d = ImageDraw.Draw(img)
    for top, bot in rows:
        xs = [x for x in range(x0, x1) if blue(px[x, (top + bot) // 2])]
        l, r = min(xs), max(xs) + 1
        color = px[l + 3, top + 3]
        d.rounded_rectangle((l, top, r - 1, bot - 1), radius=(r - l) // 6, fill=color)
        w, h = r - l, bot - top
        d.line([(l + w * .27, top + h * .52), (l + w * .43, top + h * .68), (l + w * .74, top + h * .34)],
               fill="white", width=max(2, w // 9), joint="curve")
    return img


def zempie_mark(img, box, size, color=(232, 148, 46)):
    """원본 목업의 로고 자리(box)를 지우고 zempie 마크를 그린다. 네 점 중 오른쪽 위와 왼쪽 아래 점이 이어진 모양이다."""
    x0, y0, x1, y1 = box
    ImageDraw.Draw(img).rectangle(box, fill="white")
    k = 8
    s = size * k
    m = Image.new("L", (s, s), 0)
    d = ImageDraw.Draw(m)
    r = s * 0.19
    pts = [(s * .22, s * .22), (s * .78, s * .22), (s * .22, s * .78), (s * .78, s * .78)]
    for cx, cy in pts:
        d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=255)
    d.line([pts[1], pts[2]], fill=255, width=int(s * .2))
    m = m.resize((size, size), Image.LANCZOS)
    img.paste(Image.new("RGB", (size, size), color), ((x0 + x1 - size) // 2, (y0 + y1 - size) // 2), m)


def save(img, name):
    OUT.mkdir(parents=True, exist_ok=True)
    img.save(OUT / f"{name}.png", optimize=True)
    print(f"{name}.png {img.width}x{img.height}")

def shoot_parts(html, ids, board=None):
    """목업 HTML 의 요소를 id 별로 2배로 찍어 돌려준다.
    board 를 주면 그 판 기준 위치(%)를 index.html 의 --x/--y/--w 꼴로 출력한다."""
    import io
    from playwright.sync_api import sync_playwright
    out = {}
    with sync_playwright() as p:
        b = p.chromium.launch(channel="chrome")
        pg = b.new_page(viewport={"width": 1000, "height": 800}, device_scale_factor=2)
        pg.goto(html.resolve().as_uri())
        pg.wait_for_timeout(300)
        for i in ids:
            out[i] = Image.open(io.BytesIO(pg.locator(f"#{i}").screenshot())).convert("RGB")
        if board:
            bb = pg.locator(f"#{board}").bounding_box()
            for i in ids:
                r = pg.locator(f"#{i}").bounding_box()
                x, y, w = ((r["x"] - bb["x"]) / bb["width"], (r["y"] - bb["y"]) / bb["height"], r["width"] / bb["width"])
                print(f"  {i}: --x:{x*100:.2f}%;--y:{y*100:.2f}%;--w:{w*100:.2f}%")
        b.close()
    return out


# 02 DJBank 급여이체. 실제 화면 캡처가 없어 scripts/mock/payroll-transfer.html 목업을 카드별로 2배로 찍어 쓴다.
# 계좌번호는 끝자리만 그렸고, 이름·금액은 전부 지어낸 값이다.
# 목업의 #board 가 홈 .stage 와 같은 비율이라 출력되는 --w 를 index.html 에 쓰면 카드끼리 글자 크기가 같다.
# --x/--y 는 격자 그대로 두면 너무 가지런해 보여 index.html 에서 엇갈리게 따로 잡는다
pay = shoot_parts(ROOT / "scripts" / "mock" / "payroll-transfer.html", ["filter", "table"], board="board")
for key in pay:
    save(rounded(pay[key], 30), f"payroll-{key}")

# 03 연말정산. 수임처 AI 연말정산 대시보드를 scripts/mock/yearend-dashboard.html 로 다시 그려 카드별로 찍는다.
# 격자·위치 원칙은 02 와 같다
ye = shoot_parts(ROOT / "scripts" / "mock" / "yearend-dashboard.html", ["brief", "donut", "table", "deadline"], board="board")
for key in ye:
    save(rounded(ye[key], 30), f"yearend-{key}")

# 04 zempie 커뮤니티. 화면 안의 카드를 그대로 따낸다.
# 프로필·내 게임 카드는 빈 아바타·아이콘뿐이라 쓰지 않고, 서비스가 무엇인지 보이는 상단 내비를 얹는다
ze = Image.open(WORK / "game-editor-hero.png").convert("RGB")
# 원본 목업의 로고(무지개 원)와 게시물 작성자 아바타가 실제 zempie 마크와 달라 다시 그린다
zempie_mark(ze, (46, 34, 101, 89), 48)
zempie_mark(ze, (798, 420, 877, 499), 56)
# 배너·최근 게시물 썸네일 자리도 회색 아이콘뿐이라 scripts/mock/zempie-thumbs.html 그림으로 채운다
thumbs = shoot_parts(ROOT / "scripts" / "mock" / "zempie-thumbs.html", ["banner", "recent", "jam", "meetup", "online"])
for key, box, r in [("banner", (800, 530, 2144, 870), 16), ("recent", (2272, 282, 2824, 522), 14),
                    ("jam", (2272, 660, 2408, 796), 14), ("meetup", (2272, 850, 2408, 986), 14),
                    ("online", (2272, 1042, 2408, 1178), 14)]:
    ImageDraw.Draw(ze).rectangle(box, fill="white")
    t = rounded(thumbs[key].resize((box[2] - box[0], box[3] - box[1]), Image.LANCZOS), r)
    ze.paste(t, box[:2], t)
save(rounded(ze.crop((0, 0, 2912, 122)), 24), "zempie-nav")
save(fade_bottom(rounded(ze.crop((760, 381, 2183, 1450)), 32), 0.16), "zempie-post")
save(rounded(ze.crop((2231, 172, 2862, 1254)), 32), "zempie-recent")
