(function () {
  var STORAGE_KEY = "lang";
  var DEFAULT_LANG = "zh";

  var TRANSLATIONS = {
    zh: {
      skip: "跳到主要內容",
      back: "返回上一頁",
      home: "回首頁",
      theme: "切換日間/夜間模式",
      fontGroup: "字體大小",
      fontSmaller: "縮小字體",
      fontLarger: "放大字體",
      language: "語言",
      tagline: "8樓住院期間的好幫手,免洽護理站,常見問題一次查",
      footerDisclaimer: "如頁面資訊與現場公告不一致,請以護理站現場說明為準。",
      "nav.dining.title": "餐飲資訊",
      "nav.dining.desc": "院內餐價格及本院商店介紹",
      "nav.wards.title": "病房單位介紹",
      "nav.wards.desc": "本單位護理人員配置與護病比",
      "nav.rooms.title": "單人房/雙人房",
      "nav.rooms.desc": "房型照片、價格與空床狀態",
      "nav.selfpay.title": "自費項目",
      "nav.selfpay.desc": "常見自費項目價格",
      "nav.visiting.title": "探病/會客/外出",
      "nav.visiting.desc": "會客與請假規定",
      "nav.discharge.title": "出院須知",
      "nav.discharge.desc": "出院流程與診斷證明申請",
      "nav.suggest.title": "意見信箱",
      "nav.suggest.desc": "投訴、感謝函都能在這裡反映",
      "nav.partners.title": "合作廠商",
      "nav.partners.desc": "救護車、醫療器材等合作廠商資訊"
    },
    en: {
      skip: "Skip to main content",
      back: "Back",
      home: "Home",
      theme: "Toggle light/dark mode",
      fontGroup: "Font size",
      fontSmaller: "Decrease font size",
      fontLarger: "Increase font size",
      language: "Language",
      tagline: "Your helper during your stay on Ward 8 — find common answers without asking the nursing station",
      footerDisclaimer: "If the information on this page differs from on-site notices, please follow the nursing station's explanation.",
      "nav.dining.title": "Dining Info",
      "nav.dining.desc": "In-hospital meal prices and hospital store guide",
      "nav.wards.title": "Ward Overview",
      "nav.wards.desc": "This unit's nursing staff assignment and nurse-to-patient ratio",
      "nav.rooms.title": "Private/Double Rooms",
      "nav.rooms.desc": "Room photos, prices, and bed availability",
      "nav.selfpay.title": "Self-pay Items",
      "nav.selfpay.desc": "Common self-pay item prices",
      "nav.visiting.title": "Visiting/Outings",
      "nav.visiting.desc": "Visiting and leave-of-absence rules",
      "nav.discharge.title": "Discharge Info",
      "nav.discharge.desc": "Discharge process and medical certificate requests",
      "nav.suggest.title": "Feedback",
      "nav.suggest.desc": "Submit complaints or thank-you notes here",
      "nav.partners.title": "Partner Vendors",
      "nav.partners.desc": "Ambulance, medical equipment, and other partner services"
    },
    id: {
      skip: "Lompat ke konten utama",
      back: "Kembali",
      home: "Beranda",
      theme: "Ganti mode terang/gelap",
      fontGroup: "Ukuran huruf",
      fontSmaller: "Perkecil huruf",
      fontLarger: "Perbesar huruf",
      language: "Bahasa",
      tagline: "Bantuan Anda selama dirawat di Bangsal 8 — temukan jawaban tanpa perlu bertanya ke pos perawat",
      footerDisclaimer: "Jika informasi di halaman ini berbeda dengan pengumuman di lokasi, silakan mengikuti penjelasan dari pos perawat.",
      "nav.dining.title": "Info Makanan",
      "nav.dining.desc": "Harga makanan rumah sakit & info toko rumah sakit",
      "nav.wards.title": "Info Bangsal",
      "nav.wards.desc": "Penempatan staf perawat dan rasio perawat-pasien unit ini",
      "nav.rooms.title": "Kamar Single/Double",
      "nav.rooms.desc": "Foto kamar, harga, dan ketersediaan tempat tidur",
      "nav.selfpay.title": "Item Berbayar Mandiri",
      "nav.selfpay.desc": "Daftar harga item yang dibayar sendiri",
      "nav.visiting.title": "Kunjungan/Izin Keluar",
      "nav.visiting.desc": "Aturan kunjungan dan izin keluar",
      "nav.discharge.title": "Info Pulang",
      "nav.discharge.desc": "Proses pemulangan dan permohonan surat keterangan medis",
      "nav.suggest.title": "Kotak Saran",
      "nav.suggest.desc": "Sampaikan keluhan atau ucapan terima kasih di sini",
      "nav.partners.title": "Mitra Layanan",
      "nav.partners.desc": "Ambulans, alat medis, dan mitra layanan lainnya"
    },
    vi: {
      skip: "Chuyển đến nội dung chính",
      back: "Quay lại",
      home: "Trang chủ",
      theme: "Chuyển chế độ sáng/tối",
      fontGroup: "Cỡ chữ",
      fontSmaller: "Giảm cỡ chữ",
      fontLarger: "Tăng cỡ chữ",
      language: "Ngôn ngữ",
      tagline: "Trợ thủ của bạn trong thời gian nằm viện tại khoa 8 — tra cứu các câu hỏi thường gặp mà không cần hỏi trạm điều dưỡng",
      footerDisclaimer: "Nếu thông tin trên trang này khác với thông báo tại chỗ, vui lòng theo hướng dẫn của trạm điều dưỡng.",
      "nav.dining.title": "Thông tin ăn uống",
      "nav.dining.desc": "Giá suất ăn bệnh viện và giới thiệu cửa hàng trong viện",
      "nav.wards.title": "Giới thiệu khoa phòng",
      "nav.wards.desc": "Bố trí nhân viên điều dưỡng và tỷ lệ điều dưỡng-bệnh nhân của khoa này",
      "nav.rooms.title": "Phòng đơn/đôi",
      "nav.rooms.desc": "Hình ảnh phòng, giá và tình trạng giường trống",
      "nav.selfpay.title": "Mục tự chi trả",
      "nav.selfpay.desc": "Bảng giá các mục tự chi trả phổ biến",
      "nav.visiting.title": "Thăm bệnh/Ra ngoài",
      "nav.visiting.desc": "Quy định thăm bệnh và xin nghỉ",
      "nav.discharge.title": "Thông tin xuất viện",
      "nav.discharge.desc": "Quy trình xuất viện và xin giấy chứng nhận y tế",
      "nav.suggest.title": "Hộp góp ý",
      "nav.suggest.desc": "Gửi khiếu nại hoặc lời cảm ơn tại đây",
      "nav.partners.title": "Đối tác dịch vụ",
      "nav.partners.desc": "Xe cứu thương, thiết bị y tế và các đối tác khác"
    }
  };

  var LANG_NAMES = { zh: "中文", en: "English", id: "Bahasa Indonesia", vi: "Tiếng Việt" };

  var menuItemEls = {};

  function applyLang(lang) {
    var dict = TRANSLATIONS[lang] || TRANSLATIONS[DEFAULT_LANG];

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (dict[key] !== undefined) el.textContent = dict[key];
    });

    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-aria");
      if (dict[key] !== undefined) el.setAttribute("aria-label", dict[key]);
    });

    document.querySelectorAll("[data-i18n-dynamic]").forEach(function (el) {
      var value = el.getAttribute("data-i18n-" + lang);
      if (value) el.textContent = value;
    });

    document.documentElement.setAttribute("lang", lang === "zh" ? "zh-Hant" : lang);

    Object.keys(menuItemEls).forEach(function (code) {
      menuItemEls[code].setAttribute("aria-current", code === lang ? "true" : "false");
    });
  }

  var saved = localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
  applyLang(saved);

  var toggle = document.getElementById("lang-toggle");
  var menu = document.getElementById("lang-menu");

  if (toggle && menu) {
    Object.keys(LANG_NAMES).forEach(function (code) {
      var li = document.createElement("li");
      var item = document.createElement("button");
      item.type = "button";
      item.className = "lang-menu__item";
      item.setAttribute("role", "menuitem");
      item.setAttribute("lang", code === "zh" ? "zh-Hant" : code);
      item.textContent = LANG_NAMES[code];
      item.addEventListener("click", function () {
        localStorage.setItem(STORAGE_KEY, code);
        applyLang(code);
        closeMenu();
        toggle.focus();
      });
      menuItemEls[code] = item;
      li.appendChild(item);
      menu.appendChild(li);
    });

    applyLang(saved);

    function openMenu() {
      menu.hidden = false;
      toggle.setAttribute("aria-expanded", "true");
    }

    function closeMenu() {
      menu.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
    }

    toggle.addEventListener("click", function () {
      if (menu.hidden) {
        openMenu();
      } else {
        closeMenu();
      }
    });

    document.addEventListener("click", function (e) {
      if (!menu.hidden && e.target !== toggle && !menu.contains(e.target) && !toggle.contains(e.target)) {
        closeMenu();
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !menu.hidden) {
        closeMenu();
        toggle.focus();
      }
    });
  }
})();
