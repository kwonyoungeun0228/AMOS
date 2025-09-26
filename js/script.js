window.addEventListener('DOMContentLoaded', function () {
  // 한국어 지역화
  $.datepicker.regional['ko'] = {
    closeText: '닫기',
    prevText: '이전달',
    nextText: '다음달',
    currentText: '오늘',
    monthNames: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    monthNamesShort: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
    dayNames: ['일', '월', '화', '수', '목', '금', '토'],
    dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
    dayNamesMin: ['일', '월', '화', '수', '목', '금', '토'],
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

  // =============================
  // 📌 마이쇼핑 전용 처리
  // =============================
  if (document.querySelector('.myshop')) {
    function setMyshopDateFormat() {
      let format = window.innerWidth <= 400 ? 'mm.dd' : 'yy.mm.dd';
      $('.inp-date').datepicker('option', 'dateFormat', format);
    }

    setMyshopDateFormat();             // 최초 실행
    $(window).on('resize', setMyshopDateFormat); // 리사이즈 대응
  }

});

document.addEventListener("DOMContentLoaded", () => {
  fetch("/nav.html")
    .then(res => res.text())
    .then(html => {
      const nav = document.createElement("div");
      nav.id = "bottom-nav";
      nav.innerHTML = html;
      document.body.appendChild(nav);  // body 끝에 자동 삽입
    })
    .catch(err => console.error("Nav 로드 실패:", err));
});

document.addEventListener("DOMContentLoaded", () => {
  if (document.querySelector(".bottom-nav")) {
    document.querySelector("main").style.paddingBottom = "74px";
  }
});





function fileFrom(pathname) {
  const p = pathname.split('?')[0].split('#')[0];
  if (p.endsWith('/')) return 'index.html';
  const f = p.split('/').pop() || 'index.html';
  return f.toLowerCase();
}

// 1) nav가 DOM에 생길 때까지 기다리는 Promise
function waitForNav(timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    const found = document.querySelector('nav.bottom-nav');
    if (found) return resolve(found);

    const obs = new MutationObserver(() => {
      const n = document.querySelector('nav.bottom-nav');
      if (n) {
        obs.disconnect();
        resolve(n);
      }
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });

    setTimeout(() => {
      obs.disconnect();
      const n2 = document.querySelector('nav.bottom-nav');
      if (n2) resolve(n2);
      else reject(new Error('bottom-nav not found in DOM'));
    }, timeoutMs);
  });
}

// 2) 활성화 적용
function applyActive() {
  const links = document.querySelectorAll('.bottom-nav a');
  console.log('[nav] applyActive: links=', links.length);
  if (!links.length) return;

  // 현재 페이지 파일명
  const current = fileFrom(location.pathname);
  console.log('[nav] current file =', current, 'pathname=', location.pathname);

  // 전부 초기화
  links.forEach(a => {
    a.classList.remove('is-active');
    const img = a.querySelector('img');
    if (img?.dataset?.off) img.src = img.dataset.off;
  });

  // 매칭 찾기
  let matched = null;
  links.forEach(a => {
    const raw = (a.getAttribute('href') || '').trim();
    if (!raw || raw.startsWith('#') || /^javascript:/i.test(raw)) return; // 가짜 링크 제외
    let abs;
    try {
      abs = new URL(raw, document.baseURI); // ../, ./, / 모두 절대경로화
    } catch (e) { console.warn('[nav] bad href', raw, e); return; }

    const file = fileFrom(abs.pathname);
    const same = (
      file === current ||
      (current === 'index.html' && (file === 'index.html' || file === 'home.html')) ||
      (current === 'home.html' && (file === 'home.html' || file === 'index.html'))
    );

    if (same && !matched) matched = a; // 최초 매칭만 사용
  });

  if (matched) {
    matched.classList.add('is-active');
    const img = matched.querySelector('img');
    if (img?.dataset?.on) img.src = img.dataset.on;
    console.log('[nav] matched href =', matched.getAttribute('href'));
  } else {
    console.warn('[nav] no match found for', current);
  }
}

// 3) 클릭 즉시 피드백 (페이지 이동 전 시각적 반응)
function wireImmediateFeedback() {
  const links = document.querySelectorAll('.bottom-nav a');
  console.log('[nav] wireImmediateFeedback: links=', links.length);
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

// 4) 초기화: (A) nav가 이미 있다면 바로, (B) 나중에 붙어도 기다렸다가 실행
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[nav] DOMContentLoaded');



  try {
    await waitForNav(4000);   // nav가 생길 때까지 최대 4초 대기
    applyActive();
    wireImmediateFeedback();
  } catch (e) {
    console.error('[nav] waitForNav failed:', e.message);
  }
});

