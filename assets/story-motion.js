// 케이스 스터디 인터랙션: 스크롤 진행 막대, 화면에 들어올 때 떠오르기, 숫자 올라가기.
// 움직임 줄이기 설정이면 아무것도 붙이지 않는다.
(function () {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var REVEAL = [
    '.guest > *', '.stat', '.primer .box', '.term',
    '.chapter .num', '.chapter h2',
    '.section .q', '.section .a > *', '.section .shot', '.card',
    '.flow-step', '.flow-arrow', '.app-cell', '.quad-cell', '.tbl-wrap', '.ba-card', '.net',
    '.endline', '.closing .wrap > *'
  ].join(',');
  var STAGGER_MS = 70;   // 같은 줄 형제끼리 늦춰 주는 간격
  var STAGGER_MAX = 6;   // 형제가 많아도 이 개수까지만 늦춘다
  var COUNT_MS = 1100;   // 숫자 올라가는 시간

  var root = document.documentElement;
  root.classList.add('motion');

  // 진행 막대
  var bar = document.createElement('div');
  bar.className = 'read-progress';
  document.body.appendChild(bar);
  var ticking = false;
  function paint() {
    var max = root.scrollHeight - window.innerHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ')';
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(paint); }
  }, { passive: true });
  paint();

  // 떠오르기
  var items = document.querySelectorAll(REVEAL);
  // 같은 부모 아래에서 몇 번째 대상인지 센다. 형제마다 부모의 자식 전체를 다시 훑지 않도록 부모별로 센다
  var orderInParent = new Map();
  items.forEach(function (el) {
    el.classList.add('mv');
    var i = orderInParent.get(el.parentNode) || 0;
    orderInParent.set(el.parentNode, i + 1);
    i = Math.min(i, STAGGER_MAX);
    if (i > 0) el.style.transitionDelay = (i * STAGGER_MS) + 'ms';
  });
  // .ba-card 는 전/후 과정이 한 번 끝나면 멈춰 있어 다시 보려면 새로고침해야 했다.
  // 끝난 뒤 잠깐 멈췄다가 처음부터 다시 그려지도록 is-in 을 껐다 켠다.
  // .net(로컬·서버 도식)도 같은 방식으로 되풀이한다. 순서 길이는 story.css 의 .net 움직임 지연값과 맞춘다
  var BA_SEQUENCE_MS = 4000;
  var NET_SEQUENCE_MS = 3900;
  var REPLAY_PAUSE_MS = 2200;
  function loopReplay(el, sequenceMs, onReplay) {
    setTimeout(function () {
      el.classList.remove('is-in');
      void el.offsetWidth; // 리플로우를 강제해 다음 is-in 에서 애니메이션이 처음부터 다시 돈다
      el.classList.add('is-in');
      if (onReplay) onReplay(el);
      loopReplay(el, sequenceMs, onReplay);
    }, sequenceMs + REPLAY_PAUSE_MS);
  }
  // 전 안에서 마우스가 문제 지점을 드래그로 선택한 뒤, 잠깐 자리를 비워 고칠 내용을
  // 직접 타이핑해 적고 저장하는 시간을 주고(이 동안 커서는 숨긴다), 저장이 끝나면 다시
  // 나타나 PDF 아이콘까지 끌고 가는 순서로 보이게 한다. 선택 시작·끝 좌표는 .ba-issue 의
  // 애니메이션 상태(끌리는 중간에는 scaleX 가 0~1 사이라 getBoundingClientRect 로 못 잰다)
  // 와 상관없이, .ba-issue 의 x·y·width·height 속성을 창 SVG 의 실제 렌더 크기에 맞춰
  // 직접 계산해 구한다.
  var BA_DRAG_DUR_MS = 2650;
  function runDragTrail(card) {
    var trail = card.querySelector('.ba-drag-trail');
    var svg = card.querySelector('.ba-fig:not(.on) .ba-win-svg');
    var toEl = card.querySelector('.ba-fig:not(.on) .ba-pdf-doc');
    var row = card.querySelector('.ba-fig:not(.on) .ba-row');
    var issue = card.querySelector('.ba-fig:not(.on) .ba-issue');
    if (!trail || !svg || !toEl || !row || !issue) return;
    var rowRect = row.getBoundingClientRect();
    var svgRect = svg.getBoundingClientRect();
    var scale = svgRect.width / svg.viewBox.baseVal.width; // width:100% 라 가로 기준 비율로 충분하다
    function svgPt(x, y) { return { x: svgRect.left + x * scale - rowRect.left, y: svgRect.top + y * scale - rowRect.top }; }
    function attr(name) { return parseFloat(issue.getAttribute(name)); }
    var p1 = svgPt(attr('x'), attr('y'));                                   // 선택 시작: 문제 상자 좌상단
    var p2 = svgPt(attr('x') + attr('width'), attr('y') + attr('height'));  // 선택 끝: 문제 상자 우하단
    var toRect = toEl.getBoundingClientRect();
    var p3 = { x: toRect.left + toRect.width / 2 - rowRect.left, y: toRect.top + toRect.height / 2 - rowRect.top };
    function at(p) { return 'translate(' + p.x + 'px,' + p.y + 'px)'; }
    trail.getAnimations().forEach(function (a) { a.cancel(); });
    trail.animate([
      { transform: at(p1), opacity: 0, offset: 0, easing: 'ease-out' },
      { transform: at(p1), opacity: 1, offset: 0.0189, easing: 'ease-out' },     // 마우스를 누른다 (50ms)
      { transform: at(p2), opacity: 1, offset: 0.3208, easing: 'ease-in-out' },  // 문제 지점을 드래그로 선택한다 (850ms, .ba-issue 와 같은 .85s)
      { transform: at(p2), opacity: 0, offset: 0.3396, easing: 'ease-in' },      // 손을 떼고 키보드로 옮겨 타이핑한다 (900ms)
      { transform: at(p2), opacity: 0, offset: 0.6226, easing: 'ease-in' },      // 적은 내용을 저장할 때까지 커서는 보이지 않는다 (1650ms)
      { transform: at(p2), opacity: 1, offset: 0.6415, easing: 'ease-out' },     // 저장이 끝나 다시 마우스를 잡는다 (1700ms)
      { transform: at(p3), opacity: 1, offset: 0.9245, easing: 'ease-out' },     // 그대로 PDF 자리까지 끌고 간다 (2450ms)
      { transform: at(p3), opacity: 0, offset: 1 }                              // 내려놓고 사라진다 (2650ms)
    ], { duration: BA_DRAG_DUR_MS, fill: 'forwards' });
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      el.classList.add('is-in');
      io.unobserve(el);
      // 등장 뒤에는 늦춤을 지워 호버 반응이 바로 오게 한다
      setTimeout(function () { el.style.transitionDelay = ''; }, 1200);
      if (el.classList.contains('stat')) countUp(el);
      if (el.classList.contains('ba-card')) { runDragTrail(el); loopReplay(el, BA_SEQUENCE_MS, runDragTrail); }
      if (el.classList.contains('net')) loopReplay(el, NET_SEQUENCE_MS);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
  items.forEach(function (el) { io.observe(el); });

  // 숫자 올라가기: .stat .n 과 .to 의 첫 글자 마디만 센다
  function countUp(stat) {
    stat.querySelectorAll('.n, .to').forEach(function (box) {
      var node = box.firstChild;
      if (!node || node.nodeType !== 3) return;
      var end = parseFloat(node.nodeValue);
      if (isNaN(end)) return;
      var dec = (node.nodeValue.split('.')[1] || '').length;
      var t0 = null;
      function step(t) {
        if (t0 === null) t0 = t;
        var p = Math.min(1, (t - t0) / COUNT_MS);
        var eased = 1 - Math.pow(1 - p, 3);
        node.nodeValue = (end * eased).toFixed(dec);
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }
})();
