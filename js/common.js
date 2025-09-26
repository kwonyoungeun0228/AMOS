(function () {
  /* ==========================
   * 1) 커스텀 셀렉트 (공용)
   * ========================== */
  function initCustomSelects(root = document) {
    const wraps = Array.from(root.querySelectorAll(".select-wrap[data-select]"));
    const targets = wraps.filter(w => !w.__initialized);
    if (!targets.length) return;

    const closeAll = (except = null) => {
      document.querySelectorAll(".select-wrap[data-select].is-open").forEach(w => {
        if (w !== except) {
          w.classList.remove("is-open");
          const fold = w.querySelector(".select-fold");
          const panel = w.querySelector(".select-unfold");
          if (fold) fold.setAttribute("aria-expanded", "false");
          if (panel) panel.setAttribute("hidden", "");
        }
      });
    };

    targets.forEach((wrap) => {
      wrap.__initialized = true;
      const fold = wrap.querySelector(".select-fold");
      const panel = wrap.querySelector(".select-unfold");
      const selectedTxt = wrap.querySelector(".selected");
      const realSelect = wrap.querySelector(".select");
      if (!fold || !panel || !selectedTxt || !realSelect) return;

      const open = () => {
        closeAll(wrap);
        wrap.classList.add("is-open");
        fold.setAttribute("aria-expanded", "true");
        panel.removeAttribute("hidden");
      };
      const close = () => {
        wrap.classList.remove("is-open");
        fold.setAttribute("aria-expanded", "false");
        panel.setAttribute("hidden", "");
      };
      const toggle = () => (wrap.classList.contains("is-open") ? close() : open());

      fold.addEventListener("click", (e) => {
        e.preventDefault(); e.stopPropagation(); toggle();
      });
      fold.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault(); toggle();
        } else if (e.key === "Escape") close();
      });

      panel.addEventListener("click", (e) => {
        const a = e.target.closest('a[role="option"]');
        if (!a) return;
        e.preventDefault(); e.stopPropagation();

        panel.querySelectorAll('[aria-selected="true"]').forEach(el => {
          el.setAttribute("aria-selected", "false");
        });
        a.setAttribute("aria-selected", "true");

        const value = a.dataset.value ?? a.textContent.trim();
        selectedTxt.textContent = value;
        realSelect.value = value;
        realSelect.dispatchEvent(new Event("change", { bubbles: true }));

        close();
      });
    });

    if (!document.__customSelectGlobalBound) {
      document.__customSelectGlobalBound = true;

      document.addEventListener("click", (e) => {
        const holder = e.target.closest(".select-wrap[data-select]");
        if (!holder) closeAll();
      });

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeAll();
      });
    }
  }

  /* ==========================
   * 2) 수량 스텝퍼 (공용)
   * ========================== */
  function initQtySteppers(root = document, {
    selector = ".qty",
    min = 1,
    max = Infinity,
    step = 1,
    onChange = null
  } = {}) {
    root.addEventListener("click", (e) => {
      const plus  = e.target.closest(".qty-btn.plus");
      const minus = e.target.closest(".qty-btn.minus");
      if (!plus && !minus) return;

      const qty = e.target.closest(selector);
      if (!qty) return;

      const out = qty.querySelector(".qty-val");
      if (!out) return;

      const cur = Number(out.textContent.trim()) || 0;
      let next = cur;
      if (plus)  next = Math.min(max, cur + step);
      if (minus) next = Math.max(min, cur - step);

      if (next !== cur) {
        out.textContent = String(next);

        const hidden = qty.querySelector("input[type='hidden'][name]");
        if (hidden) hidden.value = String(next);

        if (typeof onChange === "function") onChange(qty, next);
      }
    });
  }
  window.initQtySteppers = initQtySteppers;

  /* ==========================
   * 3) 장바구니 (체크/삭제/합계)
   * ========================== */
  function initCart() {
    const $wrap = document.querySelector(".cart");
    if (!$wrap) return;

    const master = $wrap.querySelector(".cart-checkall input");
    const labelEm = $wrap.querySelector(".cart-checkall em");

    const btnSelectRemove = $wrap.querySelector(".cart-selectremove");
    const btnRemoveAll    = $wrap.querySelector(".btn-detail");
    const btnBuySelected  = $wrap.querySelector(".btn-select");
    const btnBuyAll       = $wrap.querySelector(".btn-total");

    const FINAL_SELECTOR = ".co-total .value.final";

    const getItems = () => Array.from($wrap.querySelectorAll(".cart-item"));
    const getItemCheckboxes = () =>
      Array.from($wrap.querySelectorAll(".cart-item .row.head input[type='checkbox']"));

    const parsePrice = (txt) => Number((txt||"").replace(/[^\d]/g, "")) || 0;
    const formatPrice = (num) => num.toLocaleString("ko-KR") + "원";

    function readItemData($item) {
      const unitDd = $item.querySelector(".row.meta .kv dd");
      const unitPrice = unitDd ? parsePrice(unitDd.textContent) : 0;
      const qtyOut = $item.querySelector(".qty .qty-val");
      const qty = qtyOut ? Number(qtyOut.textContent.trim()) || 0 : 0;
      return { unitPrice, qty };
    }

    function updateItemSum($item) {
      const { unitPrice, qty } = readItemData($item);
      const sumEl = $item.querySelector(".row.sum .value");
      if (sumEl) sumEl.textContent = formatPrice(unitPrice * qty);
    }

    function updateFinalTotal() {
      let total = 0;
      getItems().forEach($item => {
        const checked = $item.querySelector(".row.head input[type='checkbox']")?.checked;
        if (checked) {
          const { unitPrice, qty } = readItemData($item);
          total += unitPrice * qty;
        }
      });
      const final = $wrap.querySelector(FINAL_SELECTOR);
      if (final) final.textContent = formatPrice(total);
    }

    function updateMasterAndLabel() {
      const cbs = getItemCheckboxes();
      const total = cbs.length;
      const checked = cbs.filter(cb => cb.checked).length;
      if (labelEm) labelEm.textContent = `장바구니 상품 (${checked}/${total})`;

      if (!master) return;
      if (checked === total && total > 0) {
        master.checked = true; master.indeterminate = false;
      } else if (checked === 0) {
        master.checked = false; master.indeterminate = false;
      } else {
        master.checked = false; master.indeterminate = true;
      }
    }

    // 전체선택
    if (master) {
      master.addEventListener("change", () => {
        getItemCheckboxes().forEach(cb => (cb.checked = master.checked));
        updateMasterAndLabel();
        updateFinalTotal();
      });
    }

    // 개별 체크
    $wrap.addEventListener("change", (e) => {
      if (e.target.matches(".cart-item .row.head input[type='checkbox']")) {
        updateMasterAndLabel();
        updateFinalTotal();
      }
    });

    // 수량 스텝퍼
    initQtySteppers($wrap, {
      min: 1,
      onChange(qtyEl, value) {
        const item = qtyEl.closest(".cart-item");
        updateItemSum(item);
        updateFinalTotal();
      }
    });

    // ==== 👇 개별 휴지통 삭제 처리 ====
    $wrap.addEventListener("click", (e) => {
      if (e.target.closest(".btn-trash")) {
        const item = e.target.closest(".cart-item");
        if (item) {
          item.remove();
          updateMasterAndLabel();
          updateFinalTotal();
        }
      }
    });

    // 선택삭제
    if (btnSelectRemove) {
      btnSelectRemove.addEventListener("click", () => {
        getItems().forEach(item => {
          const cb = item.querySelector(".row.head input[type='checkbox']");
          if (cb?.checked) item.remove();
        });
        updateMasterAndLabel();
        updateFinalTotal();
      });
    }

    // 전체삭제
    if (btnRemoveAll) {
      btnRemoveAll.addEventListener("click", () => {
        getItems().forEach(item => item.remove());
        updateMasterAndLabel();
        updateFinalTotal();
      });
    }

    // 선택구매 / 전체구매 (임시 동작)
    if (btnBuySelected) {
      btnBuySelected.addEventListener("click", () => {
        const selected = getItems().filter(item =>
          item.querySelector(".row.head input[type='checkbox']")?.checked
        );
        if (!selected.length) { alert("선택한 상품이 없습니다."); return; }
        alert(`선택한 ${selected.length}개 상품을 구매합니다.`);
      });
    }
    if (btnBuyAll) {
      btnBuyAll.addEventListener("click", () => {
        const count = getItems().length;
        if (!count) { alert("장바구니에 상품이 없습니다."); return; }
        alert(`전체 ${count}개 상품을 구매합니다.`);
      });
    }

    // 초기화
    getItems().forEach(updateItemSum);
    updateMasterAndLabel();
    updateFinalTotal();
  }

  /* ==========================
   * DOM 로드 후 실행
   * ========================== */
  document.addEventListener("DOMContentLoaded", () => {
    initCustomSelects(document);
    initCart();
    initOrderSearchPage(); 
  });
})();




