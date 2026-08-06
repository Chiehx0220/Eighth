(function () {
  var backBtn = document.getElementById("page-back");
  if (backBtn) {
    backBtn.addEventListener("click", function () {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = backBtn.dataset.fallback || "/";
      }
    });
  }

  var STORAGE_KEY = "font-scale";
  var MIN_SCALE = 1;
  var MAX_SCALE = 1.6;
  var STEP = 0.15;

  function applyScale(scale) {
    document.documentElement.style.setProperty("--font-scale", scale);
    localStorage.setItem(STORAGE_KEY, scale);
  }

  var saved = parseFloat(localStorage.getItem(STORAGE_KEY));
  if (!isNaN(saved)) {
    applyScale(saved);
  }

  var smaller = document.getElementById("font-smaller");
  var larger = document.getElementById("font-larger");

  if (smaller) {
    smaller.addEventListener("click", function () {
      var current = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--font-scale")) || 1;
      applyScale(Math.max(MIN_SCALE, +(current - STEP).toFixed(2)));
    });
  }

  if (larger) {
    larger.addEventListener("click", function () {
      var current = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--font-scale")) || 1;
      applyScale(Math.min(MAX_SCALE, +(current + STEP).toFixed(2)));
    });
  }

  var themeToggle = document.getElementById("theme-toggle");
  var themeIcon = document.getElementById("theme-toggle-icon");
  var THEME_KEY = "theme";

  function isDarkActive() {
    var explicit = document.documentElement.getAttribute("data-theme");
    if (explicit === "dark") return true;
    if (explicit === "light") return false;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function updateThemeIcon() {
    if (!themeIcon) return;
    themeIcon.textContent = isDarkActive() ? "light_mode" : "dark_mode";
  }

  updateThemeIcon();

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var next = isDarkActive() ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem(THEME_KEY, next);
      updateThemeIcon();
    });
  }

  var dialog = document.getElementById("room-request-dialog");
  if (dialog) {
    var dialogForm = document.getElementById("room-request-form");
    var dialogRoomType = document.getElementById("dialog-room-type");
    var dialogWard = document.getElementById("dialog-ward");
    var dialogStatus = dialogForm.querySelector(".m3-dialog__status");
    var dialogFields = dialogForm.querySelectorAll(".m3-field__input");
    var dialogCancel = document.getElementById("dialog-cancel");

    function resetDialog() {
      dialogForm.reset();
      dialogFields.forEach(function (field) { field.classList.remove("touched"); });
      dialogStatus.hidden = true;
    }

    document.querySelectorAll(".room-card__request-btn[data-room-type]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        resetDialog();
        dialogRoomType.textContent = btn.getAttribute("data-room-type");
        dialogWard.textContent = btn.getAttribute("data-ward");
        dialogForm.dataset.roomType = btn.getAttribute("data-room-type");
        dialogForm.dataset.ward = btn.getAttribute("data-ward");
        dialog.showModal();
        dialogFields[0].focus();
      });
    });

    dialogCancel.addEventListener("click", function () {
      dialog.close();
      resetDialog();
    });

    dialog.addEventListener("click", function (e) {
      if (e.target === dialog) {
        dialog.close();
        resetDialog();
      }
    });

    // Fallback for Escape-key close, where the browser calls close() itself.
    dialog.addEventListener("close", resetDialog);

    dialogFields.forEach(function (field) {
      field.addEventListener("blur", function () {
        field.classList.add("touched");
      });
    });

    dialogForm.addEventListener("submit", function (e) {
      e.preventDefault();

      var allValid = true;
      dialogFields.forEach(function (field) {
        field.classList.add("touched");
        if (!field.checkValidity()) {
          allValid = false;
        }
      });

      if (!allValid) {
        dialogStatus.textContent = "請完整填寫床號與病患姓名。";
        dialogStatus.hidden = false;
        return;
      }

      // TODO: 尚未串接後端,目前僅完成表單介面與驗證邏輯。
      // 後端串接後,這裡應改為將表單資料(床號、病患姓名、dialogForm.dataset.roomType、dialogForm.dataset.ward)送出,
      // 並在成功後才顯示送出完成訊息或關閉對話框。
      dialogStatus.textContent = "此表單目前僅為介面示範,尚未串接送出功能,您的申請「不會」送達護理站。正式上線前會另行通知。";
      dialogStatus.hidden = false;
    });
  }

  var visitorDialog = document.getElementById("visitor-registration-dialog");
  if (visitorDialog) {
    var visitorDismiss = document.getElementById("visitor-registration-dismiss");
    var visitorLink = document.getElementById("visitor-registration-link");

    visitorDialog.showModal();

    visitorDismiss.addEventListener("click", function () {
      visitorDialog.close();
    });

    visitorLink.addEventListener("click", function () {
      visitorDialog.close();
    });

    visitorDialog.addEventListener("click", function (e) {
      if (e.target === visitorDialog) visitorDialog.close();
    });
  }
})();
