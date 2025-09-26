/******************************
 * 공통: jQuery UI Datepicker (있을 때만)
 ******************************/
window.addEventListener('DOMContentLoaded', function () {
  if (!(window.jQuery && $.fn.datepicker)) return;

  // 한국어 지역화
  $.datepicker.regional['ko'] = {
    closeText: '닫기',
    prevText: '이전달',
    nextText: '다음달',
    currentText: '오늘',
    monthNames: ['1','2','3','4','5','6','7','8','9','10','11','12'],
    monthNamesShort: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
    dayNames: ['일','월','화','수','목','금','토'],
    dayNamesShort: ['일','월','화','수','목','금','토'],
    dayNamesMin: ['일','월','화','수','목','금','토'],
    weekHeader: 'Wk',
    dateFormat: 'yy.mm.dd',
    firstDay: 0,
    isRTL: false,
    showMonthAfterYear: true,
    showOtherMonths: true,
    selectOtherMonths: true
  };
  $.datepicker.setDefaults($.datepicker.regional['ko']);

  // 공통 초기화
  $('.inp-date').datepicker();

  // 기본값: 시작=오늘, 종료=내일
  $('.inp-date-start').datepicker('setDate', 'today');
  $('.inp-date-end').datepicker('setDate', '+1D');

  // 📌 마이쇼핑 전용 처리 (있을 때만)
  if (document.querySelector('.myshop')) {
    function setMyshopDateFormat() {
      const format = window.innerWidth <= 400 ? 'mm.dd' : 'yy.mm.dd';
      $('.inp-date').datepicker('option', 'dateFormat', format);
    }
    setMyshopDateFormat();
    $(window).on('resize', setMyshopDateFormat);
  }
});


/******************************
 * 하단 네비게이션 로드 + 활성화
 ******************************/
// GitHub Pages(프로젝트 사이트)에서도 동작하도록 베이스 경로 계산
function repoBase() {
  // 예) https://kwonyoungeun0228.github.io/AMOS/home.html → '/AMOS'
  const seg = location.pathname.split('/').filter(Boolean);
  const isPages = location.hostname.endsWith('github.io');
  return (isPages && seg.length) ? `/${seg[0]}` : '';
}

// 현재 파일명 추출
function fileFrom(pathname) {
  const p = pathname.split('?')[0].split('#')[0];
  if (p.endsWith('/')) return 'index.html';
  const f = p.split('/').pop() || 'index.html';
  return f.toLowerCase();
}

// nav 하이라이트
function applyActive() {
  const links = document.querySelectorAll('.bottom-nav a');
  if (!links.length) return;

  const current = fileFrom(location.pathname);

  links.forEach(a => {
    a.classList.remove('is-active');
    const img = a.querySelector('img');
    if (img?.dataset?.off) img.src = img.dataset.off;
  });

  let matched = null;
  links.forEach(a => {
    const raw = (a.getAttribute('href') || '').trim();
    if (!raw || raw.startsWith('#') || /^javascript:/i.test(raw)) return;
    let abs;
    try { abs = new URL(raw, document.baseURI); } catch { return; }
    const file = fileFrom(abs.pathname);
    const same = (
      file === current ||
      (current === 'index.html' && (file === 'index.html' || file === 'home.html')) ||
      (current === 'home.html' && (file === 'home.html' || file === 'index.html'))
    );
    if (same && !matched) matched = a;
  });

  if (matched) {
    matched.classList.add('is-active');
    const img = matched.querySelector('img');
    if (img?.dataset?.on) img.src = img.dataset.on;
  }
}

// 클릭 즉시 피드백
function wireImmediateFeedback() {
  const links = document.querySelectorAll('.bottom-nav a');
  links.forEach(a => {
    a.addEventListener('mousedown', () => {
      links.forEach(x => {
        x.classList.remove('is-active');
        const xi = x.querySelector('img');
        if (xi?.dataset?.off) xi.src = xi.dataset.off;
      });
      a.classList.add('is-active');
      const img = a.querySelector('img');
      if (img?.dataset?.on) img.src = img.dataset.on;
    }, { passive: true });
  });
}

// nav가 DOM에 생길 때까지 기다림
function waitForNav(timeoutMs = 4000) {
  return new Promise((resolve, reject) => {
    const found = document.querySelector('nav.bottom-nav');
    if (found) return resolve(found);

    const obs = new MutationObserver(() => {
      const n = document.querySelector('nav.bottom-nav');
      if (n) { obs.disconnect(); resolve(n); }
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });

    setTimeout(() => {
      obs.disconnect();
      const n2 = document.querySelector('nav.bottom-nav');
      if (n2) resolve(n2);
      else reject(new Error('bottom-nav not found'));
    }, timeoutMs);
  });
}

// nav.html 로딩 + 패딩 + 활성화 연결
document.addEventListener('DOMContentLoaded', () => {
  fetch('nav.html')
    .then(res => res.text())
    .then(html => {
      const holder = document.createElement('div');
      holder.id = 'bottom-nav';
      holder.innerHTML = html;              // nav.html 안에 <nav class="bottom-nav">...</nav> 있어야 함
      document.body.appendChild(holder);

      // 네비 높이만큼 여백
      document.querySelector('main')?.style.setProperty('padding-bottom', '74px');

      // 활성화/즉시피드백
      applyActive();
      wireImmediateFeedback();
    })
    .catch(err => console.error('Nav 로드 실패:', err));
});

// 뒤로가기 등에도 활성화 다시 적용
window.addEventListener('popstate', applyActive);
window.addEventListener('hashchange', applyActive);


/******************************
 * new-product-card 전용 수량 스텝퍼 (있을 때만)
 ******************************/