// order-search: 스텝퍼 + 라인합계 + 총합
function initOrderSearchPage() {
  const $page = document.querySelector('.order-search-page');
  if (!$page || typeof window.initQtySteppers !== 'function') return;

  // 버튼에 plus/minus 자동 보정 (HTML 수정 불필요)
  $page.querySelectorAll('.os-qty .qty-group').forEach(g=>{
    g.querySelector('.qty-btn:first-child')?.classList.add('minus');
    g.querySelector('.qty-btn:last-child')?.classList.add('plus');
  });

  const num = s => Number((s||'').replace(/[^\d]/g,''))||0;
  const won = n => n.toLocaleString('ko-KR') + '원';

  // 단가 저장: .os-price > 없으면 (초기 라인합계 / 초기 수량)
  $page.querySelectorAll('.os-item').forEach(item=>{
    const qty  = Number(item.querySelector('.qty-val')?.textContent.trim()||1);
    const priceInfo = num(item.querySelector('.os-price b')?.textContent);
    const lineInfo  = num(item.querySelector('.os-line-price')?.textContent);
    const unit = priceInfo || (qty ? Math.floor(lineInfo/qty) : 0) || 0;
    item.dataset.unitPrice = String(unit);
    const lineEl = item.querySelector('.os-line-price');
    if (lineEl) lineEl.textContent = won(unit * qty);
  });

  const updateTotal = () => {
    const sum = [...$page.querySelectorAll('.os-line-price')]
      .reduce((t,el)=> t + num(el.textContent), 0);
    const out = $page.querySelector('.os-bottom .os-total .value');
    if (out) out.textContent = won(sum);
  };

  window.initQtySteppers($page, {
    selector: '.qty-group',
    min: 1,
    max: 999,
    step: 1,
    onChange(qEl, val){
      const item = qEl.closest('.os-item');
      const unit = Number(item?.dataset.unitPrice || 0);
      const line = item?.querySelector('.os-line-price');
      if (line) line.textContent = won(unit * val);
      updateTotal();
    }
  });

  updateTotal();
}

