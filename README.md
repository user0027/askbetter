# ASKBETTER

프로덕트 매니저 개인 브랜딩 사이트다. 소개, 경력, TFT 케이스 스터디를 담은 정적 페이지로 구성된다.

## 구성

- `index.html` — 메인 페이지. Opening(헤드라인과 여백의 질문), Work 01~04, How I work, Contact 순서의 에디토리얼 지면이다. 작업 문구는 `assets/site.js` 의 `SITE.work` 에 있다.
- `case-study.html` — Claude TFT 케이스 스터디 전문.
- `assets/` — 로고, 아이콘, 브랜드 자산.
- `assets/site.js` — 페이지 이름 등 공통 값을 관리하는 스크립트.

## 스택

순수 HTML/CSS/바닐라 JS다. 빌드 도구 없이 정적 파일 그대로 배포한다.

## 로컬 실행

```
python3 -m http.server 8099
```

## 배포

Cloudflare Workers 정적 배포(`wrangler.jsonc`)를 쓴다. 배포 전에 최종 배포 시각부터 찍는다.

```
python3 scripts/stamp-deploy-time.py
wrangler deploy
```
