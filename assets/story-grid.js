/* .section .wrap.narrow 는 왼쪽 질문(.q, 1번 칸)과 오른쪽 답(2번 칸)을 grid-row 없이 쓴다.
   질문 하나에 답 요소가 두 개 이상(.fail + .a, 표 + 문단 등) 붙으면 브라우저가 자동으로 매기는
   줄 번호가 밀리면서 다음 질문이 그 밀린 줄에 끼어 들어간다. 답 개수를 미리 알 수 없어 CSS만으로는
   못 막으므로, 여기서 자식 순서를 보고 줄 번호를 직접 매겨 grid-row 로 고정한다. */
(function () {
  document.querySelectorAll('.section .wrap.narrow').forEach(function (wrap) {
    var row = 0;
    var prevWasQ = false;
    Array.from(wrap.children).forEach(function (child) {
      var isQ = child.classList.contains('q');
      if (isQ) {
        row += 1;
      } else if (!prevWasQ) {
        row += 1;
      }
      child.style.gridRow = String(row);
      prevWasQ = isQ;
    });
  });
})();
