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

  function toggleCashType(type) {
    Object.entries(cashInfos).forEach(([k, el]) => {
      if (el) el.hidden = (k !== type);
    });
  }

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

  // 최초 반영 + 이벤트
  toggleCondBoxes();
  payList.addEventListener('change', (e) => { if (e.target?.name === 'pay') toggleCondBoxes(); });
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
  const modal = document.getElementById('couponModal');
  if (!openBtn || !modal) return;

  const dim = modal.querySelector('.modal-dim');
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
  const table = document.getElementById('couponTable');
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




(() => {
  /** ===== Utils ===== */
  const maskPassword = (len) => '*'.repeat(Math.max(6, len || 0));

  const inferType = (li) => {
    if (li.dataset.type) return li.dataset.type; // password|tel|address|email|textarea|text
    const label = (li.querySelector('.label')?.textContent || '').trim();
    if (/비밀번호/.test(label)) return 'password';
    if (/주소/.test(label)) return 'address';
    if (/이메일/.test(label)) return 'email';
    if (/휴대|전화/.test(label)) return 'tel';
    return 'text';
  };

  /** 전화번호 문자열 → 파트 분해 */
  function splitTel(value = '') {
    const m = value.match(/^(\d{2,3})-(\d{3,4})-(\d{4})$/);
    if (!m) return { p1: '', p2: '', p3: '' };
    return { p1: m[1], p2: m[2], p3: m[3] };
  }

  /** 유효성 검사 */
  function validate(type, v) {
    if (!v) return false;
    if (type === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    if (type === 'tel') return /^\d{2,3}-\d{3,4}-\d{4}$/.test(v);
    if (type === 'password') return v.length >= 6;
    if (type === 'address') return true; // 주소는 파트별 검증 아래서 수행
    return true;
  }

  /** 숫자만 */
  const digits = (s = '') => s.replace(/\D/g, '');

  /** 입력 컴포넌트 생성기 */
  function buildEditor({ type, original }) {
    let wrap = document.createElement('div');
    wrap.className = 'inline-edit-wrap';

    if (type === 'password') {
      const ip = document.createElement('input');
      ip.type = 'password';
      ip.className = 'inline-edit';
      ip.placeholder = '새 비밀번호 (6자 이상)';
      wrap.append(ip);
      return { wrap, focusEl: ip, getValue() { return ip.value.trim(); } };
    }

    if (type === 'email') {
      const ip = document.createElement('input');
      ip.type = 'email';
      ip.className = 'inline-edit';
      ip.placeholder = original || 'example@domain.com';
      wrap.append(ip);
      return { wrap, focusEl: ip, getValue() { return ip.value.trim(); } };
    }

    if (type === 'textarea') {
      const ta = document.createElement('textarea');
      ta.className = 'inline-edit inline-edit--textarea';
      ta.placeholder = original || '';
      wrap.append(ta);
      return { wrap, focusEl: ta, getValue() { return ta.value.trim(); } };
    }

    if (type === 'tel') {
      const row = document.createElement('div');
      row.className = 'inline-row inline-row--tel';

      const { p1, p2, p3 } = splitTel(original);
      const a = Object.assign(document.createElement('input'), { type: 'text', inputMode: 'numeric', maxLength: 3, className: 'inp-tel' });
      const b = Object.assign(document.createElement('input'), { type: 'text', inputMode: 'numeric', maxLength: 4, className: 'inp-tel' });
      const c = Object.assign(document.createElement('input'), { type: 'text', inputMode: 'numeric', maxLength: 4, className: 'inp-tel' });

      a.placeholder = p1 || '010';
      b.placeholder = p2 || '0000';
      c.placeholder = p3 || '0000';

      // 자동 이동/백스페이스
      [a, b, c].forEach((el, i, arr) => {
        el.addEventListener('input', () => {
          el.value = digits(el.value);
          if (el.value.length === el.maxLength && i < arr.length - 1) arr[i + 1].focus();
        });
        el.addEventListener('keydown', (e) => {
          if (e.key === 'Backspace' && el.selectionStart === 0 && !el.value && i > 0) {
            arr[i - 1].focus();
          }
        });
      });

      // 초점: 앞자리
      requestAnimationFrame(() => a.focus());

      row.append(a, spanHyphen(), b, spanHyphen(), c);
      wrap.append(row);

      return {
        wrap, focusEl: a, getValue() {
          const v1 = a.value.trim() || a.placeholder || '';
          const v2 = b.value.trim() || b.placeholder || '';
          const v3 = c.value.trim() || c.placeholder || '';
          return `${digits(v1)}-${digits(v2)}-${digits(v3)}`;
        }
      };
    }

    if (type === 'address') {
      const grid = document.createElement('div');
      grid.className = 'inline-grid inline-grid--addr';

      const zipRow = document.createElement('div');
      zipRow.className = 'addr-zip-row';
      const zip = Object.assign(document.createElement('input'), { type: 'text', className: 'input zip', placeholder: '우편번호', inputMode: 'numeric', maxLength: 6 });
      const btn = Object.assign(document.createElement('button'), { type: 'button', className: 'btn btn-outline btn-zip small' });
      btn.textContent = '우편번호';
      btn.addEventListener('click', () => alert('우편번호 검색 연동 지점')); // TODO: 실제 모듈 연동

      zipRow.append(zip, btn);

      const base = Object.assign(document.createElement('input'), { type: 'text', className: 'input addr1', placeholder: '기본주소' });
      const detail = Object.assign(document.createElement('input'), { type: 'text', className: 'input addr2', placeholder: '상세주소' });

      // 기존 표기값 파싱: [08502] 주소1 주소2
      const m = original.match(/^\s*\[(\d+)\]\s*(.*)$/);
      if (m) {
        zip.placeholder = m[1];
        base.placeholder = m[2];  // 상세는 비움
      } else if (original) {
        base.placeholder = original;
      }

      grid.append(zipRow, base, detail);
      wrap.append(grid);

      return {
        wrap, focusEl: zip, getValue() {
          const z = zip.value.trim() || zip.placeholder || '';
          const a1 = base.value.trim() || base.placeholder || '';
          const a2 = detail.value.trim();
          return `[${z}] ${a1}${a2 ? ' ' + a2 : ''}`.trim();
        }
      };
    }

    // default text
    const ip = document.createElement('input');
    ip.type = 'text';
    ip.className = 'inline-edit';
    ip.placeholder = original || '';
    wrap.append(ip);
    return { wrap, focusEl: ip, getValue() { return ip.value.trim(); } };

    // helper
    function spanHyphen() { const s = document.createElement('span'); s.className = 'hyphen'; s.textContent = '-'; return s; }
  }

  /** 편집 시작 */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.profile-list .btn-more');
    if (!btn) return;

    const li = btn.closest('.item');
    if (!li || li.classList.contains('is-edit')) return;

    const field = li.querySelector('.field');
    const valEl = field.querySelector('.value');
    const original = (valEl?.textContent || '').trim();
    const type = inferType(li);

    // 에디터 생성
    const { wrap, focusEl, getValue } = buildEditor({ type, original });
    field.append(wrap);

    // 액션 버튼
    const act = document.createElement('span');
    act.className = 'edit-actions';
    const bSave = Object.assign(document.createElement('button'), { type: 'button', className: 'btn-save', textContent: '저장' });
    const bCancel = Object.assign(document.createElement('button'), { type: 'button', className: 'btn-cancel', textContent: '취소' });
    act.append(bSave, bCancel);

    // ✅ 래퍼 안쪽으로 넣어서, CSS로 모바일에서 자동 줄바꿈 되게
    wrap.append(act);

    field.append(wrap);

    // (선택) 편집 중 '수정' 버튼 숨김
    li.classList.add('is-edit');


    // 정리
    const cleanup = (apply = false) => {
      if (apply && valEl) {
        let v = getValue();
        if (type === 'address') {
          // 간단 검증: 우편번호 또는 본문이 하나라도 있지 않으면 되돌림
          if (!/\[\d{3,}\]/.test(v) && !v.replace(/\[.*?\]/, '').trim()) v = original;
        }
        if (type === 'password') {
          valEl.textContent = v ? maskPassword(v.length) : (original || maskPassword(8));
        } else {
          valEl.textContent = v || original;
        }
      }
      act.remove();
      wrap.remove();
      li.classList.remove('is-edit');
    };

    bCancel.addEventListener('click', () => cleanup(false));
    bSave.addEventListener('click', () => {
      const v = getValue();

      // 타입별 검증
      if (type === 'tel' && v && !validate('tel', v)) {
        alert('전화번호 형식이 올바르지 않습니다.\n예: 02-1234-5678 / 010-1234-5678');
        return;
      }
      if (type === 'email' && v && !validate('email', v)) {
        alert('이메일 형식이 올바르지 않습니다.');
        return;
      }
      if (type === 'password' && v && !validate('password', v)) {
        alert('비밀번호는 6자 이상이어야 합니다.');
        return;
      }
      cleanup(true);
      // TODO: 서버 저장 필요 시 여기에서 fetch 호출
    });
  });
})();
