"""deep-dive 점검 화면(status-board) 탭 이미지를 목업에서 찍는다.

실제 status-board 화면에는 실데이터가 들어 있어 찍지 않는다. 대신 status.py 와
memview/build.py 의 CSS·마크업을 따라 scripts/mock/status-board-tabs.html 에 가짜 값으로
다시 그렸고, 여기서는 탭마다 요소(#monitor 등)를 2배로 찍어 assets/deep/ 에 둔다.
찍는 방식은 cut-home-shots.py 의 shoot_parts 와 같다.

    python3 scripts/cut-deep-dive-shots.py
"""
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
MOCK = ROOT / "scripts" / "mock" / "status-board-tabs.html"
OUT = ROOT / "assets" / "deep"
TABS = ["monitor", "memory", "structure", "tokens"]


def shoot(html, ids):
    OUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        b = p.chromium.launch(channel="chrome")
        pg = b.new_page(viewport={"width": 1000, "height": 800}, device_scale_factor=2)
        pg.goto(html.resolve().as_uri())
        pg.wait_for_timeout(300)
        for i in ids:
            dst = OUT / f"{i}.png"
            pg.locator(f"#{i}").screenshot(path=str(dst))
            print(dst.relative_to(ROOT))
        b.close()


shoot(MOCK, TABS)
