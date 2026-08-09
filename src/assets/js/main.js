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

  var roomCards = document.querySelectorAll(".room-card[data-room-type]");
  if (roomCards.length) {
    var STATUS_KEY_BY_TYPE = { "單人房": "single_room_beds", "雙人房": "double_room_beds" };

    var computeVacancy = function (status, key) {
      var group = status[key];
      if (!group) return null;
      var total = 0, vacant = 0;
      Object.keys(group).forEach(function (id) {
        var entry = group[id];
        if (typeof entry === "boolean") {
          total++;
          if (!entry) vacant++;
        } else if (entry && Array.isArray(entry.beds)) {
          entry.beds.forEach(function (b) {
            total++;
            if (!b) vacant++;
          });
        }
      });
      return { total: total, vacant: vacant };
    };

    fetch(APPLICATIONS_API_BASE + "/bed-status")
      .then(function (res) {
        if (!res.ok) throw new Error("request failed");
        return res.json();
      })
      .then(function (status) {
        roomCards.forEach(function (card) {
          var key = STATUS_KEY_BY_TYPE[card.getAttribute("data-room-type")];
          var result = key && computeVacancy(status, key);
          if (!result) return;

          var chip = card.querySelector(".room-card__status");
          if (!chip) return;

          var variant = result.vacant === 0 ? "m3-chip--error" : result.vacant <= 2 ? "m3-chip--warning" : "m3-chip--success";
          chip.className = "m3-chip room-card__status " + variant;
          chip.textContent = result.vacant === 0 ? "客滿" : result.vacant <= 2 ? "剩 " + result.vacant + " 床" : "有空房";
        });
      })
      .catch(function () {});
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
        empty.textContent = "暫無待排床位";
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
        doneBtn.textContent = "已給床";
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
          errEl.textContent = "待排清單載入失敗,請重新整理再試。";
          applicationsList.appendChild(errEl);
        });
    }

    var BED_CATEGORIES = [
      { key: "single_room_beds", label: "單人房", kind: "flat", icon: "bed" },
      { key: "double_room_beds", label: "雙人房", kind: "grouped", bedCount: 2, suffixes: [1, 2], icon: "group" },
      { key: "insured_quad_room_beds", label: "健保四人房", kind: "grouped", bedCount: 4, suffixes: [1, 2, 3, 5], icon: "groups" },
      { key: "insured_double_room_beds", label: "健保雙人房", kind: "grouped", bedCount: 2, suffixes: [1, 2], icon: "group" }
    ];

    var bedStructureEl = document.getElementById("bed-structure-data");
    var bedStatusSections = document.getElementById("bed-status-sections");
    var bedStatusEditBtn = document.getElementById("bed-status-edit");
    var bedStatusSaveBtn = document.getElementById("bed-status-save");
    var bedStatusCancelBtn = document.getElementById("bed-status-cancel");
    var bedStatusSaveCount = document.getElementById("bed-status-save-count");
    var bedStatusFlash = document.getElementById("bed-status-flash");
    var bedStructure = bedStructureEl ? JSON.parse(bedStructureEl.textContent) : {};
    var bedCommitted = {};
    var bedWorking = {};
    var bedEditMode = false;

    function bedLabel(category, roomOrLabel, bedIdx) {
      if (category.kind === "flat") return roomOrLabel;
      return roomOrLabel + "-" + category.suffixes[bedIdx];
    }

    function createBedChip(label, occupied, pending, editable, onToggle) {
      var chip = document.createElement("button");
      chip.type = "button";
      chip.disabled = !editable;
      chip.className = "m3-chip bed-status-chip " + (occupied ? "m3-chip--outline" : "m3-chip--success") +
        (pending ? " bed-status-chip--pending" : "") + (editable ? " bed-status-chip--editable" : "");
      chip.setAttribute("aria-label", label + (occupied ? " 占用" : " 空床"));
      var text = document.createElement("span");
      text.textContent = label;
      chip.appendChild(text);
      if (editable) chip.addEventListener("click", onToggle);
      return chip;
    }

    var GENDER_ICONS = { "": "remove", "男": "male", "女": "female" };

    function createGenderControl(workingRoom, committedRoom, editable) {
      if (!editable) {
        var badge = document.createElement("span");
        badge.className = "bed-status-gender-badge";
        badge.setAttribute("aria-label", workingRoom.gender || "未設定");
        var badgeIcon = document.createElement("span");
        badgeIcon.className = "material-symbols-outlined";
        badgeIcon.setAttribute("aria-hidden", "true");
        badgeIcon.textContent = GENDER_ICONS[workingRoom.gender] || GENDER_ICONS[""];
        badge.appendChild(badgeIcon);
        return badge;
      }

      var group = document.createElement("div");
      group.className = "bed-status-segmented" + (workingRoom.gender !== committedRoom.gender ? " bed-status-segmented--pending" : "");

      [["", "未設定"], ["男", "男"], ["女", "女"]].forEach(function (pair) {
        var selected = workingRoom.gender === pair[0];
        var seg = document.createElement("button");
        seg.type = "button";
        seg.className = "bed-status-segment" + (selected ? " bed-status-segment--selected" : "");
        seg.setAttribute("aria-label", pair[1]);
        var icon = document.createElement("span");
        icon.className = "material-symbols-outlined";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = GENDER_ICONS[pair[0]];
        seg.appendChild(icon);
        seg.addEventListener("click", function () {
          workingRoom.gender = pair[0];
          renderBedStatus();
        });
        group.appendChild(seg);
      });

      return group;
    }

    function normalizeBedStatus(serverStatus) {
      var result = {};
      BED_CATEGORIES.forEach(function (cat) {
        result[cat.key] = {};
        (bedStructure[cat.key] || []).forEach(function (id) {
          var existing = serverStatus[cat.key] && serverStatus[cat.key][id];
          if (cat.kind === "flat") {
            result[cat.key][id] = existing === true;
          } else {
            var beds = (existing && existing.beds) || [];
            beds = beds.slice(0, cat.bedCount);
            while (beds.length < cat.bedCount) beds.push(false);
            result[cat.key][id] = { gender: (existing && existing.gender) || "", beds: beds };
          }
        });
      });
      return result;
    }

    function countBedChanges() {
      var n = 0;
      BED_CATEGORIES.forEach(function (cat) {
        (bedStructure[cat.key] || []).forEach(function (id) {
          if (cat.kind === "flat") {
            if (bedWorking[cat.key][id] !== bedCommitted[cat.key][id]) n++;
          } else {
            var w = bedWorking[cat.key][id];
            var c = bedCommitted[cat.key][id];
            if (w.gender !== c.gender) n++;
            w.beds.forEach(function (b, i) { if (b !== c.beds[i]) n++; });
          }
        });
      });
      return n;
    }

    function renderBedStatus() {
      if (!bedStatusSections) return;
      bedStatusSections.innerHTML = "";

      BED_CATEGORIES.forEach(function (cat) {
        var ids = bedStructure[cat.key] || [];
        var total = 0, vacant = 0;
        ids.forEach(function (id) {
          if (cat.kind === "flat") {
            total++;
            if (!bedWorking[cat.key][id]) vacant++;
          } else {
            var beds = bedWorking[cat.key][id].beds;
            total += beds.length;
            beds.forEach(function (b) { if (!b) vacant++; });
          }
        });

        var card = document.createElement("div");
        card.className = "bed-status-card";

        var head = document.createElement("div");
        head.className = "bed-status-card__head";
        var titleGroup = document.createElement("div");
        titleGroup.className = "bed-status-card__title-group";
        var titleIcon = document.createElement("span");
        titleIcon.className = "material-symbols-outlined";
        titleIcon.setAttribute("aria-hidden", "true");
        titleIcon.textContent = cat.icon;
        var title = document.createElement("span");
        title.className = "bed-status-card__title";
        title.textContent = cat.label;
        titleGroup.appendChild(titleIcon);
        titleGroup.appendChild(title);
        var countChip = document.createElement("span");
        countChip.className = "m3-chip m3-chip--secondary";
        countChip.textContent = vacant === 0 ? "客滿" : "剩 " + vacant + "/" + total + " 床";
        head.appendChild(titleGroup);
        head.appendChild(countChip);
        card.appendChild(head);

        var grid = document.createElement("div");
        grid.className = "bed-status-grid" + (cat.kind === "grouped" ? " bed-status-grid--rooms" : "");

        ids.forEach(function (id) {
          if (cat.kind === "grouped") {
            var committedRoom = bedCommitted[cat.key][id];
            var workingRoom = bedWorking[cat.key][id];

            var tile = document.createElement("div");
            tile.className = "bed-status-room-tile";

            var tileHead = document.createElement("div");
            tileHead.className = "bed-status-room-tile__head";
            var number = document.createElement("span");
            number.className = "bed-status-room-tile__number";
            number.textContent = id;
            tileHead.appendChild(number);
            tileHead.appendChild(createGenderControl(workingRoom, committedRoom, bedEditMode));
            tile.appendChild(tileHead);

            var tileBeds = document.createElement("div");
            tileBeds.className = "bed-status-room-tile__beds";
            workingRoom.beds.forEach(function (occupied, bIdx) {
              var pending = occupied !== committedRoom.beds[bIdx];
              tileBeds.appendChild(createBedChip(bedLabel(cat, id, bIdx), occupied, pending, bedEditMode, function () {
                workingRoom.beds[bIdx] = !workingRoom.beds[bIdx];
                renderBedStatus();
              }));
            });
            tile.appendChild(tileBeds);

            grid.appendChild(tile);
          } else {
            var occupied = bedWorking[cat.key][id];
            var pending = occupied !== bedCommitted[cat.key][id];
            grid.appendChild(createBedChip(id, occupied, pending, bedEditMode, function () {
              bedWorking[cat.key][id] = !bedWorking[cat.key][id];
              renderBedStatus();
            }));
          }
        });

        card.appendChild(grid);
        bedStatusSections.appendChild(card);
      });

      var pendingCount = countBedChanges();
      bedStatusSaveCount.textContent = pendingCount > 0 ? "(" + pendingCount + ")" : "";
      bedStatusSaveBtn.disabled = pendingCount === 0;

      bedStatusEditBtn.hidden = bedEditMode;
      bedStatusSaveBtn.hidden = !bedEditMode;
      bedStatusCancelBtn.hidden = !bedEditMode;
    }

    function loadBedStatus() {
      if (!bedStatusSections) return;
      fetch(APPLICATIONS_API_BASE + "/bed-status")
        .then(function (res) {
          if (!res.ok) throw new Error("request failed");
          return res.json();
        })
        .then(function (serverStatus) {
          bedCommitted = normalizeBedStatus(serverStatus);
          bedWorking = JSON.parse(JSON.stringify(bedCommitted));
          bedStatusFlash.textContent = "";
          renderBedStatus();
        })
        .catch(function () {
          bedStatusSections.innerHTML = "";
          var errEl = document.createElement("p");
          errEl.className = "applications-list__status";
          errEl.textContent = "床位狀態載入失敗,請重新整理再試。";
          bedStatusSections.appendChild(errEl);
        });
    }

    if (bedStatusEditBtn) {
      bedStatusEditBtn.addEventListener("click", function () {
        bedEditMode = true;
        bedStatusFlash.textContent = "";
        renderBedStatus();
      });
    }

    if (bedStatusSaveBtn) {
      bedStatusSaveBtn.addEventListener("click", function () {
        var pendingCount = countBedChanges();
        if (pendingCount === 0) return;
        bedStatusSaveBtn.disabled = true;
        fetch(APPLICATIONS_API_BASE + "/bed-status", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bedWorking),
        })
          .then(function (res) {
            if (!res.ok) throw new Error("request failed");
            bedCommitted = JSON.parse(JSON.stringify(bedWorking));
            bedEditMode = false;
            renderBedStatus();
            bedStatusFlash.textContent = "已儲存 " + pendingCount + " 處變更。";
          })
          .catch(function () {
            bedStatusFlash.textContent = "儲存失敗,請稍後再試。";
            bedStatusSaveBtn.disabled = false;
          });
      });
    }

    if (bedStatusCancelBtn) {
      bedStatusCancelBtn.addEventListener("click", function () {
        bedWorking = JSON.parse(JSON.stringify(bedCommitted));
        bedEditMode = false;
        bedStatusFlash.textContent = "";
        renderBedStatus();
      });
    }

    var APPLICATIONS_POLL_MS = 30000;
    var applicationsPollTimer = null;

    function startApplicationsPolling() {
      if (applicationsPollTimer) return;
      applicationsPollTimer = setInterval(loadApplications, APPLICATIONS_POLL_MS);
    }

    function stopApplicationsPolling() {
      clearInterval(applicationsPollTimer);
      applicationsPollTimer = null;
    }

    document.addEventListener("visibilitychange", function () {
      if (staffContent.hidden) return;
      if (document.hidden) {
        stopApplicationsPolling();
      } else {
        loadApplications();
        startApplicationsPolling();
      }
    });

    function trySubmitStaffCode() {
      if (staffCodes.indexOf(staffInput.value.trim()) !== -1) {
        staffGate.hidden = true;
        staffContent.hidden = false;
        loadBedStatus();
        loadApplications();
        startApplicationsPolling();
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
        markDoneSummary.textContent = "確定要將「" + app.roomType + "・" + app.bedNumber + "・" + app.patientName + "」標記為已給床嗎?請輸入員工號確認。";
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