document.addEventListener('DOMContentLoaded', () => {
  const scope = document.querySelector('.new-detail');
  if (scope && typeof window.initQtySteppers === 'function') {
    window.initQtySteppers(scope, { min: 1, max: 999, step: 1 });
  }
});


/******************************
 * 주문결제: 무통장입금 토글
 ******************************/
function initOrderPaymentPage(root = document) {
  const payList = root.querySelector('#payMethodList');
  const bankBox = root.querySelector('#bankTransferBox');
  if (!payList || !bankBox) return;

  const $btDate = (window.jQuery && window.$) ? $('#bt_date') : null;

  const ensureSelectInit = () => {
    if (typeof window.initCustomSelects === 'function') {
      window.initCustomSelects(bankBox);
    }
  };

  const setTodayIfEmpty = () => {
    if ($btDate && $.fn.datepicker) {
      $btDate.datepicker();
      if (!$btDate.val()) $btDate.datepicker('setDate', 'today');
    }
  };

  const toggleBank = (val) => {
    const show = (val === 'bank');
    bankBox.hidden = !show;
    if (show) {
      ensureSelectInit();
      setTodayIfEmpty();
    }
  };

  const checked = payList.querySelector('input[name="pay"]:checked');
  if (checked) toggleBank(checked.value);

  payList.addEventListener('change', (e) => {
    if (e.target?.name === 'pay') toggleBank(e.target.value);
  });
}


/******************************
 * 결제조건 토글 (가상계좌일 때만)
 ******************************/
function initPaymentConditionBox(root = document) {
  const payList = root.querySelector('#payMethodList');
  const condList = root.querySelector('#condList');
  const taxBox  = root.querySelector('#condTaxBox');
  const cashBox = root.querySelector('#condCashBox');
  if (!payList || !condList || !taxBox || !cashBox) return;

  const cashInfos = {
    hp:   root.querySelector('.cash-hp'),
    card: root.querySelector('.cash-card'),
    biz:  root.querySelector('.cash-biz')
  };

  const ensureSelectInit = (scope) => {
    if (typeof window.initCustomSelects === 'function') {
      window.initCustomSelects(scope || root);
    }
  };

  const isVacct = () => {
    const c = payList.querySelector('input[name="pay"]:checked');
    return c && (c.value === 'vacct' || c.value === 'vacct-escrow');
  };

  function toggleCashType(type) {
    Object.entries(cashInfos).forEach(([k, el]) => {
      if (el) el.hidden = (k !== type);
    });
  }

  const toggleCondBoxes = () => {
    const cond = condList.querySelector('input[name="cond"]:checked')?.value;
    taxBox.hidden  = true;
    cashBox.hidden = true;
    if (!isVacct()) return;

    if (cond === 'tax' || cond === 'tax-pay') {
      taxBox.hidden = false;
    } else if (cond === 'cash') {
      cashBox.hidden = false;
      ensureSelectInit(cashBox);
      const type = root.querySelector('input[name="cashType"]:checked')?.value || 'hp';
      toggleCashType(type);
    }
  };

  // 최초 반영 + 이벤트
  toggleCondBoxes();
  payList.addEventListener('change', (e) => { if (e.target?.name === 'pay')  toggleCondBoxes(); });
  condList.addEventListener('change', (e) => { if (e.target?.name === 'cond') toggleCondBoxes(); });
  root.addEventListener('change', (e) => { if (e.target?.name === 'cashType') toggleCashType(e.target.value); });
}

// 주문결제 페이지에서만 실행
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.checkout')) {
    initOrderPaymentPage();
    initPaymentConditionBox();
  }
});


/******************************
 * 쿠폰 모달 (열기/닫기)
 ******************************/
(function () {
  const openBtn = document.getElementById('btnOpenCoupon');
  const modal   = document.getElementById('couponModal');
  if (!openBtn || !modal) return;

  const dim    = modal.querySelector('.modal-dim');
  const closes = modal.querySelectorAll('[data-close="coupon"]');
  const firstFocusable = () =>
    modal.querySelector('.modal-close, .btn, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');

  function openModal() {
    modal.hidden = false;
    document.body.classList.add('modal-open');
    const f = firstFocusable();
    if (f) f.focus();
    document.addEventListener('keydown', onKeydown);
  }
  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove('modal-open');
    document.removeEventListener('keydown', onKeydown);
    openBtn.focus();
  }
  function onKeydown(e) { if (e.key === 'Escape') closeModal(); }

  openBtn.addEventListener('click', openModal);
  dim && dim.addEventListener('click', closeModal);
  closes.forEach(btn => btn.addEventListener('click', closeModal));
})();

/******************************
 * 쿠폰 모달: 리스트 선택 → 확인 활성화
 ******************************/
(function () {
  const table   = document.getElementById('couponTable');
  const confirm = document.getElementById('couponConfirmBtn');
  if (!table || !confirm) return;

  let selected = null;

  // 행 클릭하면 선택
  table.addEventListener('click', (e) => {
    const tr = e.target.closest('tr');
    if (!tr || !table.contains(tr)) return;

    table.querySelectorAll('tbody tr').forEach(row => row.classList.remove('is-selected'));
    tr.classList.add('is-selected');

    selected = { id: tr.dataset.couponId, name: tr.dataset.couponName };
    confirm.disabled = false;
  });

  // 확인 클릭 시 반영(옵션) + 닫기
  confirm.addEventListener('click', () => {
    if (!selected) return;
    const label = document.getElementById('selectedCouponText');
    if (label) label.textContent = selected.name;

    const hid = document.getElementById('selectedCouponId');
    if (hid) hid.value = selected.id;

    const modal = document.getElementById('couponModal');
    modal.hidden = true;
    document.body.classList.remove('modal-open');
  });
})();
