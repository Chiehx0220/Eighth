(function () {
  var APPLICATIONS_API_BASE =
    location.hostname === "localhost" || location.hostname === "127.0.0.1"
      ? "http://localhost:8787"
      : "https://eighth-cms-oauth.oauth-worker.workers.dev";

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
    var dialogBedSelect = document.getElementById("dialog-bed");
    var dialogStatus = dialogForm.querySelector(".m3-dialog__status");
    var dialogFields = dialogForm.querySelectorAll(".m3-field__input");
    var dialogCancel = document.getElementById("dialog-cancel");

    function resetDialog() {
      dialogForm.reset();
      dialogFields.forEach(function (field) { field.classList.remove("touched"); });
      dialogStatus.hidden = true;
    }

    function populateBedOptions(beds) {
      dialogBedSelect.innerHTML = "";

      var placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "請選擇目前床號";
      placeholder.disabled = true;
      placeholder.selected = true;
      dialogBedSelect.appendChild(placeholder);

      beds.forEach(function (bed) {
        var option = document.createElement("option");
        option.value = bed;
        option.textContent = bed;
        dialogBedSelect.appendChild(option);
      });
    }

    document.querySelectorAll(".room-card__request-btn[data-room-type]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        resetDialog();
        dialogRoomType.textContent = btn.getAttribute("data-room-type");
        dialogForm.dataset.roomType = btn.getAttribute("data-room-type");
        var beds = [];
        try {
          beds = JSON.parse(btn.getAttribute("data-beds") || "[]");
        } catch (e) {
          beds = [];
        }
        populateBedOptions(beds);
        dialog.showModal();
        dialogBedSelect.focus();
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

    var dialogSubmitBtn = dialogForm.querySelector("button[type=submit]");

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
        dialogStatus.textContent = "請完整填寫目前床號與病患姓名。";
        dialogStatus.hidden = false;
        return;
      }

      var bedNumber = dialogForm.querySelector("#dialog-bed").value.trim();
      var patientName = dialogForm.querySelector("#dialog-name").value.trim();

      dialogSubmitBtn.disabled = true;
      fetch(APPLICATIONS_API_BASE + "/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomType: dialogForm.dataset.roomType,
          bedNumber: bedNumber,
          patientName: patientName,
        }),
      })
        .then(function (res) {
          if (!res.ok) throw new Error("request failed");
          dialogStatus.textContent = "申請已送出,護理站將盡快為您安排。";
          dialogStatus.hidden = false;
          setTimeout(function () {
            dialog.close();
            resetDialog();
          }, 1500);
        })
        .catch(function () {
          dialogStatus.textContent = "送出失敗,請稍後再試或洽護理站。";
          dialogStatus.hidden = false;
        })
        .finally(function () {
          dialogSubmitBtn.disabled = false;
        });
    });
  }

  var brandLogo = document.querySelector(".brand[data-staff-url]");
  if (brandLogo) {
    var brandTapCount = 0;
    var brandTapTimer = null;

    brandLogo.addEventListener("click", function (e) {
      e.preventDefault();
      brandTapCount++;
      clearTimeout(brandTapTimer);

      if (brandTapCount >= 3) {
        brandTapCount = 0;
        window.location.href = brandLogo.dataset.staffUrl;
        return;
      }

      brandTapTimer = setTimeout(function () {
        brandTapCount = 0;
      }, 1500);
    });
  }

  var staffGate = document.getElementById("staff-gate");
  if (staffGate) {
    var staffInput = document.getElementById("staff-gate-input");
    var staffError = document.getElementById("staff-gate-error");
    var staffSubmit = document.getElementById("staff-gate-submit");
    var staffContent = document.getElementById("staff-content");

    var staffCodes = staffGate.dataset.codes.split(",");
    var applicationsList = document.getElementById("applications-list");

    function renderApplications(applications) {
      if (!applicationsList) return;
      applicationsList.innerHTML = "";

      if (applications.length === 0) {
        var empty = document.createElement("p");
        empty.className = "applications-list__status";
        empty.textContent = "目前沒有候補申請。";
        applicationsList.appendChild(empty);
        return;
      }

      applications.forEach(function (app) {
        var item = document.createElement("div");
        item.className = "applications-list__item";

        var info = document.createElement("div");
        info.className = "applications-list__info";

        var title = document.createElement("span");
        title.textContent = app.roomType + "・" + app.bedNumber + "・" + app.patientName;

        var meta = document.createElement("span");
        meta.className = "applications-list__meta";
        meta.textContent = "申請時間:" + new Date(app.submittedAt).toLocaleString("zh-TW");

        info.appendChild(title);
        info.appendChild(meta);

        var doneBtn = document.createElement("button");
        doneBtn.type = "button";
        doneBtn.className = "btn btn--text";
        doneBtn.textContent = "標記已處理";
        doneBtn.addEventListener("click", function () {
          openMarkDoneDialog(app);
        });

        item.appendChild(info);
        item.appendChild(doneBtn);
        applicationsList.appendChild(item);
      });
    }

    function loadApplications() {
      if (!applicationsList) return;
      fetch(APPLICATIONS_API_BASE + "/applications")
        .then(function (res) {
          if (!res.ok) throw new Error("request failed");
          return res.json();
        })
        .then(function (data) {
          renderApplications(data.applications || []);
        })
        .catch(function () {
          applicationsList.innerHTML = "";
          var errEl = document.createElement("p");
          errEl.className = "applications-list__status";
          errEl.textContent = "候補申請載入失敗,請重新整理再試。";
          applicationsList.appendChild(errEl);
        });
    }

    function trySubmitStaffCode() {
      if (staffCodes.indexOf(staffInput.value.trim()) !== -1) {
        staffGate.hidden = true;
        staffContent.hidden = false;
        loadApplications();
      } else {
        staffError.hidden = false;
      }
    }

    var markDoneDialog = document.getElementById("mark-done-dialog");
    if (markDoneDialog) {
      var markDoneForm = document.getElementById("mark-done-form");
      var markDoneSummary = document.getElementById("mark-done-summary");
      var markDoneInput = document.getElementById("mark-done-input");
      var markDoneError = document.getElementById("mark-done-error");
      var markDoneCancel = document.getElementById("mark-done-cancel");
      var pendingApp = null;

      function resetMarkDoneDialog() {
        markDoneForm.reset();
        markDoneError.hidden = true;
        pendingApp = null;
      }

      var openMarkDoneDialog = function (app) {
        pendingApp = app;
        markDoneSummary.textContent = "確定要將「" + app.roomType + "・" + app.bedNumber + "・" + app.patientName + "」標記為已處理嗎?請輸入員工號確認。";
        markDoneError.hidden = true;
        markDoneInput.value = "";
        markDoneDialog.showModal();
        markDoneInput.focus();
      };

      markDoneCancel.addEventListener("click", function () {
        markDoneDialog.close();
        resetMarkDoneDialog();
      });

      markDoneDialog.addEventListener("click", function (e) {
        if (e.target === markDoneDialog) {
          markDoneDialog.close();
          resetMarkDoneDialog();
        }
      });

      markDoneDialog.addEventListener("close", resetMarkDoneDialog);

      markDoneInput.addEventListener("input", function () {
        markDoneError.hidden = true;
      });

      markDoneForm.addEventListener("submit", function (e) {
        e.preventDefault();
        if (staffCodes.indexOf(markDoneInput.value.trim()) === -1) {
          markDoneError.hidden = false;
          return;
        }

        var app = pendingApp;
        var submitBtn = markDoneForm.querySelector("button[type=submit]");
        submitBtn.disabled = true;
        fetch(APPLICATIONS_API_BASE + "/applications/" + app.id, { method: "DELETE" })
          .then(function () {
            markDoneDialog.close();
            resetMarkDoneDialog();
            loadApplications();
          })
          .catch(function () {
            markDoneError.textContent = "刪除失敗,請稍後再試。";
            markDoneError.hidden = false;
          })
          .finally(function () {
            submitBtn.disabled = false;
          });
      });
    }

    staffSubmit.addEventListener("click", trySubmitStaffCode);
    staffInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") trySubmitStaffCode();
    });
    staffInput.addEventListener("input", function () {
      staffError.hidden = true;
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
