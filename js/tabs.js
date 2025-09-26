// tabs.js (최종본)
document.addEventListener("DOMContentLoaded", () => {
  /* =========================
   *  공통: 탭(주별/월별/기간선택)
   * ========================= */
  initReportTabs();

  /* =========================
   *  공통: 재고 아코디언
   * ========================= */
  initStockAccordion();

  /* =========================
   *  상품상세: 수량 스텝퍼
   * ========================= */
  initPdtQty();

  /* =========================
   *  상품상세: 하단 탭(기본/상세/평/QA)
   * ========================= */
  initPdtTabs();
});

/* ---------- functions ---------- */
function initReportTabs() {
  const tabs = document.querySelectorAll(".tabs .tab");
  const reports = document.querySelectorAll(".report");
  if (!tabs.length || !reports.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => {
        t.classList.remove("is-active");
        t.setAttribute("aria-selected", "false");
      });
      tab.classList.add("is-active");
      tab.setAttribute("aria-selected", "true");

      const targetId = tab.getAttribute("data-target");
      reports.forEach((r) => {
        const isTarget = r.id === targetId;
        r.classList.toggle("is-active", isTarget);
        r.toggleAttribute("hidden", !isTarget);
      });
    });
  });
}

function initStockAccordion() {
  const stockHeads = document.querySelectorAll(".stock-head");
  if (!stockHeads.length) return;

  stockHeads.forEach((btn) => {
    btn.addEventListener("click", () => {
      const body = btn.nextElementSibling; // .stock-body
      const isOpen = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!isOpen));
      btn.classList.toggle("is-open", !isOpen);
      body?.toggleAttribute("hidden");
    });
  });
}

function initPdtQty() {
  // 이벤트 위임: 페이지 어디서든 수량 버튼을 누르면 처리
  document.addEventListener("click", (e) => {
    const minus = e.target.closest(".qty-btn.minus");
    const plus = e.target.closest(".qty-btn.plus");
    if (!minus && !plus) return;

    const wrap = e.target.closest(".pdt-qty");
    if (!wrap) return;

    const out = wrap.querySelector(".qty-val");
    let n = parseInt(out?.textContent || "1", 10);
    if (Number.isNaN(n)) n = 1;

    if (minus) n = Math.max(1, n - 1);
    if (plus) n = n + 1;

    if (out) out.textContent = String(n);
  });
}

function initPdtTabs() {
  // 클릭 전환
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".pdt-tabs .seg-btn");
    if (!btn) return;

    const tabset = btn.closest(".pdt-tabset");
    if (!tabset) return;

    const tabs = tabset.querySelectorAll(".seg-btn");
    const panes = tabset.querySelectorAll(".seg-pane");

    tabs.forEach((t) => {
      const active = t === btn;
      t.classList.toggle("is-active", active);
      t.setAttribute("aria-selected", active ? "true" : "false");
    });

    panes.forEach((p) => {
      const match = p.id === `panel-${btn.dataset.tab}`;
      p.classList.toggle("is-active", match);
      p.toggleAttribute("hidden", !match);
    });
  });

  // 키보드 전환(Enter/Space)
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const btn = e.target.closest(".pdt-tabs .seg-btn");
    if (!btn) return;
    e.preventDefault();
    btn.click();
  });
}