// 5) 히스토리 변경(SPA)이나 hashchange에도 재적용 (안 쓰면 무시)
window.addEventListener('popstate', applyActive);
window.addEventListener('hashchange', applyActive);



document.addEventListener("DOMContentLoaded", () => {
  // new-product-card.html에서만 필요한 초기화
  const scope = document.querySelector(".new-detail");
  if (scope) {
    window.initQtySteppers(scope, { min: 1, max: 999, step: 1 });
  }
});



// === 주문결제 페이지: 무통장입금 토글 ===
function initOrderPaymentPage(root = document) {
  const payList = root.querySelector('#payMethodList');
  const bankBox = root.querySelector('#bankTransferBox');
  if (!payList || !bankBox) return;

  const $btDate = window.jQuery ? $('#bt_date') : null;

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
    if (e.target && e.target.name === 'pay') {
      toggleBank(e.target.value);
    }
  });
}

// === 결제조건 폼 토글 (가상계좌이체 전용) ===
function initPaymentConditionBox(root = document) {
  const payList = root.querySelector('#payMethodList');
  const condList = root.querySelector('#condList');
  const taxBox = root.querySelector('#condTaxBox');
  const cashBox = root.querySelector('#condCashBox');
  if (!payList || !condList || !taxBox || !cashBox) return;

  const cashInfos = {
    hp: root.querySelector('.cash-hp'),
    card: root.querySelector('.cash-card'),
    biz: root.querySelector('.cash-biz')
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

  const toggleCondBoxes = () => {
    const cond = condList.querySelector('input[name="cond"]:checked')?.value;
    taxBox.hidden = true;
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

  function toggleCashType(type) {
    Object.entries(cashInfos).forEach(([k, el]) => {
      if (el) el.hidden = (k !== type);
    });
  }

  toggleCondBoxes();

  payList.addEventListener('change', (e) => {
    if (e.target?.name === 'pay') toggleCondBoxes();
  });
  condList.addEventListener('change', (e) => {
    if (e.target?.name === 'cond') toggleCondBoxes();
  });
  root.addEventListener('change', (e) => {
    if (e.target?.name === 'cashType') toggleCashType(e.target.value);
  });
}

// === 페이지 진입 시 실행 ===
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.checkout')) {
    initOrderPaymentPage();
    initPaymentConditionBox();
  }
});


// ===== 쿠폰 모달 =====
(function () {
  const openBtn = document.getElementById('btnOpenCoupon');
  const modal = document.getElementById('couponModal');
  if (!openBtn || !modal) return;

  const dim = modal.querySelector('.modal-dim');
  const closes = modal.querySelectorAll('[data-close="coupon"]');
  const firstFocusable = () => modal.querySelector('.modal-close, .btn, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');

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
    openBtn.focus(); // 포커스 복귀
  }

  function onKeydown(e) {
    if (e.key === 'Escape') closeModal();
  }

  openBtn.addEventListener('click', openModal);
  dim && dim.addEventListener('click', closeModal);
  closes.forEach(btn => btn.addEventListener('click', closeModal));
})();


(function () {
  const table = document.getElementById('couponTable');
  const confirm = document.getElementById('couponConfirmBtn');
  if (!table || !confirm) return;

  let selected = null;

  // 행 클릭하면 선택
  table.addEventListener('click', (e) => {
    const tr = e.target.closest('tr');
    if (!tr || !table.contains(tr)) return;

    // 기존 선택 해제
    table.querySelectorAll('tbody tr').forEach(row => row.classList.remove('is-selected'));
    // 새 선택 적용
    tr.classList.add('is-selected');
    selected = {
      id: tr.dataset.couponId,
      name: tr.dataset.couponName
    };
    confirm.disabled = false; // 버튼 활성화
  });

  // 확인 버튼 클릭 시 처리
  confirm.addEventListener('click', () => {
    if (!selected) return;

    // (옵션) 본문에 선택된 쿠폰 표시
    const label = document.getElementById('selectedCouponText');
    if (label) label.textContent = selected.name;

    // 모달 닫기
    const modal = document.getElementById('couponModal');
    modal.hidden = true;
    document.body.classList.remove('modal-open');
  });
})();

