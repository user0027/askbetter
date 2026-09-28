// 사이트 전역 문구. 페이지 이름을 바꿀 때는 이 파일만 고친다.
// HTML 에 적힌 문구는 스크립트가 못 돌 때의 대체값이고, 로드되면 아래 값으로 덮인다.
// 여러 페이지 본문에 되풀이되는 측정값. 숫자가 바뀌면 여기만 고친다.
// HTML 에서는 <span data-site="metrics.auto">2.9분</span> 처럼 쓴다
var METRICS = {
  manual: '2시간',   // 세무달력 한 건을 검수까지 손으로 할 때
  auto: '2.9분',     // 같은 일을 AI 흐름으로 돌릴 때
  checks: '22개',    // 세무달력 발송본 자동 검수 항목 수
  fixes: '31건',     // 쓰면서 기준을 고친 기록 수
  tokens: '3,000만', // Claude Code 도입 후 한 달간 사용한 토큰 수
};

window.SITE = {
  metrics: METRICS,
  // 연락처. 링크는 data-site-href="contact.mailto" 로 건다
  contact: { email: '71d2sr@gmail.com', mailto: 'mailto:71d2sr@gmail.com' },
  brand: 'ASKBETTER',
  // 배포 주소. 공유 미리보기(og 태그)가 절대 주소를 써야 해서 scripts/make-og.py 가 읽는다
  url: 'https://askbetter.studio54.workers.dev',
  // 헤더 메뉴는 로고에 맞춰 영어로 쓴다. 본문 링크 문구도 story.label(영어)을 쓴다
  nav: {
    story: 'Case Study',
    about: 'About me',
  },
  // 커피 후원. Ko-fi 페이지로 연결한다
  // 이 글로 발표하는 행사. 케이스 스터디 표지 윗줄에 쓴다
  talk: { label: '우먼잇츠 밋업 발표 · 2026.10.11 · 온라인', href: 'https://wtech.or.kr/sub/board/meetup/15' },

  support: {
    label: '커피 한 잔 후원하기',
    href: 'https://ko-fi.com/askbetter',
  },
  // 메인 히어로. 이름·직무만 헤드라인 아래 한 단 낮은 위계로 붙여 보여 준다
  hero: {
    name: '박유진',
    role: 'Product Manager',
  },
  // 대표 작업. 메인 Work 장과 히어로 질문이 이 목록을 같이 쓴다.
  // did 는 한 일, result 는 결과
  work: [
    { q: '반복되는 기획 업무를 어디까지 자동화할 수 있을까?', name: 'Claude TFT', org: '더존비즈온', year: '2025',
      did: '반복되는 Jira 티켓 작성·QA 검토를 자동화하는 워크플로 설계.', result: '손으로 ' + METRICS.manual + ' 걸리던 반복 업무를 ' + METRICS.auto + '으로 단축.' },
    { q: '복잡한 금융 업무를 어떻게 더 명확하게 만들 수 있을까?', name: 'DJBank', org: '더존비즈온', year: '2025',
      did: 'ERP 급여 데이터와 은행 이체 업무를 연동.', result: '급여이체 서비스 상용화.' },
    { q: '사용자가 겪는 불편함에서 무엇을 먼저 바꿔야 할까?', name: 'AI 수임처 연말정산 웹', org: '더존비즈온', year: '2026',
      did: 'VOC 기반으로 재설계.', result: "사내 '최고의 기획자상' 수상." },
    { q: '데이터를 통해 성장의 우선순위를 어떻게 재정의할 수 있을까?', name: '게임 제작 툴 & 커뮤니티', org: '프롬더레드', year: '2019–2023',
      did: 'GA 데이터로 운영 방향을 검증.', result: '이탈률 개선, DAU 상승. 초·중학교 대상 MOU 체결로 B2B 확장.' },
  ],
  // 탭 제목은 로고에 맞춰 영어로 쓴다
  home: {
    title: 'PM',
  },
  story: {
    label: 'Case Study',
    href: 'case-study.html',
    title: 'AI Workflow Case Study',
  },
  // 숙련자용 심화 자료. 이름은 사용자 확인 전 임시값
  advanced: {
    label: 'Deep Dive',
    href: 'deep-dive.html',
    title: 'Deep Dive',
  },
};

(function () {
  function get(path) {
    return path.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, window.SITE);
  }
  // data-site="story.label"      → 글자 채우기
  // data-site-href="story.href"  → 링크 주소 채우기
  // data-site-title="story.title" (html 요소) → 문서 제목을 '브랜드 | 값' 으로. 공유 제목과 같은 순서
  document.querySelectorAll('[data-site]').forEach(function (el) {
    var v = get(el.getAttribute('data-site'));
    if (v != null) el.textContent = v;
  });
  document.querySelectorAll('[data-site-href]').forEach(function (el) {
    var v = get(el.getAttribute('data-site-href'));
    if (v != null) el.setAttribute('href', v);
  });
  var t = document.documentElement.getAttribute('data-site-title');
  if (t && get(t) != null) document.title = window.SITE.brand + ' | ' + get(t);
})();
