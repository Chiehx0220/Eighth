const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const yaml = require("js-yaml");

const CACHE_PATH = path.join(__dirname, "translationCache.json");
const SOURCE_PATH = path.join(__dirname, "partners.yaml");
const TARGET_LANGS = ["en", "id", "vi"];
const SOURCE_LANG = "zh-TW";
const TRANSLATABLE_FIELDS = ["category", "note"];

function loadCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_PATH, "utf8"));
  } catch (e) {
    return {};
  }
}

function saveCache(cache) {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2) + "\n", "utf8");
}

function hashText(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

async function translateBatch(texts, targetLang, apiKey) {
  const res = await fetch(`https://translation.googleapis.com/language/translate2?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: texts, source: SOURCE_LANG, target: targetLang, format: "text" })
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  return data.data.translations.map((t) => t.translatedText);
}

module.exports = async function () {
  const raw = yaml.load(fs.readFileSync(SOURCE_PATH, "utf8")) || {};
  const list = raw.list || [];
  const cache = loadCache();
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;

  var pendingByLang = {};
  TARGET_LANGS.forEach(function (lang) { pendingByLang[lang] = new Map(); });

  list.forEach(function (item) {
    TRANSLATABLE_FIELDS.forEach(function (field) {
      var text = item[field];
      if (!text) return;
      var hash = hashText(text);
      TARGET_LANGS.forEach(function (lang) {
        if (!cache[hash] || !cache[hash][lang]) {
          pendingByLang[lang].set(hash, text);
        }
      });
    });
  });

  if (apiKey) {
    for (const lang of TARGET_LANGS) {
      var entries = Array.from(pendingByLang[lang].entries());
      if (entries.length === 0) continue;
      try {
        var translated = await translateBatch(entries.map(function (e) { return e[1]; }), lang, apiKey);
        entries.forEach(function (entry, i) {
          var hash = entry[0];
          cache[hash] = cache[hash] || {};
          cache[hash][lang] = translated[i];
        });
        console.log(`[partnersI18n] translated ${entries.length} string(s) to ${lang}`);
      } catch (err) {
        console.warn(`[partnersI18n] translation to ${lang} failed, falling back to source text: ${err.message}`);
      }
    }
    saveCache(cache);
  } else {
    console.warn("[partnersI18n] GOOGLE_TRANSLATE_API_KEY not set — skipping auto-translation, using Chinese text as fallback.");
  }

  return {
    list: list.map(function (item) {
      var out = Object.assign({}, item);
      TRANSLATABLE_FIELDS.forEach(function (field) {
        var text = item[field];
        if (!text) return;
        var hash = hashText(text);
        TARGET_LANGS.forEach(function (lang) {
          out[field + "_" + lang] = (cache[hash] && cache[hash][lang]) || text;
        });
      });
      return out;
    })
  };
};
