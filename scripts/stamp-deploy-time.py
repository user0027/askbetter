#!/usr/bin/env python3
"""배포 직전에 돌려 assets/site.js 의 SITE.meta.deployedAt 을 지금 시각으로 고쳐 쓴다.

빌드 도구 없이 정적 파일 그대로 배포하는 사이트라, 이 값도 파일에 직접 적힌다.
`wrangler deploy` 앞에 이 스크립트를 먼저 돌린다."""
import re
from datetime import datetime, timezone, timedelta

KST = timezone(timedelta(hours=9))
path = "assets/site.js"

with open(path, encoding="utf-8") as f:
    content = f.read()

now = datetime.now(KST).strftime("%Y.%m.%d %H:%M")
new_content, n = re.subn(
    r"(meta: \{ deployedAt: ')[^']*(' \})",
    r"\g<1>" + now + r"\g<2>",
    content,
)
if n != 1:
    raise SystemExit(f"deployedAt 줄을 {path} 에서 못 찾았어요 (매치 {n}건)")

with open(path, "w", encoding="utf-8") as f:
    f.write(new_content)

print(f"deployedAt -> {now}")
