// ==UserScript==
// @name         三總意見信箱 MD3 化
// @namespace    hospital-info-site
// @version      1.0.0
// @description  將三軍總醫院意見信箱表單頁面重新套上 Material Design 3 風格(僅視覺調整,不影響表單送出邏輯)
// @author       hospital-info-site
// @match        https://wwwv.tsgh.ndmutsgh.edu.tw/Suggest/*
// @match        https://wwwv.tsgh.ndmctsgh.edu.tw/Suggest/*
// @match        https://wwwv.tsgh.ndmutsgh.edu.tw/sugsearch/*
// @icon         https://wwwv.tsgh.ndmutsgh.edu.tw/favicon.ico
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
  "use strict";

  // 載入中文字型與 Material Symbols 圖示字型
  var fontLink = document.createElement("link");
  fontLink.rel = "stylesheet";
  fontLink.href =
    "https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap";
  document.head.appendChild(fontLink);

  var style = document.createElement("style");
  style.textContent = [
    ":root {",
    "  --md-sys-color-primary: #0f6e56;",
    "  --md-sys-color-on-primary: #ffffff;",
    "  --md-sys-color-primary-container: #a6f2d7;",
    "  --md-sys-color-on-primary-container: #002115;",
    "  --md-sys-color-secondary-container: #cfe9da;",
    "  --md-sys-color-on-secondary-container: #0a1f16;",
    "  --md-sys-color-surface: #f6fbf7;",
    "  --md-sys-color-on-surface: #171d1a;",
    "  --md-sys-color-on-surface-variant: #404944;",
    "  --md-sys-color-surface-container-lowest: #ffffff;",
    "  --md-sys-color-surface-container-low: #f0f5f1;",
    "  --md-sys-color-surface-container: #eaefeb;",
    "  --md-sys-color-surface-container-high: #e4e9e5;",
    "  --md-sys-color-outline: #707974;",
    "  --md-sys-color-outline-variant: #bfc9c2;",
    "  --md-sys-color-error: #ba1a1a;",
    "  --md-sys-shape-corner-small: 8px;",
    "  --md-sys-shape-corner-medium: 12px;",
    "  --md-sys-shape-corner-large: 16px;",
    "  --md-sys-shape-corner-extra-large: 28px;",
    "  --md-sys-shape-corner-full: 999px;",
    "}",

    /* 整體字體與底色 */
    ".form-area, .form-area * {",
    '  font-family: "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif !important;',
    "}",

    ".form-area {",
    "  background: var(--md-sys-color-surface-container-low) !important;",
    "  border-radius: var(--md-sys-shape-corner-extra-large) !important;",
    "  padding: 32px clamp(20px, 5vw, 48px) 40px !important;",
    "  box-shadow: 0 1px 2px rgba(0,0,0,0.05), 0 8px 24px rgba(0,0,0,0.08) !important;",
    "  max-width: 720px;",
    "  margin: 24px auto !important;",
    "}",

    ".form-area h2 {",
    "  color: var(--md-sys-color-on-surface) !important;",
    "  font-size: 1.6rem !important;",
    "  font-weight: 700 !important;",
    "}",

    /* 欄位標籤 */
    ".form-area .form-group label {",
    "  display: block;",
    "  color: var(--md-sys-color-on-surface-variant) !important;",
    "  font-weight: 500 !important;",
    "  font-size: 0.95rem !important;",
    "  margin-bottom: 6px !important;",
    "}",

    ".form-area .form-group {",
    "  margin-bottom: 18px !important;",
    "}",

    /* 輸入框 / 下拉選單 / 文字區(MD3 outlined text field 風格) */
    ".form-area .form-control {",
    "  background: var(--md-sys-color-surface-container-lowest) !important;",
    "  border: 1.5px solid var(--md-sys-color-outline) !important;",
    "  border-radius: var(--md-sys-shape-corner-small) !important;",
    "  color: var(--md-sys-color-on-surface) !important;",
    "  padding: 12px 14px !important;",
    "  font-size: 1rem !important;",
    "  min-height: 48px;",
    "  box-shadow: none !important;",
    "  transition: border-color 0.15s ease, box-shadow 0.15s ease;",
    "}",

    ".form-area .form-control:focus {",
    "  border-color: var(--md-sys-color-primary) !important;",
    "  box-shadow: 0 0 0 2px color-mix(in srgb, var(--md-sys-color-primary) 25%, transparent) !important;",
    "  outline: none !important;",
    "}",

    ".form-area select.form-control {",
    "  appearance: none !important;",
    "  -webkit-appearance: none !important;",
    "  background-image: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23404944'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E\") !important;",
    "  background-repeat: no-repeat !important;",
    "  background-position: right 12px center !important;",
    "  background-size: 22px !important;",
    "  padding-right: 40px !important;",
    "}",

    ".form-area textarea.form-control {",
    "  min-height: 140px;",
    "  resize: vertical;",
    "}",

    /* 驗證碼區塊 */
    "#ContentPlaceHolder1_PanelvCode img#ContentPlaceHolder1_checkCode {",
    "  border-radius: var(--md-sys-shape-corner-small) !important;",
    "  border: 1px solid var(--md-sys-color-outline-variant) !important;",
    "}",

    /* 送出按鈕(MD3 filled button) */
    ".form-area .btn.btn-primary, .form-area input[type=submit]#submit1 {",
    "  background: var(--md-sys-color-primary) !important;",
    "  color: var(--md-sys-color-on-primary) !important;",
    "  border: none !important;",
    "  border-radius: var(--md-sys-shape-corner-full) !important;",
    "  font-weight: 500 !important;",
    "  font-size: 1rem !important;",
    "  min-height: 48px !important;",
    "  padding: 12px 32px !important;",
    "  box-shadow: none !important;",
    "  transition: filter 0.15s ease;",
    "}",

    ".form-area .btn.btn-primary:hover, .form-area input[type=submit]#submit1:hover {",
    "  filter: brightness(1.08);",
    "  cursor: pointer;",
    "}",

    /* 上方提醒事項與連結按鈕(輕度套用) */
    "div[style*='font-size:2rem'] {",
    "  background: var(--md-sys-color-surface-container) !important;",
    "  color: var(--md-sys-color-on-surface) !important;",
    "  border-radius: var(--md-sys-shape-corner-large) !important;",
    "  padding: 20px 24px !important;",
    "  font-size: 0.95rem !important;",
    "  line-height: 1.8 !important;",
    "}",

    "span[style*='background-color: #2EA7E0'] {",
    "  background: var(--md-sys-color-secondary-container) !important;",
    "  border-radius: var(--md-sys-shape-corner-full) !important;",
    "}",

    "span[style*='background-color: #2EA7E0'] a {",
    "  color: var(--md-sys-color-on-secondary-container) !important;",
    "  font-weight: 500 !important;",
    "}",
  ].join("\n");

  document.head.appendChild(style);
})();
