/* 챕터 번호·id·목차를 본문의 section.chapter 순서로 만든다.
   제목은 각 챕터 h2 한 곳에만 두고, 목차에 짧게 보일 이름은 data-toc 로 준다.
   같은 목록으로 표지 목차와 옆 플로팅 네비게이션을 함께 만든다. */
(function () {
  var chapters = document.querySelectorAll('section.chapter');
  var list = document.querySelector('.toc ol');
  var head = document.querySelector('.toc .toc-head');
  var sideNav = document.querySelector('.side-nav');
  var sideList = sideNav ? sideNav.querySelector('ol') : null;
  var sideHead = sideNav ? sideNav.querySelector('.side-nav-head') : null;
  if (list) list.textContent = '';
  if (sideList) sideList.textContent = '';

  var sideLinks = [];

  chapters.forEach(function (sec, i) {
    var n = String(i + 1).padStart(2, '0');
    var id = 'ch' + (i + 1);
    sec.id = id;
    var num = sec.querySelector('.num');
    if (num) num.textContent = n;
    var h2 = sec.querySelector('h2');
    var label = sec.dataset.toc || (h2 ? h2.textContent.trim() : '');

    if (list) {
      var a = document.createElement('a');
      var badge = document.createElement('span');
      var li = document.createElement('li');
      a.href = '#' + id;
      badge.className = 'n';
      badge.textContent = n;
      a.append(badge, label);
      li.append(a);
      list.append(li);
    }

    if (sideList) {
      var sa = document.createElement('a');
      var sBadge = document.createElement('span');
      var sli = document.createElement('li');
      sa.href = '#' + id;
      sa.setAttribute('aria-label', label);
      sBadge.className = 'n';
      sBadge.textContent = n;
      sa.append(sBadge);
      sli.append(sa);
      sideList.append(sli);
      sideLinks.push({ el: sec, link: sa, n: n, label: label });
    }
  });

  if (head) head.textContent = chapters.length + '개 챕터';

  if (sideLinks.length) {
    var ticking = false;
    var update = function () {
      var y = window.scrollY + 140;
      var current = sideLinks[0];
      sideLinks.forEach(function (item) {
        if (item.el.offsetTop <= y) current = item;
      });
      sideLinks.forEach(function (item) {
        item.link.classList.toggle('is-active', item === current);
      });
      if (sideHead) sideHead.textContent = current.label;
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
    update();
  }
})();
