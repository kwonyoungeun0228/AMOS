document.addEventListener("DOMContentLoaded", () => {
  // ===== 비밀번호 찾기 페이지 =====
  const input = document.getElementById("phone");
  const button = document.querySelector(".actions .btn");

  if (input && button) {
    input.addEventListener("input", () => {
      if (input.value.trim() !== "") {
        button.classList.add("is-active");
        button.disabled = false;
      } else {
        button.classList.remove("is-active");
        button.disabled = true;
      }
    });
  }

  // ===== 로그인 페이지 =====
  const companyInput = document.getElementById("companyCode");
  const userInput = document.getElementById("userId");
  const pwInput = document.getElementById("userPw");
  const loginBtn = document.querySelector(".btn-primary");

  if (companyInput && userInput && pwInput && loginBtn) {
    function toggleLoginBtn() {
      const allFilled =
        companyInput.value.trim() !== "" &&
        userInput.value.trim() !== "" &&
        pwInput.value.trim() !== "";

      if (allFilled) {
        loginBtn.disabled = false;
        loginBtn.classList.add("is-active");
      } else {
        loginBtn.disabled = true;
        loginBtn.classList.remove("is-active");
      }
    }

    [companyInput, userInput, pwInput].forEach(inputEl =>
      inputEl.addEventListener("input", toggleLoginBtn)
    );

    // 초기 상태 비활성화
    toggleLoginBtn();
  }
});
