// 알약형 탭 전환 (report 탭과 클래스 충돌 없게 별도)
document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.seg-tabs .seg-btn');
    const panes = document.querySelectorAll('.seg-pane');

    if (!tabs.length) return;

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // 버튼 상태
            tabs.forEach(t => {
                t.classList.remove('is-active');
                t.setAttribute('aria-selected', 'false');
            });
            tab.classList.add('is-active');
            tab.setAttribute('aria-selected', 'true');

            // 패널 전환
            const id = tab.getAttribute('data-target');
            panes.forEach(p => {
                if (p.id === id) {
                    p.classList.add('is-active');
                    p.removeAttribute('hidden');
                } else {
                    p.classList.remove('is-active');
                    p.setAttribute('hidden', '');
                }
            });
        });
    });
});
