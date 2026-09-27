/* 챕터 번호·id·목차를 본문의 section.chapter 순서로 만든다.
   제목은 각 챕터 h2 한 곳에만 두고, 목차에 짧게 보일 이름은 data-toc 로 준다. */
(function () {
  var chapters = document.querySelectorAll('section.chapter');
  var list = document.querySelector('.toc ol');
  var head = document.querySelector('.toc .toc-head');
  if (list) list.textContent = '';

  chapters.forEach(function (sec, i) {
    var n = String(i + 1).padStart(2, '0');
    var id = 'ch' + (i + 1);
    sec.id = id;
    var num = sec.querySelector('.num');
    if (num) num.textContent = n;
    if (!list) return;

    var h2 = sec.querySelector('h2');
    var a = document.createElement('a');
    var badge = document.createElement('span');
    var li = document.createElement('li');
    a.href = '#' + id;
    badge.className = 'n';
    badge.textContent = n;
    a.append(badge, sec.dataset.toc || (h2 ? h2.textContent.trim() : ''));
    li.append(a);
    list.append(li);
  });

  if (head) head.textContent = chapters.length + '개 챕터';
})();
