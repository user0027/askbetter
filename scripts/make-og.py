#!/usr/bin/env python3
"""카카오톡·슬랙 등에 링크를 붙였을 때 뜨는 썸네일과 설명을 만든다.

- assets/og/<페이지>.png 를 1200x630 으로 렌더한다.
- 각 HTML 의 <!-- og:start --> ~ <!-- og:end --> 사이 메타 태그를 다시 쓴다.

카카오톡은 스크립트를 실행하지 않고 og:image 도 절대 주소만 읽는다. 그래서 태그는
HTML 에 글자로 박히고, 주소는 assets/site.js 의 SITE.url 한 곳에서 읽는다.
문구·지표도 site.js 에서 읽으니 거기를 고친 뒤 이 스크립트만 다시 돌리면 된다.

    python3 scripts/make-og.py
"""
import html
import re
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
SITE_JS = (ROOT / "assets/site.js").read_text(encoding="utf-8")


def js_str(key):
    m = re.search(rf"\b{key}:\s*'([^']*)'", SITE_JS)
    return m.group(1) if m else ""


URL = js_str("url").rstrip("/")
BRAND = js_str("brand")
NAME = js_str("name")
MANUAL, AUTO = js_str("manual"), js_str("auto")

# 페이지별 공유 문구. title 은 미리보기 제목, desc 는 그 아래 두 줄, card 는 썸네일 안 글자
PAGES = [
    {
        "file": "index.html", "img": "home",
        "title": f"{NAME} · Product Manager | {BRAND}",
        "desc": "세무·금융 B2B 서비스와 게임 커뮤니티를 기획해 온 " + NAME + "의 포트폴리오입니다. "
                "대표 작업과 AI로 기획 업무를 바꾼 과정을 정리했습니다.",
        "kicker": "Portfolio",
        "head": "좋은 <em>질문</em>이,<br>더 나은 제품을 만듭니다.",
        "foot": f"{NAME} · Product Manager",
    },
    {
        "file": "case-study.html", "img": "case-study",
        "title": f"AI에게 맡길 일, 기획자가 남길 일 | {BRAND}",
        "desc": f"하던 업무를 나눠 보니 AI에게 맡길 일과 기획자가 남길 일이 보였습니다. "
                f"세무달력 한 건을 {MANUAL}에서 {AUTO}으로 줄인 과정을 담았습니다.",
        "kicker": "Case Study",
        "head": "AI에게 맡길 일,<br>기획자가 남길 일",
        "foot": f"세무달력 한 건 {MANUAL} → <em>{AUTO}</em>",
    },
    {
        "file": "deep-dive.html", "img": "deep-dive",
        "title": f"대조 규칙부터 운영 점검까지 | {BRAND}",
        "desc": "케이스 스터디에서 결과만 말한 작업을 실제 설정과 실측 값으로 풀었습니다. "
                "대조 규칙, 검수기, 플러그인 배포, 점검 화면을 다룹니다.",
        "kicker": "Deep Dive",
        "head": "대조 규칙부터 운영 점검까지<br>설정과 실측 값으로",
        "foot": "케이스 스터디 심화 자료",
    },
]

CARD = """<!doctype html><html lang="ko"><head><meta charset="utf-8">
<link rel="stylesheet" href="{root}/assets/tokens.css">
<style>
  html,body{{margin:0}}
  .card{{width:1200px;height:630px;box-sizing:border-box;padding:72px 84px;
    background:var(--navy);color:var(--navy-ink);font-family:var(--sans);
    display:flex;flex-direction:column;justify-content:space-between;position:relative;overflow:hidden}}
  .card:after{{content:"";position:absolute;right:-160px;top:-160px;width:520px;height:520px;
    border-radius:50%;background:radial-gradient(circle,rgba(143,168,255,.28),rgba(143,168,255,0) 70%)}}
  .top{{display:flex;justify-content:space-between;align-items:center}}
  .logo{{height:30px;filter:brightness(0) invert(1)}}  /* 남색 판 위라 로고를 흰색 한 가지로 */
  .kicker{{font-family:var(--mono);font-size:22px;letter-spacing:.14em;text-transform:uppercase;
    color:var(--accent-on-dark)}}
  h1{{margin:0;font-size:68px;line-height:1.28;font-weight:700;letter-spacing:-.02em}}
  h1 em,.foot em{{font-style:normal;color:var(--accent-on-dark)}}
  .foot{{font-size:28px;color:var(--navy-ink-soft);font-weight:500}}
</style></head><body><div class="card">
  <div class="top"><img class="logo" src="{root}/assets/brand/askbetter-logo.png" alt="">
    <span class="kicker">{kicker}</span></div>
  <h1>{head}</h1>
  <div class="foot">{foot}</div>
</div></body></html>"""


def meta(p):
    img = f"{URL}/assets/og/{p['img']}.png"
    page = URL + "/" + ("" if p["file"] == "index.html" else p["file"])
    e = lambda s: html.escape(s, quote=True)
    tags = [
        f'<meta name="description" content="{e(p["desc"])}">',
        '<meta property="og:type" content="website">',
        f'<meta property="og:site_name" content="{e(BRAND)}">',
        f'<meta property="og:title" content="{e(p["title"])}">',
        f'<meta property="og:description" content="{e(p["desc"])}">',
        f'<meta property="og:url" content="{e(page)}">',
        f'<meta property="og:image" content="{e(img)}">',
        '<meta property="og:image:width" content="1200">',
        '<meta property="og:image:height" content="630">',
        '<meta property="og:locale" content="ko_KR">',
        '<meta name="twitter:card" content="summary_large_image">',
    ]
    return "<!-- og:start -->\n" + "\n".join(tags) + "\n<!-- og:end -->"


def write_meta(p):
    f = ROOT / p["file"]
    s = f.read_text(encoding="utf-8")
    block = meta(p)
    if "<!-- og:start -->" in s:
        s = re.sub(r"<!-- og:start -->.*?<!-- og:end -->", lambda _: block, s, flags=re.S)
    else:
        s = re.sub(r"(</title>\n)", lambda m: m.group(1) + block + "\n", s, count=1)
    f.write_text(s, encoding="utf-8")


def main():
    out = ROOT / "assets/og"
    out.mkdir(exist_ok=True)
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        pg = b.new_page(viewport={"width": 1200, "height": 630})
        for p in PAGES:
            # about:blank 에서는 file:// 의 CSS·로고를 못 불러와서 파일로 써 두고 연다
            tmp = out / ".card.html"
            tmp.write_text(CARD.format(root=ROOT.as_uri(), **p), encoding="utf-8")
            pg.goto(tmp.as_uri(), wait_until="networkidle")
            tmp.unlink()
            pg.evaluate("document.fonts.ready")
            pg.screenshot(path=str(out / f"{p['img']}.png"))
            print("이미지", p["img"])
        b.close()
    # 주소가 없으면 이미지만 만든다. 상대 주소로 태그를 쓰면 카카오톡이 썸네일을 못 읽는다
    if not URL.startswith("https://"):
        raise SystemExit("assets/site.js 의 SITE.url 이 비어 있어 메타 태그는 쓰지 않았습니다")
    for p in PAGES:
        write_meta(p)
        print("태그", p["file"])


if __name__ == "__main__":
    main()
