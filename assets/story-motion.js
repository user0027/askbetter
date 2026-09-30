// 케이스 스터디 인터랙션: 스크롤 진행 막대, 화면에 들어올 때 떠오르기, 숫자 올라가기.
// 움직임 줄이기 설정이면 아무것도 붙이지 않는다.
(function () {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var REVEAL = [
    '.guest > *', '.stat', '.primer .box', '.term',
    '.chapter .num', '.chapter h2',
    '.section .q', '.section .a > *', '.section .shot', '.card',
    '.flow-step', '.flow-arrow', '.app-cell', '.quad-cell', '.tbl-wrap',
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
  items.forEach(function (el) {
    el.classList.add('mv');
    var sibs = Array.prototype.filter.call(el.parentNode.children, function (s) { return s.matches(REVEAL); });
    var i = Math.min(sibs.indexOf(el), STAGGER_MAX);
    if (i > 0) el.style.transitionDelay = (i * STAGGER_MS) + 'ms';
  });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      el.classList.add('is-in');
      io.unobserve(el);
      // 등장 뒤에는 늦춤을 지워 호버 반응이 바로 오게 한다
      setTimeout(function () { el.style.transitionDelay = ''; }, 1200);
      if (e.target.classList.contains('stat')) countUp(e.target);
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
