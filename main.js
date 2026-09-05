"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  EnglishLearnSettingTab: () => EnglishLearnSettingTab,
  default: () => EnglishLearnPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian15 = require("obsidian");

// src/editor/vocab-hover.ts
var import_view = require("@codemirror/view");
var import_state = require("@codemirror/state");
var import_obsidian3 = require("obsidian");

// src/scheduler.ts
var INTERVALS_MIN = [
  5,
  // 5 分钟
  30,
  // 30 分钟
  720,
  // 12 小时
  1440,
  // 1 天
  2 * 1440,
  // 2 天
  4 * 1440,
  // 4 天
  7 * 1440,
  // 7 天
  15 * 1440,
  // 15 天
  30 * 1440,
  // 30 天
  60 * 1440
  // 60 天
];
var MASTERED_STAGE = INTERVALS_MIN.length;
function applyGrade(prev, grade, now2, opts) {
  var _a, _b, _c, _d, _e;
  let stage = (_a = prev == null ? void 0 : prev.stage) != null ? _a : 0;
  if (grade === 1) stage = 0;
  else if (grade === 3) stage += 1;
  const hist = [...(_b = prev == null ? void 0 : prev.hist) != null ? _b : [], [now2, grade]].slice(-30);
  if (stage >= MASTERED_STAGE) {
    return { stage, next: Number.MAX_SAFE_INTEGER, count: ((_c = prev == null ? void 0 : prev.count) != null ? _c : 0) + 1, hist };
  }
  const halve = grade === 2 && ((_d = opts == null ? void 0 : opts.fuzzyHalve) != null ? _d : true);
  const intervalMin = INTERVALS_MIN[stage] * (halve ? 0.5 : 1);
  return {
    stage,
    next: now2 + intervalMin * 6e4,
    count: ((_e = prev == null ? void 0 : prev.count) != null ? _e : 0) + 1,
    hist
  };
}
var isMastered = (p) => p.stage >= MASTERED_STAGE;
var HARD_LAPS = 3;
var isHardWord = (p) => p.hist.filter((h) => h[1] === 1).length >= HARD_LAPS;
var STATUS_ORDER = {
  hard: 0,
  due: 1,
  learn: 2,
  fresh: 3,
  mastered: 4,
  ignored: 5
};
var STATUS_ICON = {
  hard: "\u26A0",
  mastered: "\u2713",
  ignored: "\u2298"
};
var STATUS_LABEL = {
  hard: "\u96BE\u8BCD",
  due: "\u5F85\u590D\u4E60",
  learn: "\u5B66\u4E60\u4E2D",
  fresh: "\u672A\u5B66",
  mastered: "\u5DF2\u638C\u63E1",
  ignored: "\u5DF2\u5FFD\u7565"
};
function wordStatus(word, progress, ignored) {
  if (ignored == null ? void 0 : ignored[word]) return "ignored";
  const p = progress[word];
  if (!p) return "fresh";
  if (isHardWord(p)) return "hard";
  if (isMastered(p)) return "mastered";
  return p.next <= Date.now() ? "due" : "learn";
}
function sortWordsByStatus(list, progress, ignored) {
  return list.map((w) => ({ w, s: STATUS_ORDER[wordStatus(w.word, progress, ignored)] })).sort((a, b) => a.s - b.s || a.w.word.localeCompare(b.w.word)).map((x) => x.w);
}
function masteredProgress(prev, now2) {
  var _a, _b;
  return {
    stage: MASTERED_STAGE,
    next: Number.MAX_SAFE_INTEGER,
    count: ((_a = prev == null ? void 0 : prev.count) != null ? _a : 0) + 1,
    hist: [...(_b = prev == null ? void 0 : prev.hist) != null ? _b : [], [now2, 3]].slice(-30)
  };
}

// src/utils.ts
function fmtDate(ms) {
  const d = typeof ms === "number" ? new Date(ms) : ms;
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function fmtDue(next, now2 = Date.now()) {
  if (next >= Number.MAX_SAFE_INTEGER) return "\u5DF2\u638C\u63E1";
  const ms = next - now2;
  if (ms <= 0) return "\u5DF2\u5230\u671F";
  const min = ms / 6e4;
  const m = Math.ceil(min);
  if (m < 60) return `${m} \u5206\u949F\u540E`;
  const h = min / 60;
  const hr = Math.ceil(h);
  if (hr < 24) return `${hr} \u5C0F\u65F6\u540E`;
  return `${Math.ceil(h / 24)} \u5929\u540E`;
}
function buildVocabRegex(words) {
  if (!words.length) return null;
  const alt = words.map((w) => escapeRe(w)).sort((a, b) => b.length - a.length);
  return new RegExp(`\\b(?:${alt.join("|")})\\b`, "gi");
}
function normalizeWord(raw) {
  return raw.trim().toLowerCase().replace(/[^a-z0-9\s'-]/g, "").replace(/\s+/g, " ").trim();
}
function isPhrase(word) {
  return /\s/.test(word);
}
var isZh = (s) => /[一-鿿]/.test(s);
var HTTP_UA = "obsidian-english-learn/0.1 (personal study plugin)";
function parseKeywords(text2) {
  return text2.split(/[,，、；;\s]+/).filter(Boolean);
}
function chunk(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}
async function settleValues(ps) {
  return (await Promise.allSettled(ps)).flatMap(
    (r) => r.status === "fulfilled" ? [r.value] : []
  );
}
function sanitizeFilename(word) {
  return word.replace(/[/\\?%*:|"<>]/g, "").replace(/\s+/g, "-");
}
async function mkdirp(app, dir) {
  let cur = "";
  for (const part of dir.split("/").filter(Boolean)) {
    cur = cur ? `${cur}/${part}` : part;
    if (!await app.vault.adapter.exists(cur)) {
      await app.vault.adapter.mkdir(cur).catch(() => {
      });
    }
  }
}
var escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function sessionLabel(theme, hard) {
  return hard ? "\u96BE\u8BCD\u4E13\u9879" : theme ? `\u300C${theme}\u300D` : "\u4ECA\u65E5\u5B66\u4E60";
}
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function isForm(token, word) {
  const t = token.toLowerCase();
  if (t === word) return true;
  if (word.length >= 5) {
    const stem = word.slice(0, word.length - 2);
    return t.startsWith(stem) && Math.abs(t.length - word.length) <= 3;
  }
  return false;
}
async function runPool(items, concurrency, fn) {
  let i = 0;
  const workers = Array.from(
    { length: Math.max(1, Math.min(concurrency, items.length)) },
    async () => {
      while (i < items.length) {
        const idx = i++;
        await fn(items[idx]).catch((e) => console.error("runPool task failed:", e));
      }
    }
  );
  await Promise.all(workers);
}

// src/dict/ecdict.ts
var import_obsidian2 = require("obsidian");

// src/dict/starter.ts
var import_obsidian = require("obsidian");
var STARTER_DICT_PATH = "taptapon/englishlearn-dict@de518a7413da5076d3967edaf29c3e770f036c6a/starter.json";
var STARTER_DICT_URLS = [
  `https://cdn.jsdelivr.net/gh/${STARTER_DICT_PATH}`,
  `https://fastly.jsdelivr.net/gh/${STARTER_DICT_PATH}`,
  `https://gcore.jsdelivr.net/gh/${STARTER_DICT_PATH}`
];
var STARTER_DICT_URL = STARTER_DICT_URLS[0];
var STARTER_VER = 4;
function starterNeedsUpgrade(meta) {
  if (!meta) return true;
  if (meta.source && meta.source !== "starter") return false;
  return meta.ver < STARTER_VER;
}
function convertStarterEntries(entries) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i;
  const shards = /* @__PURE__ */ new Map();
  for (const e of entries) {
    const word = ((_a = e.word) != null ? _a : "").trim().toLowerCase();
    const translation = ((_b = e.translation) != null ? _b : "").replace(/\\r\\n|\\n|\\r/g, "\uFF1B").replace(/[\r\n]+/g, "\uFF1B").trim();
    if (!word || !translation) continue;
    const letter = /^[a-z]/.test(word) ? word[0] : "0";
    const shard = (_c = shards.get(letter)) != null ? _c : {};
    const phonetic = (_d = e.phonetic) == null ? void 0 : _d.trim();
    const tag = (_e = e.tag) == null ? void 0 : _e.trim();
    const entry = { word, translation };
    if (phonetic) entry.phonetic = phonetic;
    if (tag) entry.tag = tag;
    if ((_f = e.synonyms) == null ? void 0 : _f.length) entry.synonyms = e.synonyms;
    if ((_g = e.antonyms) == null ? void 0 : _g.length) entry.antonyms = e.antonyms;
    if ((_h = e.rel) == null ? void 0 : _h.length) entry.rel = e.rel.filter(([x]) => x);
    if (e.rem) entry.rem = e.rem;
    if (e.wf) entry.wf = e.wf;
    if ((_i = e.ex) == null ? void 0 : _i[0]) entry.ex = e.ex;
    shard[word] = entry;
    shards.set(letter, shard);
  }
  return shards;
}
async function installStarterDict(app, dir) {
  const metaFile = `${dir}/meta.json`;
  try {
    if (await app.vault.adapter.exists(metaFile)) {
      let meta = null;
      try {
        meta = JSON.parse(await app.vault.adapter.read(metaFile));
      } catch (e) {
      }
      if (!starterNeedsUpgrade(meta)) return true;
    }
    new import_obsidian.Notice(`English Learn\uFF1A\u4E0B\u8F7D\u57FA\u7840\u8BCD\u5178 v${STARTER_VER}\uFF08\u7EA6 7MB\uFF0C\u4EC5\u6B64\u4E00\u6B21\uFF09\u2026`);
    let entries = null;
    let lastErr = null;
    for (const url of STARTER_DICT_URLS) {
      try {
        const res = await (0, import_obsidian.requestUrl)({ url });
        entries = JSON.parse(res.text);
        break;
      } catch (e) {
        lastErr = e;
      }
    }
    if (!entries) {
      console.error("\u57FA\u7840\u8BCD\u5178\u4E0B\u8F7D\u5931\u8D25:", lastErr);
      if (await app.vault.adapter.exists(`${dir}/a.json`)) {
        new import_obsidian.Notice("English Learn\uFF1A\u57FA\u7840\u8BCD\u5178\u5347\u7EA7\u5931\u8D25\uFF0C\u6682\u7528\u65E7\u7248\u6570\u636E");
        return true;
      }
      new import_obsidian.Notice("English Learn\uFF1A\u57FA\u7840\u8BCD\u5178\u4E0B\u8F7D\u5931\u8D25\uFF08\u5DF2\u5C1D\u8BD5\u591A\u4E2A CDN \u955C\u50CF\uFF09\u3002\u53EF\u5728\u8BBE\u7F6E\u4E2D\u586B\u5199\u81EA\u6258\u7BA1\u7684 ECDICT \u5206\u7247\u5730\u5740");
      return false;
    }
    const shards = convertStarterEntries(entries);
    await mkdirp(app, dir);
    for (const [letter, obj] of shards) {
      await app.vault.adapter.write(`${dir}/${letter}.json`, JSON.stringify(obj));
    }
    let count = 0;
    for (const obj of shards.values()) count += Object.keys(obj).length;
    await app.vault.adapter.write(
      metaFile,
      JSON.stringify({ source: "starter", ver: STARTER_VER, installed: Date.now(), count })
    );
    new import_obsidian.Notice(`English Learn\uFF1A\u57FA\u7840\u8BCD\u5178\u5C31\u7EEA\uFF08${count} \u8BCD\u6761\uFF0C\u542B\u97F3\u6807/\u540C\u53CD\u4E49\u8BCD/\u540C\u6839\u8BCD\uFF09`);
    return true;
  } catch (e) {
    console.error("\u57FA\u7840\u8BCD\u5178\u4E0B\u8F7D\u5931\u8D25:", e);
    new import_obsidian.Notice("English Learn\uFF1A\u57FA\u7840\u8BCD\u5178\u4E0B\u8F7D\u5931\u8D25\u3002\u53EF\u5728\u8BBE\u7F6E\u4E2D\u586B\u5199\u81EA\u6258\u7BA1\u7684 ECDICT \u5206\u7247\u5730\u5740");
    return false;
  }
}

// src/dict/ecdict.ts
var SHARDS = "abcdefghijklmnopqrstuvwxyz0";
var LRU_MAX = 8;
var LEVEL_ORDER = ["zk", "gk", "cet4", "cet6", "ky", "toefl", "ielts", "gre"];
function levelFromTag(tag) {
  if (!tag) return void 0;
  const hits = LEVEL_ORDER.filter((t) => tag.toLowerCase().includes(t));
  return hits.length ? hits[hits.length - 1].toUpperCase() : void 0;
}
var LEVEL_LABELS = {
  ZK: "\u4E2D\u8003",
  GK: "\u9AD8\u8003",
  CET4: "\u56DB\u7EA7",
  CET6: "\u516D\u7EA7",
  KY: "\u8003\u7814",
  TOEFL: "\u6258\u798F",
  IELTS: "\u96C5\u601D"
};
function levelLabel(level) {
  var _a;
  if (!level) return "";
  return (_a = LEVEL_LABELS[level.toUpperCase()]) != null ? _a : level;
}
var WF_LABELS = {
  p: "\u8FC7\u53BB\u5F0F",
  d: "\u8FC7\u53BB\u5206\u8BCD",
  i: "\u73B0\u5728\u5206\u8BCD",
  "3": "\u4E09\u5355",
  s: "\u590D\u6570",
  r: "\u6BD4\u8F83\u7EA7",
  t: "\u6700\u9AD8\u7EA7",
  0: "\u539F\u5F62"
};
var WF_ORDER = ["p", "d", "i", "3", "s", "r", "t"];
function parseWf(word, wf) {
  if (!wf) return null;
  let lemma;
  const byCode = /* @__PURE__ */ new Map();
  for (const item of wf.split("/")) {
    const c = item[0];
    const v = item.slice(2).trim();
    if (!v || !(c in WF_LABELS)) continue;
    if (c === "0") lemma = v.toLowerCase();
    else byCode.set(c, v);
  }
  if (lemma) return { forms: [], lemma };
  const forms = [];
  for (const c of WF_ORDER) {
    const v = byCode.get(c);
    if (v && v.toLowerCase() !== word.toLowerCase()) forms.push([v, WF_LABELS[c]]);
  }
  return forms.length ? { forms } : null;
}
async function lookupOnline(word) {
  var _a, _b, _c, _d, _e;
  if (isPhrase(word)) return null;
  try {
    const res = await (0, import_obsidian2.requestUrl)({
      url: `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
    });
    const data = JSON.parse(res.text);
    const first = Array.isArray(data) ? data[0] : null;
    if (!first) return null;
    const phonetics = (_a = first.phonetics) != null ? _a : [];
    const withText = phonetics.find((p) => p == null ? void 0 : p.text);
    const withAudio = phonetics.find((p) => p == null ? void 0 : p.audio);
    const def = (_e = (_d = (_c = (_b = first.meanings) == null ? void 0 : _b[0]) == null ? void 0 : _c.definitions) == null ? void 0 : _d[0]) == null ? void 0 : _e.definition;
    return {
      phonetic: withText == null ? void 0 : withText.text,
      definition: typeof def === "string" ? def : void 0,
      audioUrl: (withAudio == null ? void 0 : withAudio.audio) || void 0
    };
  } catch (e) {
    return null;
  }
}
var EcdictDict = class {
  constructor(app, pluginDir, getBase) {
    this.app = app;
    this.pluginDir = pluginDir;
    this.getBase = getBase;
    this.shards = /* @__PURE__ */ new Map();
    this.loading = /* @__PURE__ */ new Map();
    this.starterPromise = null;
    this.starterFailedAt = 0;
    this.warned = false;
  }
  get dir() {
    return this.pluginDir ? `${this.pluginDir}/dict` : "dict";
  }
  async lookup(word) {
    var _a;
    const key = word.trim().toLowerCase();
    if (!key || isPhrase(key)) return null;
    const shard = /^[a-z]/.test(key) ? key[0] : "0";
    const map = await this.loadShard(shard);
    return (_a = map[key]) != null ? _a : null;
  }
  /** 预下载全部分片，返回是否全部成功 */
  async downloadAll() {
    let ok = true;
    for (const ch of SHARDS) {
      const map = await this.loadShard(ch, true);
      if (!Object.keys(map).length) ok = false;
    }
    return ok;
  }
  /** 安装内置基础词典（单飞；失败后 60 秒冷却，避免批量查词时每词都重撞下载超时） */
  ensureStarter() {
    var _a;
    if (Date.now() - this.starterFailedAt < 6e4) return Promise.resolve(false);
    (_a = this.starterPromise) != null ? _a : this.starterPromise = installStarterDict(this.app, this.dir).catch((e) => {
      this.starterPromise = null;
      this.starterFailedAt = Date.now();
      throw e;
    });
    return this.starterPromise;
  }
  /** 已安装词典的元信息（meta.json），未安装返回 null；ver 为旧版 starter 补默认 1 */
  async installedMeta() {
    try {
      const file = `${this.dir}/meta.json`;
      if (!await this.app.vault.adapter.exists(file)) return null;
      const meta = JSON.parse(await this.app.vault.adapter.read(file));
      return typeof (meta == null ? void 0 : meta.count) === "number" ? { count: meta.count, installed: Number(meta.installed) || 0, ver: Number(meta.ver) || 1 } : null;
    } catch (e) {
      return null;
    }
  }
  /** 反向查词：找释义包含中文关键词的常见英文词（离线兜底，语义精度一般） */
  async reverseLookup(zh, limit = 3) {
    var _a, _b, _c;
    const hits = [];
    for (const ch of SHARDS) {
      const map = await this.loadShard(ch);
      await new Promise((r) => setTimeout(r, 0));
      for (const [word, e] of Object.entries(map)) {
        if ((_a = e.translation) == null ? void 0 : _a.includes(zh)) {
          const tags = (_c = (_b = e.tag) == null ? void 0 : _b.toLowerCase().split(/\s+/)) != null ? _c : [];
          const exam = tags.filter((t) => ["zk", "gk", "cet4", "cet6", "ky"].includes(t)).length;
          hits.push({ word, score: exam * 10 - word.length });
        }
      }
    }
    return hits.sort((a, b) => b.score - a.score).slice(0, limit).map((h) => h.word);
  }
  async loadShard(shard, force = false) {
    const cached = this.shards.get(shard);
    if (cached && !force) {
      this.shards.delete(shard);
      this.shards.set(shard, cached);
      return cached;
    }
    const pending = this.loading.get(shard);
    if (pending) return pending;
    const task = (async () => {
      const file = `${this.dir}/${shard}.json`;
      try {
        let text2 = null;
        if (await this.app.vault.adapter.exists(file)) {
          text2 = await this.app.vault.adapter.read(file);
        } else {
          const base = this.getBase();
          if (base) {
            try {
              const res = await (0, import_obsidian2.requestUrl)({ url: `${base.replace(/\/+$/, "")}/${shard}.json` });
              await mkdirp(this.app, this.dir);
              await this.app.vault.adapter.write(file, res.text);
              text2 = res.text;
            } catch (e) {
              console.error("\u81EA\u5B9A\u4E49\u5206\u7247\u4E0B\u8F7D\u5931\u8D25:", shard, e);
            }
          }
          if (text2 === null && await this.ensureStarter() && await this.app.vault.adapter.exists(file)) {
            text2 = await this.app.vault.adapter.read(file);
          }
          if (text2 === null) {
            this.warn();
            return {};
          }
        }
        return JSON.parse(text2);
      } catch (e) {
        console.error("ECDICT \u5206\u7247\u52A0\u8F7D\u5931\u8D25:", shard, e);
        this.warn();
        return {};
      }
    })();
    this.loading.set(shard, task);
    const map = await task;
    this.loading.delete(shard);
    if (Object.keys(map).length) {
      this.shards.set(shard, map);
      if (this.shards.size > LRU_MAX) {
        const oldest = this.shards.keys().next().value;
        if (oldest !== void 0) this.shards.delete(oldest);
      }
    }
    return map;
  }
  warn() {
    if (this.warned) return;
    this.warned = true;
    new import_obsidian2.Notice("\u8BCD\u5178\u4E0D\u53EF\u7528\uFF1A\u5185\u7F6E\u4E0B\u8F7D\u5931\u8D25\u4E14\u672A\u914D\u7F6E\u81EA\u5B9A\u4E49\u5206\u7247\u5730\u5740\uFF08\u8BE6\u89C1 README\uFF09");
  }
};

// src/editor/vocab-hover.ts
function vocabHighlight(plugin) {
  const mark = import_view.Decoration.mark({ class: "el-vocab" });
  return import_view.ViewPlugin.fromClass(
    class {
      constructor(view) {
        this.decorations = import_view.Decoration.none;
        this.rev = -1;
        this.re = null;
        this.build(view);
      }
      update(u) {
        if (u.docChanged || u.viewportChanged || this.rev !== plugin.words.rev) this.build(u.view);
      }
      build(view) {
        if (this.rev !== plugin.words.rev) {
          this.re = buildVocabRegex(plugin.words.all().map((d) => d.word));
          this.rev = plugin.words.rev;
        }
        this.decorations = this.scan(view);
      }
      scan(view) {
        if (!this.re) return import_view.Decoration.none;
        const b = new import_state.RangeSetBuilder();
        for (const { from, to } of view.visibleRanges) {
          const text2 = view.state.sliceDoc(from, to);
          const re = new RegExp(this.re.source, "gi");
          let m;
          while ((m = re.exec(text2)) !== null) {
            if (m[0]) b.add(from + m.index, from + m.index + m[0].length, mark);
          }
        }
        return b.finish();
      }
    },
    { decorations: (v) => v.decorations }
  );
}
function vocabHover(plugin) {
  return (0, import_view.hoverTooltip)((view, pos) => {
    var _a;
    const line = view.state.doc.lineAt(pos);
    for (const m of line.text.matchAll(/[A-Za-z][A-Za-z'-]*/g)) {
      const start = line.from + ((_a = m.index) != null ? _a : 0);
      const end = start + m[0].length;
      if (pos < start || pos > end) continue;
      const doc = plugin.words.get(m[0]);
      if (!doc) return null;
      return {
        pos: start,
        end,
        above: true,
        create: () => {
          const dom = document.createElement("div");
          dom.className = "el-vocab-tip";
          const head = dom.createEl("button", { cls: "el-tts", text: "\u{1F50A}" });
          void plugin.audio.badge(head, doc.word);
          head.onclick = () => plugin.speakWord(doc.word);
          const w = dom.createEl("strong", { text: doc.word });
          w.style.marginLeft = "6px";
          w.style.fontSize = "14px";
          if (doc.level)
            w.createEl("span", { text: levelLabel(doc.level), cls: "el-chip" }).style.marginLeft = "6px";
          if (doc.phonetic) dom.createEl("div", { cls: "el-vocab-tip-sub", text: doc.phonetic });
          if (doc.translation) dom.createEl("div", { text: doc.translation });
          if (doc.memo) dom.createEl("div", { cls: "el-vocab-tip-sub", text: `\u{1F4CC} ${doc.memo}` });
          if (doc.themes.length)
            dom.createEl("div", { cls: "el-vocab-tip-sub", text: doc.themes.map((t) => `#${t}`).join(" ") });
          const p = plugin.db.progress[doc.word];
          if (p)
            dom.createEl("div", {
              cls: "el-vocab-tip-sub",
              text: isMastered(p) ? "\u5DF2\u638C\u63E1 \u2713" : `\u9636\u6BB5 ${p.stage} \xB7 \u4E0B\u6B21 ${fmtDue(p.next)}`
            });
          const openBtn = dom.createEl("button", { text: "\u6253\u5F00\u8BCD\u7B14\u8BB0", cls: "el-vocab-tip-open" });
          openBtn.onclick = () => {
            void plugin.app.workspace.openLinkText(doc.path, "", false);
          };
          return { dom };
        }
      };
    }
    return null;
  });
}
function vocabTapTranslate(plugin) {
  if (!import_obsidian3.Platform.isMobile) return [];
  return [
    import_view.EditorView.domEventHandlers({
      click(event, view) {
        var _a, _b, _c;
        const t = event.target;
        if (!((_a = t == null ? void 0 : t.classList) == null ? void 0 : _a.contains("el-vocab"))) return false;
        const token = (_c = (_b = t.textContent) == null ? void 0 : _b.trim()) != null ? _c : "";
        const doc = plugin.words.resolveWord(token);
        if (!doc) return false;
        event.preventDefault();
        plugin.speakWord(doc.word);
        const head = `${doc.word}${doc.phonetic ? `  ${doc.phonetic}` : ""}${doc.level ? `  [${levelLabel(doc.level)}]` : ""}`;
        const frag = new DocumentFragment();
        const l1 = document.createElement("div");
        l1.textContent = head;
        frag.appendChild(l1);
        if (doc.translation) {
          const l2 = document.createElement("div");
          l2.textContent = doc.translation;
          frag.appendChild(l2);
        }
        new import_obsidian3.Notice(frag, 6e3);
        return true;
      }
    })
  ];
}

// src/dict/audio.ts
var import_obsidian4 = require("obsidian");
var AudioCache = class {
  constructor(app, pluginDir) {
    this.app = app;
    /** 当前在播的音频：新播放前停掉旧的（TTS 路径会 cancel 上一条，Audio 路径此前会叠音） */
    this.current = null;
    /** 确认无音频的词（有道 5xx）：不再重复撞请求，持久化到 failed.json 跨会话生效 */
    this.failed = /* @__PURE__ */ new Set();
    /** failed 是否已从磁盘载入（懒加载，首次 prefetch 时读一次） */
    this.failedLoaded = false;
    /** failed 落盘防抖定时器（后台批量预下载时避免频繁写盘） */
    this.failedSaveTimer = null;
    /** 瞬时故障（5xx/断网）词的下次可重试时间：服务恢复后仍能补下载 */
    this.retryAt = /* @__PURE__ */ new Map();
    /** 在途下载数上限：连点多个新词时防请求风暴（超限静默跳过，之后 speak 会再触发） */
    this.inFlight = 0;
    /** 标准音缓存下载成功的订阅者（UI 据此把发音按钮换成 👤） */
    this.listeners = /* @__PURE__ */ new Set();
    this.dir = pluginDir ? `${pluginDir}/audio` : "audio";
  }
  file(word) {
    return `${this.dir}/${word.toLowerCase()}.mp3`;
  }
  /** 首次使用前从磁盘载入无音频词名单（文件缺失/损坏视为空，最多多撞几次请求） */
  async ensureFailedLoaded() {
    if (this.failedLoaded) return;
    this.failedLoaded = true;
    try {
      const f = `${this.dir}/failed.json`;
      if (await this.app.vault.adapter.exists(f)) {
        const list = JSON.parse(await this.app.vault.adapter.read(f));
        if (Array.isArray(list)) for (const w of list) this.failed.add(w);
      }
    } catch (e) {
    }
  }
  /** 无音频词名单防抖落盘（3s），写失败静默（下批失败词会再带上） */
  scheduleFailedSave() {
    if (this.failedSaveTimer !== null) return;
    this.failedSaveTimer = window.setTimeout(() => {
      this.failedSaveTimer = null;
      void (async () => {
        try {
          await mkdirp(this.app, this.dir);
          await this.app.vault.adapter.write(
            `${this.dir}/failed.json`,
            JSON.stringify([...this.failed])
          );
        } catch (e) {
          console.error("\u65E0\u97F3\u9891\u8BCD\u540D\u5355\u4FDD\u5B58\u5931\u8D25:", e);
        }
      })();
    }, 3e3);
  }
  /** 播放缓存的标准发音；未命中或播放失败返回 false（调用方回落 TTS） */
  async play(word) {
    var _a;
    try {
      const f = this.file(word);
      if (!await this.app.vault.adapter.exists(f)) return false;
      (_a = this.current) == null ? void 0 : _a.pause();
      this.current = null;
      const buf = await this.app.vault.adapter.readBinary(f);
      const url = URL.createObjectURL(new Blob([buf], { type: "audio/mpeg" }));
      const audio = new Audio(url);
      this.current = audio;
      audio.onended = () => {
        if (this.current === audio) this.current = null;
        URL.revokeObjectURL(url);
      };
      await audio.play();
      return true;
    } catch (e) {
      console.error("\u6807\u51C6\u53D1\u97F3\u64AD\u653E\u5931\u8D25:", word, e);
      return false;
    }
  }
  /** 词条删除时清理其发音缓存；失败静默（不影响删除主流程） */
  async forget(word) {
    try {
      const f = this.file(word);
      if (await this.app.vault.adapter.exists(f)) await this.app.vault.adapter.remove(f);
    } catch (e) {
    }
  }
  /** 该词是否已有缓存标准音（发音按钮角标：👤=标准音，🔊=TTS 兜底） */
  async has(word) {
    try {
      return await this.app.vault.adapter.exists(this.file(word));
    } catch (e) {
      return false;
    }
  }
  /** 订阅「标准音缓存下载成功」事件；返回退订函数（Svelte onDestroy 用） */
  onCached(cb) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }
  /** 发音按钮角标（DOM 场景用）：有缓存标准音显示 👤 人头，否则 🔊 喇叭（TTS），suffix 保留按钮文字尾缀 */
  async badge(btn, word, suffix = "") {
    const ok = await this.has(word);
    btn.setText((ok ? "\u{1F464}" : "\u{1F50A}") + suffix);
    btn.setAttribute("title", ok ? "\u6807\u51C6\u53D1\u97F3" : "\u7CFB\u7EDF TTS \u64AD\u653E\uFF0C\u70B9\u51FB\u540E\u81EA\u52A8\u7F13\u5B58\u6807\u51C6\u97F3");
  }
  /** 后台下载某词的标准发音（有道 dictvoice，一次直连）；静默失败，确认无音频的词以后不再重试 */
  async prefetch(word) {
    await this.ensureFailedLoaded();
    const w = word.trim().toLowerCase();
    if (!w || this.failed.has(w)) return false;
    const until = this.retryAt.get(w);
    if (until !== void 0 && Date.now() < until) return false;
    if (this.inFlight >= 4) return false;
    this.inFlight++;
    try {
      const res = await (0, import_obsidian4.requestUrl)({
        url: `https://dict.youdao.com/dictvoice?type=2&audio=${encodeURIComponent(w)}`
      });
      await mkdirp(this.app, this.dir);
      await this.app.vault.adapter.writeBinary(this.file(w), res.arrayBuffer);
      this.retryAt.delete(w);
      for (const cb of this.listeners) cb();
      return true;
    } catch (e) {
      const status = e == null ? void 0 : e.status;
      if (typeof status === "number" && status !== 429) {
        this.failed.add(w);
        this.scheduleFailedSave();
      } else {
        this.retryAt.set(w, Date.now() + 6e4);
      }
      console.error("\u6807\u51C6\u53D1\u97F3\u4E0B\u8F7D\u5931\u8D25:", w, e);
      return false;
    } finally {
      this.inFlight--;
    }
  }
};

// src/store/data-store.ts
var DataStore = class {
  constructor(plugin) {
    this.plugin = plugin;
    this.timer = null;
  }
  /** 标记数据已变更，2 秒后落盘 */
  touch() {
    if (this.timer !== null) window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => {
      this.timer = null;
      void this.flush();
    }, 2e3);
  }
  /** 立即落盘（清掉待写的防抖） */
  async touchNow() {
    if (this.timer !== null) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
    await this.flush();
  }
  async flush() {
    await this.plugin.saveData(this.plugin.db);
  }
};

// src/store/word-store.ts
var asStr = (v) => typeof v === "string" ? v : v == null ? void 0 : String(v);
var asArr = (v) => Array.isArray(v) ? v.map(String) : v == null ? [] : [String(v)];
var EMPTY_WORDS = /* @__PURE__ */ new Set();
function parseBody(content) {
  const translation = extractSection(content, "\u91CA\u4E49");
  const exText = extractSection(content, "\u4F8B\u53E5");
  const memo = extractSection(content, "\u52A9\u8BB0");
  const examples = [];
  for (const raw of exText.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.startsWith("- ")) {
      let text2 = line.slice(2).trim();
      let source;
      const m = text2.match(/（来源[:：]\s*([^）]+)）\s*$/);
      if (m && m.index !== void 0) {
        source = m[1].trim();
        text2 = text2.slice(0, m.index).trim();
      }
      if (text2) examples.push({ text: text2, source });
    } else if (line && examples.length && /^\s/.test(raw)) {
      const prev = examples[examples.length - 1];
      prev.translation = prev.translation ? `${prev.translation}
${line}` : line;
    }
  }
  return { translation, examples, memo };
}
function extractSection(content, title) {
  const re = new RegExp(`^##\\s+${title}[ \\t]*$`, "m");
  const m = content.match(re);
  if (!m || m.index === void 0) return "";
  const rest = content.slice(m.index + m[0].length);
  const next = rest.search(/^##\s+/m);
  return (next === -1 ? rest : rest.slice(0, next)).trim();
}
function setSection(content, title, newText) {
  const re = new RegExp(`^##\\s+${title}[ \\t]*$`, "m");
  const m = content.match(re);
  if (!m || m.index === void 0) {
    return `${content.replace(/\s*$/, "")}

## ${title}

${newText}
`;
  }
  const rest = content.slice(m.index + m[0].length);
  const next = rest.search(/^##\s+/m);
  const tail = next === -1 ? "" : rest.slice(next);
  const body = tail ? tail.replace(/^\n+/, "") : "";
  return `${content.slice(0, m.index)}${m[0]}

${newText}
${body ? `
${body}` : ""}`;
}
function exampleLine(e) {
  const head = `- ${e.text}${e.source ? ` \uFF08\u6765\u6E90: ${e.source}\uFF09` : ""}`;
  return e.translation ? `${head}
  ${e.translation.replace(/\n/g, " ")}` : head;
}
function removeExampleFromSection(exSection, index) {
  if (!exSection || exSection === "\uFF08\u5F85\u8865\u5145\uFF09") return null;
  const lines = exSection.split("\n");
  const starts = [];
  lines.forEach((l, i) => {
    if (l.trim().startsWith("- ")) starts.push(i);
  });
  const start = starts[index];
  if (start === void 0) return null;
  let end = start + 1;
  while (end < lines.length && /^\s+\S/.test(lines[end])) end++;
  lines.splice(start, end - start);
  return lines.join("\n").replace(/\n{2,}/g, "\n").replace(/^\n+|\n+$/g, "");
}
function setExampleTranslation(exSection, index, zh) {
  if (!exSection || exSection === "\uFF08\u5F85\u8865\u5145\uFF09") return null;
  const lines = exSection.split("\n");
  const starts = [];
  lines.forEach((l, i) => {
    if (l.trim().startsWith("- ")) starts.push(i);
  });
  const start = starts[index];
  if (start === void 0) return null;
  let end = start + 1;
  while (end < lines.length && /^\s+\S/.test(lines[end])) end++;
  const translation = `  ${zh.replace(/\n+/g, " ").trim()}`;
  if (end === start + 1) lines.splice(end, 0, translation);
  else lines[start + 1] = translation;
  return lines.join("\n").replace(/\n{2,}/g, "\n").replace(/^\n+|\n+$/g, "");
}
function exportWordList(words) {
  const lines = [...words].sort((a, b) => a.word.localeCompare(b.word)).map((w) => {
    var _a;
    const base = `${w.word}	${w.translation.replace(/\n+/g, " ").trim()}`;
    const ex = w.examples.find((e) => e.text.trim());
    if (!ex) return base;
    const zh = ((_a = ex.translation) != null ? _a : "").replace(/\n+/g, " ").trim();
    return zh ? `${base}	${ex.text}	${zh}` : `${base}	${ex.text}`;
  });
  return [`# ${words.length} \u8BCD`, ...lines].join("\n");
}
function parseImportLine(line) {
  var _a;
  const cols = line.split("	").map((s) => s.trim());
  if (cols.length >= 2) {
    return {
      word: cols[0],
      translation: cols[1] || void 0,
      example: cols[2] || void 0,
      exampleZh: cols[3] || void 0
    };
  }
  const parts = line.split(/[\t,，;；]/);
  return { word: (_a = parts[0]) != null ? _a : "", translation: parts.slice(1).join(" ").trim() || void 0 };
}
function renderNote(word, o) {
  var _a, _b;
  const fm = [`word: ${JSON.stringify(word)}`];
  if (o.phonetic) fm.push(`phonetic: ${JSON.stringify(o.phonetic)}`);
  if (o.level) fm.push(`level: ${JSON.stringify(o.level)}`);
  fm.push(`themes: [${o.themes.map((t) => JSON.stringify(t)).join(", ")}]`);
  if ((_a = o.tags) == null ? void 0 : _a.length) fm.push(`tags: [${o.tags.map((t) => JSON.stringify(t)).join(", ")}]`);
  fm.push(`added: ${JSON.stringify((/* @__PURE__ */ new Date()).toISOString().slice(0, 10))}`);
  const examples = ((_b = o.examples) == null ? void 0 : _b.length) ? o.examples.map(exampleLine).join("\n") : "\uFF08\u5F85\u8865\u5145\uFF09";
  return [
    "---",
    fm.join("\n"),
    "---",
    "",
    "## \u91CA\u4E49",
    "",
    o.translation || "\uFF08\u5F85\u8865\u5145\uFF09",
    "",
    "## \u4F8B\u53E5",
    "",
    examples,
    ""
  ].join("\n");
}
var WordStore = class {
  constructor(plugin) {
    this.plugin = plugin;
    this.index = /* @__PURE__ */ new Map();
    /** 路径 → {mtime, doc}：scan 增量缓存，mtime 未变的文件不重读 */
    this.fileCache = /* @__PURE__ */ new Map();
    /** 词表版本号：每次索引内容变化 +1（编辑器高亮的正则缓存按此失效） */
    this.rev = 0;
    /** 主题 → 词集合索引（rev 失效的惰性缓存）：例句高亮每次翻卡都查同主题词，全量扫描在大词库上是浪费 */
    this.themeIdx = null;
    this.themeIdxRev = -1;
  }
  get(word) {
    return this.index.get(word.toLowerCase());
  }
  /** token（可能为变形，如 networks/studied）→ 词库中的原形词：先精确后宽松词干。
   *  O(n) 但只在点词这类低频交互调用，千词级词库无感 */
  resolveWord(token) {
    const lw = token.toLowerCase();
    const hit = this.index.get(lw);
    if (hit) return hit;
    for (const d of this.index.values()) {
      if (isForm(token, d.word)) return d;
    }
    return void 0;
  }
  all() {
    return [...this.index.values()].filter((w) => {
      var _a;
      return !((_a = this.plugin.db.ignored) == null ? void 0 : _a[w.word]);
    });
  }
  /** 不过滤忽略词的全量列表（词表管理、主题改名等需要触达被忽略的词） */
  allRaw() {
    return [...this.index.values()];
  }
  byTheme(theme) {
    return this.all().filter((w) => w.themes.includes(theme));
  }
  byThemeRaw(theme) {
    return this.allRaw().filter((w) => w.themes.includes(theme));
  }
  /** 某主题下全部词（含忽略词，忽略过滤由消费方按需做）。索引在 rev 变化后首次查询时重建 */
  themeWords(theme) {
    var _a;
    if (!this.themeIdx || this.themeIdxRev !== this.rev) {
      const m = /* @__PURE__ */ new Map();
      for (const d of this.allRaw()) {
        for (const t of d.themes) {
          let s = m.get(t);
          if (!s) m.set(t, s = /* @__PURE__ */ new Set());
          s.add(d.word);
        }
      }
      this.themeIdx = m;
      this.themeIdxRev = this.rev;
    }
    return (_a = this.themeIdx.get(theme)) != null ? _a : EMPTY_WORDS;
  }
  /** 删除词：仅清内存索引（文件与进度由调用方处理） */
  remove(word) {
    const doc = this.index.get(word.toLowerCase());
    if (doc) this.fileCache.delete(doc.path);
    this.index.delete(word.toLowerCase());
    this.rev++;
  }
  /** 扫描词目录，增量重建内存索引（一次学习流程会 scan 多次，全量重读在大词库上很慢） */
  async scan() {
    const { app } = this.plugin;
    const dir = `${this.plugin.db.settings.root}/words`;
    if (!await app.vault.adapter.exists(dir)) return;
    const files = app.vault.getMarkdownFiles().filter((f) => f.path.startsWith(dir + "/"));
    const live = new Set(files.map((f) => f.path));
    for (const [path, c] of this.fileCache) {
      if (!live.has(path)) {
        this.index.delete(c.doc.word);
        this.fileCache.delete(path);
      }
    }
    for (const file of files) {
      const c = this.fileCache.get(file.path);
      if (c && c.mtime === file.stat.mtime) {
        this.index.set(c.doc.word, c.doc);
        continue;
      }
      if (c) this.index.delete(c.doc.word);
      let doc;
      try {
        doc = await this.loadFile(file);
      } catch (e) {
        console.error("\u8BFB\u53D6\u8BCD\u7B14\u8BB0\u5931\u8D25\uFF0C\u672C\u8F6E\u8DF3\u8FC7:", file.path, e);
        this.fileCache.delete(file.path);
        continue;
      }
      this.fileCache.set(file.path, { mtime: file.stat.mtime, doc });
    }
    this.rev++;
  }
  async loadFile(file) {
    var _a, _b, _c;
    const { app } = this.plugin;
    const fm = (_b = (_a = app.metadataCache.getFileCache(file)) == null ? void 0 : _a.frontmatter) != null ? _b : {};
    const word = ((_c = asStr(fm.word)) != null ? _c : file.basename).toLowerCase();
    const { translation, examples, memo } = parseBody(await app.vault.read(file));
    const synonyms = asArr(fm.synonyms);
    const antonyms = asArr(fm.antonyms);
    const senses = asArr(fm.senses);
    const doc = {
      word,
      path: file.path,
      themes: asArr(fm.themes),
      phonetic: asStr(fm.phonetic),
      level: asStr(fm.level),
      tags: asArr(fm.tags),
      added: fm.added ? Date.parse(String(fm.added)) || void 0 : void 0,
      translation,
      examples,
      // [] = 「抓过但无结果」的负缓存：必须原样保留，归一化回 undefined 会让缺口统计永远算它
      synonyms: fm.synonyms != null ? synonyms : void 0,
      antonyms: fm.antonyms != null ? antonyms : void 0,
      senses: senses.length ? senses : void 0,
      memo: memo || void 0
    };
    this.index.set(word, doc);
    return doc;
  }
  /** 创建词笔记；已存在则只合并主题（不覆盖内容） */
  async create(word, opts) {
    var _a, _b;
    const { app } = this.plugin;
    const key = word.toLowerCase();
    const existingDoc = this.index.get(key);
    if (existingDoc) {
      await this.addTheme(existingDoc, ...opts.themes);
      return existingDoc;
    }
    const path = `${this.plugin.db.settings.root}/words/${sanitizeFilename(key)}.md`;
    const file = app.vault.getFileByPath(path);
    if (file) {
      const doc2 = await this.loadFile(file);
      this.fileCache.set(file.path, { mtime: file.stat.mtime, doc: doc2 });
      await this.addTheme(doc2, ...opts.themes);
      return doc2;
    }
    const created = await app.vault.create(path, renderNote(key, opts));
    const doc = {
      word: key,
      path,
      themes: [...opts.themes],
      phonetic: opts.phonetic,
      level: opts.level,
      tags: (_a = opts.tags) != null ? _a : [],
      added: Date.now(),
      translation: opts.translation,
      examples: (_b = opts.examples) != null ? _b : []
    };
    this.index.set(key, doc);
    this.fileCache.set(path, { mtime: created.stat.mtime, doc });
    this.rev++;
    return doc;
  }
  async addTheme(doc, ...themes) {
    const add = themes.filter((t) => t && !doc.themes.includes(t));
    if (!add.length) return;
    const file = this.plugin.app.vault.getFileByPath(doc.path);
    if (!file) return;
    await this.plugin.app.fileManager.processFrontMatter(file, (fm) => {
      fm.themes = [.../* @__PURE__ */ new Set([...asArr(fm.themes), ...add])];
    });
    doc.themes.push(...add);
  }
  async removeTheme(doc, theme) {
    const file = this.plugin.app.vault.getFileByPath(doc.path);
    if (!file) return;
    await this.plugin.app.fileManager.processFrontMatter(file, (fm) => {
      fm.themes = asArr(fm.themes).filter((t) => t !== theme);
    });
    doc.themes = doc.themes.filter((t) => t !== theme);
  }
  /** 主题改名：词笔记 frontmatter 里 from → to（单次写入） */
  async renameTheme(doc, from, to) {
    const file = this.plugin.app.vault.getFileByPath(doc.path);
    if (!file) return;
    await this.plugin.app.fileManager.processFrontMatter(file, (fm) => {
      fm.themes = asArr(fm.themes).map((t) => t === from ? to : t);
    });
    doc.themes = doc.themes.map((t) => t === from ? to : t);
  }
  /** 保存同义/反义词（Datamuse 抓取结果持久化到 frontmatter，再次学习离线直读） */
  async setRelWords(doc, patch) {
    const file = this.plugin.app.vault.getFileByPath(doc.path);
    if (!file) return;
    await this.plugin.app.fileManager.processFrontMatter(file, (fm) => {
      if (patch.synonyms) fm.synonyms = patch.synonyms;
      if (patch.antonyms) fm.antonyms = patch.antonyms;
    });
    if (patch.synonyms) doc.synonyms = patch.synonyms;
    if (patch.antonyms) doc.antonyms = patch.antonyms;
  }
  /** 保存 AI 结构化义项：frontmatter senses + 正文「释义」同步为全义项（；连接），两处保持一致 */
  async setSenses(doc, senses) {
    const file = this.plugin.app.vault.getFileByPath(doc.path);
    if (!file) return;
    const translation = senses.join("\uFF1B");
    const content = await this.plugin.app.vault.read(file);
    await this.plugin.app.vault.modify(file, setSection(content, "\u91CA\u4E49", translation));
    await this.plugin.app.fileManager.processFrontMatter(file, (fm) => {
      fm.senses = senses;
    });
    doc.senses = senses;
    doc.translation = translation;
  }
  /** 保存用户助记到「## 助记」区（学习卡一键记/改）；空串=删掉整个区，笔记不留空标题 */
  async setMemo(doc, memo) {
    const file = this.plugin.app.vault.getFileByPath(doc.path);
    if (!file) return;
    const text2 = memo.trim();
    const content = await this.plugin.app.vault.read(file);
    let updated;
    if (!text2) {
      const m = content.match(/^##\s+助记\s*$/m);
      if (!m || m.index === void 0) return;
      const rest = content.slice(m.index + m[0].length);
      const next = rest.search(/^##\s+/m);
      const end = next === -1 ? content.length : m.index + m[0].length + next;
      updated = `${content.slice(0, m.index)}${content.slice(end)}`.replace(/\n{3,}/g, "\n\n").replace(/\s*$/, "\n");
    } else {
      updated = setSection(content, "\u52A9\u8BB0", text2);
    }
    await this.plugin.app.vault.modify(file, updated);
    doc.memo = text2 || void 0;
  }
  /** 原地更新词笔记：释义（正文）+ 音标/等级（frontmatter，仅填空不覆盖） */
  async updateWordDoc(doc, patch) {
    const file = this.plugin.app.vault.getFileByPath(doc.path);
    if (!file) return;
    if (patch.translation && patch.translation !== doc.translation) {
      const content = await this.plugin.app.vault.read(file);
      await this.plugin.app.vault.modify(file, setSection(content, "\u91CA\u4E49", patch.translation));
      doc.translation = patch.translation;
      await this.plugin.app.fileManager.processFrontMatter(file, (fm) => {
        delete fm.senses;
      });
      doc.senses = void 0;
    }
    const fmPatch = {};
    if (patch.phonetic && !doc.phonetic) fmPatch.phonetic = patch.phonetic;
    if (patch.level && !doc.level) fmPatch.level = patch.level;
    if (Object.keys(fmPatch).length) {
      await this.plugin.app.fileManager.processFrontMatter(file, (fm) => Object.assign(fm, fmPatch));
      if (fmPatch.phonetic) doc.phonetic = fmPatch.phonetic;
      if (fmPatch.level) doc.level = fmPatch.level;
    }
  }
  /** 追加例句（文章导入/在线补全时用） */
  async appendExample(doc, example) {
    const file = this.plugin.app.vault.getFileByPath(doc.path);
    if (!file) return;
    const line = exampleLine(example);
    const content = await this.plugin.app.vault.read(file);
    const exSection = extractSection(content, "\u4F8B\u53E5");
    const isPlaceholder = !exSection || exSection === "\uFF08\u5F85\u8865\u5145\uFF09";
    const updated = isPlaceholder ? setSection(content, "\u4F8B\u53E5", line) : setSection(content, "\u4F8B\u53E5", `${exSection}
${line}`);
    await this.plugin.app.vault.modify(file, updated);
    doc.examples.push(example);
  }
  /** 删除一条例句（按当前顺序下标，与词卡展示一致）：重写「例句」区并同步内存 */
  async removeExample(doc, index) {
    const file = this.plugin.app.vault.getFileByPath(doc.path);
    if (!file) return;
    const content = await this.plugin.app.vault.read(file);
    const next = removeExampleFromSection(extractSection(content, "\u4F8B\u53E5"), index);
    if (next === null) return;
    await this.plugin.app.vault.modify(file, setSection(content, "\u4F8B\u53E5", next || "\uFF08\u5F85\u8865\u5145\uFF09"));
    doc.examples.splice(index, 1);
  }
  /** 更新一条例句的中文翻译（缺翻译回填用）：重写「例句」区并同步内存 */
  async updateExampleTranslation(doc, index, zh) {
    const file = this.plugin.app.vault.getFileByPath(doc.path);
    if (!file) return;
    const content = await this.plugin.app.vault.read(file);
    const next = setExampleTranslation(extractSection(content, "\u4F8B\u53E5"), index, zh);
    if (next === null) return;
    await this.plugin.app.vault.modify(file, setSection(content, "\u4F8B\u53E5", next));
    if (doc.examples[index]) doc.examples[index].translation = zh;
  }
};

// src/ui/view-types.ts
var THEME_VIEW_TYPE = "englishlearn-theme-view";
var LEARN_VIEW_TYPE = "englishlearn-learn-view";

// src/ui/help-tip.ts
var import_obsidian5 = require("obsidian");
function addHelpTip(host, tip) {
  const el = (host instanceof HTMLElement ? host : host.nameEl).createSpan({
    cls: "el-helptip",
    text: "?",
    attr: { "aria-label": tip, role: "button", tabindex: "-1" }
  });
  el.addEventListener("click", () => showTipBubble(el, tip));
  el.addEventListener("keydown", (e) => e.key === "Enter" && showTipBubble(el, tip));
}
var openBubble = null;
function closeTipBubble() {
  openBubble == null ? void 0 : openBubble.close();
}
function showTipBubble(anchor, tip) {
  const again = (openBubble == null ? void 0 : openBubble.anchor) === anchor;
  closeTipBubble();
  if (again) return;
  const el = createDiv({ cls: "el-tipbubble", text: tip });
  document.body.appendChild(el);
  const close = () => {
    el.remove();
    document.body.removeEventListener("pointerdown", onOutside, true);
    window.removeEventListener("resize", onResize);
    window.clearTimeout(timer);
    if ((openBubble == null ? void 0 : openBubble.el) === el) openBubble = null;
  };
  const onOutside = (e) => {
    const t = e.target;
    if (!el.contains(t) && !anchor.contains(t)) close();
  };
  const onResize = () => close();
  const timer = window.setTimeout(close, 8e3);
  openBubble = { anchor, el, close };
  const r = anchor.getBoundingClientRect();
  const bw = Math.min(el.offsetWidth, window.innerWidth - 16);
  const bh = el.offsetHeight;
  let left = r.left + r.width / 2 - bw / 2;
  left = Math.max(8, Math.min(left, window.innerWidth - bw - 8));
  let top = r.bottom + 6;
  if (top + bh > window.innerHeight - 8) top = Math.max(8, r.top - bh - 6);
  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
  document.body.addEventListener("pointerdown", onOutside, true);
  window.addEventListener("resize", onResize);
}

// src/ui/learn-view.ts
var import_obsidian11 = require("obsidian");

// node_modules/svelte/src/runtime/internal/utils.js
function noop() {
}
function run(fn) {
  return fn();
}
function blank_object() {
  return /* @__PURE__ */ Object.create(null);
}
function run_all(fns) {
  fns.forEach(run);
}
function is_function(thing) {
  return typeof thing === "function";
}
function safe_not_equal(a, b) {
  return a != a ? b == b : a !== b || a && typeof a === "object" || typeof a === "function";
}
function is_empty(obj) {
  return Object.keys(obj).length === 0;
}
function action_destroyer(action_result) {
  return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
}

// node_modules/svelte/src/runtime/internal/globals.js
var globals = typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : (
  // @ts-ignore Node typings have this
  global
);

// node_modules/svelte/src/runtime/internal/ResizeObserverSingleton.js
var ResizeObserverSingleton = class _ResizeObserverSingleton {
  /** @param {ResizeObserverOptions} options */
  constructor(options) {
    /**
     * @private
     * @readonly
     * @type {WeakMap<Element, import('./private.js').Listener>}
     */
    __publicField(this, "_listeners", "WeakMap" in globals ? /* @__PURE__ */ new WeakMap() : void 0);
    /**
     * @private
     * @type {ResizeObserver}
     */
    __publicField(this, "_observer");
    /** @type {ResizeObserverOptions} */
    __publicField(this, "options");
    this.options = options;
  }
  /**
   * @param {Element} element
   * @param {import('./private.js').Listener} listener
   * @returns {() => void}
   */
  observe(element2, listener) {
    this._listeners.set(element2, listener);
    this._getObserver().observe(element2, this.options);
    return () => {
      this._listeners.delete(element2);
      this._observer.unobserve(element2);
    };
  }
  /**
   * @private
   */
  _getObserver() {
    var _a;
    return (_a = this._observer) != null ? _a : this._observer = new ResizeObserver((entries) => {
      var _a2;
      for (const entry of entries) {
        _ResizeObserverSingleton.entries.set(entry.target, entry);
        (_a2 = this._listeners.get(entry.target)) == null ? void 0 : _a2(entry);
      }
    });
  }
};
ResizeObserverSingleton.entries = "WeakMap" in globals ? /* @__PURE__ */ new WeakMap() : void 0;

// node_modules/svelte/src/runtime/internal/dom.js
var is_hydrating = false;
function start_hydrating() {
  is_hydrating = true;
}
function end_hydrating() {
  is_hydrating = false;
}
function append(target, node) {
  target.appendChild(node);
}
function insert(target, node, anchor) {
  target.insertBefore(node, anchor || null);
}
function detach(node) {
  if (node.parentNode) {
    node.parentNode.removeChild(node);
  }
}
function destroy_each(iterations, detaching) {
  for (let i = 0; i < iterations.length; i += 1) {
    if (iterations[i]) iterations[i].d(detaching);
  }
}
function element(name) {
  return document.createElement(name);
}
function text(data) {
  return document.createTextNode(data);
}
function space() {
  return text(" ");
}
function empty() {
  return text("");
}
function listen(node, event, handler, options) {
  node.addEventListener(event, handler, options);
  return () => node.removeEventListener(event, handler, options);
}
function prevent_default(fn) {
  return function(event) {
    event.preventDefault();
    return fn.call(this, event);
  };
}
function stop_propagation(fn) {
  return function(event) {
    event.stopPropagation();
    return fn.call(this, event);
  };
}
function attr(node, attribute, value) {
  if (value == null) node.removeAttribute(attribute);
  else if (node.getAttribute(attribute) !== value) node.setAttribute(attribute, value);
}
function children(element2) {
  return Array.from(element2.childNodes);
}
function set_data(text2, data) {
  data = "" + data;
  if (text2.data === data) return;
  text2.data = /** @type {string} */
  data;
}
function set_input_value(input, value) {
  input.value = value == null ? "" : value;
}
function set_style(node, key, value, important) {
  if (value == null) {
    node.style.removeProperty(key);
  } else {
    node.style.setProperty(key, value, important ? "important" : "");
  }
}
function select_option(select, value, mounting) {
  for (let i = 0; i < select.options.length; i += 1) {
    const option = select.options[i];
    if (option.__value === value) {
      option.selected = true;
      return;
    }
  }
  if (!mounting || value !== void 0) {
    select.selectedIndex = -1;
  }
}
function select_value(select) {
  const selected_option = select.querySelector(":checked");
  return selected_option && selected_option.__value;
}
function toggle_class(element2, name, toggle) {
  element2.classList.toggle(name, !!toggle);
}
function get_custom_elements_slots(element2) {
  const result = {};
  element2.childNodes.forEach(
    /** @param {Element} node */
    (node) => {
      result[node.slot || "default"] = true;
    }
  );
  return result;
}

// node_modules/svelte/src/runtime/internal/lifecycle.js
var current_component;
function set_current_component(component) {
  current_component = component;
}
function get_current_component() {
  if (!current_component) throw new Error("Function called outside component initialization");
  return current_component;
}
function onMount(fn) {
  get_current_component().$$.on_mount.push(fn);
}
function onDestroy(fn) {
  get_current_component().$$.on_destroy.push(fn);
}

// node_modules/svelte/src/runtime/internal/scheduler.js
var dirty_components = [];
var binding_callbacks = [];
var render_callbacks = [];
var flush_callbacks = [];
var resolved_promise = /* @__PURE__ */ Promise.resolve();
var update_scheduled = false;
function schedule_update() {
  if (!update_scheduled) {
    update_scheduled = true;
    resolved_promise.then(flush);
  }
}
function add_render_callback(fn) {
  render_callbacks.push(fn);
}
var seen_callbacks = /* @__PURE__ */ new Set();
var flushidx = 0;
function flush() {
  if (flushidx !== 0) {
    return;
  }
  const saved_component = current_component;
  do {
    try {
      while (flushidx < dirty_components.length) {
        const component = dirty_components[flushidx];
        flushidx++;
        set_current_component(component);
        update(component.$$);
      }
    } catch (e) {
      dirty_components.length = 0;
      flushidx = 0;
      throw e;
    }
    set_current_component(null);
    dirty_components.length = 0;
    flushidx = 0;
    while (binding_callbacks.length) binding_callbacks.pop()();
    for (let i = 0; i < render_callbacks.length; i += 1) {
      const callback = render_callbacks[i];
      if (!seen_callbacks.has(callback)) {
        seen_callbacks.add(callback);
        callback();
      }
    }
    render_callbacks.length = 0;
  } while (dirty_components.length);
  while (flush_callbacks.length) {
    flush_callbacks.pop()();
  }
  update_scheduled = false;
  seen_callbacks.clear();
  set_current_component(saved_component);
}
function update($$) {
  if ($$.fragment !== null) {
    $$.update();
    run_all($$.before_update);
    const dirty = $$.dirty;
    $$.dirty = [-1];
    $$.fragment && $$.fragment.p($$.ctx, dirty);
    $$.after_update.forEach(add_render_callback);
  }
}
function flush_render_callbacks(fns) {
  const filtered = [];
  const targets = [];
  render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
  targets.forEach((c) => c());
  render_callbacks = filtered;
}

// node_modules/svelte/src/runtime/internal/transitions.js
var outroing = /* @__PURE__ */ new Set();
var outros;
function group_outros() {
  outros = {
    r: 0,
    c: [],
    p: outros
    // parent group
  };
}
function check_outros() {
  if (!outros.r) {
    run_all(outros.c);
  }
  outros = outros.p;
}
function transition_in(block, local) {
  if (block && block.i) {
    outroing.delete(block);
    block.i(local);
  }
}
function transition_out(block, local, detach2, callback) {
  if (block && block.o) {
    if (outroing.has(block)) return;
    outroing.add(block);
    outros.c.push(() => {
      outroing.delete(block);
      if (callback) {
        if (detach2) block.d(1);
        callback();
      }
    });
    block.o(local);
  } else if (callback) {
    callback();
  }
}

// node_modules/svelte/src/runtime/internal/each.js
function ensure_array_like(array_like_or_iterator) {
  return (array_like_or_iterator == null ? void 0 : array_like_or_iterator.length) !== void 0 ? array_like_or_iterator : Array.from(array_like_or_iterator);
}
function destroy_block(block, lookup) {
  block.d(1);
  lookup.delete(block.key);
}
function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block6, next, get_context) {
  let o = old_blocks.length;
  let n = list.length;
  let i = o;
  const old_indexes = {};
  while (i--) old_indexes[old_blocks[i].key] = i;
  const new_blocks = [];
  const new_lookup = /* @__PURE__ */ new Map();
  const deltas = /* @__PURE__ */ new Map();
  const updates = [];
  i = n;
  while (i--) {
    const child_ctx = get_context(ctx, list, i);
    const key = get_key(child_ctx);
    let block = lookup.get(key);
    if (!block) {
      block = create_each_block6(key, child_ctx);
      block.c();
    } else if (dynamic) {
      updates.push(() => block.p(child_ctx, dirty));
    }
    new_lookup.set(key, new_blocks[i] = block);
    if (key in old_indexes) deltas.set(key, Math.abs(i - old_indexes[key]));
  }
  const will_move = /* @__PURE__ */ new Set();
  const did_move = /* @__PURE__ */ new Set();
  function insert2(block) {
    transition_in(block, 1);
    block.m(node, next);
    lookup.set(block.key, block);
    next = block.first;
    n--;
  }
  while (o && n) {
    const new_block = new_blocks[n - 1];
    const old_block = old_blocks[o - 1];
    const new_key = new_block.key;
    const old_key = old_block.key;
    if (new_block === old_block) {
      next = new_block.first;
      o--;
      n--;
    } else if (!new_lookup.has(old_key)) {
      destroy(old_block, lookup);
      o--;
    } else if (!lookup.has(new_key) || will_move.has(new_key)) {
      insert2(new_block);
    } else if (did_move.has(old_key)) {
      o--;
    } else if (deltas.get(new_key) > deltas.get(old_key)) {
      did_move.add(new_key);
      insert2(new_block);
    } else {
      will_move.add(old_key);
      o--;
    }
  }
  while (o--) {
    const old_block = old_blocks[o];
    if (!new_lookup.has(old_block.key)) destroy(old_block, lookup);
  }
  while (n) insert2(new_blocks[n - 1]);
  run_all(updates);
  return new_blocks;
}

// node_modules/svelte/src/shared/boolean_attributes.js
var _boolean_attributes = (
  /** @type {const} */
  [
    "allowfullscreen",
    "allowpaymentrequest",
    "async",
    "autofocus",
    "autoplay",
    "checked",
    "controls",
    "default",
    "defer",
    "disabled",
    "formnovalidate",
    "hidden",
    "inert",
    "ismap",
    "loop",
    "multiple",
    "muted",
    "nomodule",
    "novalidate",
    "open",
    "playsinline",
    "readonly",
    "required",
    "reversed",
    "selected"
  ]
);
var boolean_attributes = /* @__PURE__ */ new Set([..._boolean_attributes]);

// node_modules/svelte/src/runtime/internal/Component.js
function create_component(block) {
  block && block.c();
}
function mount_component(component, target, anchor) {
  const { fragment, after_update } = component.$$;
  fragment && fragment.m(target, anchor);
  add_render_callback(() => {
    const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
    if (component.$$.on_destroy) {
      component.$$.on_destroy.push(...new_on_destroy);
    } else {
      run_all(new_on_destroy);
    }
    component.$$.on_mount = [];
  });
  after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
  const $$ = component.$$;
  if ($$.fragment !== null) {
    flush_render_callbacks($$.after_update);
    run_all($$.on_destroy);
    $$.fragment && $$.fragment.d(detaching);
    $$.on_destroy = $$.fragment = null;
    $$.ctx = [];
  }
}
function make_dirty(component, i) {
  if (component.$$.dirty[0] === -1) {
    dirty_components.push(component);
    schedule_update();
    component.$$.dirty.fill(0);
  }
  component.$$.dirty[i / 31 | 0] |= 1 << i % 31;
}
function init(component, options, instance7, create_fragment7, not_equal, props, append_styles = null, dirty = [-1]) {
  const parent_component = current_component;
  set_current_component(component);
  const $$ = component.$$ = {
    fragment: null,
    ctx: [],
    // state
    props,
    update: noop,
    not_equal,
    bound: blank_object(),
    // lifecycle
    on_mount: [],
    on_destroy: [],
    on_disconnect: [],
    before_update: [],
    after_update: [],
    context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
    // everything else
    callbacks: blank_object(),
    dirty,
    skip_bound: false,
    root: options.target || parent_component.$$.root
  };
  append_styles && append_styles($$.root);
  let ready = false;
  $$.ctx = instance7 ? instance7(component, options.props || {}, (i, ret, ...rest) => {
    const value = rest.length ? rest[0] : ret;
    if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
      if (!$$.skip_bound && $$.bound[i]) $$.bound[i](value);
      if (ready) make_dirty(component, i);
    }
    return ret;
  }) : [];
  $$.update();
  ready = true;
  run_all($$.before_update);
  $$.fragment = create_fragment7 ? create_fragment7($$.ctx) : false;
  if (options.target) {
    if (options.hydrate) {
      start_hydrating();
      const nodes = children(options.target);
      $$.fragment && $$.fragment.l(nodes);
      nodes.forEach(detach);
    } else {
      $$.fragment && $$.fragment.c();
    }
    if (options.intro) transition_in(component.$$.fragment);
    mount_component(component, options.target, options.anchor);
    end_hydrating();
    flush();
  }
  set_current_component(parent_component);
}
var SvelteElement;
if (typeof HTMLElement === "function") {
  SvelteElement = class extends HTMLElement {
    constructor($$componentCtor, $$slots, use_shadow_dom) {
      super();
      /** The Svelte component constructor */
      __publicField(this, "$$ctor");
      /** Slots */
      __publicField(this, "$$s");
      /** The Svelte component instance */
      __publicField(this, "$$c");
      /** Whether or not the custom element is connected */
      __publicField(this, "$$cn", false);
      /** Component props data */
      __publicField(this, "$$d", {});
      /** `true` if currently in the process of reflecting component props back to attributes */
      __publicField(this, "$$r", false);
      /** @type {Record<string, CustomElementPropDefinition>} Props definition (name, reflected, type etc) */
      __publicField(this, "$$p_d", {});
      /** @type {Record<string, Function[]>} Event listeners */
      __publicField(this, "$$l", {});
      /** @type {Map<Function, Function>} Event listener unsubscribe functions */
      __publicField(this, "$$l_u", /* @__PURE__ */ new Map());
      this.$$ctor = $$componentCtor;
      this.$$s = $$slots;
      if (use_shadow_dom) {
        this.attachShadow({ mode: "open" });
      }
    }
    addEventListener(type, listener, options) {
      this.$$l[type] = this.$$l[type] || [];
      this.$$l[type].push(listener);
      if (this.$$c) {
        const unsub = this.$$c.$on(type, listener);
        this.$$l_u.set(listener, unsub);
      }
      super.addEventListener(type, listener, options);
    }
    removeEventListener(type, listener, options) {
      super.removeEventListener(type, listener, options);
      if (this.$$c) {
        const unsub = this.$$l_u.get(listener);
        if (unsub) {
          unsub();
          this.$$l_u.delete(listener);
        }
      }
      if (this.$$l[type]) {
        const idx = this.$$l[type].indexOf(listener);
        if (idx >= 0) {
          this.$$l[type].splice(idx, 1);
        }
      }
    }
    async connectedCallback() {
      this.$$cn = true;
      if (!this.$$c) {
        let create_slot = function(name) {
          return () => {
            let node;
            const obj = {
              c: function create() {
                node = element("slot");
                if (name !== "default") {
                  attr(node, "name", name);
                }
              },
              /**
               * @param {HTMLElement} target
               * @param {HTMLElement} [anchor]
               */
              m: function mount(target, anchor) {
                insert(target, node, anchor);
              },
              d: function destroy(detaching) {
                if (detaching) {
                  detach(node);
                }
              }
            };
            return obj;
          };
        };
        await Promise.resolve();
        if (!this.$$cn || this.$$c) {
          return;
        }
        const $$slots = {};
        const existing_slots = get_custom_elements_slots(this);
        for (const name of this.$$s) {
          if (name in existing_slots) {
            $$slots[name] = [create_slot(name)];
          }
        }
        for (const attribute of this.attributes) {
          const name = this.$$g_p(attribute.name);
          if (!(name in this.$$d)) {
            this.$$d[name] = get_custom_element_value(name, attribute.value, this.$$p_d, "toProp");
          }
        }
        for (const key in this.$$p_d) {
          if (!(key in this.$$d) && this[key] !== void 0) {
            this.$$d[key] = this[key];
            delete this[key];
          }
        }
        this.$$c = new this.$$ctor({
          target: this.shadowRoot || this,
          props: {
            ...this.$$d,
            $$slots,
            $$scope: {
              ctx: []
            }
          }
        });
        const reflect_attributes = () => {
          this.$$r = true;
          for (const key in this.$$p_d) {
            this.$$d[key] = this.$$c.$$.ctx[this.$$c.$$.props[key]];
            if (this.$$p_d[key].reflect) {
              const attribute_value = get_custom_element_value(
                key,
                this.$$d[key],
                this.$$p_d,
                "toAttribute"
              );
              if (attribute_value == null) {
                this.removeAttribute(this.$$p_d[key].attribute || key);
              } else {
                this.setAttribute(this.$$p_d[key].attribute || key, attribute_value);
              }
            }
          }
          this.$$r = false;
        };
        this.$$c.$$.after_update.push(reflect_attributes);
        reflect_attributes();
        for (const type in this.$$l) {
          for (const listener of this.$$l[type]) {
            const unsub = this.$$c.$on(type, listener);
            this.$$l_u.set(listener, unsub);
          }
        }
        this.$$l = {};
      }
    }
    // We don't need this when working within Svelte code, but for compatibility of people using this outside of Svelte
    // and setting attributes through setAttribute etc, this is helpful
    attributeChangedCallback(attr2, _oldValue, newValue) {
      var _a;
      if (this.$$r) return;
      attr2 = this.$$g_p(attr2);
      this.$$d[attr2] = get_custom_element_value(attr2, newValue, this.$$p_d, "toProp");
      (_a = this.$$c) == null ? void 0 : _a.$set({ [attr2]: this.$$d[attr2] });
    }
    disconnectedCallback() {
      this.$$cn = false;
      Promise.resolve().then(() => {
        if (!this.$$cn && this.$$c) {
          this.$$c.$destroy();
          this.$$c = void 0;
        }
      });
    }
    $$g_p(attribute_name) {
      return Object.keys(this.$$p_d).find(
        (key) => this.$$p_d[key].attribute === attribute_name || !this.$$p_d[key].attribute && key.toLowerCase() === attribute_name
      ) || attribute_name;
    }
  };
}
function get_custom_element_value(prop, value, props_definition, transform) {
  var _a;
  const type = (_a = props_definition[prop]) == null ? void 0 : _a.type;
  value = type === "Boolean" && typeof value !== "boolean" ? value != null : value;
  if (!transform || !props_definition[prop]) {
    return value;
  } else if (transform === "toAttribute") {
    switch (type) {
      case "Object":
      case "Array":
        return value == null ? null : JSON.stringify(value);
      case "Boolean":
        return value ? "" : null;
      case "Number":
        return value == null ? null : value;
      default:
        return value;
    }
  } else {
    switch (type) {
      case "Object":
      case "Array":
        return value && JSON.parse(value);
      case "Boolean":
        return value;
      // conversion already handled above
      case "Number":
        return value != null ? +value : value;
      default:
        return value;
    }
  }
}
var SvelteComponent = class {
  constructor() {
    /**
     * ### PRIVATE API
     *
     * Do not use, may change at any time
     *
     * @type {any}
     */
    __publicField(this, "$$");
    /**
     * ### PRIVATE API
     *
     * Do not use, may change at any time
     *
     * @type {any}
     */
    __publicField(this, "$$set");
  }
  /** @returns {void} */
  $destroy() {
    destroy_component(this, 1);
    this.$destroy = noop;
  }
  /**
   * @template {Extract<keyof Events, string>} K
   * @param {K} type
   * @param {((e: Events[K]) => void) | null | undefined} callback
   * @returns {() => void}
   */
  $on(type, callback) {
    if (!is_function(callback)) {
      return noop;
    }
    const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
    callbacks.push(callback);
    return () => {
      const index = callbacks.indexOf(callback);
      if (index !== -1) callbacks.splice(index, 1);
    };
  }
  /**
   * @param {Partial<Props>} props
   * @returns {void}
   */
  $set(props) {
    if (this.$$set && !is_empty(props)) {
      this.$$.skip_bound = true;
      this.$$set(props);
      this.$$.skip_bound = false;
    }
  }
};

// node_modules/svelte/src/shared/version.js
var PUBLIC_VERSION = "4";

// node_modules/svelte/src/runtime/internal/disclose-version/index.js
if (typeof window !== "undefined")
  (window.__svelte || (window.__svelte = { v: /* @__PURE__ */ new Set() })).v.add(PUBLIC_VERSION);

// src/components/LearnSession.svelte
var import_obsidian10 = require("obsidian");

// src/cloze.ts
var POS_RE = /^(?:n|v|vt|vi|adj|adv|prep|conj|pron|art|num|interj|aux|abbr)\./;
var sensesOf = (d) => {
  var _a, _b;
  if ((_a = d.senses) == null ? void 0 : _a.length) return d.senses;
  const merged = [];
  for (const p of ((_b = d.translation) != null ? _b : "").split(/[\n;；]/)) {
    const s = p.trim();
    if (!s) continue;
    if (!merged.length || POS_RE.test(s)) merged.push(s);
    else merged[merged.length - 1] += "\uFF1B" + s;
  }
  return merged;
};
var firstSense = (d) => {
  var _a;
  return (_a = sensesOf(d)[0]) != null ? _a : "";
};
function senseClash(a, b) {
  const bigrams = (s) => {
    var _a;
    const out = /* @__PURE__ */ new Set();
    for (const seg of (_a = s.match(/[一-鿿]+/g)) != null ? _a : []) {
      for (let i = 0; i + 2 <= seg.length; i++) out.add(seg.slice(i, i + 2));
    }
    return out;
  };
  const A = bigrams(a);
  const B = bigrams(b);
  for (const g of A) if (B.has(g)) return true;
  return false;
}
function posOf(sense) {
  const m = sense.match(/^\s*([a-z]+\.)\s?/);
  return m ? m[1] : "";
}
function preferPos(items, pos, senseOf) {
  return [
    ...shuffle(items.filter((x) => posOf(senseOf(x)) === pos)),
    ...shuffle(items.filter((x) => posOf(senseOf(x)) !== pos))
  ];
}
function clozeText(text2, word) {
  var _a;
  const tokens = (_a = text2.match(/[A-Za-z][A-Za-z'-]*/g)) != null ? _a : [];
  const hit = tokens.find((t) => isForm(t, word));
  if (!hit) return null;
  return text2.replace(new RegExp(`\\b${escapeRe(hit)}\\b`, "gi"), "\uFF3F\uFF3F\uFF3F\uFF3F");
}
function pickClozeHint(doc) {
  const hits = doc.examples.map((e) => clozeText(e.text, doc.word)).filter((t) => !!t);
  return hits.length ? hits[Math.floor(Math.random() * hits.length)] : null;
}
function buildQuiz(doc, pool, opts) {
  var _a, _b, _c;
  const mine = firstSense(doc);
  const pos = posOf(mine);
  if (mine && doc.word.length >= 4 && Math.random() < ((_a = opts == null ? void 0 : opts.spellChance) != null ? _a : 0.3)) {
    return {
      kind: "spell",
      question: mine,
      phonetic: doc.phonetic,
      options: [],
      answer: -1,
      reveal: `${doc.word}  ${mine}`,
      audioOnly: Math.random() < ((_b = opts == null ? void 0 : opts.audioChance) != null ? _b : 0.4)
    };
  }
  const exPool = shuffle(doc.examples);
  const exSorted = [...exPool.filter((e) => e.translation), ...exPool.filter((e) => !e.translation)];
  for (const ex of exSorted) {
    const tokens = (_c = ex.text.match(/[A-Za-z][A-Za-z'-]*/g)) != null ? _c : [];
    const hit = tokens.find((t) => isForm(t, doc.word));
    if (!hit) continue;
    if (tokens.length < 5) continue;
    const allOthers = pool.filter((p) => p.word !== doc.word);
    const clean = mine ? pool.filter((p) => p.word !== doc.word && firstSense(p) && !senseClash(firstSense(p), mine)) : allOthers;
    const othersDocs = clean.length >= 3 ? clean : allOthers;
    if (othersDocs.length < 3) continue;
    const options2 = shuffle([doc.word, ...preferPos(othersDocs, pos, firstSense).slice(0, 3).map((p) => p.word)]);
    const question = ex.text.replace(new RegExp(`\\b${escapeRe(hit)}\\b`, "gi"), "\uFF3F\uFF3F\uFF3F\uFF3F");
    return {
      kind: "cloze",
      question,
      options: options2,
      answer: options2.indexOf(doc.word),
      reveal: ex.translation ? `${ex.text}
${ex.translation}` : ex.text
    };
  }
  if (!mine) return null;
  const noClash = pool.filter(
    (p) => p.word !== doc.word && firstSense(p) && !senseClash(firstSense(p), mine)
  );
  if (Math.random() < 0.5 && noClash.length >= 3) {
    const options2 = shuffle([doc.word, ...preferPos(noClash, pos, firstSense).slice(0, 3).map((p) => p.word)]);
    return {
      kind: "meaning",
      question: mine,
      options: options2,
      answer: options2.indexOf(doc.word),
      reveal: `${doc.word}  ${mine}`
    };
  }
  const others = [...new Set(noClash.map((p) => firstSense(p)))];
  if (others.length < 3) {
    others.push(
      ...[...new Set(
        pool.filter((p) => p.word !== doc.word).map((p) => firstSense(p)).filter(Boolean)
      )]
    );
  }
  const uniq = [...new Set(others)];
  if (uniq.length < 3) return null;
  const options = shuffle([mine, ...preferPos(uniq, pos, (s) => s).slice(0, 3)]);
  return {
    kind: "meaning",
    question: doc.word,
    phonetic: doc.phonetic,
    options,
    answer: options.indexOf(mine),
    reveal: `${doc.word}  ${mine}`
  };
}

// src/components/HelpTip.svelte
function create_fragment(ctx) {
  let span;
  let t;
  let mounted;
  let dispose;
  return {
    c() {
      span = element("span");
      t = text("?");
      attr(span, "class", "el-helptip");
      attr(
        span,
        "aria-label",
        /*tip*/
        ctx[0]
      );
      attr(span, "role", "button");
      attr(span, "tabindex", "-1");
    },
    m(target, anchor) {
      insert(target, span, anchor);
      append(span, t);
      if (!mounted) {
        dispose = [
          listen(
            span,
            "click",
            /*pop*/
            ctx[1]
          ),
          listen(
            span,
            "keydown",
            /*keydown_handler*/
            ctx[2]
          )
        ];
        mounted = true;
      }
    },
    p(ctx2, [dirty]) {
      if (dirty & /*tip*/
      1) {
        attr(
          span,
          "aria-label",
          /*tip*/
          ctx2[0]
        );
      }
    },
    i: noop,
    o: noop,
    d(detaching) {
      if (detaching) {
        detach(span);
      }
      mounted = false;
      run_all(dispose);
    }
  };
}
function instance($$self, $$props, $$invalidate) {
  let { tip } = $$props;
  const pop = (e) => showTipBubble(e.currentTarget, tip);
  const keydown_handler = (e) => e.key === "Enter" && pop(e);
  $$self.$$set = ($$props2) => {
    if ("tip" in $$props2) $$invalidate(0, tip = $$props2.tip);
  };
  return [tip, pop, keydown_handler];
}
var HelpTip = class extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance, create_fragment, safe_not_equal, { tip: 0 });
  }
};
var HelpTip_default = HelpTip;

// src/modals.ts
var import_obsidian9 = require("obsidian");

// src/llm.ts
var import_obsidian6 = require("obsidian");
var LLM_OLLAMA_PRESET = { baseUrl: "http://localhost:11434/v1", apiKey: "ollama", model: "qwen2.5:3b" };
var LLM_PRESETS = {
  ollama: LLM_OLLAMA_PRESET,
  deepseek: { baseUrl: "https://api.deepseek.com/v1", apiKey: "", model: "deepseek-v4-flash" },
  siliconflow: { baseUrl: "https://api.siliconflow.cn/v1", apiKey: "", model: "Qwen/Qwen3-8B" },
  zhipu: { baseUrl: "https://open.bigmodel.cn/api/paas/v4", apiKey: "", model: "glm-4.7-flash" }
};
function llmUrlLocked(p) {
  return p !== "ollama" && p !== "custom" && Boolean(LLM_PRESETS[p]);
}
function llmConf(saved, p) {
  const preset = LLM_PRESETS[p];
  const c = { baseUrl: "", apiKey: "", model: "", ...preset, ...saved == null ? void 0 : saved[p] };
  if (preset && llmUrlLocked(p)) c.baseUrl = preset.baseUrl;
  return c;
}
function llmReady(cfg) {
  return Boolean(cfg.baseUrl && cfg.model);
}
async function llmTest(cfg) {
  return llmChat(cfg, [
    { role: "user", content: "Reply with exactly: ok" }
  ], 0);
}
async function llmChat(cfg, messages, temperature = 0.3) {
  var _a, _b, _c;
  const headers = { "Content-Type": "application/json" };
  if (cfg.apiKey) headers.Authorization = `Bearer ${cfg.apiKey}`;
  const res = await (0, import_obsidian6.requestUrl)({
    url: `${cfg.baseUrl.replace(/\/+$/, "")}/chat/completions`,
    method: "POST",
    headers,
    body: JSON.stringify({ model: cfg.model, messages, temperature })
  });
  const data = JSON.parse(res.text);
  const content = (_c = (_b = (_a = data == null ? void 0 : data.choices) == null ? void 0 : _a[0]) == null ? void 0 : _b.message) == null ? void 0 : _c.content;
  if (typeof content !== "string") throw new Error("LLM \u54CD\u5E94\u683C\u5F0F\u5F02\u5E38");
  return content;
}
function repairJson(raw) {
  const PUNCT = { "\uFF1A": ":", "\uFF0C": ",", "\u201C": '"', "\u201D": '"' };
  let out = "";
  let inStr = false;
  let esc = false;
  let prev = "";
  for (let i = 0; i < raw.length; i++) {
    let ch = raw[i];
    if (!inStr) {
      if (PUNCT[ch]) ch = PUNCT[ch];
      if (ch === '"') {
        if (prev && !",:[{".includes(prev)) out += ",";
        inStr = true;
        esc = false;
        prev = ch;
        out += ch;
        continue;
      }
      if (ch === "{" || ch === "[") {
        if (prev && !",:[{".includes(prev)) out += ",";
        prev = ch;
        out += ch;
        continue;
      }
      if (ch === "}" || ch === "]") {
        if (prev === ",") out = out.replace(/,\s*$/, "");
        prev = ch;
        out += ch;
        continue;
      }
      if (/\s/.test(ch)) {
        out += ch;
        continue;
      }
      if (ch === ":") {
        prev = ch;
        out += ch;
        continue;
      }
      if (ch === ",") {
        prev = ch;
        out += ch;
        continue;
      }
      const m = raw.slice(i).match(/^(?:-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null)/);
      if (m) {
        if (prev && !",:[{".includes(prev)) out += ",";
        const tok = m[0];
        out += tok;
        prev = tok[tok.length - 1];
        i += tok.length - 1;
        continue;
      }
      break;
    }
    out += ch;
    if (esc) {
      esc = false;
    } else if (ch === "\\") {
      esc = true;
    } else if (ch === '"') {
      inStr = false;
      prev = ch;
    } else if (ch < " ") {
      out = out.slice(0, -1) + (ch === "\n" ? "\\n" : ch === "\r" ? "" : ch === "	" ? "\\t" : `\\u${ch.charCodeAt(0).toString(16).padStart(4, "0")}`);
    }
  }
  return out;
}
function lastCompleteItemEnd(raw) {
  let inStr = false;
  let esc = false;
  let depth = 0;
  let last = -1;
  for (let i = 1; i < raw.length; i++) {
    const ch = raw[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
    } else if (ch === '"') {
      inStr = true;
    } else if (ch === "{" || ch === "[") {
      depth++;
    } else if (ch === "}" || ch === "]") {
      depth--;
      if (depth === 0 && ch === "}") last = i + 1;
    }
  }
  return last;
}
function parseJsonArray(text2) {
  const stripped = text2.replace(/```(?:json)?/gi, "").trim();
  const start = stripped.indexOf("[");
  if (start === -1) throw new Error("LLM \u672A\u8FD4\u56DE JSON \u6570\u7EC4");
  const tail = stripped.slice(start);
  const end = tail.lastIndexOf("]");
  const raw = end === -1 ? null : tail.slice(0, end + 1);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      try {
        return JSON.parse(repairJson(raw));
      } catch (e2) {
      }
    }
  }
  const cut = lastCompleteItemEnd(tail);
  if (cut > 0) {
    try {
      return JSON.parse(repairJson(`${tail.slice(0, cut)}]`));
    } catch (e) {
    }
  }
  throw new Error("LLM \u8FD4\u56DE\u7684 JSON \u65E0\u6CD5\u89E3\u6790\uFF0C\u8BF7\u91CD\u8BD5\u6216\u6362\u66F4\u5927\u7684\u6A21\u578B");
}
async function llmTranslateSeeds(cfg, keyword) {
  const content = await llmChat(cfg, [
    {
      role: "system",
      content: "You are a translator. Reply ONLY with a JSON array of 2-3 common English words or short phrases (lowercase) that best represent the given Chinese concept. No explanation."
    },
    { role: "user", content: keyword }
  ], 0.2);
  const words = parseJsonArray(content).map((w) => String(w).trim().toLowerCase()).filter((w) => /^[a-z][a-z' -]*$/.test(w));
  if (!words.length) throw new Error("LLM \u672A\u80FD\u7ED9\u51FA\u5BF9\u5E94\u7684\u82F1\u6587\u8BCD");
  return words.slice(0, 3);
}
var EXPAND_ANGLES = [
  "\u5B50\u9886\u57DF\u4E0E\u4E13\u4E1A\u672F\u8BED",
  "\u5B9E\u9645\u5E94\u7528\u4E0E\u884C\u4E1A\u573A\u666F",
  "\u76F8\u5173\u73B0\u8C61\u4E0E\u793E\u4F1A\u95EE\u9898",
  "\u5E38\u89C1\u642D\u914D\u4E0E\u4E60\u60EF\u7528\u8BED",
  "\u9886\u57DF\u4EBA\u7269\u3001\u7EC4\u7EC7\u4E0E\u5DE5\u5177",
  "\u4E0A\u4F4D\u6982\u5FF5\u4E0E\u4E0B\u4F4D\u6982\u5FF5",
  "\u8FD1\u4E49\u8BCD\u4E0E\u53CD\u4E49\u8BCD",
  "\u4E0E\u79D1\u6280/\u7ECF\u6D4E/\u6587\u5316/\u73AF\u5883\u7684\u8DE8\u9886\u57DF\u4EA4\u53C9",
  "\u53E3\u8BED\u4E0E\u4FDA\u8BED\u8868\u8FBE",
  "\u5B66\u672F\u5199\u4F5C\u9AD8\u9891\u8BCD",
  "\u5386\u53F2\u6E0A\u6E90\u4E0E\u7ECF\u5178\u7406\u8BBA",
  "\u4E89\u8BAE\u4E0E\u524D\u6CBF\u8BDD\u9898"
];
async function llmExpandWords(cfg, keywords, existing, count = 12) {
  const listed = existing.length > 400 ? existing.slice(0, 400) : existing;
  const angles = shuffle(EXPAND_ANGLES).slice(0, 3);
  const user = `\u4E3B\u9898\u5173\u952E\u8BCD\uFF08\u53EF\u80FD\u662F\u4E2D\u6587\u6216\u82F1\u6587\uFF0C\u4E2D\u6587\u5173\u952E\u8BCD\u8BF7\u7406\u89E3\u4E3A\u5176\u5BF9\u5E94\u7684\u82F1\u6587\u4E3B\u9898\u9886\u57DF\uFF09\uFF1A${keywords.join(", ")}
${listed.length ? `\u4EE5\u4E0B\u5355\u8BCD\u5DF2\u5B58\u5728\u6216\u4E4B\u524D\u5DF2\u7ED9\u8FC7\uFF0C\u4E0D\u8981\u91CD\u590D\uFF08\u542B\u5B83\u4EEC\u7684\u53D8\u5F62\uFF09\uFF1A
${listed.join(", ")}
` : ""}\u8BF7\u7ED9\u51FA ${count} \u4E2A\u8BE5\u4E3B\u9898\u9886\u57DF\u4E2D\u503C\u5F97\u4E2D\u9AD8\u7EA7\u82F1\u8BED\u5B66\u4E60\u8005\u638C\u63E1\u7684\u82F1\u6587\u5355\u8BCD\uFF08\u53EF\u542B\u5C11\u91CF\u77ED\u8BED\uFF09\u3002\u5173\u952E\u8BCD\u53EA\u662F\u8D77\u70B9\uFF0C\u672C\u6B21\u8BF7\u4F18\u5148\u56F4\u7ED5\u8FD9\u4E9B\u4FA7\u9762\u53D1\u6563\uFF1A${angles.join("\u3001")}\u3002
- \u5411\u5173\u8054\u6982\u5FF5\u6269\u5C55\uFF1A\u5B50\u9886\u57DF\u3001\u5E94\u7528\u573A\u666F\u3001\u76F8\u5173\u73B0\u8C61\u3001\u5E38\u89C1\u642D\u914D\u3001\u9886\u57DF\u4EBA\u7269/\u5DE5\u5177\u7B49\uFF0C\u4E0D\u5FC5\u9010\u5B57\u8D34\u5408\u5173\u952E\u8BCD
- \u5DF2\u5217\u51FA\u7684\u8BCD\u5927\u591A\u5360\u4F4F\u4E86\u4E3B\u9898\u6700\u663E\u773C\u7684\u4F4D\u7F6E\uFF0C\u8BF7\u5411\u66F4\u8FB9\u7F18\u3001\u66F4\u7EC6\u5206\u3001\u66F4\u4E13\u4E1A\u7684\u8BCD\u6C47\u5EF6\u4F38
\u8981\u6C42\uFF1A
1. \u4E00\u5F8B\u7528\u539F\u5F62\uFF08\u5355\u6570\u540D\u8BCD\u3001\u52A8\u8BCD\u539F\u5F62\uFF09\uFF0C\u540C\u4E00\u5355\u8BCD\u53EA\u51FA\u73B0\u4E00\u6B21\uFF0C\u4E0D\u8981\u8F93\u51FA\u5176\u590D\u6570/\u65F6\u6001/\u6D3E\u751F\u5F62\u5F0F
2. \u5404\u5355\u8BCD\u4E92\u4E0D\u91CD\u590D\uFF0C\u4E5F\u8DF3\u8FC7\u4E2D\u8003\u9AD8\u8003\u7EA7\u522B\u7684\u7B80\u5355\u57FA\u7840\u8BCD
3. \u91CA\u4E49\u7B80\u660E\uFF1A\u8BCD\u6027\u7F29\u5199 + \u4E2D\u6587\u6838\u5FC3\u4E49\uFF0C\u4E00\u9879\u5373\u53EF
\u6BCF\u9879\u683C\u5F0F\uFF1A{"word":"\u82F1\u6587\u5355\u8BCD","translation":"\u8BCD\u6027. \u4E2D\u6587\u91CA\u4E49\uFF08\u7B80\u660E\uFF09"}
\u53EA\u8F93\u51FA JSON \u6570\u7EC4\uFF0C\u4E0D\u8981\u4EFB\u4F55\u5176\u4ED6\u6587\u5B57\u3002`;
  const out = await llmChat(
    cfg,
    [
      { role: "system", content: "\u4F60\u662F\u82F1\u8BED\u8BCD\u6C47\u6559\u5B66\u4E13\u5BB6\u3002\u6839\u636E\u4E3B\u9898\u5173\u952E\u8BCD\uFF08\u53EF\u80FD\u662F\u4E2D\u6587\uFF0C\u5982\u300C\u4EBA\u5DE5\u667A\u80FD\u300D\u4EE3\u8868 AI \u9886\u57DF\uFF09\u7B5B\u9009\u503C\u5F97\u5B66\u4E60\u7684\u82F1\u6587\u8BCD\u6C47\uFF0C\u5584\u4E8E\u4ECE\u4E00\u4E2A\u4E3B\u9898\u8054\u60F3\u5230\u5176\u5468\u8FB9\u5B50\u9886\u57DF\u548C\u5173\u8054\u6982\u5FF5\uFF0C\u4FDD\u8BC1\u591A\u8F6E\u751F\u6210\u7684\u8BCD\u6C47\u4E30\u5BCC\u591A\u6837\u3002\u53EA\u8F93\u51FA JSON\u3002" },
      { role: "user", content: user }
    ],
    0.9
    // 扩词要发散，温度给高些；例句/翻译等结构化任务仍用各自默认值
  );
  return parseJsonArray(out).filter(
    (x) => !!x && typeof x.word === "string"
  );
}
async function llmExamples(cfg, words, topic, count = 3, onBatch, shouldStop, onRetry, onWords) {
  const m = /* @__PURE__ */ new Map();
  let firstErr;
  const ask = async (batch) => {
    var _a;
    let out;
    try {
      out = await llmChat(
        cfg,
        [
          { role: "system", content: "\u4F60\u4E3A\u82F1\u8BED\u5355\u8BCD\u5199\u4F8B\u53E5\uFF0C\u4E3B\u9898\u8BCD\uFF08\u53EF\u80FD\u662F\u4E2D\u6587\uFF09\u4EE3\u8868\u76EE\u6807\u9886\u57DF\u3002\u53EA\u8F93\u51FA JSON\u3002" },
          {
            role: "user",
            content: `\u4E3A\u4E0B\u5217\u6BCF\u4E2A\u5355\u8BCD\u5199 ${count} \u4E2A\u7B80\u6D01\u81EA\u7136\u7684\u82F1\u6587\u4F8B\u53E5\uFF08\u6BCF\u53E5 10 \u8BCD\u5DE6\u53F3\uFF0C\u5355\u8BCD\u7528\u539F\u5F62\u6216\u5408\u9002\u53D8\u5F62\uFF09\uFF0C\u5404\u53E5\u8BED\u5883\u4E0D\u540C\uFF08\u5982\u65E5\u5E38\u5BF9\u8BDD\u3001\u5DE5\u4F5C/\u5B66\u4E60\u573A\u666F\u3001\u4E66\u9762\u8868\u8FBE\uFF09${topic ? `\uFF0C\u5185\u5BB9\u5C3D\u91CF\u56F4\u7ED5\u300C${topic}\u300D\u4E3B\u9898\u9886\u57DF\u5C55\u5F00\uFF0C\u591A\u7528\u8BE5\u9886\u57DF\u7684\u5E38\u89C1\u8BCD\u6C47\u548C\u573A\u666F` : ""}\uFF1A
${batch.map((w, i) => `${i + 1}. ${w}`).join("\n")}
\u6BCF\u4E2A\u4F8B\u53E5\u90FD\u8981\u914D\u4E00\u53E5\u81EA\u7136\u7684\u4E2D\u6587\u7FFB\u8BD1\u3002
\u8F93\u51FA JSON \u6570\u7EC4\uFF1A[{"word":"...","sentences":[{"en":"\u82F1\u6587\u4F8B\u53E5","zh":"\u4E2D\u6587\u7FFB\u8BD1"},...]}]\uFF0C\u5FC5\u987B\u8986\u76D6\u5168\u90E8 ${batch.length} \u4E2A\u5355\u8BCD\uFF0C\u6BCF\u4E2A\u5355\u8BCD\u7ED9\u6EE1 ${count} \u53E5\u3002`
          }
        ],
        0.5
      );
    } catch (e) {
      firstErr != null ? firstErr : firstErr = e;
      return;
    }
    let items;
    try {
      items = parseJsonArray(out);
    } catch (e) {
      firstErr != null ? firstErr : firstErr = e;
      return;
    }
    for (const x of items) {
      const w = x == null ? void 0 : x.word;
      const list = x == null ? void 0 : x.sentences;
      if (!w) continue;
      const arr = (Array.isArray(list) ? list : []).map((s) => {
        if (typeof s === "string") return s.trim() ? { text: s.trim() } : void 0;
        const en = typeof (s == null ? void 0 : s.en) === "string" ? s.en.trim() : "";
        if (!en) return void 0;
        return { text: en, zh: typeof s.zh === "string" ? s.zh.trim() : void 0 };
      }).filter((e) => !!e);
      if (!arr.length) continue;
      const k = String(w).toLowerCase();
      m.set(k, [...(_a = m.get(k)) != null ? _a : [], ...arr]);
    }
    onWords == null ? void 0 : onWords(batch.map((w) => w.toLowerCase()).filter((w) => m.has(w)));
  };
  const batches = chunk(words, count > 1 ? 10 : 30);
  let batchDone = 0;
  await runPool(batches, 2, async (batch) => {
    if (shouldStop == null ? void 0 : shouldStop()) return;
    try {
      await ask(batch);
    } finally {
      onBatch == null ? void 0 : onBatch(++batchDone, batches.length);
    }
  });
  const missing = words.filter((w) => !m.has(w.toLowerCase()));
  if (!(shouldStop == null ? void 0 : shouldStop()) && missing.length) {
    onRetry == null ? void 0 : onRetry(missing.length);
    await runPool(chunk(missing, 5), 2, ask);
  }
  if (!m.size && firstErr) throw firstErr;
  return m;
}
async function llmSenses(cfg, words, onWords) {
  const m = /* @__PURE__ */ new Map();
  let firstErr;
  const ask = async (batch) => {
    let out;
    try {
      out = await llmChat(
        cfg,
        [
          { role: "system", content: "\u4F60\u662F\u82F1\u8BED\u8BCD\u5178\u7F16\u7E82\u4E13\u5BB6\uFF0C\u5584\u7528\u7B80\u660E\u7684\u4E2D\u6587\u6807\u6CE8\u8BCD\u4E49\u3002\u53EA\u8F93\u51FA JSON\u3002" },
          {
            role: "user",
            content: `\u5217\u51FA\u4E0B\u5217\u6BCF\u4E2A\u82F1\u8BED\u5355\u8BCD\u7684\u5E38\u7528\u4E2D\u6587\u4E49\u9879\uFF082~6 \u884C\uFF0C\u6309\u5E38\u7528\u5EA6\u6392\u5E8F\uFF0C\u77ED\u8BED\u5355\u8BCD\u7ED9 1~2 \u884C\uFF09\u3002\u6BCF\u884C\u662F\u4E00\u4E2A\u6838\u5FC3\u542B\u4E49\uFF1A\u540C\u4E00\u542B\u4E49\u7684\u8FD1\u4E49\u8868\u8FF0\uFF08\u540C\u8BCD\u6027\uFF09\u7528\u300C\uFF1B\u300D\u5408\u5E76\u5728\u4E00\u884C\uFF0C\u4E0D\u540C\u6838\u5FC3\u542B\u4E49\u5206\u884C\uFF1B\u683C\u5F0F\u300C\u8BCD\u6027. \u4E2D\u6587\u91CA\u4E49\u300D\uFF0C\u8BCD\u6027\u7528 n./v./adj./adv./vt./vi. \u7B49\u7F29\u5199\u3002\u793A\u4F8B\uFF1Abank \u2192 ["n. \u94F6\u884C", "n. \u5CB8\uFF1B\u5824", "v. \u5806\u79EF"]\uFF1A
${batch.map((w, i) => `${i + 1}. ${w}`).join("\n")}
\u8F93\u51FA JSON \u6570\u7EC4\uFF1A[{"word":"...","senses":["n. \u91CA\u4E49","v. \u91CA\u4E49"]}]\uFF0C\u5FC5\u987B\u8986\u76D6\u5168\u90E8 ${batch.length} \u4E2A\u5355\u8BCD\u3002`
          }
        ],
        0.2
      );
    } catch (e) {
      firstErr != null ? firstErr : firstErr = e;
      return;
    }
    let items;
    try {
      items = parseJsonArray(out);
    } catch (e) {
      firstErr != null ? firstErr : firstErr = e;
      return;
    }
    for (const x of items) {
      const w = x == null ? void 0 : x.word;
      const s = x == null ? void 0 : x.senses;
      if (!w || !Array.isArray(s)) continue;
      const list = s.map(String).map((t) => t.trim()).filter(Boolean).slice(0, 6);
      if (list.length) m.set(String(w).toLowerCase(), list);
    }
    onWords == null ? void 0 : onWords(batch.map((w) => w.toLowerCase()).filter((w) => m.has(w)));
  };
  await runPool(chunk(words, 10), 2, ask);
  const missing = words.filter((w) => !m.has(w.toLowerCase()));
  if (missing.length) {
    await runPool(chunk(missing, 5), 2, ask);
  }
  if (!m.size && firstErr) throw firstErr;
  return m;
}
function memoSuggestions(items, cap = 5) {
  const out = [];
  for (const x of items) {
    const raw = typeof x === "string" ? x : typeof (x == null ? void 0 : x.memo) === "string" ? x.memo : typeof (x == null ? void 0 : x.text) === "string" ? x.text : typeof (x == null ? void 0 : x.content) === "string" ? x.content : "";
    const s = raw.trim();
    if (s && !out.includes(s)) out.push(s);
    if (out.length >= cap) break;
  }
  return out;
}
async function llmMemoSuggestions(cfg, word, translation) {
  const out = await llmChat(
    cfg,
    [
      { role: "system", content: "\u4F60\u662F\u82F1\u8BED\u8BCD\u6C47\u8BB0\u5FC6\u6CD5\u4E13\u5BB6\uFF0C\u64C5\u957F\u7528\u8BCD\u6839\u8BCD\u7F00\u3001\u8C10\u97F3\u8054\u60F3\u3001\u6613\u6DF7\u8BCD\u5BF9\u6BD4\u5E2E\u4E2D\u56FD\u5B66\u4E60\u8005\u9AD8\u6548\u8BB0\u5355\u8BCD\u3002\u53EA\u8F93\u51FA JSON\u3002" },
      {
        role: "user",
        content: `\u4E3A\u82F1\u8BED\u5355\u8BCD\u300C${word}\u300D${translation ? `\uFF08\u8BCD\u4E49\uFF1A${translation}\uFF09` : ""}\u5199 3 \u6761\u4E0D\u540C\u89D2\u5EA6\u7684\u4E2D\u6587\u52A9\u8BB0\uFF0C\u6BCF\u6761\u4E00\u4E24\u53E5\u8BDD\u3001\u7B80\u77ED\u597D\u8BB0\uFF1A
1. \u8BCD\u6839\u8BCD\u7F00\u62C6\u89E3\uFF08\u660E\u663E\u53EF\u62C6\u624D\u5199\uFF09
2. \u8C10\u97F3\u8054\u60F3\u6216\u5F62\u8C61\u573A\u666F\u8054\u60F3
3. \u8FD1\u5F62/\u8FD1\u4E49\u6613\u6DF7\u8BCD\u5BF9\u6BD4\u8FA8\u6790
\u53EA\u8F93\u51FA JSON \u6570\u7EC4\uFF1A["\u52A9\u8BB01","\u52A9\u8BB02","\u52A9\u8BB03"]\u3002`
      }
    ],
    0.6
  );
  return memoSuggestions(parseJsonArray(out));
}
async function llmTranslateSentences(cfg, texts) {
  const out = new Array(texts.length).fill("");
  const translate = async (idx) => {
    const out2 = await llmChat(
      cfg,
      [
        { role: "system", content: "\u4F60\u662F\u82F1\u8BD1\u4E2D\u7FFB\u8BD1\u5668\u3002\u53EA\u8F93\u51FA JSON\u3002" },
        {
          role: "user",
          content: `\u628A\u4E0B\u5217\u82F1\u6587\u4F8B\u53E5\u7FFB\u8BD1\u6210\u81EA\u7136\u6D41\u7545\u7684\u4E2D\u6587\uFF08\u4FDD\u6301\u7F16\u53F7\u987A\u5E8F\uFF09\uFF1A
${idx.map((i, j) => `${j + 1}. ${texts[i]}`).join("\n")}
\u53EA\u8F93\u51FA JSON \u6570\u7EC4\uFF1A["\u8BD1\u65871","\u8BD1\u65872",...]\uFF0C\u6570\u7EC4\u957F\u5EA6\u5FC5\u987B\u7B49\u4E8E ${idx.length}\u3002`
        }
      ],
      0.3
    );
    const arr = parseJsonArray(out2);
    idx.forEach((origIdx, j) => {
      const t = arr[j];
      if (typeof t === "string" && t.trim()) out[origIdx] = t.trim();
    });
  };
  const idxs = texts.map((_, i) => i).filter((i) => texts[i].trim());
  await runPool(chunk(idxs, 15), 2, translate);
  return out;
}

// src/dict/frequent-words.ts
var set = null;
function isFrequent(w) {
  set != null ? set : set = new Set(NGSL.split(" "));
  return set.has(w);
}
function isFrequentForm(w) {
  if (isFrequent(w)) return true;
  const c = [];
  if (w.endsWith("ies") || w.endsWith("ied")) c.push(w.slice(0, -3) + "y");
  if (w.endsWith("es")) c.push(w.slice(0, -2));
  if (w.endsWith("s")) c.push(w.slice(0, -1));
  if (w.endsWith("ed")) c.push(w.slice(0, -1), w.slice(0, -2), w.slice(0, -3));
  if (w.endsWith("ing")) c.push(w.slice(0, -3), w.slice(0, -3) + "e", w.slice(0, -4));
  if (w.endsWith("ly")) c.push(w.slice(0, -2), w.slice(0, -3) + "y");
  if (w.endsWith("er")) c.push(w.slice(0, -2), w.slice(0, -2) + "e", w.slice(0, -3));
  if (w.endsWith("est")) c.push(w.slice(0, -3), w.slice(0, -3) + "e", w.slice(0, -4));
  return c.some((x) => set.has(x));
}
var NGSL = "a abandon ability able abortion about above abroad absence absolute absolutely abstract abuse academic accept acceptable access accident accommodation accompany accomplish accord account accurate accuse achieve achievement acknowledge acquire acquisition across act action active activity actor actual actually ad adapt add addition additional address adequate adjust adjustment administration admire admit adopt adult advance advantage adventure advertise advertisement advice advise adviser advocate affair affect afford afraid after afternoon again against age agency agenda agent aggressive ago agree agreement agricultural ahead aid aim air aircraft airline alarm album alcohol alive all allege allow ally almost alone along alongside already alright also alter alternative although altogether always amaze amendment among amount analysis analyst analyze ancient and anger angle angry animal announce announcement annual another answer anticipate anxiety anxious any anybody anymore anyone anything anyway anywhere apart apartment apologize apparent apparently appeal appear appearance application apply appoint appointment appreciate approach appropriate approval approve approximately architecture area argue argument arise arm army around arrange arrangement arrest arrival arrive art article artist as ashamed aside ask assess assessment asset assign assist assistance assistant associate association assume assumption assure at athlete atmosphere attach attachment attack attempt attend attendance attention attitude attract attraction attractive attribute audience aunt author automatically autumn available average avoid award aware awareness away awful baby back background bad badly bag balance ball ban band bank bar barely barrier base basic basically basis bath battle be beach bear beat beautiful beauty because become bed bedroom beer before begin behave behavior behind belief believe bell belong below belt bend beneath benefit beside besides bet between beyond bias bid big bike bill billion bin bind biological bird birth bit bite black blame bless blind block blood bloody blow blue board boat body bomb bond bone book boom boost boot border bore borrow boss both bother bottle bottom boundary bowl box boy brain branch brand bread break breakfast breast breath breathe breed bridge brief briefly bright brilliant bring broad broadcast brother brown brush budget build bunch burden burn burst bury bus business busy but button buy buyer by cable cake calculate call calm camera camp campaign can cancel cancer cap capability capable capacity capital capture car carbon card care career careful carefully carpet carry case cash cast castle cat catalog catch category cause celebrate celebration cell cent center central century ceremony certain certainly chain chair chairman challenge chamber champion championship chance change channel chapter character characteristic characterize charge charity charm chart chase chat cheap check cheek cheese chemical chest chicken chief child childhood chip chocolate choice choose church cigarette circle circumstance cite citizen city civil civilian claim class classic classical clause clean clear clearly climate climb clinical clock close closely clothes clothing cloud club cluster coach coal coast coat code coffee coin cold collapse colleague collect collection college color column combination combine come comedy comfort comfortable command comment commercial commission commit commitment committee common communicate communication community company compare comparison compensation compete competition competitive competitor complain complaint complete completely complex complexity complicate component compose composition compound comprehensive comprise compromise compute computer concentrate concentration concept concern concert conclude conclusion concrete condition conduct confidence confident confirm conflict confuse confusion connect connection consequence consequently conservative consider considerable consideration consist consistent constant constantly constitute constraint construct construction consult consultant consume consumer contact contain contemporary content contest context continue continuous contract contrast contribute contribution control controversial convention conventional conversation convert convince cook cool cooperation cope copy core corner corporate corporation correct correspond cost cough could council counsel count counter country county couple course court cousin cover coverage cow crack craft crash crazy cream create creation creative creature credit crew crime criminal crisis criterion critic critical criticism criticize crop cross crowd crucial cry cultural culture cup curious currency current currently curtain curve custom customer cut cycle dad daily damage damn dance danger dangerous dare dark darkness data database date daughter day dead deal dealer dear death debate debt decade decide decision declare decline decrease dedicate deep deeply defeat defend defense deficit define definitely definition degree delay delight deliver delivery demand democracy democratic demonstrate demonstration density deny department depend dependent deposit depress depression depth derive describe description desert deserve design designer desire desk despite destroy destruction detail detect determination determine develop development device devote dialog die diet differ difference different differently difficult difficulty dig digital dimension dinner direct direction directly director dirty disagree disappear disappoint disaster discipline discount discover discovery discuss discussion disease dish disk dismiss disorder display dispute distance distant distinct distinction distinguish distribute district disturb diversity divide division divorce do doctor document dog dollar domestic dominate door double doubt down dozen draft drag drama dramatic dramatically draw dream dress drink drive driver drop drug dry due during dust duty each ear early earn earth ease easily east eastern easy eat economic economy edge edit edition editor educate education educational effect effective effectively efficiency efficient effort egg either elderly elect election electric electricity electronic element eliminate else elsewhere embarrass embrace emerge emergency emotion emotional emphasis emphasize empire employ employee employer employment empty enable encounter encourage end enemy energy engage engine engineer enhance enjoy enormous enough ensure enter enterprise entertain entertainment entire entirely entitle entrance entry envelope environment environmental episode equal equally equation equipment equivalent era error escape especially essay essential establish establishment estate estimate ethnic evaluate evaluation even evening event eventually ever every everybody everyday everyone everything everywhere evidence evil evolution evolve exact exactly exam examination examine example exceed excellent except exception excess exchange excite excitement exclude excuse executive exercise exhaust exhibit exhibition exist existence expand expansion expect expectation expenditure expense expensive experience experiment experimental expert explain explanation explore export expose exposure express expression extend extension extensive extent external extra extract extraordinary extreme extremely eye face facility fact factor factory fade fail failure fair fairly faith faithfully fall false familiar family famous fan fancy fantastic far farm farmer fascinate fashion fast fat father fault favor favorite fear feature federal fee feed feel fellow female fence festival few fiction field fifteen fifty fight figure file fill film filter final finally finance financial find fine finger finish fire firm firmly first firstly fish fit fix flag flash flat flexible flight float flood floor flow flower fly focus fold folk follow food fool foot football for force forecast foreign forest forever forget form formal format formation former formula forth fortunate fortune forward found foundation fragment frame framework free freedom freeze frequency frequent frequently fresh friend friendly friendship frighten from front fruit fuel fulfill full fully fun function functional fund fundamental funny furniture further furthermore future gain gallery game gap garden gas gate gather gay gaze gear gender gene general generally generate generation genetic gentle gentleman gently genuine gesture get giant gift girl give glad glance glass global go goal god gold golden golf good govern government governor grab grade gradually graduate grain grammar grand grandmother grant grass grateful gray great greatly green greet grin ground group grow growth guarantee guard guess guest guide guideline guilty guitar gun guy habit hair half hall hand handle hang happen happiness happy harbor hard hardly harm hat hate have he head health healthy hear heart heat heavily heavy height hell hello help helpful hence her here hero herself hesitate hi hide high highlight highly hill him himself hint hire his historian historic historical history hit hold holder hole holiday home honest honor hook hope hopefully horrible horse hospital host hot hotel hour house household how however huge human humor hunger hunt hurry hurt husband hypothesis i ice idea ideal identify identity if ignore ill illegal illness illustrate illustration image imagination imagine immediate immediately immigrant implement implementation implication imply import importance important impose impossible impress impression impressive improve improvement in incentive inch incident include income incorporate increase increasingly indeed independence independent index indicate indication individual industrial industry infant infection inflation influence inform information initial initially initiative injure injury inner innocent innovation input inquiry inside insight insist inspire install instance instead institution institutional instruction instrument insurance insure integrate intellectual intelligence intend intense intention interaction interest interior internal international interpret interpretation intervention interview into introduce introduction invent invest investigate investigation investment investor invitation invite involve involvement iron island isolate issue it item its itself jacket jail job join joint joke journal journalist journey joy judge judgment jump jury just justice justify keen keep key kick kid kill kind king kiss kitchen knee knife knock know knowledge label labor laboratory lack lady lake land landscape language large largely last late latter laugh laughter launch law lawyer lay layer lazy lead leader leadership league lean leap learn least leather leave lecture left leg legal legislation lend length less lesson let letter level liability liberal library license lie life lift light like likely limit limitation line link lip liquid list listen listener literally literary literature little live load loan local locate location lock log logic long look loose lose loss lot loud love lovely lover low luck lucky lunch luxury machine mad magazine magic mail main mainly maintain maintenance major majority make maker male man manage management manager manner manufacture manufacturer many map march margin mark market marriage marry mass massive master match mate material mathematics matter mature maximum may maybe mayor me meal mean meanwhile measure measurement meat mechanism medical medicine medium meet member membership memory mental mention menu mere merely mess message metal meter method middle might mile military milk mind mine minimum minister minor minority minute mirror miss mission mistake mix mixture mobile mode model moderate modern modify module mom moment money monitor month monthly mood moon moral more moreover morning mortgage most mostly mother motion motivate motivation motor mount mountain mouse mouth move movement movie much multiple murder muscle museum music musical musician must mutual my myself mystery name narrative narrow nation national native natural naturally nature near nearby nearly necessarily necessary neck need negative neglect negotiate negotiation neighbor neighborhood neither nerve nervous net network never nevertheless new newly news newspaper next nice night no nobody noise none nor normal normally north northern nose not note nothing notice notion noun novel now nowadays nowhere nuclear number numerous nurse object objective obligation observation observe obvious obviously occasion occasionally occupy occur ocean odd of off offense offer office officer official often oil okay old on once one online only onto open opera operate operation operator opinion opponent opportunity oppose opposite opposition option or orange order ordinary organic organization organize origin original originally other otherwise ought our ourselves out outcome outline output outside over overall overcome overseas owe own owner ownership pace pack package page pain paint pair pale panel panic paper paragraph parallel parent park part participant participate participation particular particularly partly partner partnership party pass passage passenger passion past path patient pattern pause pay payment peace peak peer pen penalty pension people per perceive percent percentage perception perfect perfectly perform performance perhaps period permanent permission permit person personal personality personally personnel perspective persuade phase phenomenon philosophy phone photo photograph phrase physical piano pick picture piece pig pile pilot pink pipe pitch place plain plan plane planet plant plastic plate platform play player pleasant please pleasure plenty plot plus pocket poem poet poetry point police policy political politician politics poll pollution pool poor pop popular population port portion portrait pose position positive possess possession possibility possible possibly post pot potato potential potentially pound pour poverty power powerful practical practice praise pray precise precisely predict prefer preference pregnancy pregnant premise preparation prepare presence present presentation preserve president presidential press pressure presumably pretend pretty prevent previous previously price pride primarily primary prime principal principle print printer prior priority prison prisoner private privilege prize pro probability probably problem procedure proceed process produce producer product production profession professional professor profile profit program progress project promise promote promotion prompt proof proper properly property proportion proposal propose prospect protect protection protein protest proud prove provide province provision psychological pub public publication publisher pull pump pupil purchase pure purpose pursue push put qualification qualify quality quantity quarter question quick quickly quiet quietly quite quote race racial radical radio rail rain raise random range rank rapid rapidly rare rarely rat rate rather ratio raw reach react reaction read reader ready real reality realize really rear reason reasonable reasonably recall receive recent recently reckon recognition recognize recommend recommendation record recover recovery recruit red reduce reduction refer reference reflect reflection reform refugee refuse regard regardless region regional register registration regret regular regularly regulate regulation reject relate relation relationship relative relatively relax release relevant reliable relief religion religious rely remain remark remarkable remember remind remote remove rent repair repeat replace reply report reporter represent representation representative reputation request require requirement rescue research researcher reserve resident resign resist resistance resolution resolve resort resource respect respectively respond response responsibility responsible rest restaurant restore restrict restriction result retail retain retire retirement return reveal revenue reverse review revise revolution reward rice rich rid ride right ring rise risk rival river road rock role roll romantic roof room root rough roughly round route routine row royal ruin rule run rural rush sad safe safety sail sake salary sale salt same sample sanction sand satisfaction satisfy save say scale scan scare scene schedule scheme scholar school science scientific scientist scope score scream screen sea seal search season seat second secondary secondly secret secretary section sector secure security see seed seek seem segment select selection self sell send senior sense sensitive sentence separate sequence series serious seriously servant serve server service session set settle settlement several severe sex sexual shade shadow shake shall shape share shareholder sharp she sheep sheet shelf shell shelter shift shine ship shirt shock shoe shoot shop shore short shot should shoulder shout show shower shut sick side sigh sight sign signal significance significant significantly silence silent silly silver similar similarly simple simply since sing singer single sink sir sister sit site situate situation size ski skill skin skirt sky slave sleep slice slide slight slightly slip slope slow slowly small smart smell smile smoke smooth snap snow so social society soft software soil soldier solid solution solve some somebody somehow someone something sometimes somewhat somewhere son song soon sorry sort soul sound source south southern space spare speak speaker special specialist specialize species specific specifically specify speech speed spell spend spin spirit split sponsor sport spot spread spring square stability stable staff stage stain stair stake stamp stand standard star stare start state statement station statistic status stay steady steal steel stem step stick still stimulate stir stock stomach stone stop storage store storm story straight strain strange stranger strategy stream street strength strengthen stress stretch strict strike string strip stroke strong strongly structural structure struggle student studio study stuff stupid style subject submit subsequent subsequently substance substantial substitute succeed success successful successfully such sudden suddenly suffer sufficient sugar suggest suggestion suit suitable sum summarize summary summer sun supplement supplier supply support supporter suppose sure surely surface surgery surprise surprisingly surround survey survival survive suspect suspend sustain swear sweep sweet swim swing switch symbol symptom system table tackle tail take tale talent talk tall tank tap tape target task taste tax taxi tea teach teacher team tear technical technique technology teenager telephone television tell temperature temporary tend tendency tender tennis tension tent term terrible territory terrorist test text than thank that the theater their them theme themselves then theoretical theory therapy there therefore these they thick thin thing think thirst this those though threat threaten throat through throughout throw thus ticket tie tight till time tiny tip tire tissue title to today together tomorrow tone tongue tonight too tool tooth top topic total totally touch tough tour tourism tourist toward tower town toy trace track trade tradition traditional traffic trail train transfer transform transition translate transport transportation trap travel treat treatment tree trend trial trick trigger trip troop trouble truck true truly trust truth try tube tune turn twice twin twist type typical typically ugly ultimately unable uncertainty uncle unclear under undergo underlie understand undertake unemployment unfortunately uniform union unique unit unite universal universe university unknown unless unlike unlikely until unusual up update upon upper upset urban urge us use useful user usual usually valley valuable value van variable variation variety various vary vast vegetable vehicle venture verb version versus very vessel veteran via vice victim victory video view village violence violent virtually virus visible vision visit visitor visual vital voice volume voluntary volunteer vote voter wage wait wake walk wall wander want war warm warn wash waste watch water wave way we weak weakness wealth wealthy weapon wear weather web wed week weekend weekly weigh weight weird welcome welfare well west western wet what whatever wheel when whenever where whereas wherever whether which while whilst whisper white who whole whom whose why wide widely wife wild will win wind window wine wing winner winter wipe wire wise wish with withdraw within without witness woman wonder wonderful wood wooden word work worker world worry worth would wound wrap write writer wrong yard year yellow yes yesterday yet yield you young your yourself youth zero zone";

// src/expand/fetcher.ts
var import_obsidian7 = require("obsidian");
async function fetchWikiArticles(keyword, limit = 5, lang) {
  var _a, _b;
  const lg = lang != null ? lang : isZh(keyword) ? "zh" : "en";
  const url = `https://${lg}.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&explaintext=1&exlimit=${limit}&redirects=1&generator=search&gsrsearch=${encodeURIComponent(keyword)}&gsrlimit=${limit}&origin=*`;
  const res = await (0, import_obsidian7.requestUrl)({
    url,
    headers: { "User-Agent": HTTP_UA }
  });
  const data = JSON.parse(res.text);
  const pages = Object.values((_b = (_a = data == null ? void 0 : data.query) == null ? void 0 : _a.pages) != null ? _b : {});
  return pages.filter((p) => typeof p.extract === "string" && p.extract.length > 200).map((p) => ({ title: p.title, extract: p.extract.slice(0, 8e3), keyword }));
}
async function fetchArticleFromUrl(url) {
  var _a, _b, _c, _d;
  const u = url.trim();
  if (!/^https?:\/\//i.test(u)) throw new Error("\u8BF7\u8F93\u5165\u4EE5 http(s):// \u5F00\u5934\u7684\u6587\u7AE0\u94FE\u63A5");
  const res = await (0, import_obsidian7.requestUrl)({ url: u, headers: { "User-Agent": HTTP_UA } });
  const doc = new DOMParser().parseFromString(res.text, "text/html");
  const root = (_c = (_b = (_a = doc.querySelector("article")) != null ? _a : doc.querySelector("[role='main']")) != null ? _b : doc.querySelector("main")) != null ? _c : doc.body;
  root.querySelectorAll("script,style,noscript,iframe,svg,nav,header,footer,aside,form,button").forEach((el) => el.remove());
  root.querySelectorAll("p,div,br,li,h1,h2,h3,h4,h5,h6,pre,blockquote,tr,section").forEach((el) => {
    el.after(doc.createTextNode("\n"));
  });
  const text2 = ((_d = root.textContent) != null ? _d : "").replace(/[\t ]+/g, " ").replace(/ ?\n ?/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (text2.length < 200) {
    throw new Error("\u8BE5\u9875\u9762\u6B63\u6587\u592A\u77ED\uFF08\u53EF\u80FD\u9700\u8981\u767B\u5F55\u6216\u4E3A\u52A8\u6001\u6E32\u67D3\uFF09\uFF0C\u8BF7\u76F4\u63A5\u7C98\u8D34\u6587\u672C");
  }
  return text2;
}
async function fetchOpenAlexAbstracts(keyword, limit = 5) {
  var _a;
  const url = `https://api.openalex.org/works?search=${encodeURIComponent(keyword)}&filter=language:en&per-page=${limit}`;
  const res = await (0, import_obsidian7.requestUrl)({ url, headers: { "User-Agent": HTTP_UA } });
  const data = JSON.parse(res.text);
  const works = (_a = data == null ? void 0 : data.results) != null ? _a : [];
  return works.map((w) => {
    var _a2, _b;
    const inv = (_a2 = w.abstract_inverted_index) != null ? _a2 : {};
    const words = [];
    for (const [word, positions] of Object.entries(inv)) {
      for (const p of positions) words[p] = word;
    }
    return { title: (_b = w.display_name) != null ? _b : "", extract: words.join(" "), keyword };
  }).filter((a) => a.extract.length > 200);
}
async function crossLangKeyword(keyword) {
  var _a, _b, _c, _d, _e;
  const lg = isZh(keyword) ? "zh" : "en";
  const target = lg === "zh" ? "en" : "zh";
  const url = `https://${lg}.wikipedia.org/w/api.php?action=query&format=json&generator=search&gsrsearch=${encodeURIComponent(keyword)}&gsrlimit=1&prop=langlinks&lllang=${target}&redirects=1&origin=*`;
  const res = await (0, import_obsidian7.requestUrl)({
    url,
    headers: { "User-Agent": HTTP_UA }
  });
  const data = JSON.parse(res.text);
  const pages = Object.values(
    (_b = (_a = data == null ? void 0 : data.query) == null ? void 0 : _a.pages) != null ? _b : {}
  );
  return (_e = (_d = (_c = pages[0]) == null ? void 0 : _c.langlinks) == null ? void 0 : _d.find((l) => l.lang === target)) == null ? void 0 : _e["*"];
}
async function relatedTitles(title, limit = 2) {
  var _a, _b;
  const lg = isZh(title) ? "zh" : "en";
  const url = `https://${lg}.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent("morelike:" + title)}&srlimit=${limit + 1}&origin=*`;
  const res = await (0, import_obsidian7.requestUrl)({
    url,
    headers: { "User-Agent": HTTP_UA }
  });
  const data = JSON.parse(res.text);
  const hits = (_b = (_a = data == null ? void 0 : data.query) == null ? void 0 : _a.search) != null ? _b : [];
  return hits.map((h) => h.title).filter((t) => t !== title).slice(0, limit);
}
async function collectWikiArticles(kws, onStatus) {
  onStatus == null ? void 0 : onStatus("\u6293\u53D6 OpenAlex \u8BBA\u6587\u6458\u8981\u2026");
  let articles = (await settleValues(kws.map((k) => fetchOpenAlexAbstracts(k, 5)))).flat();
  if (!articles.length) {
    onStatus == null ? void 0 : onStatus("OpenAlex \u65E0\u7ED3\u679C\uFF0C\u6539\u7528 Wikipedia\u2026\uFF08\u4E92\u67E5\u5BF9\u5E94\u8BCD\u6761\uFF09");
    const crosses = await Promise.allSettled(kws.map((k) => crossLangKeyword(k)));
    const targets = [...kws];
    for (const r of crosses) {
      if (r.status === "fulfilled" && r.value && !targets.includes(r.value)) targets.push(r.value);
    }
    const fetchAll = async (list) => (await settleValues(list.map((k) => fetchWikiArticles(k, 5)))).flat();
    articles = await fetchAll(targets);
    if (articles.length) {
      onStatus == null ? void 0 : onStatus(`\u67E5\u627E\u300C${articles[0].title}\u300D\u7684\u76F8\u5173\u8BCD\u6761\u2026`);
      const rel = await relatedTitles(articles[0].title, 2).catch(() => []);
      const fresh = rel.filter((t) => !targets.includes(t)).slice(0, 4);
      if (fresh.length) {
        onStatus == null ? void 0 : onStatus(`\u6269\u5C55\u76F8\u5173\u8BCD\uFF1A${fresh.join("\u3001")}`);
        articles = articles.concat(await fetchAll(fresh));
      }
    }
  }
  if (!articles.length) {
    throw new Error("OpenAlex \u4E0E Wikipedia \u5747\u4E0D\u53EF\u8FBE\uFF08\u5F53\u524D\u7F51\u7EDC\u53D7\u9650\uFF09\uFF0C\u53EF\u8BD5\u300C\u76F8\u5173\u8BCD\uFF08Datamuse\uFF09\u300D\u6216\u300CAI \u6269\u8BCD\u300D");
  }
  return articles;
}

// src/expand/datamuse.ts
var import_obsidian8 = require("obsidian");
async function fetchWords(code, keyword, limit) {
  const res = await (0, import_obsidian8.requestUrl)({
    url: `https://api.datamuse.com/words?${code}=${encodeURIComponent(keyword)}&max=${limit}`,
    headers: { "User-Agent": HTTP_UA }
  });
  const data = JSON.parse(res.text);
  return data.map((d) => String(d.word)).filter((w) => /^[a-z][a-z'-]{2,}$/.test(w));
}
function fetchRelatedWords(keyword, limit = 20) {
  return fetchWords("ml", keyword, limit);
}
function fetchSynonyms(keyword, limit = 5) {
  return fetchWords("rel_syn", keyword, limit);
}
function fetchAntonyms(keyword, limit = 5) {
  return fetchWords("rel_ant", keyword, limit);
}

// src/expand/extract.ts
var STOPWORDS = new Set(
  `the be to of and a in that have it for not on with he as you do at this but his by from
they we say her she or an will my one all would there their what so up out if about who get
which go me when make can like time no just him know take people into year your good some
could them see other than then now look only come its over think also back after use two how
our work first well way even new want because any these give day most us is are was were been
has had did does made having said get getting got go goes went gone come comes coming take
takes taking took know knows knew known make makes think thinks thought see sees saw seen
want wants use uses used find finds found tell tells told ask asks asked work works seem seems
feel feels felt try tries tried leave leaves left call calls called speak speaks spoke speak
talk talks talked live lives lived happen happens happened put puts hear hears heard bring
brings brought keep keeps kept let lets begin begins began seem mean means meant become
becomes became leave show shows showed start starts started run runs move moves moved like
likes loved love help helps helped play plays played stop stops stopped watch watches watched
follow follows followed bring hold holds held write writes wrote sit sits sat stand stands
stood lose loses lost pay pays paid meet meets met include includes included set sets learn
learns learned change changes changed lead leads led understand understands speak read reads
spend spends spent grow grows grew open opens walk walks win wins won offer offers offered
remember remember consider appears appear buy buys bought wait waits waited serve sends send
build builds built stay stays fall falls fell cut cuts reach reach raise raises raised pass
passes passed sell sells require report reports decide decide pull allow allow allows
something anything everything someone everyone anyone nothing much many more most less least
very quite really rather still already yet ever never always often sometimes usually again
once twice here there where why who whose also only even just both either neither each every
none few several lot lots thing things way ways part parts place places case cases number
group problem fact hand hand large big small high low right left early late long short old
new great bad better best worse worst sure true real same different important possible
common general public private simple easy hard difficult strong weak light dark warm cold
full empty open close next last little enough almost around across against among along behind
below above under between through during before after without within upon whether though
although however therefore thus hence rather quite almost maybe perhaps probably actually
currently recently finally usually finally especially particularly mainly mostly largely
exactly completely totally entirely greatly highly deeply widely closely directly quickly
slowly carefully finally suddenly immediately easily hardly really usually
one two three four five six seven eight nine ten first second third next last
monday tuesday wednesday thursday friday saturday sunday january february march april june
july august september october november december week month months year years today tomorrow
yesterday hour hours minute minutes second seconds
article page section list example examples following also however based using used
information data research study studies paper author authors et al
www http https com org`.split(/\s+/).filter(Boolean)
);
function stemWord(w) {
  const s = w.toLowerCase();
  if (s.length <= 4) return s;
  if (s.endsWith("ies")) return s.slice(0, -3) + "y";
  if (/(?:ches|shes|sses|xes|zes)$/.test(s)) return s.slice(0, -2);
  if (/(?:ss|us|is)$/.test(s)) return s;
  if (s.endsWith("s")) return s.slice(0, -1);
  if (s.endsWith("ing")) return stripVerbSuffix(s, 3);
  if (s.endsWith("ed")) {
    const b = stripVerbSuffix(s, 2);
    return b !== s ? b : s.slice(0, -1);
  }
  if (s.endsWith("ly")) return s.slice(0, -2);
  return s;
}
function stripVerbSuffix(s, drop) {
  const b = s.slice(0, s.length - drop);
  if (b.length < 3 || !/[aeiou]/.test(b)) return s;
  if (/(.)\1$/.test(b) && b.length > 3 && !/(ll|ss|ff)$/.test(b)) return b.slice(0, -1);
  return b;
}
function filterNewByStem(words, existing) {
  const stems = new Set([...existing].map(stemWord));
  const out = [];
  for (const w of words) {
    const s = stemWord(w);
    if (stems.has(s)) continue;
    stems.add(s);
    out.push(w);
  }
  return out;
}
function extractCandidates(articles, opts) {
  var _a, _b, _c, _d;
  const minFreq = (_a = opts.minFreq) != null ? _a : 2;
  const existingStems = new Set([...opts.existing].map(stemWord));
  const agg = /* @__PURE__ */ new Map();
  for (let ai = 0; ai < articles.length; ai++) {
    const text2 = articles[ai].text;
    for (const m of text2.matchAll(/[A-Za-z][A-Za-z'-]{2,}/g)) {
      const surface = m[0];
      const lower = surface.toLowerCase();
      const word = stemWord(lower);
      if (word.length < 4 || STOPWORDS.has(word) || STOPWORDS.has(lower)) continue;
      if (existingStems.has(word)) continue;
      let a = agg.get(word);
      if (!a) {
        a = { freq: 0, articles: /* @__PURE__ */ new Set(), lowerSeen: 0, allCaps: true };
        agg.set(word, a);
      }
      a.freq++;
      a.articles.add(ai);
      if (surface === lower) a.lowerSeen++;
      if (surface !== surface.toUpperCase()) a.allCaps = false;
    }
  }
  for (const k of [...agg.keys()]) {
    const full = k + "e";
    const a = agg.get(k);
    const b = agg.get(full);
    if (a && b) {
      b.freq += a.freq;
      for (const ai of a.articles) b.articles.add(ai);
      b.lowerSeen += a.lowerSeen;
      b.allCaps = b.allCaps && a.allCaps;
      agg.delete(k);
    }
  }
  const cands = [];
  for (const [word, a] of agg) {
    if (a.freq < minFreq) continue;
    if (a.lowerSeen === 0 && !a.allCaps) continue;
    cands.push({
      word,
      freq: a.freq,
      coverage: a.articles.size,
      score: a.freq * (1 + a.articles.size)
    });
  }
  cands.sort((x, y) => y.score - x.score);
  for (const c of cands) {
    const order = [...agg.get(c.word).articles];
    let best;
    for (const ai of order) {
      for (const raw of (_b = articles[ai].text.match(/[^.!?]+[.!?]+/g)) != null ? _b : [articles[ai].text]) {
        const s = raw.trim();
        if (s.length < 30 || s.length > 200) continue;
        const tokens = (_c = s.match(/[A-Za-z][A-Za-z'-]*/g)) != null ? _c : [];
        if (!tokens.some((t) => isForm(t, c.word))) continue;
        if (!best || s.length < best.text.length) best = { text: s, title: articles[ai].title };
      }
      if (best) break;
    }
    if (best) {
      c.sentence = best.text;
      c.sentenceTitle = best.title;
    }
  }
  return cands.slice(0, (_d = opts.limit) != null ? _d : 120);
}

// src/components/ExpandPanel.svelte
var { Map: Map_1 } = globals;
function get_each_context(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[55] = list[i];
  child_ctx[56] = list;
  child_ctx[57] = i;
  return child_ctx;
}
function get_each_context_1(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[58] = list[i];
  return child_ctx;
}
function create_if_block_14(ctx) {
  let div;
  let input;
  let mounted;
  let dispose;
  return {
    c() {
      div = element("div");
      input = element("input");
      attr(input, "class", "el-kw-input");
      attr(input, "type", "text");
      attr(input, "placeholder", "\u4E3B\u9898\u5173\u952E\u8BCD\uFF0C\u4E2D\u82F1\u6587\u5747\u53EF\uFF0C\u9017\u53F7\u5206\u9694\uFF0C\u5982\uFF1Amachine learning, \u4EBA\u5DE5\u667A\u80FD, climate");
      attr(div, "class", "el-expand-kw");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, input);
      set_input_value(
        input,
        /*keywordsText*/
        ctx[4]
      );
      if (!mounted) {
        dispose = [
          listen(
            input,
            "input",
            /*input_input_handler*/
            ctx[36]
          ),
          listen(
            input,
            "keydown",
            /*keydown_handler*/
            ctx[37]
          )
        ];
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*keywordsText*/
      16 && input.value !== /*keywordsText*/
      ctx2[4]) {
        set_input_value(
          input,
          /*keywordsText*/
          ctx2[4]
        );
      }
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_else_block_1(ctx) {
  let div1;
  let textarea;
  let t0;
  let div0;
  let button;
  let t1;
  let t2;
  let helptip;
  let current;
  let mounted;
  let dispose;
  helptip = new HelpTip_default({
    props: {
      tip: `\u76F4\u63A5\u52A0\u5165\u300C${/*theme*/
      ctx[1]}\u300D\uFF1B\u65E0\u91CA\u4E49\u7684\u8BCD\u81EA\u52A8\u67E5\u8BCD\u5178\u8865\u5168\uFF0C\u5DF2\u6709\u8BCD\u5408\u5E76\u4E3B\u9898`
    }
  });
  return {
    c() {
      div1 = element("div");
      textarea = element("textarea");
      t0 = space();
      div0 = element("div");
      button = element("button");
      t1 = text("\u5BFC\u5165");
      t2 = space();
      create_component(helptip.$$.fragment);
      attr(textarea, "class", "el-article-input");
      attr(textarea, "rows", "8");
      attr(textarea, "placeholder", "\u6BCF\u884C\u4E00\u4E2A\u5355\u8BCD\uFF1B\u53EF\u9644\u5E26\u91CA\u4E49\u4E0E\u4F8B\u53E5\uFF1Aword<TAB>\u91CA\u4E49<TAB>\u4F8B\u53E5<TAB>\u4F8B\u53E5\u7FFB\u8BD1\uFF08\u540E\u4E24\u5217\u53EF\u9009\uFF09\uFF0C# \u5F00\u5934\u7684\u884C\u5FFD\u7565");
      attr(button, "class", "mod-cta");
      button.disabled = /*busy*/
      ctx[6];
      attr(div0, "class", "el-expand-actions");
      set_style(div0, "margin-top", "6px");
      attr(div1, "class", "el-article-box");
    },
    m(target, anchor) {
      insert(target, div1, anchor);
      append(div1, textarea);
      set_input_value(
        textarea,
        /*importText*/
        ctx[12]
      );
      append(div1, t0);
      append(div1, div0);
      append(div0, button);
      append(button, t1);
      append(div0, t2);
      mount_component(helptip, div0, null);
      current = true;
      if (!mounted) {
        dispose = [
          listen(
            textarea,
            "input",
            /*textarea_input_handler_1*/
            ctx[43]
          ),
          listen(
            button,
            "click",
            /*runImport*/
            ctx[18]
          )
        ];
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*importText*/
      4096) {
        set_input_value(
          textarea,
          /*importText*/
          ctx2[12]
        );
      }
      if (!current || dirty[0] & /*busy*/
      64) {
        button.disabled = /*busy*/
        ctx2[6];
      }
      const helptip_changes = {};
      if (dirty[0] & /*theme*/
      2) helptip_changes.tip = `\u76F4\u63A5\u52A0\u5165\u300C${/*theme*/
      ctx2[1]}\u300D\uFF1B\u65E0\u91CA\u4E49\u7684\u8BCD\u81EA\u52A8\u67E5\u8BCD\u5178\u8865\u5168\uFF0C\u5DF2\u6709\u8BCD\u5408\u5E76\u4E3B\u9898`;
      helptip.$set(helptip_changes);
    },
    i(local) {
      if (current) return;
      transition_in(helptip.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(helptip.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching) {
        detach(div1);
      }
      destroy_component(helptip);
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_if_block_13(ctx) {
  let div2;
  let div0;
  let input;
  let t0;
  let button0;
  let t1;
  let t2;
  let textarea;
  let t3;
  let div1;
  let button1;
  let t4;
  let mounted;
  let dispose;
  return {
    c() {
      div2 = element("div");
      div0 = element("div");
      input = element("input");
      t0 = space();
      button0 = element("button");
      t1 = text("\u94FE\u63A5\u63D0\u53D6");
      t2 = space();
      textarea = element("textarea");
      t3 = space();
      div1 = element("div");
      button1 = element("button");
      t4 = text("\u63D0\u53D6\u751F\u8BCD");
      attr(input, "class", "el-article-url");
      attr(input, "type", "text");
      attr(input, "placeholder", "\u8F93\u5165\u6587\u7AE0\u94FE\u63A5\uFF08http/https\uFF09\uFF0C\u81EA\u52A8\u6293\u6B63\u6587\u63D0\u53D6\u751F\u8BCD");
      input.disabled = /*busy*/
      ctx[6];
      attr(button0, "class", "mod-cta");
      button0.disabled = /*busy*/
      ctx[6];
      attr(div0, "class", "el-expand-actions");
      set_style(div0, "margin-bottom", "6px");
      attr(textarea, "class", "el-article-input");
      attr(textarea, "rows", "6");
      attr(textarea, "placeholder", "\u7C98\u8D34\u6B63\u5728\u8BFB\u7684\u82F1\u6587\u6587\u7AE0\u6216\u6BB5\u843D\uFF1A\u63D0\u53D6\u4F60\u8FD8\u6CA1\u6536\u5F55\u7684\u751F\u8BCD\uFF0C\u4F8B\u53E5\u81EA\u52A8\u53D6\u81EA\u539F\u6587");
      attr(button1, "class", "mod-cta");
      button1.disabled = /*busy*/
      ctx[6];
      attr(div1, "class", "el-expand-actions");
      set_style(div1, "margin-top", "6px");
      attr(div2, "class", "el-article-box");
    },
    m(target, anchor) {
      insert(target, div2, anchor);
      append(div2, div0);
      append(div0, input);
      set_input_value(
        input,
        /*articleUrl*/
        ctx[9]
      );
      append(div0, t0);
      append(div0, button0);
      append(button0, t1);
      append(div2, t2);
      append(div2, textarea);
      set_input_value(
        textarea,
        /*articleText*/
        ctx[8]
      );
      append(div2, t3);
      append(div2, div1);
      append(div1, button1);
      append(button1, t4);
      if (!mounted) {
        dispose = [
          listen(
            input,
            "input",
            /*input_input_handler_1*/
            ctx[40]
          ),
          listen(
            input,
            "keydown",
            /*keydown_handler_1*/
            ctx[41]
          ),
          listen(
            button0,
            "click",
            /*extractFromUrl*/
            ctx[17]
          ),
          listen(
            textarea,
            "input",
            /*textarea_input_handler*/
            ctx[42]
          ),
          listen(
            button1,
            "click",
            /*extractArticle*/
            ctx[16]
          )
        ];
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*busy*/
      64) {
        input.disabled = /*busy*/
        ctx2[6];
      }
      if (dirty[0] & /*articleUrl*/
      512 && input.value !== /*articleUrl*/
      ctx2[9]) {
        set_input_value(
          input,
          /*articleUrl*/
          ctx2[9]
        );
      }
      if (dirty[0] & /*busy*/
      64) {
        button0.disabled = /*busy*/
        ctx2[6];
      }
      if (dirty[0] & /*articleText*/
      256) {
        set_input_value(
          textarea,
          /*articleText*/
          ctx2[8]
        );
      }
      if (dirty[0] & /*busy*/
      64) {
        button1.disabled = /*busy*/
        ctx2[6];
      }
    },
    i: noop,
    o: noop,
    d(detaching) {
      if (detaching) {
        detach(div2);
      }
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_if_block_12(ctx) {
  let div;
  let button;
  let t0;
  let t1;
  let helptip;
  let current;
  let mounted;
  let dispose;
  helptip = new HelpTip_default({
    props: {
      tip: "Datamuse \u76F8\u5173\u8BCD\uFF1A\u514D Key\u3001\u56FD\u5185\u53EF\u76F4\u8FDE\uFF1B\u4E2D\u6587\u5173\u952E\u8BCD\u7ECF LLM/\u8BCD\u5178\u8F6C\u4E3A\u82F1\u6587\u79CD\u5B50\u540E\u67E5\u8BE2"
    }
  });
  return {
    c() {
      div = element("div");
      button = element("button");
      t0 = text("\u5F00\u59CB\u83B7\u53D6");
      t1 = space();
      create_component(helptip.$$.fragment);
      attr(button, "class", "mod-cta");
      button.disabled = /*busy*/
      ctx[6];
      attr(div, "class", "el-expand-panel");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, button);
      append(button, t0);
      append(div, t1);
      mount_component(helptip, div, null);
      current = true;
      if (!mounted) {
        dispose = listen(
          button,
          "click",
          /*expandRelated*/
          ctx[20]
        );
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (!current || dirty[0] & /*busy*/
      64) {
        button.disabled = /*busy*/
        ctx2[6];
      }
    },
    i(local) {
      if (current) return;
      transition_in(helptip.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(helptip.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
      destroy_component(helptip);
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_11(ctx) {
  let div;
  let button;
  let t0;
  let t1;
  let helptip;
  let current;
  let mounted;
  let dispose;
  helptip = new HelpTip_default({
    props: {
      tip: "\u6293\u53D6 OpenAlex \u8BBA\u6587\u6458\u8981\uFF08\u56FD\u5185\u76F4\u8FDE\uFF09\u6216 Wikipedia \u4E3B\u9898\u6587\u7AE0\uFF0C\u63D0\u53D6\u9AD8\u9891\u8BCD"
    }
  });
  return {
    c() {
      div = element("div");
      button = element("button");
      t0 = text("\u5F00\u59CB\u6293\u53D6");
      t1 = space();
      create_component(helptip.$$.fragment);
      attr(button, "class", "mod-cta");
      button.disabled = /*busy*/
      ctx[6];
      attr(div, "class", "el-expand-panel");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, button);
      append(button, t0);
      append(div, t1);
      mount_component(helptip, div, null);
      current = true;
      if (!mounted) {
        dispose = listen(
          button,
          "click",
          /*expandWiki*/
          ctx[15]
        );
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (!current || dirty[0] & /*busy*/
      64) {
        button.disabled = /*busy*/
        ctx2[6];
      }
    },
    i(local) {
      if (current) return;
      transition_in(helptip.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(helptip.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
      destroy_component(helptip);
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_9(ctx) {
  let div;
  let select;
  let t;
  let current_block_type_index;
  let if_block;
  let current;
  let mounted;
  let dispose;
  let each_value_1 = ensure_array_like([6, 12, 16, 20]);
  let each_blocks = [];
  for (let i = 0; i < 4; i += 1) {
    each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
  }
  const if_block_creators = [create_if_block_10, create_else_block];
  const if_blocks = [];
  function select_block_type_1(ctx2, dirty) {
    if (
      /*llmOn*/
      ctx2[3]
    ) return 0;
    return 1;
  }
  current_block_type_index = select_block_type_1(ctx, [-1, -1]);
  if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
  return {
    c() {
      div = element("div");
      select = element("select");
      for (let i = 0; i < 4; i += 1) {
        each_blocks[i].c();
      }
      t = space();
      if_block.c();
      select.disabled = /*busy*/
      ctx[6];
      attr(select, "title", "\u672C\u6B21 AI \u751F\u6210\u591A\u5C11\u4E2A\u5019\u9009\u8BCD\uFF08\u6700\u5927 20\uFF09");
      if (
        /*aiCount*/
        ctx[10] === void 0
      ) add_render_callback(() => (
        /*select_change_handler*/
        ctx[38].call(select)
      ));
      attr(div, "class", "el-expand-panel");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, select);
      for (let i = 0; i < 4; i += 1) {
        if (each_blocks[i]) {
          each_blocks[i].m(select, null);
        }
      }
      select_option(
        select,
        /*aiCount*/
        ctx[10],
        true
      );
      append(div, t);
      if_blocks[current_block_type_index].m(div, null);
      current = true;
      if (!mounted) {
        dispose = [
          listen(
            select,
            "change",
            /*select_change_handler*/
            ctx[38]
          ),
          listen(
            select,
            "change",
            /*change_handler*/
            ctx[39]
          )
        ];
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (!current || dirty[0] & /*busy*/
      64) {
        select.disabled = /*busy*/
        ctx2[6];
      }
      if (dirty[0] & /*aiCount*/
      1024) {
        select_option(
          select,
          /*aiCount*/
          ctx2[10]
        );
      }
      let previous_block_index = current_block_type_index;
      current_block_type_index = select_block_type_1(ctx2, dirty);
      if (current_block_type_index === previous_block_index) {
        if_blocks[current_block_type_index].p(ctx2, dirty);
      } else {
        group_outros();
        transition_out(if_blocks[previous_block_index], 1, 1, () => {
          if_blocks[previous_block_index] = null;
        });
        check_outros();
        if_block = if_blocks[current_block_type_index];
        if (!if_block) {
          if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx2);
          if_block.c();
        } else {
          if_block.p(ctx2, dirty);
        }
        transition_in(if_block, 1);
        if_block.m(div, null);
      }
    },
    i(local) {
      if (current) return;
      transition_in(if_block);
      current = true;
    },
    o(local) {
      transition_out(if_block);
      current = false;
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
      destroy_each(each_blocks, detaching);
      if_blocks[current_block_type_index].d();
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_each_block_1(ctx) {
  let option;
  let option_value_value;
  return {
    c() {
      option = element("option");
      option.textContent = `${/*n*/
      ctx[58]} \u4E2A`;
      option.__value = option_value_value = /*n*/
      ctx[58];
      set_input_value(option, option.__value);
    },
    m(target, anchor) {
      insert(target, option, anchor);
    },
    p: noop,
    d(detaching) {
      if (detaching) {
        detach(option);
      }
    }
  };
}
function create_else_block(ctx) {
  let button;
  let t0;
  let t1;
  let helptip;
  let current;
  let mounted;
  let dispose;
  helptip = new HelpTip_default({
    props: {
      tip: "\u6309\u5173\u952E\u8BCD\u751F\u6210\u5019\u9009\u8BCD\uFF08\u91CA\u4E49 + \u4F8B\u53E5\uFF09\uFF1B\u4E91\u7AEF API \u9700 Key\uFF0C\u672C\u5730 Ollama \u4E0D\u7528"
    }
  });
  return {
    c() {
      button = element("button");
      t0 = text("\u914D\u7F6E LLM");
      t1 = space();
      create_component(helptip.$$.fragment);
      button.disabled = /*busy*/
      ctx[6];
    },
    m(target, anchor) {
      insert(target, button, anchor);
      append(button, t0);
      insert(target, t1, anchor);
      mount_component(helptip, target, anchor);
      current = true;
      if (!mounted) {
        dispose = listen(
          button,
          "click",
          /*openSettings*/
          ctx[26]
        );
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (!current || dirty[0] & /*busy*/
      64) {
        button.disabled = /*busy*/
        ctx2[6];
      }
    },
    i(local) {
      if (current) return;
      transition_in(helptip.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(helptip.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching) {
        detach(button);
        detach(t1);
      }
      destroy_component(helptip, detaching);
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_10(ctx) {
  let button;
  let t;
  let mounted;
  let dispose;
  return {
    c() {
      button = element("button");
      t = text("\u5F00\u59CB\u751F\u6210");
      attr(button, "class", "mod-cta");
      button.disabled = /*busy*/
      ctx[6];
    },
    m(target, anchor) {
      insert(target, button, anchor);
      append(button, t);
      if (!mounted) {
        dispose = listen(
          button,
          "click",
          /*expandLlm*/
          ctx[19]
        );
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*busy*/
      64) {
        button.disabled = /*busy*/
        ctx2[6];
      }
    },
    i: noop,
    o: noop,
    d(detaching) {
      if (detaching) {
        detach(button);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_7(ctx) {
  let div;
  let t0;
  let t1;
  let if_block = !/*cands*/
  ctx[2].length && create_if_block_8(ctx);
  return {
    c() {
      div = element("div");
      t0 = text(
        /*summary*/
        ctx[7]
      );
      t1 = space();
      if (if_block) if_block.c();
      attr(div, "class", "el-expand-summary");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, t0);
      append(div, t1);
      if (if_block) if_block.m(div, null);
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*summary*/
      128) set_data(
        t0,
        /*summary*/
        ctx2[7]
      );
      if (!/*cands*/
      ctx2[2].length) {
        if (if_block) {
          if_block.p(ctx2, dirty);
        } else {
          if_block = create_if_block_8(ctx2);
          if_block.c();
          if_block.m(div, null);
        }
      } else if (if_block) {
        if_block.d(1);
        if_block = null;
      }
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
      if (if_block) if_block.d();
    }
  };
}
function create_if_block_8(ctx) {
  let button;
  let t0;
  let t1;
  let t2;
  let mounted;
  let dispose;
  return {
    c() {
      button = element("button");
      t0 = text("\u73B0\u5728\u5B66\u300C");
      t1 = text(
        /*theme*/
        ctx[1]
      );
      t2 = text("\u300D");
      attr(button, "class", "mod-cta");
      set_style(button, "margin-left", "10px");
    },
    m(target, anchor) {
      insert(target, button, anchor);
      append(button, t0);
      append(button, t1);
      append(button, t2);
      if (!mounted) {
        dispose = listen(
          button,
          "click",
          /*learnTheme*/
          ctx[22]
        );
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*theme*/
      2) set_data(
        t1,
        /*theme*/
        ctx2[1]
      );
    },
    d(detaching) {
      if (detaching) {
        detach(button);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_1(ctx) {
  let div1;
  let span;
  let t0;
  let t1;
  let t2;
  let t3_value = (
    /*cands*/
    ctx[2].length + ""
  );
  let t3;
  let t4;
  let div0;
  let button0;
  let t5;
  let t6;
  let button1;
  let t7;
  let t8;
  let div2;
  let each_blocks = [];
  let each_1_lookup = new Map_1();
  let mounted;
  let dispose;
  let each_value = ensure_array_like(
    /*cands*/
    ctx[2]
  );
  const get_key = (ctx2) => (
    /*c*/
    ctx2[55].word
  );
  for (let i = 0; i < each_value.length; i += 1) {
    let child_ctx = get_each_context(ctx, each_value, i);
    let key = get_key(child_ctx);
    each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
  }
  return {
    c() {
      div1 = element("div");
      span = element("span");
      t0 = text("\u5DF2\u9009 ");
      t1 = text(
        /*checkedCount*/
        ctx[14]
      );
      t2 = text(" / ");
      t3 = text(t3_value);
      t4 = space();
      div0 = element("div");
      button0 = element("button");
      t5 = text("\u5168\u9009");
      t6 = space();
      button1 = element("button");
      t7 = text("\u6E05\u7A7A");
      t8 = space();
      div2 = element("div");
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      attr(span, "class", "el-muted");
      button0.disabled = /*busy*/
      ctx[6];
      button1.disabled = /*busy*/
      ctx[6];
      attr(div0, "class", "el-cand-toolbar-btns");
      attr(div1, "class", "el-cand-toolbar");
      attr(div2, "class", "el-cand-list");
    },
    m(target, anchor) {
      insert(target, div1, anchor);
      append(div1, span);
      append(span, t0);
      append(span, t1);
      append(span, t2);
      append(span, t3);
      append(div1, t4);
      append(div1, div0);
      append(div0, button0);
      append(button0, t5);
      append(div0, t6);
      append(div0, button1);
      append(button1, t7);
      insert(target, t8, anchor);
      insert(target, div2, anchor);
      for (let i = 0; i < each_blocks.length; i += 1) {
        if (each_blocks[i]) {
          each_blocks[i].m(div2, null);
        }
      }
      if (!mounted) {
        dispose = [
          listen(
            button0,
            "click",
            /*click_handler_5*/
            ctx[44]
          ),
          listen(
            button1,
            "click",
            /*click_handler_6*/
            ctx[45]
          )
        ];
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*checkedCount*/
      16384) set_data(
        t1,
        /*checkedCount*/
        ctx2[14]
      );
      if (dirty[0] & /*cands*/
      4 && t3_value !== (t3_value = /*cands*/
      ctx2[2].length + "")) set_data(t3, t3_value);
      if (dirty[0] & /*busy*/
      64) {
        button0.disabled = /*busy*/
        ctx2[6];
      }
      if (dirty[0] & /*busy*/
      64) {
        button1.disabled = /*busy*/
        ctx2[6];
      }
      if (dirty[0] & /*cands, plugin*/
      5) {
        each_value = ensure_array_like(
          /*cands*/
          ctx2[2]
        );
        each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx2, each_value, each_1_lookup, div2, destroy_block, create_each_block, null, get_each_context);
      }
    },
    d(detaching) {
      if (detaching) {
        detach(div1);
        detach(t8);
        detach(div2);
      }
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].d();
      }
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_if_block_6(ctx) {
  let span;
  let t_value = levelLabel(
    /*c*/
    ctx[55].level
  ) + "";
  let t;
  return {
    c() {
      span = element("span");
      t = text(t_value);
      attr(span, "class", "el-chip");
      attr(span, "title", "\u8003\u8BD5\u7B49\u7EA7");
    },
    m(target, anchor) {
      insert(target, span, anchor);
      append(span, t);
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*cands*/
      4 && t_value !== (t_value = levelLabel(
        /*c*/
        ctx2[55].level
      ) + "")) set_data(t, t_value);
    },
    d(detaching) {
      if (detaching) {
        detach(span);
      }
    }
  };
}
function create_if_block_5(ctx) {
  let span;
  let t0;
  let t1_value = (
    /*c*/
    ctx[55].freq + ""
  );
  let t1;
  let t2;
  let t3_value = (
    /*c*/
    ctx[55].coverage + ""
  );
  let t3;
  return {
    c() {
      span = element("span");
      t0 = text("\u9891 ");
      t1 = text(t1_value);
      t2 = text(" \xB7 \u6587 ");
      t3 = text(t3_value);
      attr(span, "class", "el-chip");
    },
    m(target, anchor) {
      insert(target, span, anchor);
      append(span, t0);
      append(span, t1);
      append(span, t2);
      append(span, t3);
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*cands*/
      4 && t1_value !== (t1_value = /*c*/
      ctx2[55].freq + "")) set_data(t1, t1_value);
      if (dirty[0] & /*cands*/
      4 && t3_value !== (t3_value = /*c*/
      ctx2[55].coverage + "")) set_data(t3, t3_value);
    },
    d(detaching) {
      if (detaching) {
        detach(span);
      }
    }
  };
}
function create_if_block_4(ctx) {
  let div;
  let t_value = (
    /*c*/
    ctx[55].translation + ""
  );
  let t;
  return {
    c() {
      div = element("div");
      t = text(t_value);
      attr(div, "class", "el-cand-trans");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, t);
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*cands*/
      4 && t_value !== (t_value = /*c*/
      ctx2[55].translation + "")) set_data(t, t_value);
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
    }
  };
}
function create_if_block_2(ctx) {
  let div;
  let t0_value = (
    /*c*/
    ctx[55].sentence + ""
  );
  let t0;
  let span;
  let t1;
  let t2_value = (
    /*c*/
    ctx[55].source + ""
  );
  let t2;
  let t3;
  let if_block_anchor;
  let if_block = (
    /*c*/
    ctx[55].sentenceZh && create_if_block_3(ctx)
  );
  return {
    c() {
      div = element("div");
      t0 = text(t0_value);
      span = element("span");
      t1 = text("\u2014\u2014 ");
      t2 = text(t2_value);
      t3 = space();
      if (if_block) if_block.c();
      if_block_anchor = empty();
      attr(span, "class", "el-example-src");
      attr(div, "class", "el-cand-sent");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, t0);
      append(div, span);
      append(span, t1);
      append(span, t2);
      insert(target, t3, anchor);
      if (if_block) if_block.m(target, anchor);
      insert(target, if_block_anchor, anchor);
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*cands*/
      4 && t0_value !== (t0_value = /*c*/
      ctx2[55].sentence + "")) set_data(t0, t0_value);
      if (dirty[0] & /*cands*/
      4 && t2_value !== (t2_value = /*c*/
      ctx2[55].source + "")) set_data(t2, t2_value);
      if (
        /*c*/
        ctx2[55].sentenceZh
      ) {
        if (if_block) {
          if_block.p(ctx2, dirty);
        } else {
          if_block = create_if_block_3(ctx2);
          if_block.c();
          if_block.m(if_block_anchor.parentNode, if_block_anchor);
        }
      } else if (if_block) {
        if_block.d(1);
        if_block = null;
      }
    },
    d(detaching) {
      if (detaching) {
        detach(div);
        detach(t3);
        detach(if_block_anchor);
      }
      if (if_block) if_block.d(detaching);
    }
  };
}
function create_if_block_3(ctx) {
  let div;
  let t_value = (
    /*c*/
    ctx[55].sentenceZh + ""
  );
  let t;
  return {
    c() {
      div = element("div");
      t = text(t_value);
      attr(div, "class", "el-cand-sent-zh");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, t);
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*cands*/
      4 && t_value !== (t_value = /*c*/
      ctx2[55].sentenceZh + "")) set_data(t, t_value);
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
    }
  };
}
function create_each_block(key_1, ctx) {
  let label;
  let input;
  let t0;
  let div1;
  let div0;
  let span;
  let t1_value = (
    /*c*/
    ctx[55].word + ""
  );
  let t1;
  let t2;
  let button;
  let t4;
  let t5;
  let t6;
  let t7;
  let t8;
  let mounted;
  let dispose;
  function input_change_handler() {
    ctx[46].call(
      input,
      /*each_value*/
      ctx[56],
      /*c_index*/
      ctx[57]
    );
  }
  function click_handler_7() {
    return (
      /*click_handler_7*/
      ctx[47](
        /*c*/
        ctx[55]
      )
    );
  }
  let if_block0 = (
    /*c*/
    ctx[55].level && create_if_block_6(ctx)
  );
  let if_block1 = (
    /*c*/
    ctx[55].freq && create_if_block_5(ctx)
  );
  let if_block2 = (
    /*c*/
    ctx[55].translation && create_if_block_4(ctx)
  );
  let if_block3 = (
    /*c*/
    ctx[55].sentence && create_if_block_2(ctx)
  );
  return {
    key: key_1,
    first: null,
    c() {
      label = element("label");
      input = element("input");
      t0 = space();
      div1 = element("div");
      div0 = element("div");
      span = element("span");
      t1 = text(t1_value);
      t2 = space();
      button = element("button");
      button.textContent = "\u{1F50A}";
      t4 = space();
      if (if_block0) if_block0.c();
      t5 = space();
      if (if_block1) if_block1.c();
      t6 = space();
      if (if_block2) if_block2.c();
      t7 = space();
      if (if_block3) if_block3.c();
      t8 = space();
      attr(input, "type", "checkbox");
      attr(span, "class", "el-cand-word");
      attr(button, "class", "el-tts");
      attr(button, "title", "\u8BD5\u542C\u53D1\u97F3");
      attr(div0, "class", "el-cand-head");
      attr(div1, "class", "el-cand-main");
      attr(label, "class", "el-cand");
      toggle_class(
        label,
        "is-checked",
        /*c*/
        ctx[55].checked
      );
      this.first = label;
    },
    m(target, anchor) {
      insert(target, label, anchor);
      append(label, input);
      input.checked = /*c*/
      ctx[55].checked;
      append(label, t0);
      append(label, div1);
      append(div1, div0);
      append(div0, span);
      append(span, t1);
      append(div0, t2);
      append(div0, button);
      append(div0, t4);
      if (if_block0) if_block0.m(div0, null);
      append(div0, t5);
      if (if_block1) if_block1.m(div0, null);
      append(div1, t6);
      if (if_block2) if_block2.m(div1, null);
      append(div1, t7);
      if (if_block3) if_block3.m(div1, null);
      append(label, t8);
      if (!mounted) {
        dispose = [
          listen(input, "change", input_change_handler),
          listen(button, "click", stop_propagation(prevent_default(click_handler_7)))
        ];
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (dirty[0] & /*cands*/
      4) {
        input.checked = /*c*/
        ctx[55].checked;
      }
      if (dirty[0] & /*cands*/
      4 && t1_value !== (t1_value = /*c*/
      ctx[55].word + "")) set_data(t1, t1_value);
      if (
        /*c*/
        ctx[55].level
      ) {
        if (if_block0) {
          if_block0.p(ctx, dirty);
        } else {
          if_block0 = create_if_block_6(ctx);
          if_block0.c();
          if_block0.m(div0, t5);
        }
      } else if (if_block0) {
        if_block0.d(1);
        if_block0 = null;
      }
      if (
        /*c*/
        ctx[55].freq
      ) {
        if (if_block1) {
          if_block1.p(ctx, dirty);
        } else {
          if_block1 = create_if_block_5(ctx);
          if_block1.c();
          if_block1.m(div0, null);
        }
      } else if (if_block1) {
        if_block1.d(1);
        if_block1 = null;
      }
      if (
        /*c*/
        ctx[55].translation
      ) {
        if (if_block2) {
          if_block2.p(ctx, dirty);
        } else {
          if_block2 = create_if_block_4(ctx);
          if_block2.c();
          if_block2.m(div1, t7);
        }
      } else if (if_block2) {
        if_block2.d(1);
        if_block2 = null;
      }
      if (
        /*c*/
        ctx[55].sentence
      ) {
        if (if_block3) {
          if_block3.p(ctx, dirty);
        } else {
          if_block3 = create_if_block_2(ctx);
          if_block3.c();
          if_block3.m(div1, null);
        }
      } else if (if_block3) {
        if_block3.d(1);
        if_block3 = null;
      }
      if (dirty[0] & /*cands*/
      4) {
        toggle_class(
          label,
          "is-checked",
          /*c*/
          ctx[55].checked
        );
      }
    },
    d(detaching) {
      if (detaching) {
        detach(label);
      }
      if (if_block0) if_block0.d();
      if (if_block1) if_block1.d();
      if (if_block2) if_block2.d();
      if (if_block3) if_block3.d();
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_if_block(ctx) {
  let button;
  let t0;
  let t1;
  let t2;
  let t3;
  let t4;
  let button_disabled_value;
  let mounted;
  let dispose;
  return {
    c() {
      button = element("button");
      t0 = text("\u52A0\u5165\u300C");
      t1 = text(
        /*theme*/
        ctx[1]
      );
      t2 = text("\u300D\uFF08");
      t3 = text(
        /*checkedCount*/
        ctx[14]
      );
      t4 = text("\uFF09");
      attr(button, "class", "mod-cta");
      button.disabled = button_disabled_value = /*busy*/
      ctx[6] || !/*checkedCount*/
      ctx[14];
    },
    m(target, anchor) {
      insert(target, button, anchor);
      append(button, t0);
      append(button, t1);
      append(button, t2);
      append(button, t3);
      append(button, t4);
      if (!mounted) {
        dispose = listen(
          button,
          "click",
          /*addChecked*/
          ctx[21]
        );
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*theme*/
      2) set_data(
        t1,
        /*theme*/
        ctx2[1]
      );
      if (dirty[0] & /*checkedCount*/
      16384) set_data(
        t3,
        /*checkedCount*/
        ctx2[14]
      );
      if (dirty[0] & /*busy, checkedCount*/
      16448 && button_disabled_value !== (button_disabled_value = /*busy*/
      ctx2[6] || !/*checkedCount*/
      ctx2[14])) {
        button.disabled = button_disabled_value;
      }
    },
    d(detaching) {
      if (detaching) {
        detach(button);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_fragment2(ctx) {
  let div2;
  let div0;
  let button0;
  let t0;
  let t1_value = (
    /*llmOn*/
    ctx[3] ? "" : "\uFF08\u672A\u914D\u7F6E\uFF09"
  );
  let t1;
  let t2;
  let button1;
  let t3;
  let t4;
  let button2;
  let t5;
  let t6;
  let button3;
  let t7;
  let t8;
  let button4;
  let t9;
  let t10;
  let t11;
  let current_block_type_index;
  let if_block1;
  let t12;
  let div1;
  let t13;
  let t14;
  let t15;
  let t16;
  let div3;
  let helptip;
  let t17;
  let current;
  let mounted;
  let dispose;
  let if_block0 = (
    /*lastAction*/
    ctx[11] !== "article" && /*lastAction*/
    ctx[11] !== "import" && create_if_block_14(ctx)
  );
  const if_block_creators = [
    create_if_block_9,
    create_if_block_11,
    create_if_block_12,
    create_if_block_13,
    create_else_block_1
  ];
  const if_blocks = [];
  function select_block_type(ctx2, dirty) {
    if (
      /*lastAction*/
      ctx2[11] === "llm"
    ) return 0;
    if (
      /*lastAction*/
      ctx2[11] === "wiki"
    ) return 1;
    if (
      /*lastAction*/
      ctx2[11] === "related"
    ) return 2;
    if (
      /*lastAction*/
      ctx2[11] === "article"
    ) return 3;
    return 4;
  }
  current_block_type_index = select_block_type(ctx, [-1, -1]);
  if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
  let if_block2 = (
    /*summary*/
    ctx[7] && create_if_block_7(ctx)
  );
  let if_block3 = (
    /*cands*/
    ctx[2].length && create_if_block_1(ctx)
  );
  helptip = new HelpTip_default({ props: { tip: (
    /*pageTip*/
    ctx[13]
  ) } });
  let if_block4 = (
    /*cands*/
    ctx[2].length && create_if_block(ctx)
  );
  return {
    c() {
      div2 = element("div");
      div0 = element("div");
      button0 = element("button");
      t0 = text("AI \u6269\u8BCD");
      t1 = text(t1_value);
      t2 = space();
      button1 = element("button");
      t3 = text("\u8054\u7F51\u6293\u53D6");
      t4 = space();
      button2 = element("button");
      t5 = text("\u76F8\u5173\u8BCD");
      t6 = space();
      button3 = element("button");
      t7 = text("\u6587\u7AE0\u63D0\u53D6");
      t8 = space();
      button4 = element("button");
      t9 = text("\u5BFC\u5165\u8BCD\u8868");
      t10 = space();
      if (if_block0) if_block0.c();
      t11 = space();
      if_block1.c();
      t12 = space();
      div1 = element("div");
      t13 = text(
        /*status*/
        ctx[5]
      );
      t14 = space();
      if (if_block2) if_block2.c();
      t15 = space();
      if (if_block3) if_block3.c();
      t16 = space();
      div3 = element("div");
      create_component(helptip.$$.fragment);
      t17 = space();
      if (if_block4) if_block4.c();
      attr(button0, "class", "el-tab");
      button0.disabled = /*busy*/
      ctx[6];
      toggle_class(
        button0,
        "is-active",
        /*lastAction*/
        ctx[11] === "llm"
      );
      attr(button1, "class", "el-tab");
      button1.disabled = /*busy*/
      ctx[6];
      toggle_class(
        button1,
        "is-active",
        /*lastAction*/
        ctx[11] === "wiki"
      );
      attr(button2, "class", "el-tab");
      button2.disabled = /*busy*/
      ctx[6];
      toggle_class(
        button2,
        "is-active",
        /*lastAction*/
        ctx[11] === "related"
      );
      attr(button3, "class", "el-tab");
      button3.disabled = /*busy*/
      ctx[6];
      toggle_class(
        button3,
        "is-active",
        /*lastAction*/
        ctx[11] === "article"
      );
      attr(button4, "class", "el-tab");
      button4.disabled = /*busy*/
      ctx[6];
      toggle_class(
        button4,
        "is-active",
        /*lastAction*/
        ctx[11] === "import"
      );
      attr(div0, "class", "el-expand-tabs");
      attr(div1, "class", "el-muted el-expand-status");
      attr(div2, "class", "el-expand");
      attr(div3, "class", "el-expand-footer");
    },
    m(target, anchor) {
      insert(target, div2, anchor);
      append(div2, div0);
      append(div0, button0);
      append(button0, t0);
      append(button0, t1);
      append(div0, t2);
      append(div0, button1);
      append(button1, t3);
      append(div0, t4);
      append(div0, button2);
      append(button2, t5);
      append(div0, t6);
      append(div0, button3);
      append(button3, t7);
      append(div0, t8);
      append(div0, button4);
      append(button4, t9);
      append(div2, t10);
      if (if_block0) if_block0.m(div2, null);
      append(div2, t11);
      if_blocks[current_block_type_index].m(div2, null);
      append(div2, t12);
      append(div2, div1);
      append(div1, t13);
      append(div2, t14);
      if (if_block2) if_block2.m(div2, null);
      append(div2, t15);
      if (if_block3) if_block3.m(div2, null);
      insert(target, t16, anchor);
      insert(target, div3, anchor);
      mount_component(helptip, div3, null);
      append(div3, t17);
      if (if_block4) if_block4.m(div3, null);
      current = true;
      if (!mounted) {
        dispose = [
          listen(
            button0,
            "click",
            /*click_handler*/
            ctx[31]
          ),
          listen(
            button1,
            "click",
            /*click_handler_1*/
            ctx[32]
          ),
          listen(
            button2,
            "click",
            /*click_handler_2*/
            ctx[33]
          ),
          listen(
            button3,
            "click",
            /*click_handler_3*/
            ctx[34]
          ),
          listen(
            button4,
            "click",
            /*click_handler_4*/
            ctx[35]
          )
        ];
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if ((!current || dirty[0] & /*llmOn*/
      8) && t1_value !== (t1_value = /*llmOn*/
      ctx2[3] ? "" : "\uFF08\u672A\u914D\u7F6E\uFF09")) set_data(t1, t1_value);
      if (!current || dirty[0] & /*busy*/
      64) {
        button0.disabled = /*busy*/
        ctx2[6];
      }
      if (!current || dirty[0] & /*lastAction*/
      2048) {
        toggle_class(
          button0,
          "is-active",
          /*lastAction*/
          ctx2[11] === "llm"
        );
      }
      if (!current || dirty[0] & /*busy*/
      64) {
        button1.disabled = /*busy*/
        ctx2[6];
      }
      if (!current || dirty[0] & /*lastAction*/
      2048) {
        toggle_class(
          button1,
          "is-active",
          /*lastAction*/
          ctx2[11] === "wiki"
        );
      }
      if (!current || dirty[0] & /*busy*/
      64) {
        button2.disabled = /*busy*/
        ctx2[6];
      }
      if (!current || dirty[0] & /*lastAction*/
      2048) {
        toggle_class(
          button2,
          "is-active",
          /*lastAction*/
          ctx2[11] === "related"
        );
      }
      if (!current || dirty[0] & /*busy*/
      64) {
        button3.disabled = /*busy*/
        ctx2[6];
      }
      if (!current || dirty[0] & /*lastAction*/
      2048) {
        toggle_class(
          button3,
          "is-active",
          /*lastAction*/
          ctx2[11] === "article"
        );
      }
      if (!current || dirty[0] & /*busy*/
      64) {
        button4.disabled = /*busy*/
        ctx2[6];
      }
      if (!current || dirty[0] & /*lastAction*/
      2048) {
        toggle_class(
          button4,
          "is-active",
          /*lastAction*/
          ctx2[11] === "import"
        );
      }
      if (
        /*lastAction*/
        ctx2[11] !== "article" && /*lastAction*/
        ctx2[11] !== "import"
      ) {
        if (if_block0) {
          if_block0.p(ctx2, dirty);
        } else {
          if_block0 = create_if_block_14(ctx2);
          if_block0.c();
          if_block0.m(div2, t11);
        }
      } else if (if_block0) {
        if_block0.d(1);
        if_block0 = null;
      }
      let previous_block_index = current_block_type_index;
      current_block_type_index = select_block_type(ctx2, dirty);
      if (current_block_type_index === previous_block_index) {
        if_blocks[current_block_type_index].p(ctx2, dirty);
      } else {
        group_outros();
        transition_out(if_blocks[previous_block_index], 1, 1, () => {
          if_blocks[previous_block_index] = null;
        });
        check_outros();
        if_block1 = if_blocks[current_block_type_index];
        if (!if_block1) {
          if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx2);
          if_block1.c();
        } else {
          if_block1.p(ctx2, dirty);
        }
        transition_in(if_block1, 1);
        if_block1.m(div2, t12);
      }
      if (!current || dirty[0] & /*status*/
      32) set_data(
        t13,
        /*status*/
        ctx2[5]
      );
      if (
        /*summary*/
        ctx2[7]
      ) {
        if (if_block2) {
          if_block2.p(ctx2, dirty);
        } else {
          if_block2 = create_if_block_7(ctx2);
          if_block2.c();
          if_block2.m(div2, t15);
        }
      } else if (if_block2) {
        if_block2.d(1);
        if_block2 = null;
      }
      if (
        /*cands*/
        ctx2[2].length
      ) {
        if (if_block3) {
          if_block3.p(ctx2, dirty);
        } else {
          if_block3 = create_if_block_1(ctx2);
          if_block3.c();
          if_block3.m(div2, null);
        }
      } else if (if_block3) {
        if_block3.d(1);
        if_block3 = null;
      }
      const helptip_changes = {};
      if (dirty[0] & /*pageTip*/
      8192) helptip_changes.tip = /*pageTip*/
      ctx2[13];
      helptip.$set(helptip_changes);
      if (
        /*cands*/
        ctx2[2].length
      ) {
        if (if_block4) {
          if_block4.p(ctx2, dirty);
        } else {
          if_block4 = create_if_block(ctx2);
          if_block4.c();
          if_block4.m(div3, null);
        }
      } else if (if_block4) {
        if_block4.d(1);
        if_block4 = null;
      }
    },
    i(local) {
      if (current) return;
      transition_in(if_block1);
      transition_in(helptip.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(if_block1);
      transition_out(helptip.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching) {
        detach(div2);
        detach(t16);
        detach(div3);
      }
      if (if_block0) if_block0.d();
      if_blocks[current_block_type_index].d();
      if (if_block2) if_block2.d();
      if (if_block3) if_block3.d();
      destroy_component(helptip);
      if (if_block4) if_block4.d();
      mounted = false;
      run_all(dispose);
    }
  };
}
function applyExamples(list, m) {
  let n = 0;
  for (const c of list) {
    const exs = m.get(c.word);
    if (exs === null || exs === void 0 ? void 0 : exs.length) {
      c.exs = exs;
      c.sentence = exs[0].text;
      c.sentenceZh = exs[0].zh;
      c.source = "AI";
      n++;
    }
  }
  return n;
}
function instance2($$self, $$props, $$invalidate) {
  let checkedCount;
  let llmOn;
  let pageTip;
  var _a, _b;
  let { plugin } = $$props;
  let { theme } = $$props;
  let { onDone } = $$props;
  let { onClose = () => {
  } } = $$props;
  let { initialTab = "llm" } = $$props;
  let { autoRun = false } = $$props;
  let keywordsText = ((_b = (_a = plugin.db.themes[theme]) === null || _a === void 0 ? void 0 : _a.keywords) !== null && _b !== void 0 ? _b : []).join(", ");
  let cands = [];
  let status = "";
  let busy = false;
  let summary = "";
  let articleText = "";
  let articleUrl = "";
  let aiCount = Math.min(20, Math.max(1, plugin.db.settings.expandCount || 12));
  let lastAction = initialTab;
  let importText = "";
  onMount(() => {
    const cache = plugin.expandCache;
    if ((cache === null || cache === void 0 ? void 0 : cache.theme) === theme && cache.cands.length) {
      $$invalidate(2, cands = cache.cands);
      $$invalidate(5, status = `\u5DF2\u6062\u590D\u4E0A\u6B21\u672A\u5BFC\u5165\u7684\u5019\u9009\uFF08${cands.length} \u8BCD\uFF09\uFF0C\u53EF\u7EE7\u7EED\u52FE\u9009`);
      return;
    }
    if (autoRun && lastAction === "llm" && kw().length) {
      if (llmOn) void expandLlm();
      else {
        switchTab("wiki");
        void expandWiki();
      }
    }
  });
  function kw() {
    return parseKeywords(keywordsText);
  }
  function saveKeywords(kws) {
    var _a2;
    const info = plugin.db.themes[theme];
    if (!info) return;
    const merged = [
      .../* @__PURE__ */ new Set([...(_a2 = info.keywords) !== null && _a2 !== void 0 ? _a2 : [], ...kws])
    ];
    if (merged.join() !== info.keywords.join()) {
      info.keywords = merged;
      plugin.store.touch();
    }
  }
  async function enrichAndShow(raw, sourceLabel) {
    var _a2, _b2, _c, _d;
    $$invalidate(5, status = `\u5019\u9009 ${raw.length} \u8BCD\uFF0C\u67E5\u8BCD\u5178\u8865\u91CA\u4E49\u2026`);
    const enriched = [];
    await runPool(raw, 6, async (c) => {
      var _a3;
      let word = c.word;
      let e = await plugin.dict.lookup(word);
      if (!e && /^[a-z]+$/.test(word)) {
        const e2 = await plugin.dict.lookup(word + "e");
        if (e2) {
          word = word + "e";
          e = e2;
        }
      }
      if (!e) return;
      enriched.push({
        word,
        translation: (_a3 = e.translation) !== null && _a3 !== void 0 ? _a3 : "",
        sentence: c.sentence,
        source: c.sentence ? c.sentenceTitle ? `${sourceLabel}: ${c.sentenceTitle}` : sourceLabel : void 0,
        score: c.score,
        freq: c.freq,
        coverage: c.coverage,
        level: levelFromTag(e.tag),
        checked: false
      });
    });
    const seen = /* @__PURE__ */ new Map();
    for (const c of enriched) {
      const prev = seen.get(c.word);
      if (prev) {
        prev.freq = ((_a2 = prev.freq) !== null && _a2 !== void 0 ? _a2 : 0) + ((_b2 = c.freq) !== null && _b2 !== void 0 ? _b2 : 0);
        prev.coverage = Math.max((_c = prev.coverage) !== null && _c !== void 0 ? _c : 0, (_d = c.coverage) !== null && _d !== void 0 ? _d : 0);
      } else seen.set(c.word, c);
    }
    const merged = [...seen.values()];
    const fresh = filterNewByStem(merged.map((c) => c.word), plugin.words.allRaw().map((d) => d.word));
    const kept = new Set(fresh);
    const filtered = merged.filter((c) => kept.has(c.word));
    filtered.sort((a, b) => {
      var _a3, _b3;
      return ((_a3 = b.score) !== null && _a3 !== void 0 ? _a3 : 0) - ((_b3 = a.score) !== null && _b3 !== void 0 ? _b3 : 0);
    });
    $$invalidate(2, cands = filtered.slice(0, 80));
    let picked = 0;
    cands.forEach((c) => {
      if (c.level !== "ZK" && c.level !== "GK" && !isFrequent(c.word) && picked < 10) {
        c.checked = true;
        picked++;
      }
    });
    $$invalidate(5, status = cands.length ? `\u5171 ${cands.length} \u4E2A\u5019\u9009\uFF08\u6309 \u9891\u6B21\xD7\u6587\u7AE0\u8986\u76D6\u5EA6 \u6392\u5E8F\uFF1BZK/GK \u53CA NGSL \u9AD8\u9891\u57FA\u7840\u8BCD\u9ED8\u8BA4\u4E0D\u52FE\u9009\uFF09` : "\u6CA1\u6709\u63D0\u53D6\u5230\u5019\u9009\u8BCD\uFF0C\u8BD5\u8BD5\u66F4\u5177\u4F53\u7684\u5173\u952E\u8BCD\u6216\u66F4\u957F\u7684\u6587\u7AE0");
  }
  async function expandWiki() {
    var _a2;
    const kws = kw();
    if (!kws.length) {
      $$invalidate(5, status = "\u8BF7\u5148\u586B\u5199\u5173\u952E\u8BCD");
      return;
    }
    saveKeywords(kws);
    $$invalidate(11, lastAction = "wiki");
    $$invalidate(6, busy = true);
    $$invalidate(5, status = "\u6293\u53D6 OpenAlex \u8BBA\u6587\u6458\u8981\u2026");
    $$invalidate(2, cands = []);
    $$invalidate(7, summary = "");
    try {
      const articles = await collectWikiArticles(kws, (s) => $$invalidate(5, status = s));
      $$invalidate(5, status = `\u6293\u5230 ${articles.length} \u7BC7\u6587\u7AE0\uFF0C\u63D0\u53D6\u5019\u9009\u8BCD\u2026`);
      const existing = new Set(plugin.words.allRaw().map((d) => d.word));
      const texts = articles.map((a) => ({ title: a.title, text: a.extract }));
      const all = extractCandidates(texts, { existing, minFreq: 1 });
      const strict = all.filter((c) => c.freq >= 2);
      if (strict.length < 10) $$invalidate(5, status = `\u5019\u9009\u4E0D\u8DB3\uFF0C\u5DF2\u653E\u5BBD\u8BCD\u9891\u8981\u6C42\u2026`);
      await enrichAndShow(strict.length >= 10 ? strict : all, "\u8054\u7F51");
    } catch (e) {
      $$invalidate(5, status = (_a2 = e.message) !== null && _a2 !== void 0 ? _a2 : String(e));
    }
    $$invalidate(6, busy = false);
  }
  async function extractFromText(text2) {
    var _a2;
    if (text2.trim().length < 200) {
      $$invalidate(5, status = "\u8BF7\u7C98\u8D34\u66F4\u957F\u7684\u6587\u7AE0\uFF08\u81F3\u5C11 200 \u5B57\u7B26\uFF09");
      return;
    }
    $$invalidate(6, busy = true);
    $$invalidate(11, lastAction = "article");
    $$invalidate(5, status = "\u63D0\u53D6\u6587\u7AE0\u751F\u8BCD\u2026");
    $$invalidate(2, cands = []);
    $$invalidate(7, summary = "");
    try {
      const existing = new Set(plugin.words.allRaw().map((d) => d.word));
      const raw = extractCandidates([{ title: "\u6587\u7AE0", text: text2 }], { existing, minFreq: 1 });
      await enrichAndShow(raw, "\u6587\u7AE0");
    } catch (e) {
      $$invalidate(5, status = (_a2 = e.message) !== null && _a2 !== void 0 ? _a2 : String(e));
    }
    $$invalidate(6, busy = false);
  }
  async function extractArticle() {
    await extractFromText(articleText);
  }
  async function extractFromUrl() {
    var _a2;
    const url = articleUrl.trim();
    if (!url) {
      $$invalidate(5, status = "\u8BF7\u5148\u8F93\u5165\u6587\u7AE0\u94FE\u63A5");
      return;
    }
    $$invalidate(6, busy = true);
    $$invalidate(5, status = "\u6293\u53D6\u6587\u7AE0\u6B63\u6587\u2026");
    try {
      const text2 = await fetchArticleFromUrl(url);
      $$invalidate(8, articleText = text2);
      await extractFromText(text2);
    } catch (e) {
      $$invalidate(5, status = `\u6293\u53D6\u5931\u8D25\uFF1A${(_a2 = e.message) !== null && _a2 !== void 0 ? _a2 : String(e)}`);
      $$invalidate(6, busy = false);
    }
  }
  async function runImport() {
    const lines = importText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
    if (!lines.length) {
      $$invalidate(5, status = "\u6CA1\u6709\u53EF\u5BFC\u5165\u7684\u5185\u5BB9");
      return;
    }
    $$invalidate(6, busy = true);
    $$invalidate(5, status = `\u6B63\u5728\u5BFC\u5165 ${lines.length} \u4E2A\u8BCD\uFF08\u81EA\u52A8\u8865\u97F3\u6807/\u91CA\u4E49\uFF09\u2026`);
    $$invalidate(7, summary = "");
    try {
      let created = 0;
      let merged = 0;
      await runPool(lines, 6, async (line) => {
        const { word, translation, example, exampleZh } = parseImportLine(line);
        const r = await plugin.addWord(word, theme, {
          translation,
          examples: example ? [
            {
              text: example,
              translation: exampleZh,
              source: "\u5BFC\u5165"
            }
          ] : void 0
        });
        if (r === "created") created++;
        else if (r === "merged") merged++;
        $$invalidate(5, status = `\u6B63\u5728\u5BFC\u5165 ${created + merged}/${lines.length} \u4E2A\u8BCD\u2026`);
      });
      await plugin.store.touchNow();
      $$invalidate(7, summary = `\u5BFC\u5165\u5B8C\u6210\uFF1A\u65B0\u589E ${created}\uFF0C\u5408\u5E76 ${merged}\uFF0C\u8DF3\u8FC7 ${lines.length - created - merged}`);
      $$invalidate(5, status = "");
      $$invalidate(12, importText = "");
      $$invalidate(0, plugin.expandCache = void 0, plugin);
      plugin.refreshStatusBar();
      onDone();
    } catch (e) {
      $$invalidate(5, status = `\u5BFC\u5165\u51FA\u9519\uFF1A${e instanceof Error ? e.message : e}`);
    } finally {
      $$invalidate(6, busy = false);
    }
  }
  let seenAiWords = /* @__PURE__ */ new Set();
  async function expandLlm() {
    var _a2;
    if (!llmOn) {
      $$invalidate(5, status = "\u8BF7\u5148\u5728 \u8BBE\u7F6E \u2192 English Learn \u4E2D\u914D\u7F6E LLM API\uFF08\u5730\u5740/\u6A21\u578B\uFF1B\u4E91\u7AEF API \u53E6\u9700 Key\uFF0C\u672C\u5730 Ollama \u4E0D\u7528\uFF09");
      return;
    }
    const kws = kw();
    if (!kws.length) {
      $$invalidate(5, status = "\u8BF7\u5148\u586B\u5199\u5173\u952E\u8BCD");
      return;
    }
    saveKeywords(kws);
    $$invalidate(11, lastAction = "llm");
    $$invalidate(6, busy = true);
    $$invalidate(5, status = "AI \u751F\u6210\u5019\u9009\u8BCD\u2026\uFF08\u672C\u5730\u5C0F\u6A21\u578B\u53EF\u80FD\u9700\u8981\u51E0\u5341\u79D2\uFF09");
    $$invalidate(2, cands = []);
    $$invalidate(7, summary = "");
    try {
      const existing = plugin.words.allRaw().map((d) => d.word);
      const avoid = [.../* @__PURE__ */ new Set([...existing, ...seenAiWords])];
      const out = await llmExpandWords(plugin.llmCfg, kws, avoid, aiCount);
      const keys = out.map((w) => String(w.word).trim().toLowerCase());
      keys.forEach((k) => k && seenAiWords.add(k));
      const byWord = new Map(out.map((w, i) => [keys[i], w]));
      const fresh = filterNewByStem(keys.filter(Boolean), avoid);
      const list = fresh.map((word) => {
        var _a3;
        const w = byWord.get(word);
        return {
          word,
          translation: String((_a3 = w === null || w === void 0 ? void 0 : w.translation) !== null && _a3 !== void 0 ? _a3 : ""),
          sentence: (w === null || w === void 0 ? void 0 : w.sentence) ? String(w.sentence) : void 0,
          source: "AI",
          checked: false
        };
      });
      $$invalidate(2, cands = list);
      let picked = 0;
      cands.forEach((c) => {
        if (!isFrequent(c.word) && picked < 10) {
          c.checked = true;
          picked++;
        }
      });
      if (list.length) {
        $$invalidate(5, status = `\u5DF2\u751F\u6210 ${list.length} \u4E2A\u5019\u9009\uFF08NGSL \u9AD8\u9891\u57FA\u7840\u8BCD\u9ED8\u8BA4\u4E0D\u52FE\u9009\uFF09\uFF0C\u6B63\u5728\u914D\u4F8B\u53E5\u2026`);
        try {
          const m = await llmExamples(plugin.llmCfg, list.map((c) => c.word), plugin.topicOf(theme) || void 0, 3);
          const n = applyExamples(list, m);
          $$invalidate(2, cands);
          $$invalidate(5, status = `AI \u751F\u6210 ${list.length} \u4E2A\u5019\u9009\u3001${n} \u6761\u4F8B\u53E5\uFF08\u53EF\u518D\u70B9\u4E00\u6B21\u300CAI \u6269\u8BCD\u300D\u7EE7\u7EED\u8865\u5145\uFF09`);
        } catch (_b2) {
          $$invalidate(5, status = `AI \u751F\u6210 ${list.length} \u4E2A\u5019\u9009\uFF08\u4F8B\u53E5\u751F\u6210\u5931\u8D25\uFF0C\u5165\u5E93\u540E\u53EF\u7528\u547D\u4EE4\u300C\u4E3A\u7F3A\u4F8B\u53E5\u7684\u8BCD\u751F\u6210\u4F8B\u53E5\u300D\u8865\uFF09`);
        }
      } else {
        $$invalidate(5, status = "\u6CA1\u6709\u751F\u6210\u65B0\u7684\u5019\u9009\uFF08\u90FD\u4E0E\u8BCD\u5E93\u91CD\u590D\uFF09\uFF0C\u53EF\u518D\u70B9\u4E00\u6B21\u8BD5\u8BD5");
      }
    } catch (e) {
      const msg = (_a2 = e.message) !== null && _a2 !== void 0 ? _a2 : String(e);
      $$invalidate(5, status = /timed? ?out|timeout|30/i.test(msg) ? "AI \u6269\u8BCD\u5931\u8D25\uFF1A\u8BF7\u6C42\u8D85\u65F6\uFF08\u672C\u5730\u6A21\u578B\u592A\u6162\uFF09\u3002\u5EFA\u8BAE\u6362\u66F4\u5927\u7684\u6A21\u578B\uFF0C\u6216\u51CF\u5C11\u5173\u952E\u8BCD\u540E\u518D\u8BD5" : "AI \u6269\u8BCD\u5931\u8D25\uFF1A" + msg);
    }
    $$invalidate(6, busy = false);
  }
  async function expandRelated() {
    var _a2;
    const kws = kw();
    if (!kws.length) {
      $$invalidate(5, status = "\u8BF7\u5148\u586B\u5199\u5173\u952E\u8BCD");
      return;
    }
    saveKeywords(kws);
    $$invalidate(11, lastAction = "related");
    $$invalidate(6, busy = true);
    $$invalidate(5, status = "\u83B7\u53D6\u76F8\u5173\u8BCD\u2026");
    $$invalidate(2, cands = []);
    $$invalidate(7, summary = "");
    const zhKws = kws.filter(isZh);
    const seeds = [...kws.filter((k) => !isZh(k))];
    try {
      for (const k of zhKws) {
        const before = seeds.length;
        if (llmOn) {
          $$invalidate(5, status = `\u4E2D\u6587\u5173\u952E\u8BCD\u8F6C\u82F1\u6587\u79CD\u5B50\u8BCD\u2026\uFF08${k}\uFF09`);
          try {
            seeds.push(...await llmTranslateSeeds(plugin.llmCfg, k));
          } catch (_b2) {
          }
        }
        if (seeds.length === before) {
          $$invalidate(5, status = `\u8BCD\u5178\u53CD\u67E5\u300C${k}\u300D\u7684\u82F1\u6587\u8BCD\u2026`);
          seeds.push(...await plugin.dict.reverseLookup(k, 3));
        }
      }
      const uniqueSeeds = [...new Set(seeds)].slice(0, 6);
      if (!uniqueSeeds.length) {
        throw new Error("\u65E0\u6CD5\u5F97\u5230\u82F1\u6587\u79CD\u5B50\u8BCD\uFF1A\u8BF7\u914D\u7F6E LLM\uFF0C\u6216\u6539\u7528\u82F1\u6587\u5173\u952E\u8BCD");
      }
      $$invalidate(5, status = `\u83B7\u53D6\u76F8\u5173\u8BCD\u2026\uFF08Datamuse\uFF1A${uniqueSeeds.join("\u3001")}\uFF09`);
      const words = [
        ...new Set((await settleValues(uniqueSeeds.map((k) => fetchRelatedWords(k, 20)))).flat())
      ];
      if (!words.length) {
        throw new Error("Datamuse \u4E0D\u53EF\u8FBE\u6216\u65E0\u7ED3\u679C\uFF0C\u5EFA\u8BAE\u6539\u7528\u300CAI \u6269\u8BCD\u300D");
      }
      const raw = filterNewByStem(words, plugin.words.allRaw().map((d) => d.word)).map((w) => ({ word: w, freq: 1, coverage: 1, score: 0 }));
      await enrichAndShow(raw, "Datamuse");
    } catch (e) {
      $$invalidate(5, status = (_a2 = e.message) !== null && _a2 !== void 0 ? _a2 : String(e));
    }
    $$invalidate(6, busy = false);
  }
  async function addChecked() {
    const sel = cands.filter((c) => c.checked);
    if (!sel.length) {
      $$invalidate(5, status = "\u8BF7\u5148\u52FE\u9009\u8981\u52A0\u5165\u7684\u8BCD");
      return;
    }
    $$invalidate(6, busy = true);
    $$invalidate(5, status = `\u6B63\u5728\u52A0\u5165 0/${sel.length} \u4E2A\u8BCD\u2026`);
    try {
      let created = 0;
      let merged = 0;
      let done = 0;
      const createdWords = [];
      await runPool(sel, 6, async (c) => {
        var _a2;
        const examples = ((_a2 = c.exs) === null || _a2 === void 0 ? void 0 : _a2.length) ? c.exs.map((e) => ({
          text: e.text,
          translation: e.zh,
          source: c.source
        })) : c.sentence ? [
          {
            text: c.sentence,
            translation: c.sentenceZh,
            source: c.source
          }
        ] : void 0;
        const r = await plugin.addWord(c.word, theme, {
          translation: c.translation,
          examples,
          skipOnline: true
        });
        if (r === "created") {
          created++;
          createdWords.push(c.word);
        } else if (r === "merged") merged++;
        done++;
        $$invalidate(5, status = `\u6B63\u5728\u52A0\u5165 ${done}/${sel.length} \u4E2A\u8BCD\u2026`);
      });
      await plugin.store.touchNow();
      const added = new Set(sel.map((c) => c.word));
      $$invalidate(2, cands = cands.filter((c) => !added.has(c.word)));
      if (created + merged === 0) {
        $$invalidate(5, status = "\u6CA1\u6709\u8BCD\u6210\u529F\u52A0\u5165\uFF08\u8BCD\u5178\u4E0B\u8F7D\u5931\u8D25\u6216\u7F51\u7EDC\u95EE\u9898\uFF09\uFF0C\u8BF7\u91CD\u8BD5");
      } else {
        plugin.enrichWordsInBackground(createdWords);
        $$invalidate(7, summary = `\u5DF2\u52A0\u5165\uFF1A\u65B0\u589E ${created}\uFF0C\u5408\u5E76 ${merged}${createdWords.length ? "\uFF08\u4F8B\u53E5/\u4E49\u9879/\u97F3\u6807/\u540C\u53CD\u4E49\u6B63\u5728\u540E\u53F0\u8865\u5168\uFF09" : ""}`);
        $$invalidate(5, status = "");
      }
      plugin.refreshStatusBar();
      onDone();
    } finally {
      $$invalidate(6, busy = false);
    }
  }
  function learnTheme() {
    onClose();
    void plugin.startSession(theme);
  }
  function toggleAll(v) {
    cands.forEach((c) => c.checked = v);
    $$invalidate(2, cands);
  }
  function runActive() {
    if (lastAction === "llm") void expandLlm();
    else if (lastAction === "wiki") void expandWiki();
    else if (lastAction === "related") void expandRelated();
  }
  function switchTab(a) {
    if (lastAction === a) return;
    $$invalidate(11, lastAction = a);
    $$invalidate(2, cands = []);
    $$invalidate(5, status = "");
    $$invalidate(7, summary = "");
  }
  function openSettings() {
    plugin.openSettings();
  }
  const click_handler = () => switchTab("llm");
  const click_handler_1 = () => switchTab("wiki");
  const click_handler_2 = () => switchTab("related");
  const click_handler_3 = () => switchTab("article");
  const click_handler_4 = () => switchTab("import");
  function input_input_handler() {
    keywordsText = this.value;
    $$invalidate(4, keywordsText);
  }
  const keydown_handler = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      runActive();
    }
  };
  function select_change_handler() {
    aiCount = select_value(this);
    $$invalidate(10, aiCount);
  }
  const change_handler = () => {
    $$invalidate(0, plugin.db.settings.expandCount = aiCount, plugin);
    plugin.store.touch();
  };
  function input_input_handler_1() {
    articleUrl = this.value;
    $$invalidate(9, articleUrl);
  }
  const keydown_handler_1 = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      extractFromUrl();
    }
  };
  function textarea_input_handler() {
    articleText = this.value;
    $$invalidate(8, articleText);
  }
  function textarea_input_handler_1() {
    importText = this.value;
    $$invalidate(12, importText);
  }
  const click_handler_5 = () => toggleAll(true);
  const click_handler_6 = () => toggleAll(false);
  function input_change_handler(each_value, c_index) {
    each_value[c_index].checked = this.checked;
    $$invalidate(2, cands);
  }
  const click_handler_7 = (c) => plugin.speakWord(c.word);
  $$self.$$set = ($$props2) => {
    if ("plugin" in $$props2) $$invalidate(0, plugin = $$props2.plugin);
    if ("theme" in $$props2) $$invalidate(1, theme = $$props2.theme);
    if ("onDone" in $$props2) $$invalidate(27, onDone = $$props2.onDone);
    if ("onClose" in $$props2) $$invalidate(28, onClose = $$props2.onClose);
    if ("initialTab" in $$props2) $$invalidate(29, initialTab = $$props2.initialTab);
    if ("autoRun" in $$props2) $$invalidate(30, autoRun = $$props2.autoRun);
  };
  $$self.$$.update = () => {
    if ($$self.$$.dirty[0] & /*cands*/
    4) {
      $: $$invalidate(14, checkedCount = cands.filter((c) => c.checked).length);
    }
    if ($$self.$$.dirty[0] & /*cands, theme*/
    6) {
      $: if (cands.length) $$invalidate(0, plugin.expandCache = { theme, cands }, plugin);
    }
    if ($$self.$$.dirty[0] & /*plugin*/
    1) {
      $: $$invalidate(3, llmOn = llmReady(plugin.llmCfg));
    }
    if ($$self.$$.dirty[0] & /*llmOn*/
    8) {
      $: $$invalidate(13, pageTip = llmOn ? "AI \u751F\u6210\uFF08\u91CA\u4E49 + \u4F8B\u53E5\uFF09\u3001\u8054\u7F51\u6293\u53D6\u3001\u76F8\u5173\u8BCD\u6309\u5173\u952E\u8BCD\u6269\u8BCD\uFF1B\u300C\u6587\u7AE0\u63D0\u53D6\u300D\u76F4\u63A5\u8F93\u5165\u94FE\u63A5\u6216\u7C98\u8D34\u6B63\u6587\uFF0C\u300C\u5BFC\u5165\u8BCD\u8868\u300D\u7C98\u8D34\u6279\u91CF\u8BCD\u8868\u3002\u52FE\u9009\u540E\u52A0\u5165\u4E3B\u9898" : "AI \u6269\u8BCD\u9700\u5148\u5728\u300CAI \u6269\u8BCD\u300D\u9875\u7B7E\u70B9\u300C\u914D\u7F6E LLM\u300D\uFF1B\u300C\u8054\u7F51\u6293\u53D6\u300D\u4ECE\u8BBA\u6587\u6458\u8981\uFF08OpenAlex\uFF09\u6216 Wikipedia \u63D0\u53D6\u9AD8\u9891\u4E3B\u9898\u8BCD\uFF1B\u300C\u6587\u7AE0\u63D0\u53D6\u300D\u53EF\u8F93\u5165\u94FE\u63A5\u6293\u6B63\u6587\u6216\u76F4\u63A5\u7C98\u8D34\u63D0\u53D6\u751F\u8BCD\uFF1B\u300C\u5BFC\u5165\u8BCD\u8868\u300D\u53EF\u7C98\u8D34\u8BCD\u8868\u6279\u91CF\u52A0\u5165");
    }
  };
  return [
    plugin,
    theme,
    cands,
    llmOn,
    keywordsText,
    status,
    busy,
    summary,
    articleText,
    articleUrl,
    aiCount,
    lastAction,
    importText,
    pageTip,
    checkedCount,
    expandWiki,
    extractArticle,
    extractFromUrl,
    runImport,
    expandLlm,
    expandRelated,
    addChecked,
    learnTheme,
    toggleAll,
    runActive,
    switchTab,
    openSettings,
    onDone,
    onClose,
    initialTab,
    autoRun,
    click_handler,
    click_handler_1,
    click_handler_2,
    click_handler_3,
    click_handler_4,
    input_input_handler,
    keydown_handler,
    select_change_handler,
    change_handler,
    input_input_handler_1,
    keydown_handler_1,
    textarea_input_handler,
    textarea_input_handler_1,
    click_handler_5,
    click_handler_6,
    input_change_handler,
    click_handler_7
  ];
}
var ExpandPanel = class extends SvelteComponent {
  constructor(options) {
    super();
    init(
      this,
      options,
      instance2,
      create_fragment2,
      safe_not_equal,
      {
        plugin: 0,
        theme: 1,
        onDone: 27,
        onClose: 28,
        initialTab: 29,
        autoRun: 30
      },
      null,
      [-1, -1]
    );
  }
};
var ExpandPanel_default = ExpandPanel;

// src/modals.ts
var ConfirmModal = class extends import_obsidian9.Modal {
  // 只有点了确认按钮才置位；Esc/点外部关闭视为取消
  constructor(app, message, okText, onResult) {
    super(app);
    this.message = message;
    this.okText = okText;
    this.onResult = onResult;
    this.ok = false;
  }
  onOpen() {
    this.contentEl.createEl("p", { text: this.message, cls: "el-confirm-msg" });
    const row = this.contentEl.createDiv("el-confirm-btns");
    new import_obsidian9.ButtonComponent(row).setButtonText("\u53D6\u6D88").onClick(() => this.close());
    new import_obsidian9.ButtonComponent(row).setButtonText(this.okText).setCta().onClick(() => {
      this.ok = true;
      this.close();
    });
  }
  onClose() {
    this.onResult(this.ok);
    this.contentEl.empty();
  }
};
function confirmOk(app, message, okText = "\u786E\u5B9A") {
  return new Promise((resolve) => new ConfirmModal(app, message, okText, resolve).open());
}
function confirmDeleteWord(app, word) {
  return confirmOk(app, `\u5220\u9664\u8BCD\u6761\u300C${word}\u300D\uFF1F
\u8BCD\u7B14\u8BB0\u4F1A\u79FB\u5165 Obsidian \u56DE\u6536\u7AD9\uFF08.trash\uFF09\uFF0C\u5B66\u4E60\u8FDB\u5EA6\u4E00\u5E76\u6E05\u9664\u3002`, "\u5220\u9664");
}
var SessionSwitchModal = class extends import_obsidian9.Modal {
  constructor(app, label, onPick) {
    super(app);
    this.label = label;
    this.onPick = onPick;
  }
  onOpen() {
    this.titleEl.setText("\u6709\u8FDB\u884C\u4E2D\u7684\u5B66\u4E60\u4F1A\u8BDD");
    this.contentEl.createEl("p", {
      text: `\u300C${this.label}\u300D\u7684\u961F\u5217\u8FD8\u5728\u8FDB\u884C\u4E2D\uFF08\u5DF2\u8BC4\u5206\u7684\u8FDB\u5EA6\u5DF2\u4FDD\u5B58\uFF09\u3002`,
      cls: "el-confirm-msg"
    });
    const row = this.contentEl.createDiv("el-confirm-btns");
    new import_obsidian9.ButtonComponent(row).setButtonText("\u53D6\u6D88").onClick(() => this.close());
    new import_obsidian9.ButtonComponent(row).setButtonText("\u653E\u5F03\u5E76\u91CD\u5F00").setWarning().onClick(() => {
      this.picked = false;
      this.close();
    });
    new import_obsidian9.ButtonComponent(row).setButtonText(`\u56DE\u5230\u300C${this.label}\u300D`).setCta().onClick(() => {
      this.picked = true;
      this.close();
    });
  }
  onClose() {
    this.onPick(this.picked);
    this.contentEl.empty();
  }
};
function askActiveSession(app, theme, hard) {
  return new Promise((resolve) => new SessionSwitchModal(app, sessionLabel(theme, hard), resolve).open());
}
var CreateThemeModal = class extends import_obsidian9.Modal {
  constructor(app, plugin, onDone, ctaLabel = "\u5BFC\u5165\u4E3B\u9898\u8BCD\u6C47") {
    super(app);
    this.plugin = plugin;
    this.onDone = onDone;
    this.ctaLabel = ctaLabel;
  }
  onOpen() {
    const { contentEl } = this;
    this.modalEl.addClass("el-create-theme-modal");
    contentEl.createEl("h3", { text: "\u65B0\u5EFA\u4E3B\u9898" });
    let name = "";
    let keywords = "";
    const disabledThemes = () => Object.values(this.plugin.db.themes).filter((t) => t.enabled === false);
    const hasDisabled = disabledThemes().length > 0;
    let tabBar;
    let tabCreate;
    let tabRestore;
    let pageRestore;
    if (hasDisabled) {
      tabBar = contentEl.createDiv("el-expand-tabs");
      tabCreate = tabBar.createEl("button", { text: "\u65B0\u5EFA\u4E3B\u9898", cls: "el-tab is-active" });
      tabRestore = tabBar.createEl("button", { text: "\u542F\u7528\u9690\u85CF\u4E3B\u9898", cls: "el-tab" });
    }
    const pageCreate = contentEl.createDiv();
    new import_obsidian9.Setting(pageCreate).setName("\u4E3B\u9898\u540D\u79F0").setDesc("\u5982\uFF1A\u79D1\u6280\u3001\u5546\u52A1\u3001\u5B66\u672F\u5199\u4F5C").addText((t) => t.onChange((v) => name = v.trim()));
    new import_obsidian9.Setting(pageCreate).setName("\u5173\u952E\u8BCD").setDesc("\u591A\u4E2A\u5173\u952E\u8BCD\uFF0C\u7528\u9017\u53F7\u6216\u7A7A\u683C\u5206\u9694\uFF1B\u521B\u5EFA\u540E\u5C06\u6309\u5173\u952E\u8BCD\u81EA\u52A8\u6269\u8BCD").addText((t) => t.onChange((v) => keywords = v));
    new import_obsidian9.Setting(pageCreate).addButton((b) => {
      b.setButtonText(this.ctaLabel).setCta();
      if (this.ctaLabel === "\u5BFC\u5165\u4E3B\u9898\u8BCD\u6C47") b.setTooltip("\u521B\u5EFA\u540E\u5C06\u8FDB\u5165\u6269\u8BCD\u9875");
      b.onClick(() => {
        if (!name) {
          new import_obsidian9.Notice("\u8BF7\u8F93\u5165\u4E3B\u9898\u540D\u79F0");
          return;
        }
        if (this.plugin.db.themes[name]) {
          new import_obsidian9.Notice("\u4E3B\u9898\u5DF2\u5B58\u5728");
          return;
        }
        this.plugin.db.themes[name] = {
          name,
          keywords: parseKeywords(keywords),
          created: Date.now()
        };
        this.plugin.store.touch();
        this.close();
        this.onDone(name);
      });
    });
    if (hasDisabled) {
      pageRestore = contentEl.createDiv();
      const box = pageRestore.createDiv("el-disabled-list");
      box.createEl("div", { text: "\u5DF2\u505C\u7528\u4E3B\u9898\uFF08\u9762\u677F\u5DF2\u9690\u85CF\uFF0C\u70B9\u51FB\u542F\u7528\u6062\u590D\uFF09", cls: "el-muted" });
      for (const t of disabledThemes()) {
        const row = box.createDiv("el-disabled-row");
        row.createSpan({ text: t.name });
        row.createEl("button", { text: "\u542F\u7528", cls: "el-btn-restore" }).addEventListener("click", () => {
          delete t.enabled;
          this.plugin.store.touch();
          new import_obsidian9.Notice(`\u5DF2\u542F\u7528\u300C${t.name}\u300D`);
          this.close();
          this.onDone(void 0);
          void this.plugin.refreshStatusBar();
        });
      }
    }
    const showCreatePage = () => {
      pageCreate.style.display = "";
      if (pageRestore) pageRestore.style.display = "none";
      tabCreate == null ? void 0 : tabCreate.classList.add("is-active");
      tabRestore == null ? void 0 : tabRestore.classList.remove("is-active");
    };
    const showRestorePage = () => {
      pageCreate.style.display = "none";
      if (pageRestore) pageRestore.style.display = "";
      tabCreate == null ? void 0 : tabCreate.classList.remove("is-active");
      tabRestore == null ? void 0 : tabRestore.classList.add("is-active");
    };
    tabCreate == null ? void 0 : tabCreate.addEventListener("click", showCreatePage);
    tabRestore == null ? void 0 : tabRestore.addEventListener("click", showRestorePage);
    if (pageRestore) showCreatePage();
  }
  onClose() {
    this.contentEl.empty();
  }
};
var EditThemeModal = class extends import_obsidian9.Modal {
  constructor(app, plugin, theme, onDone) {
    super(app);
    this.plugin = plugin;
    this.theme = theme;
    this.onDone = onDone;
  }
  onOpen() {
    var _a, _b;
    const { contentEl } = this;
    contentEl.createEl("h3", { text: `\u7F16\u8F91\u4E3B\u9898 \u2014 ${this.theme}` });
    let name = this.theme;
    let keywords = ((_b = (_a = this.plugin.db.themes[this.theme]) == null ? void 0 : _a.keywords) != null ? _b : []).join(", ");
    let mergeTarget = "";
    new import_obsidian9.Setting(contentEl).setName("\u4E3B\u9898\u540D\u79F0").addText((t) => {
      t.setValue(name).onChange((v) => name = v.trim());
    });
    new import_obsidian9.Setting(contentEl).setName("\u5173\u952E\u8BCD").setDesc("\u591A\u4E2A\u5173\u952E\u8BCD\uFF0C\u7528\u9017\u53F7\u6216\u7A7A\u683C\u5206\u9694\uFF1B\u6269\u8BCD\u65F6\u7528\u4F5C\u9ED8\u8BA4\u5173\u952E\u8BCD").addText((t) => t.setValue(keywords).onChange((v) => keywords = v));
    new import_obsidian9.Setting(contentEl).addButton(
      (b) => b.setButtonText("\u4FDD\u5B58").setCta().onClick(async () => {
        const err = await this.plugin.editTheme(
          this.theme,
          name,
          parseKeywords(keywords)
        );
        if (err) {
          new import_obsidian9.Notice(err);
          return;
        }
        new import_obsidian9.Notice(name !== this.theme ? `\u5DF2\u6539\u540D\uFF1A${this.theme} \u2192 ${name}` : "\u5DF2\u4FDD\u5B58");
        this.close();
        this.onDone();
      })
    );
    new import_obsidian9.Setting(contentEl).setName("\u5220\u9664\u4E3B\u9898").setDesc("\u8BCD\u7B14\u8BB0\u6587\u4EF6\u4F1A\u4FDD\u7559\uFF0C\u4EC5\u89E3\u9664\u5173\u8054").addButton(
      (b) => b.setButtonText("\u5220\u9664").setWarning().onClick(async () => {
        if (!await confirmOk(this.app, `\u5220\u9664\u4E3B\u9898\u300C${this.theme}\u300D\uFF1F
\u8BCD\u7B14\u8BB0\u6587\u4EF6\u4F1A\u4FDD\u7559\uFF0C\u4EC5\u89E3\u9664\u5173\u8054\u3002`, "\u5220\u9664"))
          return;
        await this.plugin.deleteTheme(this.theme);
        new import_obsidian9.Notice(`\u5DF2\u5220\u9664\u4E3B\u9898\u300C${this.theme}\u300D`);
        this.close();
        this.onDone();
      })
    );
    new import_obsidian9.Setting(contentEl).setName("\u5408\u5E76\u5230\u5176\u4ED6\u4E3B\u9898").setDesc(`\u628A\u300C${this.theme}\u300D\u7684\u5168\u90E8\u8BCD\u5E76\u5165\u76EE\u6807\u4E3B\u9898\u540E\u5220\u9664\u672C\u4E3B\u9898\uFF08\u5B66\u4E60\u8FDB\u5EA6\u4FDD\u7559\uFF09`).addDropdown((d) => {
      d.addOption("", "\u9009\u62E9\u76EE\u6807\u4E3B\u9898\u2026");
      for (const n of Object.keys(this.plugin.db.themes)) {
        if (n !== this.theme) d.addOption(n, n);
      }
      d.onChange((v) => mergeTarget = v);
    }).addButton(
      (b) => b.setButtonText("\u5408\u5E76").setWarning().onClick(async () => {
        if (!mergeTarget) {
          new import_obsidian9.Notice("\u5148\u9009\u62E9\u76EE\u6807\u4E3B\u9898");
          return;
        }
        if (!await confirmOk(this.app, `\u628A\u300C${this.theme}\u300D\u7684\u8BCD\u5168\u90E8\u5E76\u5165\u300C${mergeTarget}\u300D\uFF1F
\u5B66\u4E60\u8FDB\u5EA6\u4FDD\u7559\uFF0C\u672C\u4E3B\u9898\u5C06\u5220\u9664\u3002`, "\u5408\u5E76"))
          return;
        const n = await this.plugin.mergeTheme(this.theme, mergeTarget);
        new import_obsidian9.Notice(`\u5DF2\u5408\u5E76\uFF1A${n} \u4E2A\u8BCD\u79FB\u5165\u300C${mergeTarget}\u300D`);
        this.close();
        this.onDone();
      })
    );
  }
  onClose() {
    this.contentEl.empty();
  }
};
var AddWordModal = class _AddWordModal extends import_obsidian9.Modal {
  // 「加入」按钮：查询完成后聚焦，纯键盘收词
  constructor(app, plugin, presetWord, onDone, defaultTheme) {
    super(app);
    this.plugin = plugin;
    this.presetWord = presetWord;
    this.onDone = onDone;
    this.defaultTheme = defaultTheme;
    this.word = "";
    this.example = "";
    // AI 生成的例句（加入时写入词笔记）
    this.exampleZh = "";
    // 例句中文翻译
    this.phraseZh = "";
    // 短语的 AI 翻译（词典查不到短语，查询时兜底）
    this.queryBusy = false;
    this.addBtn = null;
    this.word = presetWord != null ? presetWord : "";
  }
  onOpen() {
    const { contentEl } = this;
    const names = Object.keys(this.plugin.db.themes);
    if (!names.length) {
      contentEl.createEl("p", { text: "\u8FD8\u6CA1\u6709\u4E3B\u9898\uFF0C\u5148\u521B\u5EFA\u4E00\u4E2A\uFF1A" });
      contentEl.createEl("button", { text: "\u65B0\u5EFA\u4E3B\u9898", cls: "mod-cta" }).onClickEvent(() => {
        this.close();
        new CreateThemeModal(
          this.app,
          this.plugin,
          (created) => {
            var _a;
            (_a = this.onDone) == null ? void 0 : _a.call(this);
            new _AddWordModal(this.app, this.plugin, this.presetWord, this.onDone, created).open();
          },
          "\u521B\u5EFA\u4E3B\u9898"
          // 收词场景：按钮语义是建主题回收词，不进扩词
        ).open();
      });
      return;
    }
    contentEl.createEl("h3", { text: "\u6536\u5F55\u5355\u8BCD" });
    let theme = this.defaultTheme && names.includes(this.defaultTheme) ? this.defaultTheme : this.plugin.lastAddTheme && names.includes(this.plugin.lastAddTheme) ? this.plugin.lastAddTheme : names[0];
    new import_obsidian9.Setting(contentEl).setName("\u52A0\u5165\u4E3B\u9898").addDropdown((d) => {
      d.addOptions(Object.fromEntries(names.map((n) => [n, n])));
      d.setValue(theme);
      d.onChange((v) => theme = v);
    });
    new import_obsidian9.Setting(contentEl).setName("\u5355\u8BCD").addText((t) => {
      t.setValue(this.word);
      t.inputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          void this.query();
        }
      });
      t.onChange((v) => {
        this.word = v.trim();
        this.phraseZh = "";
        if (this.example || this.exampleZh) {
          this.example = "";
          this.exampleZh = "";
        }
      });
    });
    new import_obsidian9.Setting(contentEl).addButton(
      (b) => b.setButtonText("\u67E5\u8BE2").onClick(() => this.query())
    ).addButton((b) => {
      b.setButtonText("\u{1F50A} \u53D1\u97F3").onClick(() => {
        if (!this.word) return;
        this.plugin.speakWord(this.word);
        window.setTimeout(() => void this.plugin.audio.badge(b.buttonEl, this.word, " \u53D1\u97F3"), 1200);
      });
      void this.plugin.audio.badge(b.buttonEl, this.word, " \u53D1\u97F3");
      return b;
    }).addButton(
      (b) => b.setButtonText("AI \u4F8B\u53E5").onClick(() => this.genExample(b))
    );
    this.previewEl = contentEl.createDiv({ cls: "el-preview" });
    this.previewEl.style.cssText = "min-height:40px;margin:8px 0;padding:8px 12px;border-radius:8px;background:var(--background-secondary);font-size:13px;color:var(--text-muted);white-space:pre-wrap;";
    new import_obsidian9.Setting(contentEl).addButton((b) => {
      this.addBtn = b;
      return b.setButtonText("\u52A0\u5165").setCta().onClick(async () => {
        var _a;
        if (!this.word) return;
        if (this.word.split(/\s+/).length > 5) {
          new import_obsidian9.Notice("\u8D85\u8FC7 5 \u4E2A\u8BCD\uFF0C\u7591\u4F3C\u6574\u53E5\u800C\u975E\u77ED\u8BED\uFF0C\u4E0D\u6536\u5F55");
          return;
        }
        let r;
        try {
          r = await this.plugin.addWord(
            this.word,
            theme,
            {
              // 短语词典查不到，把查询时 AI 翻译的结果带上
              translation: isPhrase(this.word) ? this.phraseZh || void 0 : void 0,
              examples: this.example ? [{ text: this.example, translation: this.exampleZh || void 0, source: "AI" }] : void 0
            }
          );
        } catch (e) {
          new import_obsidian9.Notice(`\u6536\u5F55\u5931\u8D25\uFF1A${e instanceof Error ? e.message : e}`);
          return;
        }
        if (r === "skipped") {
          new import_obsidian9.Notice("\u65E0\u6548\u5355\u8BCD");
          return;
        }
        this.plugin.lastAddTheme = theme;
        const doc = this.plugin.words.get(this.word);
        void this.plugin.audio.prefetch(this.word);
        this.plugin.refreshStatusBar();
        (_a = this.onDone) == null ? void 0 : _a.call(this);
        this.showDone(theme, r === "created", doc == null ? void 0 : doc.phonetic);
      });
    });
    if (this.word) this.query();
  }
  /** 收录成功页：给出「现在学」入口，打通收词 → 学习闭环 */
  showDone(theme, created, phonetic) {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: created ? "\u2713 \u5DF2\u6536\u5F55" : "\u2713 \u5DF2\u5728\u8BCD\u5E93\uFF0C\u5DF2\u5408\u5E76\u4E3B\u9898" });
    const line = contentEl.createDiv({ cls: "el-muted" });
    line.style.margin = "4px 0 16px";
    line.setText(`${this.word}${phonetic ? "  " + phonetic : ""} \u2192 ${theme}`);
    const row = contentEl.createDiv();
    row.style.cssText = "display:flex;gap:8px;";
    const ttsBtn = row.createEl("button", { text: "\u{1F50A}" });
    void this.plugin.audio.badge(ttsBtn, this.word);
    ttsBtn.onClickEvent(() => {
      this.plugin.speakWord(this.word);
      window.setTimeout(() => void this.plugin.audio.badge(ttsBtn, this.word), 1200);
    });
    const learnBtn = row.createEl("button", {
      text: `\u73B0\u5728\u5B66\u300C${theme}\u300D`,
      cls: "mod-cta"
    });
    learnBtn.onClickEvent(() => {
      this.close();
      void this.plugin.startSession(theme);
    });
    learnBtn.focus();
    row.createEl("button", { text: "\u5173\u95ED" }).onClickEvent(() => this.close());
    row.createEl("button", { text: "\u518D\u6536\u4E00\u4E2A" }).onClickEvent(() => {
      this.close();
      new _AddWordModal(this.app, this.plugin, void 0, this.onDone, theme).open();
    });
  }
  async query() {
    if (this.queryBusy) return;
    const word = this.word.trim().toLowerCase();
    if (!word) return;
    this.queryBusy = true;
    try {
      await this.renderPreview(word);
    } catch (e) {
      this.previewEl.setText(`\u67E5\u8BE2\u5931\u8D25\uFF1A${e instanceof Error ? e.message : e}`);
    } finally {
      this.queryBusy = false;
    }
  }
  async renderPreview(word) {
    if (word.split(/\s+/).length > 5) {
      this.previewEl.setText("\u8D85\u8FC7 5 \u4E2A\u8BCD\uFF0C\u7591\u4F3C\u6574\u53E5\u800C\u975E\u77ED\u8BED\uFF0C\u4E0D\u6536\u5F55");
      return;
    }
    this.previewEl.setText("\u67E5\u8BE2\u4E2D\u2026");
    const lines = [];
    if (isPhrase(word)) {
      lines.push("\u{1F4CC} \u77ED\u8BED\uFF08\u65E0\u97F3\u6807\uFF0C\u91CA\u4E49\u8D70 AI \u7FFB\u8BD1\uFF09");
      if (!this.phraseZh) {
        const cfg = this.plugin.llmCfg;
        if (llmReady(cfg)) {
          try {
            const [zh] = await llmTranslateSentences(cfg, [word]);
            if (zh) this.phraseZh = zh;
          } catch (e) {
          }
        }
      }
      lines.push(this.phraseZh || "\uFF08AI \u7FFB\u8BD1\u4E0D\u53EF\u7528\uFF0C\u52A0\u5165\u540E\u91CA\u4E49\u5F85\u8865\uFF09");
    } else {
      const entry = await this.plugin.dict.lookup(word);
      if (entry == null ? void 0 : entry.phonetic) lines.push(entry.phonetic);
      if (entry == null ? void 0 : entry.translation) lines.push(entry.translation.replace(/；/g, "\n"));
      const lv = levelFromTag(entry == null ? void 0 : entry.tag);
      if (lv) lines.push(`\u{1F3F7} ${levelLabel(lv)}`);
      if (lines.length) return this.flushPreview(lines);
      this.previewEl.setText("\u672C\u5730\u8BCD\u5178\u672A\u6536\u5F55\uFF0C\u8054\u7F51\u67E5\u8BE2\u4E2D\u2026");
      const on = await lookupOnline(word);
      if (on == null ? void 0 : on.phonetic) lines.push(on.phonetic);
      if (on == null ? void 0 : on.definition) lines.push(`[\u82F1] ${on.definition}`);
      if (!lines.length) lines.push("\uFF08\u8BCD\u5178\u672A\u547D\u4E2D\uFF0C\u52A0\u5165\u540E\u53EF\u7528\u300C\u8865\u5168\u7F3A\u5931\u91CA\u4E49\u300D\u91CD\u8BD5\uFF09");
    }
    this.flushPreview(lines);
  }
  /** 预览落盘：带上 AI 例句一次性渲染，并把焦点交给「加入」（Enter 二段式第二段：再按 Enter 即收录） */
  flushPreview(lines) {
    var _a;
    if (this.example) lines.push(`
\u{1F4DD} ${this.example}${this.exampleZh ? `
${this.exampleZh}` : ""}`);
    this.previewEl.setText(lines.join("\n"));
    (_a = this.addBtn) == null ? void 0 : _a.buttonEl.focus();
  }
  /** AI 生成一句例句：收词时即有例句，免去事后补全 */
  async genExample(b) {
    var _a, _b;
    const word = this.word.trim().toLowerCase();
    if (!word) {
      new import_obsidian9.Notice("\u8BF7\u5148\u586B\u5199\u5355\u8BCD");
      return;
    }
    const cfg = this.plugin.llmCfg;
    if (!llmReady(cfg)) {
      new import_obsidian9.Notice("\u8BF7\u5148\u5728 \u8BBE\u7F6E \u2192 English Learn \u914D\u7F6E LLM API");
      return;
    }
    b.setDisabled(true).setButtonText("\u751F\u6210\u4E2D\u2026");
    try {
      const m = await llmExamples(cfg, [word], void 0, 1);
      if (word !== this.word.trim().toLowerCase()) return;
      const ex = (_a = m.get(word)) == null ? void 0 : _a[0];
      if (ex) {
        this.example = ex.text;
        this.exampleZh = (_b = ex.zh) != null ? _b : "";
        void this.query();
      } else {
        new import_obsidian9.Notice("\u6CA1\u6709\u751F\u6210\u51FA\u4F8B\u53E5\uFF0C\u53EF\u91CD\u8BD5");
      }
    } catch (e) {
      new import_obsidian9.Notice("\u4F8B\u53E5\u751F\u6210\u5931\u8D25\uFF1A" + (e instanceof Error ? e.message : e));
    } finally {
      b.setDisabled(false).setButtonText("AI \u4F8B\u53E5");
    }
  }
  onClose() {
    this.contentEl.empty();
  }
};
var ExpandModal = class extends import_obsidian9.Modal {
  constructor(app, plugin, theme, onDone, initialTab = "llm", autoRun = false) {
    super(app);
    this.plugin = plugin;
    this.theme = theme;
    this.onDone = onDone;
    this.initialTab = initialTab;
    this.autoRun = autoRun;
  }
  onOpen() {
    this.titleEl.setText(`\u6269\u8BCD \u2014 ${this.theme}`);
    this.modalEl.addClass("el-expand-modal");
    this.comp = new ExpandPanel_default({
      target: this.contentEl,
      props: {
        plugin: this.plugin,
        theme: this.theme,
        onDone: this.onDone,
        onClose: () => this.close(),
        initialTab: this.initialTab,
        autoRun: this.autoRun
      }
    });
  }
  onClose() {
    var _a;
    (_a = this.comp) == null ? void 0 : _a.$destroy();
    this.contentEl.empty();
  }
};
var BackfillExamplesModal = class extends import_obsidian9.Modal {
  constructor(app, plugin, onDone) {
    super(app);
    this.plugin = plugin;
    this.onDone = onDone;
    this.cancelled = false;
  }
  // 生成中停止/关窗置位，任务在批间检查并提前结束
  onOpen() {
    this.titleEl.setText("AI \u8865\u4F8B\u53E5");
    this.modalEl.addClass("el-backfill-modal");
    const { contentEl } = this;
    const docs = this.plugin.words.all();
    let want = Math.max(1, this.plugin.db.settings.exampleCount || 3);
    let limit = 20;
    let busy = false;
    let button;
    let cancelBtn;
    let wantDrop;
    let limitInput;
    const statsEl = contentEl.createDiv("el-bf-stats");
    const distEl = contentEl.createDiv("el-bf-dist");
    const summaryBox = contentEl.createDiv("el-bf-summary");
    const summaryEl = summaryBox.createDiv();
    const progWrap = summaryBox.createDiv("el-bf-progress");
    const progFill = progWrap.createDiv("el-bf-progress-fill");
    const renderStats = () => {
      const missing = docs.filter((d) => d.examples.length < want);
      const dist = [0, 1, 2, 3, 4].filter((n) => n < want).map((n) => ({ n, c: missing.filter((d) => d.examples.length === n).length })).filter((x) => x.c > 0);
      statsEl.empty();
      const tile = (label, value, cls) => {
        const t = statsEl.createDiv(cls ? `el-bf-tile ${cls}` : "el-bf-tile");
        t.createDiv("el-bf-tile-v").setText(String(value));
        t.createDiv("el-bf-tile-l").setText(label);
      };
      tile("\u603B\u8BCD\u6570", docs.length);
      tile("\u5DF2\u8FBE\u6807", docs.length - missing.length, "is-ok");
      tile("\u9700\u8865", missing.length, missing.length > 0 ? "is-miss" : "is-ok");
      distEl.empty();
      if (missing.length === 0) {
        distEl.addClass("is-empty");
        distEl.setText("\u2705 \u5168\u90E8\u8BCD\u7684\u4F8B\u53E5\u6570\u5DF2\u8FBE\u6807\uFF0C\u65E0\u9700\u8865\u4F8B\u53E5");
      } else {
        distEl.removeClass("is-empty");
        distEl.createSpan({ text: "\u7F3A\u53E3\u5206\u5E03", cls: "el-bf-dist-label" });
        for (const x of dist) distEl.createSpan({ text: `${x.n} \u6761 \xB7 ${x.c} \u8BCD`, cls: "el-chip" });
      }
      const eff = limit > 0 ? Math.min(limit, missing.length) : missing.length;
      summaryEl.setText(`\u672C\u6B21\u5C06\u4E3A ${eff} \u4E2A\u8BCD\u751F\u6210\u4F8B\u53E5\uFF08\u4F8B\u53E5\u6700\u5C11\u7684\u8BCD\u4F18\u5148\uFF0C\u7EA6 ${Math.ceil(eff / 10)} \u6279\u8BF7\u6C42\uFF09`);
      button == null ? void 0 : button.setDisabled(busy || missing.length === 0);
      return missing.length;
    };
    const missing0 = renderStats();
    new import_obsidian9.Setting(contentEl).setName("\u76EE\u6807\u4F8B\u53E5\u6570").setDesc("\u6BCF\u4E2A\u8BCD\u8865\u5230\u51E0\u6761\uFF08\u53EA\u5F71\u54CD\u672C\u6B21\uFF0C\u4E0D\u4FEE\u6539\u9ED8\u8BA4\u8BBE\u7F6E\uFF09").addDropdown((d) => {
      wantDrop = d;
      d.addOptions({ "1": "1 \u6761", "2": "2 \u6761", "3": "3 \u6761", "5": "5 \u6761" });
      d.setValue(String(want));
      d.onChange((v) => {
        want = Number(v) || 3;
        renderStats();
      });
    });
    new import_obsidian9.Setting(contentEl).setName("\u672C\u6B21\u6700\u591A\u8865\u8BCD\u6570").setDesc(`\u7559\u7A7A\u6216 0 \u8868\u793A\u5168\u90E8\uFF08\u5F53\u524D\u9700\u8865 ${missing0} \u8BCD\uFF09\uFF1B\u5927\u8BCD\u5E93\u5EFA\u8BAE\u5206\u6279`).addText((t) => {
      limitInput = t;
      t.inputEl.type = "number";
      t.inputEl.min = "0";
      t.setPlaceholder("\u5168\u90E8");
      t.setValue("20");
      t.onChange((v) => limit = Math.max(0, Number(v) || 0));
    });
    const footer = new import_obsidian9.Setting(contentEl);
    const setBusy = (b) => {
      button == null ? void 0 : button.setDisabled(b);
      if (b) button == null ? void 0 : button.setButtonText("\u751F\u6210\u4E2D\u2026");
      else button == null ? void 0 : button.setButtonText("\u5F00\u59CB\u751F\u6210");
      if (!b) cancelBtn == null ? void 0 : cancelBtn.setButtonText("\u53D6\u6D88");
      wantDrop == null ? void 0 : wantDrop.setDisabled(b);
      limitInput == null ? void 0 : limitInput.setDisabled(b);
    };
    const start = async () => {
      var _a;
      if (busy) return;
      busy = true;
      this.cancelled = false;
      setBusy(true);
      cancelBtn == null ? void 0 : cancelBtn.setButtonText("\u505C\u6B62");
      progWrap.addClass("is-active");
      progFill.style.width = "0%";
      try {
        await this.plugin.backfillExamples(
          want,
          limit || void 0,
          (done, total, extra) => {
            const text2 = `\u751F\u6210\u4E2D ${done}/${total}\u2026${extra != null ? extra : ""}`;
            summaryEl.setText(text2);
            button == null ? void 0 : button.setButtonText(text2);
            progFill.style.width = `${total > 0 ? Math.round(done / total * 100) : 0}%`;
          },
          () => this.cancelled
        );
      } catch (e) {
        new import_obsidian9.Notice("\u8865\u4F8B\u53E5\u5931\u8D25\uFF1A" + ((_a = e.message) != null ? _a : e));
        progWrap.removeClass("is-active");
        setBusy(false);
        busy = false;
        return;
      }
      busy = false;
      this.close();
      this.onDone();
    };
    footer.addButton((b) => {
      cancelBtn = b;
      return b.setButtonText("\u53D6\u6D88").onClick(() => {
        if (busy) {
          this.cancelled = true;
          cancelBtn == null ? void 0 : cancelBtn.setDisabled(true).setButtonText("\u505C\u6B62\u4E2D\u2026");
        } else {
          this.close();
        }
      });
    });
    footer.addButton((b) => {
      button = b;
      return b.setButtonText("\u5F00\u59CB\u751F\u6210").setCta().onClick(() => void start());
    });
  }
  onClose() {
    this.cancelled = true;
    this.contentEl.empty();
  }
};
var DataBackfillModal = class extends import_obsidian9.Modal {
  constructor(app, plugin, onDone) {
    super(app);
    this.plugin = plugin;
    this.onDone = onDone;
  }
  onOpen() {
    this.titleEl.setText("\u6279\u91CF\u8865\u5168\u6570\u636E");
    this.modalEl.addClass("el-wordlist-modal");
    const statEl = this.contentEl.createDiv({ cls: "el-muted" });
    statEl.style.marginBottom = "8px";
    statEl.setText("\u7EDF\u8BA1\u7F3A\u53E3\u4E2D\u2026");
    void this.plugin.backfillGaps().then((gaps) => {
      statEl.setText(
        `\u5F53\u524D\u7F3A\u53E3\uFF1A\u4F8B\u53E5 ${gaps.ex} \u8BCD \xB7 \u4E49\u9879 ${gaps.senses} \u8BCD \xB7 \u4F8B\u53E5\u7FFB\u8BD1 ${gaps.zh} \u53E5 \xB7 \u540C\u53CD\u4E49 ${gaps.rel} \u8BCD \xB7 \u91CA\u4E49\u97F3\u6807 ${gaps.trans} \u8BCD`
      );
      const gap = (btn, n) => {
        btn == null ? void 0 : btn.setDisabled(n === 0);
      };
      gap(btns.ex, gaps.ex);
      gap(btns.senses, gaps.senses);
      gap(btns.zh, gaps.zh);
      gap(btns.rel, gaps.rel);
      gap(btns.trans, gaps.trans);
    }).catch((e) => {
      statEl.setText(`\u7F3A\u53E3\u7EDF\u8BA1\u5931\u8D25\uFF1A${e instanceof Error ? e.message : e}\uFF08\u5404\u4EFB\u52A1\u4ECD\u53EF\u6267\u884C\uFF09`);
    });
    const btns = {};
    const row = (key, name, desc, run2) => {
      new import_obsidian9.Setting(this.contentEl).setName(name).setDesc(desc).addButton((b) => {
        btns[key] = b;
        return b.setButtonText("\u6267\u884C").onClick(() => {
          this.close();
          run2();
        });
      });
    };
    row(
      "ex",
      "AI \u8865\u4F8B\u53E5",
      "\u4E3A\u7F3A\u4F8B\u53E5\u7684\u8BCD\u6279\u91CF\u751F\u6210\uFF08\u5F39\u7A97\u53EF\u9009\u76EE\u6807\u6761\u6570\u4E0E\u6570\u91CF\uFF09",
      () => new BackfillExamplesModal(this.app, this.plugin, this.onDone).open()
    );
    row(
      "senses",
      "AI \u8865\u4E49\u9879",
      "\u4E3A\u6CA1\u6709\u591A\u4E49\u9879\u7684\u8BCD\u6279\u91CF\u62C6\u4E49\u9879\uFF08\u5E26\u8BCD\u6027\uFF0C\u53EA\u8865\u7F3A\u4E0D\u8986\u76D6\uFF09",
      () => this.plugin.backfillSenses()
    );
    row(
      "zh",
      "AI \u4F8B\u53E5\u7FFB\u8BD1",
      "\u4E3A\u6CA1\u6709\u4E2D\u6587\u7FFB\u8BD1\u7684\u4F8B\u53E5\u6279\u91CF\u8865\u7FFB\u8BD1",
      () => this.plugin.backfillExampleTranslations()
    );
    row(
      "rel",
      "\u540C/\u53CD\u4E49\u8BCD",
      "\u4E3A\u6CA1\u6293\u53D6\u8FC7\u7684\u8BCD\u9884\u586B\u540C\u53CD\u4E49\u5173\u8054\uFF08Datamuse\uFF0C\u514D Key\uFF09",
      () => this.plugin.backfillRelWords()
    );
    row(
      "trans",
      "\u91CA\u4E49/\u97F3\u6807",
      "\u79BB\u7EBF\u8BCD\u5178 + \u5728\u7EBF\u515C\u5E95\uFF08\u4E5F\u8986\u76D6\u7F3A\u5931\u7684\u8003\u7EA7\u6807\u7B7E\uFF09",
      () => this.plugin.backfillTranslations()
    );
  }
  onClose() {
    this.contentEl.empty();
  }
};
var WordListModal = class extends import_obsidian9.Modal {
  // false = 状态序（难词>待复习>…，默认），true = 字母序
  constructor(app, plugin, theme) {
    super(app);
    this.plugin = plugin;
    this.theme = theme;
    this.wordsAll = [];
    this.sortAlpha = false;
  }
  onOpen() {
    this.modalEl.addClass("el-wordlist-modal");
    this.render();
  }
  /** 按当前排序模式取展示列表（搜索过滤后套排序） */
  currentList(q) {
    const base = q ? this.wordsAll.filter((w) => w.word.includes(q) || w.translation.toLowerCase().includes(q)) : this.wordsAll;
    if (this.sortAlpha) return [...base].sort((a, b) => a.word.localeCompare(b.word));
    return sortWordsByStatus(base, this.plugin.db.progress, this.plugin.db.ignored);
  }
  render() {
    const { contentEl } = this;
    contentEl.empty();
    this.wordsAll = this.plugin.words.byThemeRaw(this.theme);
    const words = this.wordsAll;
    const nIgnored = words.filter((w) => {
      var _a;
      return (_a = this.plugin.db.ignored) == null ? void 0 : _a[w.word];
    }).length;
    const title = nIgnored ? `${this.theme} \xB7 ${words.length} \u8BCD\uFF08\u5FFD\u7565 ${nIgnored}\uFF0C\u4E0D\u8FDB\u5B66\u4E60\uFF09` : `${this.theme} \xB7 ${words.length} \u8BCD`;
    this.headEl = contentEl.createEl("h3", { text: title });
    const actions = contentEl.createDiv("el-wordlist-actions");
    const sortBtn = actions.createEl("button", {
      cls: "el-wordlist-btn",
      text: this.sortAlpha ? "\u{1F524} \u5B57\u6BCD\u5E8F" : "\u2B50 \u72B6\u6001\u5E8F",
      attr: { title: "\u5207\u6362\u6392\u5E8F\uFF1A\u72B6\u6001\u5E8F\uFF08\u96BE\u8BCD>\u5F85\u590D\u4E60>\u5B66\u4E60\u4E2D>\u672A\u5B66>\u5DF2\u638C\u63E1\uFF09/ \u5B57\u6BCD\u5E8F" }
    });
    sortBtn.addEventListener("click", () => {
      var _a, _b;
      this.sortAlpha = !this.sortAlpha;
      sortBtn.textContent = this.sortAlpha ? "\u{1F524} \u5B57\u6BCD\u5E8F" : "\u2B50 \u72B6\u6001\u5E8F";
      const q = ((_b = (_a = this.searchEl) == null ? void 0 : _a.value) != null ? _b : "").trim().toLowerCase();
      if (this.listEl) this.renderRows(this.listEl, this.currentList(q), q);
    });
    const exportBtn = actions.createEl("button", {
      cls: "el-wordlist-btn",
      text: "\u{1F4CB} \u5BFC\u51FA\u8BCD\u8868",
      attr: { title: "\u590D\u5236\u300C\u8BCD \u91CA\u4E49 \u4F8B\u53E5\u300D\u6E05\u5355\u5230\u526A\u8D34\u677F\uFF08\u53EF\u7C98\u56DE\u300C\u5BFC\u5165\u8BCD\u8868\u300D\uFF09" }
    });
    exportBtn.disabled = !words.length;
    exportBtn.addEventListener("click", async () => {
      try {
        const text2 = exportWordList(words);
        await navigator.clipboard.writeText(text2);
        const dir = `${this.plugin.db.settings.root}/export`;
        await mkdirp(this.plugin.app, dir);
        const path = `${dir}/${sanitizeFilename(this.theme)}-${fmtDate(Date.now())}.txt`;
        const existing = this.plugin.app.vault.getAbstractFileByPath(path);
        if (existing instanceof import_obsidian9.TFile) await this.plugin.app.vault.modify(existing, text2);
        else await this.plugin.app.vault.create(path, text2);
        new import_obsidian9.Notice(`\u5DF2\u590D\u5236 ${wordsAll.length} \u4E2A\u8BCD\uFF0C\u5E76\u5B58\u6863 ${path}`);
      } catch (e) {
        new import_obsidian9.Notice(`\u5BFC\u51FA\u5931\u8D25\uFF1A${e instanceof Error ? e.message : String(e)}`);
      }
    });
    const learnBtn = actions.createEl("button", {
      cls: "el-wordlist-btn mod-cta",
      text: "\u25B6 \u5B66\u4E60",
      attr: { title: "\u5F00\u59CB\u672C\u4E3B\u9898\u7684\u5B66\u4E60\u4F1A\u8BDD\uFF08\u5230\u671F\u590D\u4E60 + \u65B0\u8BCD\u914D\u989D\uFF09" }
    });
    learnBtn.disabled = !words.length;
    learnBtn.addEventListener("click", () => {
      void this.plugin.startSession(this.theme).then((started) => {
        if (started) this.close();
      });
    });
    const wordsAll = words;
    const search = contentEl.createEl("input", {
      type: "search",
      cls: "el-wordlist-search",
      attr: { placeholder: "\u7B5B\u9009\uFF1A\u5355\u8BCD\u6216\u91CA\u4E49\u2026" }
    });
    this.searchEl = search;
    const listWrap = contentEl.createDiv("el-wordlist-scroll");
    this.listEl = listWrap;
    const renderList = () => {
      const q = search.value.trim().toLowerCase();
      this.renderRows(listWrap, this.currentList(q), q);
    };
    search.addEventListener("input", renderList);
    renderList();
    if (!import_obsidian9.Platform.isMobile) setTimeout(() => search.focus(), 50);
  }
  renderRows(wrap, words, q) {
    var _a, _b, _c;
    wrap.empty();
    const table = wrap.createEl("table", { cls: "el-wordlist" });
    const thead = table.createEl("thead");
    for (const h of ["\u72B6\u6001", "\u8BCD", "\u97F3\u6807", "", "\u91CA\u4E49", ""]) {
      thead.createEl("th", { text: h });
    }
    const tbody = table.createEl("tbody");
    for (const w of words) {
      const st = wordStatus(w.word, this.plugin.db.progress, this.plugin.db.ignored);
      const tr = tbody.createEl("tr", { cls: `el-wordlist-row st-${st}` });
      tr.addEventListener("click", () => {
        this.close();
        void this.plugin.app.workspace.openLinkText(w.path, "", false);
      });
      const tdSt = tr.createEl("td", { cls: "el-wordlist-st" });
      const ico = STATUS_ICON[st];
      if (ico) tdSt.createSpan({ text: ico, cls: "el-word-ico" });
      tdSt.createSpan({ text: STATUS_LABEL[st] });
      const tdWord = tr.createEl("td", { cls: "el-wordlist-word" });
      tdWord.setText(w.word);
      if (isPhrase(w.word)) tdWord.createSpan({ text: "\u77ED\u8BED", cls: "el-chip" });
      tr.createEl("td", { cls: "el-wordlist-phon", text: (_a = w.phonetic) != null ? _a : "" });
      const tdAudio = tr.createEl("td", { cls: "el-wordlist-audio" });
      const ttsBtn = tdAudio.createEl("button", {
        cls: "el-wordlist-btn",
        text: "\u{1F50A}",
        attr: { title: "\u53D1\u97F3" }
      });
      void this.plugin.audio.badge(ttsBtn, w.word);
      ttsBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.plugin.speakWord(w.word);
        window.setTimeout(() => void this.plugin.audio.badge(ttsBtn, w.word), 1200);
      });
      tr.createEl("td", { cls: "el-wordlist-gloss", text: w.translation.replace(/\n/g, "\uFF1B") });
      const tdOp = tr.createEl("td", { cls: "el-wordlist-op" });
      tdOp.createEl("button", {
        cls: "el-wordlist-btn",
        text: ((_b = this.plugin.db.ignored) == null ? void 0 : _b[w.word]) ? "\u6062\u590D" : "\u5FFD\u7565",
        attr: { title: ((_c = this.plugin.db.ignored) == null ? void 0 : _c[w.word]) ? "\u53D6\u6D88\u5FFD\u7565\uFF0C\u91CD\u65B0\u8FDB\u5B66\u4E60\u4F1A\u8BDD" : "\u5FFD\u7565\u8BE5\u8BCD\uFF1A\u4E0D\u8FDB\u5B66\u4E60\u4F1A\u8BDD\u3001\u4E0D\u8BA1\u5165\u7EDF\u8BA1" }
      }).addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggleIgnored(w.word);
      });
    }
    if (!words.length) {
      wrap.createDiv({
        cls: "el-muted",
        text: q ? "\u6CA1\u6709\u5339\u914D\u7684\u8BCD" : "\uFF08\u7A7A\u4E3B\u9898\uFF1A\u70B9\u300C\u6269\u8BCD\u300D\u52A0\u8BCD\uFF0C\u300C\u5BFC\u5165\u8BCD\u8868\u300D\u9875\u7B7E\u53EF\u7C98\u8D34\u8BCD\u8868\u6279\u91CF\u52A0\u5165\uFF09"
      });
    }
  }
  toggleIgnored(word) {
    var _a, _b, _c, _d;
    const ignored = (_b = (_a = this.plugin.db).ignored) != null ? _b : _a.ignored = {};
    if (ignored[word]) delete ignored[word];
    else ignored[word] = true;
    this.plugin.store.touch();
    this.plugin.refreshStatusBar();
    const nIgnored = this.wordsAll.filter((w) => {
      var _a2;
      return (_a2 = this.plugin.db.ignored) == null ? void 0 : _a2[w.word];
    }).length;
    this.headEl.textContent = nIgnored ? `${this.theme} \xB7 ${this.wordsAll.length} \u8BCD\uFF08\u5FFD\u7565 ${nIgnored}\uFF0C\u4E0D\u8FDB\u5B66\u4E60\uFF09` : `${this.theme} \xB7 ${this.wordsAll.length} \u8BCD`;
    const q = ((_d = (_c = this.searchEl) == null ? void 0 : _c.value) != null ? _d : "").trim().toLowerCase();
    this.renderRows(this.listEl, this.currentList(q), q);
  }
  onClose() {
    this.contentEl.empty();
  }
};
var MemoModal = class extends import_obsidian9.Modal {
  constructor(app, plugin, wordDoc, onSaved) {
    super(app);
    this.plugin = plugin;
    this.wordDoc = wordDoc;
    this.onSaved = onSaved;
  }
  onOpen() {
    var _a;
    const { contentEl } = this;
    const d = this.wordDoc;
    addHelpTip(
      contentEl.createEl("h3", { text: `\u52A9\u8BB0 \xB7 ${d.word}` }),
      "\u5199\u4E0B\u4F60\u81EA\u5DF1\u7684\u8BB0\u5FC6\u7EBF\u7D22\uFF1A\u8BCD\u6839\u8BCD\u7F00\u3001\u8C10\u97F3\u8054\u60F3\u3001\u76F8\u8FD1\u8BCD\u5BF9\u6BD4\u2026\u2026\u590D\u4E60\u65F6\u663E\u793A\u5728\u8BCD\u5361\u4E0A\u3002"
    );
    const ta = contentEl.createEl("textarea", {
      cls: "el-memo-in",
      attr: { placeholder: "\u5982\uFF1Abene- \u597D + fit \u505A \u2192 \u597D\u5904", rows: "5" }
    });
    ta.value = (_a = d.memo) != null ? _a : "";
    setTimeout(() => ta.focus(), 50);
    const sugBox = contentEl.createDiv("el-memo-sugs");
    const addSug = (text2) => {
      sugBox.createDiv({ cls: "el-memo-sug", text: text2, attr: { title: "\u70B9\u51FB\u586B\u5165\uFF0C\u53EF\u518D\u7F16\u8F91" } }).addEventListener("click", () => {
        const cur = ta.value.trim();
        ta.value = cur ? `${cur}
${text2}` : text2;
        ta.focus();
      });
    };
    void this.plugin.dict.lookup(d.word).then((e) => {
      var _a2;
      const rem = (_a2 = e == null ? void 0 : e.rem) == null ? void 0 : _a2.trim();
      if (rem && !sugBox.childNodes.length) addSug(`\u{1F4D6} ${rem}`);
    }).catch(() => {
    });
    const btns = contentEl.createDiv();
    btns.style.display = "flex";
    btns.style.gap = "8px";
    btns.style.justifyContent = "flex-end";
    btns.style.marginTop = "10px";
    const ai = new import_obsidian9.ButtonComponent(btns).setButtonText("\u2728 AI \u52A9\u8BB0").setClass("el-memo-ai");
    ai.buttonEl.addEventListener("click", async () => {
      var _a2, _b;
      if (!llmReady(this.plugin.llmCfg)) {
        new import_obsidian9.Notice("\u5148\u5728\u8BBE\u7F6E\u91CC\u914D\u7F6E AI\uFF08LLM\uFF09\u518D\u751F\u6210\u52A9\u8BB0");
        return;
      }
      ai.setButtonText("\u751F\u6210\u4E2D\u2026").setDisabled(true);
      sugBox.empty();
      try {
        const sugs = await llmMemoSuggestions(this.plugin.llmCfg, d.word, (_b = (_a2 = d.senses) == null ? void 0 : _a2[0]) != null ? _b : d.translation);
        if (!sugs.length) new import_obsidian9.Notice("AI \u6CA1\u7ED9\u51FA\u52A9\u8BB0\uFF0C\u53EF\u91CD\u8BD5\u6216\u6362\u4E2A\u6A21\u578B");
        for (const s of sugs) addSug(s);
      } catch (e) {
        new import_obsidian9.Notice(`AI \u52A9\u8BB0\u751F\u6210\u5931\u8D25\uFF1A${e instanceof Error ? e.message : String(e)}`);
      } finally {
        ai.setButtonText("\u2728 AI \u52A9\u8BB0").setDisabled(false);
      }
    });
    const save = new import_obsidian9.ButtonComponent(btns).setButtonText("\u4FDD\u5B58").setCta();
    save.buttonEl.addEventListener("click", async () => {
      var _a2;
      await this.plugin.words.setMemo(d, ta.value);
      (_a2 = this.onSaved) == null ? void 0 : _a2.call(this);
      this.close();
    });
    new import_obsidian9.ButtonComponent(btns).setButtonText("\u6E05\u7A7A\u52A9\u8BB0").setClass("el-memo-clear").onClick(async () => {
      var _a2;
      await this.plugin.words.setMemo(d, "");
      (_a2 = this.onSaved) == null ? void 0 : _a2.call(this);
      this.close();
    });
    ta.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) save.buttonEl.click();
    });
  }
  onClose() {
    this.contentEl.empty();
  }
};
var KEY_GUIDES = {
  siliconflow: {
    title: "\u514D\u8D39\u83B7\u53D6\u7845\u57FA\u6D41\u52A8 API Key",
    steps: "\u2460 \u70B9\u300C\u6253\u5F00\u7845\u57FA\u6D41\u52A8\u300D\u2192 \u624B\u673A\u9A8C\u8BC1\u7801\u6216\u5FAE\u4FE1\u626B\u7801\u6CE8\u518C/\u767B\u5F55\uFF08\u81EA\u52A8\u5230\u5BC6\u94A5\u9875\uFF09\n\u2461 \u70B9\u300C\u65B0\u5EFA API \u5BC6\u94A5\u300D\u2192 \u590D\u5236\n\u2462 \u56DE\u6765\u7C98\u8D34\uFF0C\u4FDD\u5B58\u5373\u53EF",
    note: "\u6CE8\u518C\u9001 2000 \u4E07 token \u989D\u5EA6\uFF0CQwen3-8B \u7B49\u5E38\u7528\u6A21\u578B\u514D\u8D39\uFF0C\u6269\u8BCD/\u4F8B\u53E5/\u52A9\u8BB0\u591F\u7528\u5F88\u4E45\u3002",
    url: "https://cloud.siliconflow.cn/account/ak",
    openText: "\u6253\u5F00\u7845\u57FA\u6D41\u52A8\uFF08\u6CE8\u518C/\u767B\u5F55\uFF09",
    keyPrefix: "sk-"
  },
  zhipu: {
    title: "\u514D\u8D39\u83B7\u53D6\u667A\u8C31 API Key",
    steps: "\u2460 \u70B9\u300C\u6253\u5F00\u667A\u8C31\u5F00\u653E\u5E73\u53F0\u300D\u2192 \u624B\u673A\u53F7\u6216\u90AE\u7BB1\u6CE8\u518C/\u767B\u5F55\n\u2461 \u8FDB\u5165\u300CAPI \u5BC6\u94A5\u300D\u2192 \u65B0\u5EFA\u5E76\u590D\u5236\n\u2462 \u56DE\u6765\u7C98\u8D34\uFF0C\u4FDD\u5B58\u5373\u53EF",
    note: "glm-4.7-flash \u514D\u8D39\uFF08\u4E0D\u9650\u91CF\uFF09\uFF0C\u53E6\u9001 2000 \u4E07 token \u53EF\u7528\u66F4\u5F3A\u7684\u6A21\u578B\u3002",
    url: "https://bigmodel.cn/usercenter/proj-mgmt/apikeys",
    // 2025 改版后老地址 open.bigmodel.cn/usercenter/apikeys 已 404
    openText: "\u6253\u5F00\u667A\u8C31\u5F00\u653E\u5E73\u53F0\uFF08\u6CE8\u518C/\u767B\u5F55\uFF09"
  },
  deepseek: {
    title: "\u83B7\u53D6 DeepSeek API Key",
    steps: "\u2460 \u70B9\u300C\u6253\u5F00 DeepSeek \u5F00\u653E\u5E73\u53F0\u300D\u2192 \u6CE8\u518C/\u767B\u5F55\n\u2461 \u5DE6\u4FA7\u300CAPI keys\u300D\u2192\u300C\u521B\u5EFA API key\u300D\u2192 \u590D\u5236\n\u2462 \u56DE\u6765\u7C98\u8D34\uFF0C\u4FDD\u5B58\u5373\u53EF",
    url: "https://platform.deepseek.com/api_keys",
    openText: "\u6253\u5F00 DeepSeek \u5F00\u653E\u5E73\u53F0",
    keyPrefix: "sk-"
  }
};
var KeyGuideModal = class extends import_obsidian9.Modal {
  constructor(app, provider, onPick) {
    super(app);
    this.provider = provider;
    this.onPick = onPick;
  }
  onOpen() {
    const g = KEY_GUIDES[this.provider];
    this.titleEl.setText(g.title);
    const c = this.contentEl;
    c.addClass("el-keyguide");
    c.createEl("p", { text: g.steps, cls: "el-keyguide-steps" });
    if (g.note) c.createEl("p", { text: g.note, cls: "el-muted" });
    new import_obsidian9.ButtonComponent(c).setButtonText(g.openText).setCta().onClick(() => {
      window.open(g.url);
    });
    const row = c.createDiv("el-keyguide-row");
    const input = new import_obsidian9.TextComponent(row);
    input.setPlaceholder(g.keyPrefix ? `\u7C98\u8D34 ${g.keyPrefix} \u5F00\u5934\u7684\u5BC6\u94A5` : "\u7C98\u8D34 API \u5BC6\u94A5");
    new import_obsidian9.ButtonComponent(row).setButtonText("\u7C98\u8D34").onClick(async () => {
      try {
        const t = (await navigator.clipboard.readText()).trim();
        if (t) input.inputEl.value = t;
        else new import_obsidian9.Notice("\u526A\u8D34\u677F\u662F\u7A7A\u7684\uFF0C\u5148\u53BB\u7F51\u9875\u91CC\u590D\u5236\u5BC6\u94A5");
      } catch (e) {
        new import_obsidian9.Notice("\u65E0\u6CD5\u8BFB\u53D6\u526A\u8D34\u677F\uFF0C\u8BF7\u5728\u8F93\u5165\u6846\u91CC\u624B\u52A8\u7C98\u8D34");
      }
    });
    const btns = c.createDiv("el-confirm-btns");
    new import_obsidian9.ButtonComponent(btns).setButtonText("\u53D6\u6D88").onClick(() => this.close());
    new import_obsidian9.ButtonComponent(btns).setButtonText("\u4FDD\u5B58\u5E76\u4F7F\u7528").setCta().onClick(() => {
      const key = input.inputEl.value.trim();
      if (g.keyPrefix ? !key.startsWith(g.keyPrefix) : key.length < 16) {
        new import_obsidian9.Notice(g.keyPrefix ? `\u5BC6\u94A5\u5E94\u4EE5 ${g.keyPrefix} \u5F00\u5934\uFF0C\u8BF7\u68C0\u67E5\u662F\u5426\u590D\u5236\u5B8C\u6574` : "\u5BC6\u94A5\u770B\u8D77\u6765\u4E0D\u5B8C\u6574\uFF0C\u8BF7\u91CD\u65B0\u590D\u5236");
        return;
      }
      this.onPick(key);
      this.close();
    });
  }
  onClose() {
    this.contentEl.empty();
  }
};
var AI_SETUP_OPTIONS = [
  { id: "siliconflow", label: "\u7845\u57FA\u6D41\u52A8\uFF08\u514D\u8D39\u989D\u5EA6 \xB7 \u63A8\u8350\uFF09" },
  { id: "zhipu", label: "\u667A\u8C31 GLM\uFF08\u514D\u8D39\u6A21\u578B\uFF09" },
  { id: "deepseek", label: "DeepSeek" },
  { id: "ollama", label: "\u672C\u5730 Ollama\uFF08\u5DF2\u5B89\u88C5\uFF09" }
];
var AiSetupModal = class extends import_obsidian9.Modal {
  constructor(app, plugin, onDone) {
    super(app);
    this.plugin = plugin;
    this.onDone = onDone;
    this.picked = "siliconflow";
    this.keyVal = "";
  }
  onOpen() {
    this.titleEl.setText("\u914D\u7F6E AI \u6E90");
    const c = this.contentEl;
    c.addClass("el-aisetup");
    c.createEl("p", {
      text: "AI \u7528\u4E8E\u81EA\u52A8\u5199\u4F8B\u53E5\u3001\u6269\u8BCD\u3001\u751F\u6210\u52A9\u8BB0\uFF1B\u4E0D\u914D\u7F6E\u4E5F\u80FD\u79BB\u7EBF\u5B66\u8BCD\u3002\u63A8\u8350\u514D\u8D39\u4E91\u7AEF\u6E90\uFF0C\u6CE8\u518C\u5373\u6709\u989D\u5EA6\u3002",
      cls: "el-muted"
    });
    const group = c.createDiv("el-aisetup-opts");
    for (const o of AI_SETUP_OPTIONS) {
      const lab = group.createEl("label", { cls: "el-aisetup-opt" });
      const input = lab.createEl("input", { type: "radio" });
      input.name = "el-aisetup-src";
      input.checked = o.id === this.picked;
      input.onchange = () => {
        if (input.checked) {
          this.picked = o.id;
          this.renderDetail();
        }
      };
      lab.createSpan({ text: o.label });
    }
    this.detailEl = c.createDiv("el-aisetup-detail");
    this.renderDetail();
    const btns = c.createDiv("el-confirm-btns");
    new import_obsidian9.ButtonComponent(btns).setButtonText("\u6682\u4E0D\u914D\u7F6E").onClick(() => {
      var _a;
      this.plugin.db.settings.aiGuideDone = true;
      this.plugin.store.touch();
      (_a = this.onDone) == null ? void 0 : _a.call(this);
      this.close();
    });
    const save = new import_obsidian9.ButtonComponent(btns).setButtonText("\u4FDD\u5B58\u5E76\u6D4B\u8BD5").setCta();
    save.buttonEl.addEventListener("click", async () => {
      var _a;
      const p = this.picked;
      const key = this.keyVal.trim();
      if (p !== "ollama") {
        const g = KEY_GUIDES[p];
        if (g.keyPrefix ? !key.startsWith(g.keyPrefix) : key.length < 16) {
          new import_obsidian9.Notice(g.keyPrefix ? `\u5BC6\u94A5\u5E94\u4EE5 ${g.keyPrefix} \u5F00\u5934\uFF0C\u8BF7\u68C0\u67E5\u662F\u5426\u590D\u5236\u5B8C\u6574` : "\u5BC6\u94A5\u770B\u8D77\u6765\u4E0D\u5B8C\u6574\uFF0C\u8BF7\u91CD\u65B0\u590D\u5236");
          return;
        }
      }
      const s = this.plugin.db.settings;
      const preset = { baseUrl: "", apiKey: "", model: "", ...LLM_PRESETS[p] };
      s.llmSaved = { ...s.llmSaved, [p]: { ...preset, apiKey: key } };
      if (import_obsidian9.Platform.isMobile) s.llmMobileProvider = p;
      else s.llmProvider = p;
      s.aiGuideDone = true;
      this.plugin.store.touch();
      (_a = this.onDone) == null ? void 0 : _a.call(this);
      this.close();
      new import_obsidian9.Notice("\u6B63\u5728\u6D4B\u8BD5\u8FDE\u63A5\u2026");
      try {
        await llmTest(this.plugin.llmCfg);
        new import_obsidian9.Notice("\u8FDE\u63A5\u6210\u529F \u2713\uFF0CAI \u4F8B\u53E5/\u6269\u8BCD/\u52A9\u8BB0\u5DF2\u53EF\u7528");
      } catch (e) {
        new import_obsidian9.Notice(`\u914D\u7F6E\u5DF2\u4FDD\u5B58\uFF0C\u4F46\u8FDE\u63A5\u5931\u8D25\uFF1A${e instanceof Error ? e.message : String(e)}\uFF08\u53EF\u5230 \u8BBE\u7F6E \u2192 English Learn \u2192 AI \u6269\u8BCD \u4FEE\u6539\uFF09`, 1e4);
      }
    });
  }
  /** 按选中源重绘注册引导区（切换 radio 时重建；Key 输入值经 this.keyVal 保留） */
  renderDetail() {
    const d = this.detailEl;
    d.empty();
    if (this.picked === "ollama") {
      d.createEl("p", {
        text: "\u4F7F\u7528\u672C\u673A Ollama\uFF1A\u786E\u4FDD\u5DF2\u5B89\u88C5\u5E76\u6267\u884C\u8FC7 ollama pull qwen2.5:3b\u3002\u624B\u673A\u8FDE\u4E0D\u4E0A\u672C\u673A\uFF0C\u5EFA\u8BAE\u9009\u4E91\u7AEF\u6E90\u3002",
        cls: "el-muted"
      });
      return;
    }
    const g = KEY_GUIDES[this.picked];
    d.createEl("p", { text: g.steps, cls: "el-keyguide-steps" });
    if (g.note) d.createEl("p", { text: g.note, cls: "el-muted" });
    new import_obsidian9.ButtonComponent(d).setButtonText(g.openText).onClick(() => window.open(g.url));
    const row = d.createDiv("el-keyguide-row");
    const input = new import_obsidian9.TextComponent(row);
    input.setPlaceholder(g.keyPrefix ? `\u7C98\u8D34 ${g.keyPrefix} \u5F00\u5934\u7684\u5BC6\u94A5` : "\u7C98\u8D34 API \u5BC6\u94A5");
    input.inputEl.value = this.keyVal;
    input.onChange((v) => this.keyVal = v);
    new import_obsidian9.ButtonComponent(row).setButtonText("\u7C98\u8D34").onClick(async () => {
      try {
        const t = (await navigator.clipboard.readText()).trim();
        if (t) {
          input.inputEl.value = t;
          this.keyVal = t;
        } else new import_obsidian9.Notice("\u526A\u8D34\u677F\u662F\u7A7A\u7684\uFF0C\u5148\u53BB\u7F51\u9875\u91CC\u590D\u5236\u5BC6\u94A5");
      } catch (e) {
        new import_obsidian9.Notice("\u65E0\u6CD5\u8BFB\u53D6\u526A\u8D34\u677F\uFF0C\u8BF7\u5728\u8F93\u5165\u6846\u91CC\u624B\u52A8\u7C98\u8D34");
      }
    });
  }
  onClose() {
    this.contentEl.empty();
  }
};

// src/tts.ts
var voice = null;
var voicePicked = false;
var preferredVoice = null;
function pickVoice() {
  voicePicked = true;
  const ens = window.speechSynthesis.getVoices().filter((v) => /^en[-_]/i.test(v.lang) || v.lang.toLowerCase() === "en");
  if (!ens.length) return;
  if (preferredVoice) {
    const hit = ens.find((v) => v.name === preferredVoice);
    if (hit) {
      voice = hit;
      return;
    }
  }
  const score = (v) => (/enhanced|premium|natural|neural|google/i.test(v.name) ? 2 : 0) + (v.lang.replace("_", "-").toLowerCase() === "en-us" ? 1 : 0);
  voice = ens.reduce((best, v) => score(v) > score(best) ? v : best);
}
function setPreferredVoice(name) {
  preferredVoice = (name == null ? void 0 : name.trim()) || null;
  voice = null;
  voicePicked = false;
}
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  const synth = window.speechSynthesis;
  const refresh = () => {
    voice = null;
    voicePicked = false;
  };
  if (typeof synth.addEventListener === "function")
    synth.addEventListener("voiceschanged", refresh);
  else synth.onvoiceschanged = refresh;
}
var speakSeq = 0;
function speak(text2, rate = 1) {
  if (!("speechSynthesis" in window)) return;
  try {
    if (!voicePicked || !voice) pickVoice();
    play(text2, rate, 0);
  } catch (e) {
    console.error("TTS \u5931\u8D25:", e);
  }
}
function play(text2, rate, attempt) {
  var _a;
  const synth = window.speechSynthesis;
  const gen = ++speakSeq;
  if (synth.speaking || synth.pending) synth.cancel();
  const u = new SpeechSynthesisUtterance(text2);
  if (voice && attempt < 3) u.voice = voice;
  u.lang = (_a = voice == null ? void 0 : voice.lang) != null ? _a : "en-US";
  u.rate = rate;
  let started = false;
  u.onstart = () => {
    started = true;
  };
  u.onerror = (e) => {
    const err = e.error;
    if (err !== "canceled" && err !== "interrupted") console.error("TTS utterance error:", err);
  };
  synth.speak(u);
  synth.resume();
  setTimeout(() => {
    if (gen !== speakSeq || started || synth.speaking) return;
    if (attempt < 3) {
      console.warn(
        "TTS \u672A\u542F\u52A8\uFF0C\u91CD\u8BD5\u7B2C " + (attempt + 2) + " \u6B21" + (attempt === 2 ? "\uFF08\u6539\u7528\u7CFB\u7EDF\u9ED8\u8BA4\u58F0\u97F3\uFF09" : "")
      );
      setTimeout(() => {
        if (gen === speakSeq) play(text2, rate, attempt + 1);
      }, 100);
    } else {
      console.error("TTS \u8FDE\u7CFB\u7EDF\u9ED8\u8BA4\u58F0\u97F3\u90FD\u672A\u542F\u52A8\uFF0CspeechSynthesis \u53EF\u80FD\u5DF2\u5047\u6B7B\uFF0C\u8BF7\u91CD\u542F Obsidian");
    }
  }, 500);
}

// src/components/SenseList.svelte
function get_each_context2(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[7] = list[i];
  return child_ctx;
}
function create_else_block2(ctx) {
  let div;
  let t;
  return {
    c() {
      div = element("div");
      t = text(
        /*emptyText*/
        ctx[0]
      );
      attr(div, "class", "el-translation");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, t);
    },
    p(ctx2, dirty) {
      if (dirty & /*emptyText*/
      1) set_data(
        t,
        /*emptyText*/
        ctx2[0]
      );
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
    }
  };
}
function create_if_block2(ctx) {
  let div;
  let t;
  let each_value = ensure_array_like(
    /*shown*/
    ctx[3]
  );
  let each_blocks = [];
  for (let i = 0; i < each_value.length; i += 1) {
    each_blocks[i] = create_each_block2(get_each_context2(ctx, each_value, i));
  }
  let if_block = (
    /*list*/
    ctx[2].length > MAX && create_if_block_15(ctx)
  );
  return {
    c() {
      div = element("div");
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      t = space();
      if (if_block) if_block.c();
      attr(div, "class", "el-senses");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      for (let i = 0; i < each_blocks.length; i += 1) {
        if (each_blocks[i]) {
          each_blocks[i].m(div, null);
        }
      }
      append(div, t);
      if (if_block) if_block.m(div, null);
    },
    p(ctx2, dirty) {
      if (dirty & /*shown*/
      8) {
        each_value = ensure_array_like(
          /*shown*/
          ctx2[3]
        );
        let i;
        for (i = 0; i < each_value.length; i += 1) {
          const child_ctx = get_each_context2(ctx2, each_value, i);
          if (each_blocks[i]) {
            each_blocks[i].p(child_ctx, dirty);
          } else {
            each_blocks[i] = create_each_block2(child_ctx);
            each_blocks[i].c();
            each_blocks[i].m(div, t);
          }
        }
        for (; i < each_blocks.length; i += 1) {
          each_blocks[i].d(1);
        }
        each_blocks.length = each_value.length;
      }
      if (
        /*list*/
        ctx2[2].length > MAX
      ) {
        if (if_block) {
          if_block.p(ctx2, dirty);
        } else {
          if_block = create_if_block_15(ctx2);
          if_block.c();
          if_block.m(div, null);
        }
      } else if (if_block) {
        if_block.d(1);
        if_block = null;
      }
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
      destroy_each(each_blocks, detaching);
      if (if_block) if_block.d();
    }
  };
}
function create_each_block2(ctx) {
  let div;
  let t_value = (
    /*s*/
    ctx[7] + ""
  );
  let t;
  let div_title_value;
  return {
    c() {
      div = element("div");
      t = text(t_value);
      attr(div, "class", "el-sense");
      attr(div, "title", div_title_value = /*s*/
      ctx[7]);
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, t);
    },
    p(ctx2, dirty) {
      if (dirty & /*shown*/
      8 && t_value !== (t_value = /*s*/
      ctx2[7] + "")) set_data(t, t_value);
      if (dirty & /*shown*/
      8 && div_title_value !== (div_title_value = /*s*/
      ctx2[7])) {
        attr(div, "title", div_title_value);
      }
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
    }
  };
}
function create_if_block_15(ctx) {
  let button;
  let t_value = (
    /*expanded*/
    ctx[1] ? "\u6536\u8D77" : `\u8FD8\u6709 ${/*list*/
    ctx[2].length - MAX} \u4E2A\u4E49\u9879`
  );
  let t;
  let mounted;
  let dispose;
  return {
    c() {
      button = element("button");
      t = text(t_value);
      attr(button, "class", "el-sense-more");
    },
    m(target, anchor) {
      insert(target, button, anchor);
      append(button, t);
      if (!mounted) {
        dispose = listen(
          button,
          "click",
          /*click_handler*/
          ctx[6]
        );
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty & /*expanded, list*/
      6 && t_value !== (t_value = /*expanded*/
      ctx2[1] ? "\u6536\u8D77" : `\u8FD8\u6709 ${/*list*/
      ctx2[2].length - MAX} \u4E2A\u4E49\u9879`)) set_data(t, t_value);
    },
    d(detaching) {
      if (detaching) {
        detach(button);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_fragment3(ctx) {
  let if_block_anchor;
  function select_block_type(ctx2, dirty) {
    if (
      /*list*/
      ctx2[2].length
    ) return create_if_block2;
    return create_else_block2;
  }
  let current_block_type = select_block_type(ctx, -1);
  let if_block = current_block_type(ctx);
  return {
    c() {
      if_block.c();
      if_block_anchor = empty();
    },
    m(target, anchor) {
      if_block.m(target, anchor);
      insert(target, if_block_anchor, anchor);
    },
    p(ctx2, [dirty]) {
      if (current_block_type === (current_block_type = select_block_type(ctx2, dirty)) && if_block) {
        if_block.p(ctx2, dirty);
      } else {
        if_block.d(1);
        if_block = current_block_type(ctx2);
        if (if_block) {
          if_block.c();
          if_block.m(if_block_anchor.parentNode, if_block_anchor);
        }
      }
    },
    i: noop,
    o: noop,
    d(detaching) {
      if (detaching) {
        detach(if_block_anchor);
      }
      if_block.d(detaching);
    }
  };
}
var MAX = 4;
function instance3($$self, $$props, $$invalidate) {
  let list;
  let shown;
  let { doc } = $$props;
  let { emptyText = "\uFF08\u91CA\u4E49\u5F85\u8865\u5145\uFF0C\u53EF\u5728\u8BCD\u7B14\u8BB0\u4E2D\u624B\u52A8\u7F16\u8F91\uFF09" } = $$props;
  let expanded = false;
  let shownWord = doc.word;
  const click_handler = () => $$invalidate(1, expanded = !expanded);
  $$self.$$set = ($$props2) => {
    if ("doc" in $$props2) $$invalidate(4, doc = $$props2.doc);
    if ("emptyText" in $$props2) $$invalidate(0, emptyText = $$props2.emptyText);
  };
  $$self.$$.update = () => {
    if ($$self.$$.dirty & /*doc, shownWord*/
    48) {
      $: if (doc.word !== shownWord) {
        $$invalidate(5, shownWord = doc.word);
        $$invalidate(1, expanded = false);
      }
    }
    if ($$self.$$.dirty & /*doc*/
    16) {
      $: $$invalidate(2, list = sensesOf(doc));
    }
    if ($$self.$$.dirty & /*expanded, list*/
    6) {
      $: $$invalidate(3, shown = expanded ? list : list.slice(0, MAX));
    }
  };
  return [emptyText, expanded, list, shown, doc, shownWord, click_handler];
}
var SenseList = class extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance3, create_fragment3, safe_not_equal, { doc: 4, emptyText: 0 });
  }
};
var SenseList_default = SenseList;

// src/components/WordFullCard.svelte
function get_each_context3(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[51] = list[i];
  child_ctx[53] = i;
  return child_ctx;
}
function get_each_context_12(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[54] = list[i];
  return child_ctx;
}
function get_each_context_2(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[57] = list[i][0];
  child_ctx[58] = list[i][1];
  return child_ctx;
}
function get_each_context_3(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[57] = list[i][0];
  child_ctx[61] = list[i][1];
  return child_ctx;
}
function get_each_context_4(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[57] = list[i];
  return child_ctx;
}
function get_each_context_5(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[57] = list[i];
  return child_ctx;
}
function create_if_block_19(ctx) {
  let span;
  return {
    c() {
      span = element("span");
      span.textContent = "\u77ED\u8BED";
      attr(span, "class", "el-chip");
    },
    m(target, anchor) {
      insert(target, span, anchor);
    },
    d(detaching) {
      if (detaching) {
        detach(span);
      }
    }
  };
}
function create_if_block_18(ctx) {
  let div;
  let t_1_value = (
    /*doc*/
    ctx[0].phonetic + ""
  );
  let t_1;
  return {
    c() {
      div = element("div");
      t_1 = text(t_1_value);
      attr(div, "class", "el-phonetic");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, t_1);
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*doc*/
      1 && t_1_value !== (t_1_value = /*doc*/
      ctx2[0].phonetic + "")) set_data(t_1, t_1_value);
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
    }
  };
}
function create_if_block_17(ctx) {
  let button0;
  let t0_value = (
    /*aiBusy*/
    ctx[7] ? "\u23F3 \u8865\u4F8B\u53E5\u2026" : "\u270D\uFE0F \u8865\u4F8B\u53E5"
  );
  let t0;
  let t1;
  let button1;
  let t2_value = (
    /*sensesBusy*/
    ctx[8] ? "\u23F3 \u8865\u4E49\u9879\u2026" : "\u{1F4D6} \u8865\u4E49\u9879"
  );
  let t2;
  let mounted;
  let dispose;
  return {
    c() {
      button0 = element("button");
      t0 = text(t0_value);
      t1 = space();
      button1 = element("button");
      t2 = text(t2_value);
      attr(button0, "class", "el-tts el-ai-btn");
      attr(button0, "title", "AI \u8865\u4F8B\u53E5\uFF08\u6BCF\u6B21 3 \u6761\uFF09");
      button0.disabled = /*aiBusy*/
      ctx[7];
      attr(button1, "class", "el-tts el-ai-btn");
      attr(button1, "title", "AI \u8865\u5168\u4E49\u9879\uFF08\u5E26\u8BCD\u6027\u591A\u4E49\uFF09");
      button1.disabled = /*sensesBusy*/
      ctx[8];
    },
    m(target, anchor) {
      insert(target, button0, anchor);
      append(button0, t0);
      insert(target, t1, anchor);
      insert(target, button1, anchor);
      append(button1, t2);
      if (!mounted) {
        dispose = [
          listen(
            button0,
            "click",
            /*click_handler*/
            ctx[25]
          ),
          listen(
            button1,
            "click",
            /*click_handler_1*/
            ctx[26]
          )
        ];
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*aiBusy*/
      128 && t0_value !== (t0_value = /*aiBusy*/
      ctx2[7] ? "\u23F3 \u8865\u4F8B\u53E5\u2026" : "\u270D\uFE0F \u8865\u4F8B\u53E5")) set_data(t0, t0_value);
      if (dirty[0] & /*aiBusy*/
      128) {
        button0.disabled = /*aiBusy*/
        ctx2[7];
      }
      if (dirty[0] & /*sensesBusy*/
      256 && t2_value !== (t2_value = /*sensesBusy*/
      ctx2[8] ? "\u23F3 \u8865\u4E49\u9879\u2026" : "\u{1F4D6} \u8865\u4E49\u9879")) set_data(t2, t2_value);
      if (dirty[0] & /*sensesBusy*/
      256) {
        button1.disabled = /*sensesBusy*/
        ctx2[8];
      }
    },
    d(detaching) {
      if (detaching) {
        detach(button0);
        detach(t1);
        detach(button1);
      }
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_if_block3(ctx) {
  let senselist;
  let t0;
  let t1;
  let t2;
  let t3;
  let t4;
  let t5;
  let t6;
  let if_block6_anchor;
  let current;
  senselist = new SenseList_default({ props: { doc: (
    /*doc*/
    ctx[0]
  ) } });
  let if_block0 = (
    /*doc*/
    ctx[0].level && create_if_block_16(ctx)
  );
  function select_block_type(ctx2, dirty) {
    if (
      /*doc*/
      ctx2[0].memo
    ) return create_if_block_142;
    if (
      /*dictRem*/
      ctx2[12]
    ) return create_if_block_152;
    return create_else_block_2;
  }
  let current_block_type = select_block_type(ctx, [-1, -1, -1]);
  let if_block1 = current_block_type(ctx);
  let if_block2 = (
    /*synonyms*/
    (ctx[2].length || /*antonyms*/
    ctx[3].length) && create_if_block_112(ctx)
  );
  let if_block3 = (
    /*dictRel*/
    ctx[11].length && create_if_block_102(ctx)
  );
  let if_block4 = (
    /*dictWf*/
    ctx[13] && create_if_block_82(ctx)
  );
  let if_block5 = (
    /*doc*/
    ctx[0].examples.length && create_if_block_22(ctx)
  );
  let if_block6 = (
    /*doc*/
    ctx[0].examples.length > 3 && false
  );
  return {
    c() {
      create_component(senselist.$$.fragment);
      t0 = space();
      if (if_block0) if_block0.c();
      t1 = space();
      if_block1.c();
      t2 = space();
      if (if_block2) if_block2.c();
      t3 = space();
      if (if_block3) if_block3.c();
      t4 = space();
      if (if_block4) if_block4.c();
      t5 = space();
      if (if_block5) if_block5.c();
      t6 = space();
      if (if_block6) if_block6.c();
      if_block6_anchor = empty();
    },
    m(target, anchor) {
      mount_component(senselist, target, anchor);
      insert(target, t0, anchor);
      if (if_block0) if_block0.m(target, anchor);
      insert(target, t1, anchor);
      if_block1.m(target, anchor);
      insert(target, t2, anchor);
      if (if_block2) if_block2.m(target, anchor);
      insert(target, t3, anchor);
      if (if_block3) if_block3.m(target, anchor);
      insert(target, t4, anchor);
      if (if_block4) if_block4.m(target, anchor);
      insert(target, t5, anchor);
      if (if_block5) if_block5.m(target, anchor);
      insert(target, t6, anchor);
      if (if_block6) if_block6.m(target, anchor);
      insert(target, if_block6_anchor, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const senselist_changes = {};
      if (dirty[0] & /*doc*/
      1) senselist_changes.doc = /*doc*/
      ctx2[0];
      senselist.$set(senselist_changes);
      if (
        /*doc*/
        ctx2[0].level
      ) {
        if (if_block0) {
          if_block0.p(ctx2, dirty);
        } else {
          if_block0 = create_if_block_16(ctx2);
          if_block0.c();
          if_block0.m(t1.parentNode, t1);
        }
      } else if (if_block0) {
        if_block0.d(1);
        if_block0 = null;
      }
      if (current_block_type === (current_block_type = select_block_type(ctx2, dirty)) && if_block1) {
        if_block1.p(ctx2, dirty);
      } else {
        if_block1.d(1);
        if_block1 = current_block_type(ctx2);
        if (if_block1) {
          if_block1.c();
          if_block1.m(t2.parentNode, t2);
        }
      }
      if (
        /*synonyms*/
        ctx2[2].length || /*antonyms*/
        ctx2[3].length
      ) {
        if (if_block2) {
          if_block2.p(ctx2, dirty);
        } else {
          if_block2 = create_if_block_112(ctx2);
          if_block2.c();
          if_block2.m(t3.parentNode, t3);
        }
      } else if (if_block2) {
        if_block2.d(1);
        if_block2 = null;
      }
      if (
        /*dictRel*/
        ctx2[11].length
      ) {
        if (if_block3) {
          if_block3.p(ctx2, dirty);
        } else {
          if_block3 = create_if_block_102(ctx2);
          if_block3.c();
          if_block3.m(t4.parentNode, t4);
        }
      } else if (if_block3) {
        if_block3.d(1);
        if_block3 = null;
      }
      if (
        /*dictWf*/
        ctx2[13]
      ) {
        if (if_block4) {
          if_block4.p(ctx2, dirty);
        } else {
          if_block4 = create_if_block_82(ctx2);
          if_block4.c();
          if_block4.m(t5.parentNode, t5);
        }
      } else if (if_block4) {
        if_block4.d(1);
        if_block4 = null;
      }
      if (
        /*doc*/
        ctx2[0].examples.length
      ) {
        if (if_block5) {
          if_block5.p(ctx2, dirty);
        } else {
          if_block5 = create_if_block_22(ctx2);
          if_block5.c();
          if_block5.m(t6.parentNode, t6);
        }
      } else if (if_block5) {
        if_block5.d(1);
        if_block5 = null;
      }
      if (
        /*doc*/
        ctx2[0].examples.length > 3 && false
      ) {
        if (if_block6) {
          if_block6.p(ctx2, dirty);
        } else {
          if_block6 = create_if_block_1(ctx2);
          if_block6.c();
          if_block6.m(if_block6_anchor.parentNode, if_block6_anchor);
        }
      } else if (if_block6) {
        if_block6.d(1);
        if_block6 = null;
      }
    },
    i(local) {
      if (current) return;
      transition_in(senselist.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(senselist.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching) {
        detach(t0);
        detach(t1);
        detach(t2);
        detach(t3);
        detach(t4);
        detach(t5);
        detach(t6);
        detach(if_block6_anchor);
      }
      destroy_component(senselist, detaching);
      if (if_block0) if_block0.d(detaching);
      if_block1.d(detaching);
      if (if_block2) if_block2.d(detaching);
      if (if_block3) if_block3.d(detaching);
      if (if_block4) if_block4.d(detaching);
      if (if_block5) if_block5.d(detaching);
      if (if_block6) if_block6.d(detaching);
    }
  };
}
function create_if_block_16(ctx) {
  let div;
  let span;
  let t_1_value = levelLabel(
    /*doc*/
    ctx[0].level
  ) + "";
  let t_1;
  return {
    c() {
      div = element("div");
      span = element("span");
      t_1 = text(t_1_value);
      attr(span, "class", "el-chip");
      attr(span, "title", "\u8003\u8BD5\u7B49\u7EA7");
      set_style(div, "margin-top", "8px");
      set_style(div, "display", "flex");
      set_style(div, "gap", "6px");
      set_style(div, "flex-wrap", "wrap");
      set_style(div, "justify-content", "center");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, span);
      append(span, t_1);
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*doc*/
      1 && t_1_value !== (t_1_value = levelLabel(
        /*doc*/
        ctx2[0].level
      ) + "")) set_data(t_1, t_1_value);
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
    }
  };
}
function create_else_block_2(ctx) {
  let button;
  let mounted;
  let dispose;
  return {
    c() {
      button = element("button");
      button.textContent = "\u{1F4CC} \u8BB0\u4E2A\u52A9\u8BB0";
      attr(button, "class", "el-memo-add");
      attr(button, "title", "\u8BB0\u4E00\u6761\u81EA\u5DF1\u7684\u52A9\u8BB0\uFF08\u8054\u60F3/\u8BCD\u6839/\u53E3\u8BC0\uFF09\uFF0C\u590D\u4E60\u65F6\u663E\u793A\u5728\u8BCD\u5361\u4E0A");
    },
    m(target, anchor) {
      insert(target, button, anchor);
      if (!mounted) {
        dispose = listen(
          button,
          "click",
          /*editMemo*/
          ctx[16]
        );
        mounted = true;
      }
    },
    p: noop,
    d(detaching) {
      if (detaching) {
        detach(button);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_152(ctx) {
  let div;
  let t0;
  let t1;
  let mounted;
  let dispose;
  return {
    c() {
      div = element("div");
      t0 = text("\u{1F4D6} ");
      t1 = text(
        /*dictRem*/
        ctx[12]
      );
      attr(div, "class", "el-memo");
      attr(div, "title", "\u8BCD\u5178\u8BCD\u6839\u62C6\u89E3\uFF0C\u70B9\u51FB\u8BB0\u6210\u81EA\u5DF1\u7684\u52A9\u8BB0");
      attr(div, "role", "button");
      attr(div, "tabindex", "0");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, t0);
      append(div, t1);
      if (!mounted) {
        dispose = [
          listen(
            div,
            "click",
            /*editMemo*/
            ctx[16]
          ),
          listen(
            div,
            "keydown",
            /*keydown_handler_2*/
            ctx[29]
          )
        ];
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*dictRem*/
      4096) set_data(
        t1,
        /*dictRem*/
        ctx2[12]
      );
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_if_block_142(ctx) {
  let div;
  let t0;
  let t1_value = (
    /*doc*/
    ctx[0].memo + ""
  );
  let t1;
  let mounted;
  let dispose;
  return {
    c() {
      div = element("div");
      t0 = text("\u{1F4CC} ");
      t1 = text(t1_value);
      attr(div, "class", "el-memo");
      attr(div, "title", "\u4F60\u7684\u52A9\u8BB0\uFF0C\u70B9\u51FB\u4FEE\u6539");
      attr(div, "role", "button");
      attr(div, "tabindex", "0");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, t0);
      append(div, t1);
      if (!mounted) {
        dispose = [
          listen(
            div,
            "click",
            /*editMemo*/
            ctx[16]
          ),
          listen(
            div,
            "keydown",
            /*keydown_handler_1*/
            ctx[28]
          )
        ];
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*doc*/
      1 && t1_value !== (t1_value = /*doc*/
      ctx2[0].memo + "")) set_data(t1, t1_value);
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_if_block_112(ctx) {
  let div;
  let t_1;
  let if_block0 = (
    /*synonyms*/
    ctx[2].length && create_if_block_132(ctx)
  );
  let if_block1 = (
    /*antonyms*/
    ctx[3].length && create_if_block_122(ctx)
  );
  return {
    c() {
      div = element("div");
      if (if_block0) if_block0.c();
      t_1 = space();
      if (if_block1) if_block1.c();
      attr(div, "class", "el-related-row");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      if (if_block0) if_block0.m(div, null);
      append(div, t_1);
      if (if_block1) if_block1.m(div, null);
    },
    p(ctx2, dirty) {
      if (
        /*synonyms*/
        ctx2[2].length
      ) {
        if (if_block0) {
          if_block0.p(ctx2, dirty);
        } else {
          if_block0 = create_if_block_132(ctx2);
          if_block0.c();
          if_block0.m(div, t_1);
        }
      } else if (if_block0) {
        if_block0.d(1);
        if_block0 = null;
      }
      if (
        /*antonyms*/
        ctx2[3].length
      ) {
        if (if_block1) {
          if_block1.p(ctx2, dirty);
        } else {
          if_block1 = create_if_block_122(ctx2);
          if_block1.c();
          if_block1.m(div, null);
        }
      } else if (if_block1) {
        if_block1.d(1);
        if_block1 = null;
      }
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
      if (if_block0) if_block0.d();
      if (if_block1) if_block1.d();
    }
  };
}
function create_if_block_132(ctx) {
  let span;
  let t1;
  let each_1_anchor;
  let each_value_5 = ensure_array_like(
    /*synonyms*/
    ctx[2]
  );
  let each_blocks = [];
  for (let i = 0; i < each_value_5.length; i += 1) {
    each_blocks[i] = create_each_block_5(get_each_context_5(ctx, each_value_5, i));
  }
  return {
    c() {
      span = element("span");
      span.textContent = "\u{1F500} \u540C\u4E49";
      t1 = space();
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      each_1_anchor = empty();
      attr(span, "title", "\u540C\u4E49\u8BCD\uFF0C\u70B9\u51FB\u53D1\u97F3");
    },
    m(target, anchor) {
      insert(target, span, anchor);
      insert(target, t1, anchor);
      for (let i = 0; i < each_blocks.length; i += 1) {
        if (each_blocks[i]) {
          each_blocks[i].m(target, anchor);
        }
      }
      insert(target, each_1_anchor, anchor);
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*plugin, synonyms*/
      6) {
        each_value_5 = ensure_array_like(
          /*synonyms*/
          ctx2[2]
        );
        let i;
        for (i = 0; i < each_value_5.length; i += 1) {
          const child_ctx = get_each_context_5(ctx2, each_value_5, i);
          if (each_blocks[i]) {
            each_blocks[i].p(child_ctx, dirty);
          } else {
            each_blocks[i] = create_each_block_5(child_ctx);
            each_blocks[i].c();
            each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
          }
        }
        for (; i < each_blocks.length; i += 1) {
          each_blocks[i].d(1);
        }
        each_blocks.length = each_value_5.length;
      }
    },
    d(detaching) {
      if (detaching) {
        detach(span);
        detach(t1);
        detach(each_1_anchor);
      }
      destroy_each(each_blocks, detaching);
    }
  };
}
function create_each_block_5(ctx) {
  let button;
  let t_1_value = (
    /*w*/
    ctx[57] + ""
  );
  let t_1;
  let mounted;
  let dispose;
  function click_handler_3() {
    return (
      /*click_handler_3*/
      ctx[30](
        /*w*/
        ctx[57]
      )
    );
  }
  return {
    c() {
      button = element("button");
      t_1 = text(t_1_value);
      attr(button, "class", "el-related-w");
    },
    m(target, anchor) {
      insert(target, button, anchor);
      append(button, t_1);
      if (!mounted) {
        dispose = listen(button, "click", click_handler_3);
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (dirty[0] & /*synonyms*/
      4 && t_1_value !== (t_1_value = /*w*/
      ctx[57] + "")) set_data(t_1, t_1_value);
    },
    d(detaching) {
      if (detaching) {
        detach(button);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_122(ctx) {
  let span;
  let t1;
  let each_1_anchor;
  let each_value_4 = ensure_array_like(
    /*antonyms*/
    ctx[3]
  );
  let each_blocks = [];
  for (let i = 0; i < each_value_4.length; i += 1) {
    each_blocks[i] = create_each_block_4(get_each_context_4(ctx, each_value_4, i));
  }
  return {
    c() {
      span = element("span");
      span.textContent = "\u2194\uFE0F \u53CD\u4E49";
      t1 = space();
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      each_1_anchor = empty();
      attr(span, "title", "\u53CD\u4E49\u8BCD\uFF0C\u70B9\u51FB\u53D1\u97F3");
    },
    m(target, anchor) {
      insert(target, span, anchor);
      insert(target, t1, anchor);
      for (let i = 0; i < each_blocks.length; i += 1) {
        if (each_blocks[i]) {
          each_blocks[i].m(target, anchor);
        }
      }
      insert(target, each_1_anchor, anchor);
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*plugin, antonyms*/
      10) {
        each_value_4 = ensure_array_like(
          /*antonyms*/
          ctx2[3]
        );
        let i;
        for (i = 0; i < each_value_4.length; i += 1) {
          const child_ctx = get_each_context_4(ctx2, each_value_4, i);
          if (each_blocks[i]) {
            each_blocks[i].p(child_ctx, dirty);
          } else {
            each_blocks[i] = create_each_block_4(child_ctx);
            each_blocks[i].c();
            each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
          }
        }
        for (; i < each_blocks.length; i += 1) {
          each_blocks[i].d(1);
        }
        each_blocks.length = each_value_4.length;
      }
    },
    d(detaching) {
      if (detaching) {
        detach(span);
        detach(t1);
        detach(each_1_anchor);
      }
      destroy_each(each_blocks, detaching);
    }
  };
}
function create_each_block_4(ctx) {
  let button;
  let t_1_value = (
    /*w*/
    ctx[57] + ""
  );
  let t_1;
  let mounted;
  let dispose;
  function click_handler_4() {
    return (
      /*click_handler_4*/
      ctx[31](
        /*w*/
        ctx[57]
      )
    );
  }
  return {
    c() {
      button = element("button");
      t_1 = text(t_1_value);
      attr(button, "class", "el-related-w el-related-ant");
    },
    m(target, anchor) {
      insert(target, button, anchor);
      append(button, t_1);
      if (!mounted) {
        dispose = listen(button, "click", click_handler_4);
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (dirty[0] & /*antonyms*/
      8 && t_1_value !== (t_1_value = /*w*/
      ctx[57] + "")) set_data(t_1, t_1_value);
    },
    d(detaching) {
      if (detaching) {
        detach(button);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_102(ctx) {
  let div;
  let span;
  let t1;
  let each_value_3 = ensure_array_like(
    /*dictRel*/
    ctx[11]
  );
  let each_blocks = [];
  for (let i = 0; i < each_value_3.length; i += 1) {
    each_blocks[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
  }
  return {
    c() {
      div = element("div");
      span = element("span");
      span.textContent = "\u{1F331} \u540C\u6839";
      t1 = space();
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      attr(span, "title", "\u540C\u6839\u8BCD\uFF08\u8BCD\u5178\uFF09\uFF0C\u70B9\u51FB\u53D1\u97F3");
      attr(div, "class", "el-related-row");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, span);
      append(div, t1);
      for (let i = 0; i < each_blocks.length; i += 1) {
        if (each_blocks[i]) {
          each_blocks[i].m(div, null);
        }
      }
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*dictRel, plugin*/
      2050) {
        each_value_3 = ensure_array_like(
          /*dictRel*/
          ctx2[11]
        );
        let i;
        for (i = 0; i < each_value_3.length; i += 1) {
          const child_ctx = get_each_context_3(ctx2, each_value_3, i);
          if (each_blocks[i]) {
            each_blocks[i].p(child_ctx, dirty);
          } else {
            each_blocks[i] = create_each_block_3(child_ctx);
            each_blocks[i].c();
            each_blocks[i].m(div, null);
          }
        }
        for (; i < each_blocks.length; i += 1) {
          each_blocks[i].d(1);
        }
        each_blocks.length = each_value_3.length;
      }
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
      destroy_each(each_blocks, detaching);
    }
  };
}
function create_each_block_3(ctx) {
  let button;
  let t_1_value = (
    /*w*/
    ctx[57] + ""
  );
  let t_1;
  let button_title_value;
  let mounted;
  let dispose;
  function click_handler_5() {
    return (
      /*click_handler_5*/
      ctx[32](
        /*w*/
        ctx[57]
      )
    );
  }
  return {
    c() {
      button = element("button");
      t_1 = text(t_1_value);
      attr(button, "class", "el-related-w");
      attr(button, "title", button_title_value = /*t*/
      ctx[61] || "\u70B9\u51FB\u53D1\u97F3");
    },
    m(target, anchor) {
      insert(target, button, anchor);
      append(button, t_1);
      if (!mounted) {
        dispose = listen(button, "click", click_handler_5);
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (dirty[0] & /*dictRel*/
      2048 && t_1_value !== (t_1_value = /*w*/
      ctx[57] + "")) set_data(t_1, t_1_value);
      if (dirty[0] & /*dictRel*/
      2048 && button_title_value !== (button_title_value = /*t*/
      ctx[61] || "\u70B9\u51FB\u53D1\u97F3")) {
        attr(button, "title", button_title_value);
      }
    },
    d(detaching) {
      if (detaching) {
        detach(button);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_82(ctx) {
  let div;
  let span;
  let t1;
  function select_block_type_1(ctx2, dirty) {
    if (
      /*dictWf*/
      ctx2[13].lemma
    ) return create_if_block_92;
    return create_else_block_12;
  }
  let current_block_type = select_block_type_1(ctx, [-1, -1, -1]);
  let if_block = current_block_type(ctx);
  return {
    c() {
      div = element("div");
      span = element("span");
      span.textContent = "\u{1F500} \u8BCD\u5F62";
      t1 = space();
      if_block.c();
      attr(span, "title", "\u8BCD\u5F62\u53D8\u5316\uFF08\u8BCD\u5178\uFF09\uFF0C\u70B9\u51FB\u53D1\u97F3");
      attr(div, "class", "el-related-row");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, span);
      append(div, t1);
      if_block.m(div, null);
    },
    p(ctx2, dirty) {
      if (current_block_type === (current_block_type = select_block_type_1(ctx2, dirty)) && if_block) {
        if_block.p(ctx2, dirty);
      } else {
        if_block.d(1);
        if_block = current_block_type(ctx2);
        if (if_block) {
          if_block.c();
          if_block.m(div, null);
        }
      }
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
      if_block.d();
    }
  };
}
function create_else_block_12(ctx) {
  let each_1_anchor;
  let each_value_2 = ensure_array_like(
    /*dictWf*/
    ctx[13].forms
  );
  let each_blocks = [];
  for (let i = 0; i < each_value_2.length; i += 1) {
    each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
  }
  return {
    c() {
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      each_1_anchor = empty();
    },
    m(target, anchor) {
      for (let i = 0; i < each_blocks.length; i += 1) {
        if (each_blocks[i]) {
          each_blocks[i].m(target, anchor);
        }
      }
      insert(target, each_1_anchor, anchor);
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*plugin, dictWf*/
      8194) {
        each_value_2 = ensure_array_like(
          /*dictWf*/
          ctx2[13].forms
        );
        let i;
        for (i = 0; i < each_value_2.length; i += 1) {
          const child_ctx = get_each_context_2(ctx2, each_value_2, i);
          if (each_blocks[i]) {
            each_blocks[i].p(child_ctx, dirty);
          } else {
            each_blocks[i] = create_each_block_2(child_ctx);
            each_blocks[i].c();
            each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
          }
        }
        for (; i < each_blocks.length; i += 1) {
          each_blocks[i].d(1);
        }
        each_blocks.length = each_value_2.length;
      }
    },
    d(detaching) {
      if (detaching) {
        detach(each_1_anchor);
      }
      destroy_each(each_blocks, detaching);
    }
  };
}
function create_if_block_92(ctx) {
  let button;
  let t0_value = (
    /*dictWf*/
    ctx[13].lemma + ""
  );
  let t0;
  let span;
  let mounted;
  let dispose;
  return {
    c() {
      button = element("button");
      t0 = text(t0_value);
      span = element("span");
      span.textContent = "\u539F\u5F62";
      attr(span, "class", "el-wf-tag");
      attr(button, "class", "el-related-w");
      attr(button, "title", "\u672C\u8BCD\u7684\u539F\u5F62\uFF0C\u70B9\u51FB\u53D1\u97F3");
    },
    m(target, anchor) {
      insert(target, button, anchor);
      append(button, t0);
      append(button, span);
      if (!mounted) {
        dispose = listen(
          button,
          "click",
          /*click_handler_6*/
          ctx[33]
        );
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*dictWf*/
      8192 && t0_value !== (t0_value = /*dictWf*/
      ctx2[13].lemma + "")) set_data(t0, t0_value);
    },
    d(detaching) {
      if (detaching) {
        detach(button);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_each_block_2(ctx) {
  let button;
  let t0_value = (
    /*w*/
    ctx[57] + ""
  );
  let t0;
  let span;
  let t1_value = (
    /*label*/
    ctx[58] + ""
  );
  let t1;
  let mounted;
  let dispose;
  function click_handler_7() {
    return (
      /*click_handler_7*/
      ctx[34](
        /*w*/
        ctx[57]
      )
    );
  }
  return {
    c() {
      button = element("button");
      t0 = text(t0_value);
      span = element("span");
      t1 = text(t1_value);
      attr(span, "class", "el-wf-tag");
      attr(button, "class", "el-related-w");
      attr(button, "title", "\u70B9\u51FB\u53D1\u97F3");
    },
    m(target, anchor) {
      insert(target, button, anchor);
      append(button, t0);
      append(button, span);
      append(span, t1);
      if (!mounted) {
        dispose = listen(button, "click", click_handler_7);
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (dirty[0] & /*dictWf*/
      8192 && t0_value !== (t0_value = /*w*/
      ctx[57] + "")) set_data(t0, t0_value);
      if (dirty[0] & /*dictWf*/
      8192 && t1_value !== (t1_value = /*label*/
      ctx[58] + "")) set_data(t1, t1_value);
    },
    d(detaching) {
      if (detaching) {
        detach(button);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_22(ctx) {
  let div;
  let each_value = ensure_array_like(
    /*doc*/
    ctx[0].examples
  );
  let each_blocks = [];
  for (let i = 0; i < each_value.length; i += 1) {
    each_blocks[i] = create_each_block3(get_each_context3(ctx, each_value, i));
  }
  return {
    c() {
      div = element("div");
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      attr(div, "class", "el-examples");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      for (let i = 0; i < each_blocks.length; i += 1) {
        if (each_blocks[i]) {
          each_blocks[i].m(div, null);
        }
      }
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*readExample, doc, delExample, segsList, tokClick*/
      1212929) {
        each_value = ensure_array_like(
          /*doc*/
          ctx2[0].examples
        );
        let i;
        for (i = 0; i < each_value.length; i += 1) {
          const child_ctx = get_each_context3(ctx2, each_value, i);
          if (each_blocks[i]) {
            each_blocks[i].p(child_ctx, dirty);
          } else {
            each_blocks[i] = create_each_block3(child_ctx);
            each_blocks[i].c();
            each_blocks[i].m(div, null);
          }
        }
        for (; i < each_blocks.length; i += 1) {
          each_blocks[i].d(1);
        }
        each_blocks.length = each_value.length;
      }
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
      destroy_each(each_blocks, detaching);
    }
  };
}
function create_else_block3(ctx) {
  let t_1_value = (
    /*seg*/
    ctx[54].t + ""
  );
  let t_1;
  return {
    c() {
      t_1 = text(t_1_value);
    },
    m(target, anchor) {
      insert(target, t_1, anchor);
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*segsList*/
      512 && t_1_value !== (t_1_value = /*seg*/
      ctx2[54].t + "")) set_data(t_1, t_1_value);
    },
    d(detaching) {
      if (detaching) {
        detach(t_1);
      }
    }
  };
}
function create_if_block_72(ctx) {
  let span;
  let t_1_value = (
    /*seg*/
    ctx[54].t + ""
  );
  let t_1;
  let mounted;
  let dispose;
  function click_handler_10() {
    return (
      /*click_handler_10*/
      ctx[39](
        /*seg*/
        ctx[54]
      )
    );
  }
  function keydown_handler_5(...args) {
    return (
      /*keydown_handler_5*/
      ctx[40](
        /*seg*/
        ctx[54],
        ...args
      )
    );
  }
  return {
    c() {
      span = element("span");
      t_1 = text(t_1_value);
      attr(span, "class", "el-tok el-tok-new");
      attr(span, "title", "\u672A\u6536\u5F55\uFF0C\u70B9\u51FB\u6536\u5F55");
      attr(span, "role", "button");
      attr(span, "tabindex", "-1");
    },
    m(target, anchor) {
      insert(target, span, anchor);
      append(span, t_1);
      if (!mounted) {
        dispose = [
          listen(span, "click", stop_propagation(click_handler_10)),
          listen(span, "keydown", keydown_handler_5)
        ];
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (dirty[0] & /*segsList*/
      512 && t_1_value !== (t_1_value = /*seg*/
      ctx[54].t + "")) set_data(t_1, t_1_value);
    },
    d(detaching) {
      if (detaching) {
        detach(span);
      }
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_if_block_62(ctx) {
  let span;
  let t_1_value = (
    /*seg*/
    ctx[54].t + ""
  );
  let t_1;
  let mounted;
  let dispose;
  function click_handler_9() {
    return (
      /*click_handler_9*/
      ctx[37](
        /*seg*/
        ctx[54]
      )
    );
  }
  function keydown_handler_4(...args) {
    return (
      /*keydown_handler_4*/
      ctx[38](
        /*seg*/
        ctx[54],
        ...args
      )
    );
  }
  return {
    c() {
      span = element("span");
      t_1 = text(t_1_value);
      attr(span, "class", "el-tok");
      attr(span, "title", "\u5DF2\u6536\u5F55\uFF0C\u70B9\u51FB\u67E5\u770B\u8BCD\u5361");
      attr(span, "role", "button");
      attr(span, "tabindex", "-1");
    },
    m(target, anchor) {
      insert(target, span, anchor);
      append(span, t_1);
      if (!mounted) {
        dispose = [
          listen(span, "click", stop_propagation(click_handler_9)),
          listen(span, "keydown", keydown_handler_4)
        ];
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (dirty[0] & /*segsList*/
      512 && t_1_value !== (t_1_value = /*seg*/
      ctx[54].t + "")) set_data(t_1, t_1_value);
    },
    d(detaching) {
      if (detaching) {
        detach(span);
      }
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_if_block_52(ctx) {
  let span;
  let t_1_value = (
    /*seg*/
    ctx[54].t + ""
  );
  let t_1;
  let mounted;
  let dispose;
  function click_handler_8() {
    return (
      /*click_handler_8*/
      ctx[35](
        /*seg*/
        ctx[54]
      )
    );
  }
  function keydown_handler_3(...args) {
    return (
      /*keydown_handler_3*/
      ctx[36](
        /*seg*/
        ctx[54],
        ...args
      )
    );
  }
  return {
    c() {
      span = element("span");
      t_1 = text(t_1_value);
      attr(span, "class", "el-rel");
      attr(span, "title", "\u540C\u4E3B\u9898\u5DF2\u6536\u5F55\u8BCD\uFF0C\u70B9\u51FB\u67E5\u770B\u8BCD\u5361");
      attr(span, "role", "button");
      attr(span, "tabindex", "-1");
    },
    m(target, anchor) {
      insert(target, span, anchor);
      append(span, t_1);
      if (!mounted) {
        dispose = [
          listen(span, "click", stop_propagation(click_handler_8)),
          listen(span, "keydown", keydown_handler_3)
        ];
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (dirty[0] & /*segsList*/
      512 && t_1_value !== (t_1_value = /*seg*/
      ctx[54].t + "")) set_data(t_1, t_1_value);
    },
    d(detaching) {
      if (detaching) {
        detach(span);
      }
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_each_block_12(ctx) {
  let if_block_anchor;
  function select_block_type_2(ctx2, dirty) {
    if (
      /*seg*/
      ctx2[54].kind === "rel"
    ) return create_if_block_52;
    if (
      /*seg*/
      ctx2[54].kind === "lib"
    ) return create_if_block_62;
    if (
      /*seg*/
      ctx2[54].kind === "new"
    ) return create_if_block_72;
    return create_else_block3;
  }
  let current_block_type = select_block_type_2(ctx, [-1, -1, -1]);
  let if_block = current_block_type(ctx);
  return {
    c() {
      if_block.c();
      if_block_anchor = empty();
    },
    m(target, anchor) {
      if_block.m(target, anchor);
      insert(target, if_block_anchor, anchor);
    },
    p(ctx2, dirty) {
      if (current_block_type === (current_block_type = select_block_type_2(ctx2, dirty)) && if_block) {
        if_block.p(ctx2, dirty);
      } else {
        if_block.d(1);
        if_block = current_block_type(ctx2);
        if (if_block) {
          if_block.c();
          if_block.m(if_block_anchor.parentNode, if_block_anchor);
        }
      }
    },
    d(detaching) {
      if (detaching) {
        detach(if_block_anchor);
      }
      if_block.d(detaching);
    }
  };
}
function create_if_block_42(ctx) {
  let span;
  let t0;
  let t1_value = (
    /*e*/
    ctx[51].source + ""
  );
  let t1;
  return {
    c() {
      span = element("span");
      t0 = text("\u2014\u2014 ");
      t1 = text(t1_value);
      attr(span, "class", "el-example-src");
    },
    m(target, anchor) {
      insert(target, span, anchor);
      append(span, t0);
      append(span, t1);
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*doc*/
      1 && t1_value !== (t1_value = /*e*/
      ctx2[51].source + "")) set_data(t1, t1_value);
    },
    d(detaching) {
      if (detaching) {
        detach(span);
      }
    }
  };
}
function create_if_block_32(ctx) {
  let div;
  let t_1_value = (
    /*e*/
    ctx[51].translation + ""
  );
  let t_1;
  return {
    c() {
      div = element("div");
      t_1 = text(t_1_value);
      attr(div, "class", "el-example-zh");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, t_1);
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*doc*/
      1 && t_1_value !== (t_1_value = /*e*/
      ctx2[51].translation + "")) set_data(t_1, t_1_value);
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
    }
  };
}
function create_each_block3(ctx) {
  var _a;
  let div;
  let button0;
  let button1;
  let t2;
  let mounted;
  let dispose;
  let each_value_1 = ensure_array_like(
    /*segsList*/
    (_a = ctx[9][
      /*ei*/
      ctx[53]
    ]) != null ? _a : []
  );
  let each_blocks = [];
  for (let i = 0; i < each_value_1.length; i += 1) {
    each_blocks[i] = create_each_block_12(get_each_context_12(ctx, each_value_1, i));
  }
  function click_handler_11() {
    return (
      /*click_handler_11*/
      ctx[41](
        /*e*/
        ctx[51]
      )
    );
  }
  let if_block0 = (
    /*e*/
    ctx[51].source && create_if_block_42(ctx)
  );
  function click_handler_12() {
    return (
      /*click_handler_12*/
      ctx[42](
        /*ei*/
        ctx[53]
      )
    );
  }
  let if_block1 = (
    /*e*/
    ctx[51].translation && create_if_block_32(ctx)
  );
  function click_handler_13() {
    return (
      /*click_handler_13*/
      ctx[43](
        /*e*/
        ctx[51]
      )
    );
  }
  function keydown_handler_6(...args) {
    return (
      /*keydown_handler_6*/
      ctx[44](
        /*e*/
        ctx[51],
        ...args
      )
    );
  }
  return {
    c() {
      div = element("div");
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      button0 = element("button");
      button0.textContent = "\u{1F50A}";
      if (if_block0) if_block0.c();
      button1 = element("button");
      button1.textContent = "\u2715";
      if (if_block1) if_block1.c();
      t2 = space();
      attr(button0, "class", "el-example-tts");
      attr(button0, "title", "\u6717\u8BFB\u4F8B\u53E5");
      attr(button1, "class", "el-example-del");
      attr(button1, "title", "\u5220\u9664\u8FD9\u6761\u4F8B\u53E5\uFF08\u5199\u56DE\u8BCD\u7B14\u8BB0\uFF09");
      attr(div, "class", "el-example");
      attr(div, "role", "button");
      attr(div, "tabindex", "0");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      for (let i = 0; i < each_blocks.length; i += 1) {
        if (each_blocks[i]) {
          each_blocks[i].m(div, null);
        }
      }
      append(div, button0);
      if (if_block0) if_block0.m(div, null);
      append(div, button1);
      if (if_block1) if_block1.m(div, null);
      append(div, t2);
      if (!mounted) {
        dispose = [
          listen(button0, "click", stop_propagation(click_handler_11)),
          listen(button1, "click", stop_propagation(click_handler_12)),
          listen(div, "click", click_handler_13),
          listen(div, "keydown", keydown_handler_6)
        ];
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      var _a2;
      ctx = new_ctx;
      if (dirty[0] & /*tokClick, segsList*/
      1049088) {
        each_value_1 = ensure_array_like(
          /*segsList*/
          (_a2 = ctx[9][
            /*ei*/
            ctx[53]
          ]) != null ? _a2 : []
        );
        let i;
        for (i = 0; i < each_value_1.length; i += 1) {
          const child_ctx = get_each_context_12(ctx, each_value_1, i);
          if (each_blocks[i]) {
            each_blocks[i].p(child_ctx, dirty);
          } else {
            each_blocks[i] = create_each_block_12(child_ctx);
            each_blocks[i].c();
            each_blocks[i].m(div, button0);
          }
        }
        for (; i < each_blocks.length; i += 1) {
          each_blocks[i].d(1);
        }
        each_blocks.length = each_value_1.length;
      }
      if (
        /*e*/
        ctx[51].source
      ) {
        if (if_block0) {
          if_block0.p(ctx, dirty);
        } else {
          if_block0 = create_if_block_42(ctx);
          if_block0.c();
          if_block0.m(div, button1);
        }
      } else if (if_block0) {
        if_block0.d(1);
        if_block0 = null;
      }
      if (
        /*e*/
        ctx[51].translation
      ) {
        if (if_block1) {
          if_block1.p(ctx, dirty);
        } else {
          if_block1 = create_if_block_32(ctx);
          if_block1.c();
          if_block1.m(div, t2);
        }
      } else if (if_block1) {
        if_block1.d(1);
        if_block1 = null;
      }
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
      destroy_each(each_blocks, detaching);
      if (if_block0) if_block0.d();
      if (if_block1) if_block1.d();
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_fragment4(ctx) {
  let div;
  let t0_value = (
    /*doc*/
    ctx[0].word + ""
  );
  let t0;
  let show_if = isPhrase(
    /*doc*/
    ctx[0].word
  );
  let span;
  let t2;
  let t3;
  let t4;
  let button;
  let t5_value = (
    /*hasAudio*/
    ctx[6] ? "\u{1F464}" : "\u{1F50A}"
  );
  let t5;
  let button_title_value;
  let t6;
  let if_block3_anchor;
  let current;
  let mounted;
  let dispose;
  let if_block0 = show_if && create_if_block_19(ctx);
  let if_block1 = (
    /*doc*/
    ctx[0].phonetic && create_if_block_18(ctx)
  );
  let if_block2 = (
    /*showAi*/
    ctx[4] && create_if_block_17(ctx)
  );
  let if_block3 = (
    /*showBody*/
    ctx[5] && create_if_block3(ctx)
  );
  return {
    c() {
      div = element("div");
      t0 = text(t0_value);
      if (if_block0) if_block0.c();
      span = element("span");
      span.textContent = "\u270F\uFE0F";
      t2 = space();
      if (if_block1) if_block1.c();
      t3 = space();
      if (if_block2) if_block2.c();
      t4 = space();
      button = element("button");
      t5 = text(t5_value);
      t6 = space();
      if (if_block3) if_block3.c();
      if_block3_anchor = empty();
      attr(span, "class", "el-word-edit");
      attr(div, "class", "el-word el-word-link");
      attr(div, "title", "\u70B9\u51FB\u7F16\u8F91\u8BCD\u7B14\u8BB0");
      attr(div, "role", "button");
      attr(div, "tabindex", "0");
      attr(button, "class", "el-tts");
      attr(button, "title", button_title_value = /*hasAudio*/
      ctx[6] ? "\u6807\u51C6\u53D1\u97F3" : "\u7CFB\u7EDF TTS \u64AD\u653E\uFF0C\u70B9\u51FB\u540E\u81EA\u52A8\u7F13\u5B58\u6807\u51C6\u97F3");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, t0);
      if (if_block0) if_block0.m(div, null);
      append(div, span);
      insert(target, t2, anchor);
      if (if_block1) if_block1.m(target, anchor);
      insert(target, t3, anchor);
      if (if_block2) if_block2.m(target, anchor);
      insert(target, t4, anchor);
      insert(target, button, anchor);
      append(button, t5);
      insert(target, t6, anchor);
      if (if_block3) if_block3.m(target, anchor);
      insert(target, if_block3_anchor, anchor);
      current = true;
      if (!mounted) {
        dispose = [
          listen(
            div,
            "click",
            /*openWordNote*/
            ctx[14]
          ),
          listen(
            div,
            "keydown",
            /*keydown_handler*/
            ctx[24]
          ),
          listen(
            button,
            "click",
            /*click_handler_2*/
            ctx[27]
          )
        ];
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if ((!current || dirty[0] & /*doc*/
      1) && t0_value !== (t0_value = /*doc*/
      ctx2[0].word + "")) set_data(t0, t0_value);
      if (dirty[0] & /*doc*/
      1) show_if = isPhrase(
        /*doc*/
        ctx2[0].word
      );
      if (show_if) {
        if (if_block0) {
        } else {
          if_block0 = create_if_block_19(ctx2);
          if_block0.c();
          if_block0.m(div, span);
        }
      } else if (if_block0) {
        if_block0.d(1);
        if_block0 = null;
      }
      if (
        /*doc*/
        ctx2[0].phonetic
      ) {
        if (if_block1) {
          if_block1.p(ctx2, dirty);
        } else {
          if_block1 = create_if_block_18(ctx2);
          if_block1.c();
          if_block1.m(t3.parentNode, t3);
        }
      } else if (if_block1) {
        if_block1.d(1);
        if_block1 = null;
      }
      if (
        /*showAi*/
        ctx2[4]
      ) {
        if (if_block2) {
          if_block2.p(ctx2, dirty);
        } else {
          if_block2 = create_if_block_17(ctx2);
          if_block2.c();
          if_block2.m(t4.parentNode, t4);
        }
      } else if (if_block2) {
        if_block2.d(1);
        if_block2 = null;
      }
      if ((!current || dirty[0] & /*hasAudio*/
      64) && t5_value !== (t5_value = /*hasAudio*/
      ctx2[6] ? "\u{1F464}" : "\u{1F50A}")) set_data(t5, t5_value);
      if (!current || dirty[0] & /*hasAudio*/
      64 && button_title_value !== (button_title_value = /*hasAudio*/
      ctx2[6] ? "\u6807\u51C6\u53D1\u97F3" : "\u7CFB\u7EDF TTS \u64AD\u653E\uFF0C\u70B9\u51FB\u540E\u81EA\u52A8\u7F13\u5B58\u6807\u51C6\u97F3")) {
        attr(button, "title", button_title_value);
      }
      if (
        /*showBody*/
        ctx2[5]
      ) {
        if (if_block3) {
          if_block3.p(ctx2, dirty);
          if (dirty[0] & /*showBody*/
          32) {
            transition_in(if_block3, 1);
          }
        } else {
          if_block3 = create_if_block3(ctx2);
          if_block3.c();
          transition_in(if_block3, 1);
          if_block3.m(if_block3_anchor.parentNode, if_block3_anchor);
        }
      } else if (if_block3) {
        group_outros();
        transition_out(if_block3, 1, 1, () => {
          if_block3 = null;
        });
        check_outros();
      }
    },
    i(local) {
      if (current) return;
      transition_in(if_block3);
      current = true;
    },
    o(local) {
      transition_out(if_block3);
      current = false;
    },
    d(detaching) {
      if (detaching) {
        detach(div);
        detach(t2);
        detach(t3);
        detach(t4);
        detach(button);
        detach(t6);
        detach(if_block3_anchor);
      }
      if (if_block0) if_block0.d();
      if (if_block1) if_block1.d(detaching);
      if (if_block2) if_block2.d(detaching);
      if (if_block3) if_block3.d(detaching);
      mounted = false;
      run_all(dispose);
    }
  };
}
function instance4($$self, $$props, $$invalidate) {
  let { plugin } = $$props;
  let { doc } = $$props;
  let { synonyms = [] } = $$props;
  let { antonyms = [] } = $$props;
  let { showAi = true } = $$props;
  let { showBody = true } = $$props;
  let hasAudio = false;
  let audioSeq = 0;
  async function checkAudio(w) {
    const gen = ++audioSeq;
    const ok = w ? await plugin.audio.has(w) : false;
    if (gen === audioSeq) $$invalidate(6, hasAudio = ok);
  }
  onDestroy(plugin.audio.onCached(() => void checkAudio(doc.word)));
  function openWordNote() {
    void plugin.app.workspace.openLinkText(doc.path, "", true);
  }
  function readExample(text2) {
    var _a;
    speak(text2, (_a = plugin.db.settings.ttsSentenceRate) !== null && _a !== void 0 ? _a : plugin.db.settings.ttsRate);
  }
  function editMemo() {
    new MemoModal(plugin.app, plugin, doc, () => $$invalidate(0, doc)).open();
  }
  async function delExample(index) {
    if (!await confirmOk(plugin.app, "\u5220\u9664\u8FD9\u6761\u4F8B\u53E5\uFF1F\u8BCD\u7B14\u8BB0\u540C\u6B65\u66F4\u65B0\u3002", "\u5220\u9664")) return;
    await plugin.words.removeExample(doc, index);
    $$invalidate(0, doc);
  }
  let aiBusy = false;
  async function aiExamples() {
    if (aiBusy) return;
    $$invalidate(7, aiBusy = true);
    try {
      await plugin.aiExamplesFor(doc);
      $$invalidate(0, doc);
    } finally {
      $$invalidate(7, aiBusy = false);
    }
  }
  let sensesBusy = false;
  async function aiSenses() {
    if (sensesBusy) return;
    $$invalidate(8, sensesBusy = true);
    try {
      await plugin.aiSensesFor(doc);
      $$invalidate(0, doc);
    } finally {
      $$invalidate(8, sensesBusy = false);
    }
  }
  let relatedList = [];
  function relatedWords(d) {
    var _a;
    const set2 = /* @__PURE__ */ new Set();
    for (const t of d.themes) {
      for (const w of plugin.words.themeWords(t)) {
        if (w !== d.word && !((_a = plugin.db.ignored) === null || _a === void 0 ? void 0 : _a[w])) set2.add(w);
      }
    }
    return [...set2];
  }
  function splitExample(text2) {
    const segs = [];
    const re = /[A-Za-z][A-Za-z'-]*/g;
    let last = 0;
    let m;
    const self = doc.word.toLowerCase();
    while ((m = re.exec(text2)) !== null) {
      const tok = m[0];
      if (m.index > last) segs.push({ t: text2.slice(last, m.index) });
      const lw = tok.toLowerCase();
      let kind;
      if (lw === self || isForm(tok, self)) kind = void 0;
      else if (relatedList.includes(lw) || relatedList.some((w) => isForm(tok, w))) kind = "rel";
      else if (plugin.words.get(lw)) kind = "lib";
      else if (!isFrequentForm(lw) && !/'(?:s|t|re|ve|ll|d|m)$/.test(lw)) kind = "new";
      segs.push({ t: tok, kind });
      last = m.index + tok.length;
    }
    if (last < text2.length) segs.push({ t: text2.slice(last) });
    return segs;
  }
  let libVer = 0;
  let segsList = [];
  function tokClick(seg) {
    if (seg.kind === "new") {
      new AddWordModal(plugin.app, plugin, seg.t, () => $$invalidate(22, libVer += 1), doc.themes[0]).open();
      return;
    }
    const d = plugin.words.resolveWord(seg.t);
    if (d) plugin.openWordCard(d);
    else plugin.speakWord(seg.t);
  }
  let showAllEx = false;
  let shownWord = doc.word;
  let dictRel = [];
  let dictRem = "";
  let dictWf = null;
  async function loadDictExtra(word) {
    var _a, _b;
    $$invalidate(11, dictRel = []);
    $$invalidate(12, dictRem = "");
    $$invalidate(13, dictWf = null);
    try {
      const e = await plugin.dict.lookup(word);
      if (doc.word !== word) return;
      $$invalidate(11, dictRel = (_a = e === null || e === void 0 ? void 0 : e.rel) !== null && _a !== void 0 ? _a : []);
      $$invalidate(12, dictRem = (_b = e === null || e === void 0 ? void 0 : e.rem) !== null && _b !== void 0 ? _b : "");
      $$invalidate(13, dictWf = parseWf(word, e === null || e === void 0 ? void 0 : e.wf));
    } catch (_c) {
    }
  }
  const keydown_handler = (ev) => ev.key === "Enter" && openWordNote();
  const click_handler = () => void aiExamples();
  const click_handler_1 = () => void aiSenses();
  const click_handler_2 = () => plugin.speakWord(doc.word);
  const keydown_handler_1 = (ev) => ev.key === "Enter" && editMemo();
  const keydown_handler_2 = (ev) => ev.key === "Enter" && editMemo();
  const click_handler_3 = (w) => plugin.speakWord(w);
  const click_handler_4 = (w) => plugin.speakWord(w);
  const click_handler_5 = (w) => plugin.speakWord(w);
  const click_handler_6 = () => (dictWf == null ? void 0 : dictWf.lemma) && plugin.speakWord(dictWf.lemma);
  const click_handler_7 = (w) => plugin.speakWord(w);
  const click_handler_8 = (seg) => tokClick(seg);
  const keydown_handler_3 = (seg, ev) => ev.key === "Enter" && tokClick(seg);
  const click_handler_9 = (seg) => tokClick(seg);
  const keydown_handler_4 = (seg, ev) => ev.key === "Enter" && tokClick(seg);
  const click_handler_10 = (seg) => tokClick(seg);
  const keydown_handler_5 = (seg, ev) => ev.key === "Enter" && tokClick(seg);
  const click_handler_11 = (e) => readExample(e.text);
  const click_handler_12 = (ei) => void delExample(ei);
  const click_handler_13 = (e) => readExample(e.text);
  const keydown_handler_6 = (e, ev) => ev.key === "Enter" && readExample(e.text);
  const click_handler_14 = () => $$invalidate(10, showAllEx = !showAllEx);
  $$self.$$set = ($$props2) => {
    if ("plugin" in $$props2) $$invalidate(1, plugin = $$props2.plugin);
    if ("doc" in $$props2) $$invalidate(0, doc = $$props2.doc);
    if ("synonyms" in $$props2) $$invalidate(2, synonyms = $$props2.synonyms);
    if ("antonyms" in $$props2) $$invalidate(3, antonyms = $$props2.antonyms);
    if ("showAi" in $$props2) $$invalidate(4, showAi = $$props2.showAi);
    if ("showBody" in $$props2) $$invalidate(5, showBody = $$props2.showBody);
  };
  $$self.$$.update = () => {
    if ($$self.$$.dirty[0] & /*doc*/
    1) {
      $: void checkAudio(doc.word);
    }
    if ($$self.$$.dirty[0] & /*doc*/
    1) {
      $: $$invalidate(21, relatedList = relatedWords(doc));
    }
    if ($$self.$$.dirty[0] & /*relatedList, libVer, doc*/
    6291457) {
      $: $$invalidate(9, segsList = (relatedList, libVer, doc.examples.map((e) => splitExample(e.text))));
    }
    if ($$self.$$.dirty[0] & /*doc, shownWord*/
    8388609) {
      $: if (doc.word !== shownWord) {
        $$invalidate(23, shownWord = doc.word);
        $$invalidate(10, showAllEx = false);
      }
    }
    if ($$self.$$.dirty[0] & /*doc*/
    1) {
      $: loadDictExtra(doc.word);
    }
  };
  return [
    doc,
    plugin,
    synonyms,
    antonyms,
    showAi,
    showBody,
    hasAudio,
    aiBusy,
    sensesBusy,
    segsList,
    showAllEx,
    dictRel,
    dictRem,
    dictWf,
    openWordNote,
    readExample,
    editMemo,
    delExample,
    aiExamples,
    aiSenses,
    tokClick,
    relatedList,
    libVer,
    shownWord,
    keydown_handler,
    click_handler,
    click_handler_1,
    click_handler_2,
    keydown_handler_1,
    keydown_handler_2,
    click_handler_3,
    click_handler_4,
    click_handler_5,
    click_handler_6,
    click_handler_7,
    click_handler_8,
    keydown_handler_3,
    click_handler_9,
    keydown_handler_4,
    click_handler_10,
    keydown_handler_5,
    click_handler_11,
    click_handler_12,
    click_handler_13,
    keydown_handler_6,
    click_handler_14
  ];
}
var WordFullCard = class extends SvelteComponent {
  constructor(options) {
    super();
    init(
      this,
      options,
      instance4,
      create_fragment4,
      safe_not_equal,
      {
        plugin: 1,
        doc: 0,
        synonyms: 2,
        antonyms: 3,
        showAi: 4,
        showBody: 5
      },
      null,
      [-1, -1, -1]
    );
  }
};
var WordFullCard_default = WordFullCard;

// src/components/LearnSession.svelte
var { window: window_1 } = globals;
function get_each_context_22(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[106] = list[i];
  child_ctx[108] = i;
  return child_ctx;
}
function get_each_context4(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[101] = list[i];
  return child_ctx;
}
function get_each_context_13(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[101] = list[i];
  return child_ctx;
}
function create_if_block_192(ctx) {
  let div0;
  let span0;
  let t0;
  let t1;
  let t2_value = (
    /*hardMode*/
    ctx[10] ? " \xB7 \u96BE\u8BCD" : ""
  );
  let t2;
  let t3;
  let span2;
  let span1;
  let t4_value = (
    /*idx*/
    ctx[2] + 1 + ""
  );
  let t4;
  let t5;
  let t6;
  let t7;
  let helptip;
  let t8;
  let button0;
  let t10;
  let button1;
  let t12;
  let div2;
  let div1;
  let t13;
  let current_block_type_index;
  let if_block;
  let if_block_anchor;
  let current;
  let mounted;
  let dispose;
  helptip = new HelpTip_default({ props: { tip: KEYS_TIP } });
  const if_block_creators = [create_if_block_20, create_if_block_21, create_if_block_27, create_if_block_31];
  const if_blocks = [];
  function select_block_type_2(ctx2, dirty) {
    if (
      /*cur*/
      ctx2[6].kind === "new"
    ) return 0;
    if (
      /*cur*/
      ctx2[6].kind === "study" || /*cur*/
      ctx2[6].kind === "confirm" || /*cur*/
      ctx2[6].kind === "restudy"
    ) return 1;
    if (
      /*cur*/
      ctx2[6].kind === "review"
    ) return 2;
    if (
      /*cur*/
      ctx2[6].kind === "quiz"
    ) return 3;
    return -1;
  }
  if (~(current_block_type_index = select_block_type_2(ctx, [-1, -1, -1, -1]))) {
    if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
  }
  return {
    c() {
      div0 = element("div");
      span0 = element("span");
      t0 = text(
        /*themeLabel*/
        ctx[35]
      );
      t1 = text(
        /*roundLabel*/
        ctx[36]
      );
      t2 = text(t2_value);
      t3 = space();
      span2 = element("span");
      span1 = element("span");
      t4 = text(t4_value);
      t5 = text(" / ");
      t6 = text(
        /*total*/
        ctx[7]
      );
      t7 = space();
      create_component(helptip.$$.fragment);
      t8 = space();
      button0 = element("button");
      button0.textContent = "\u{1F5D1}";
      t10 = space();
      button1 = element("button");
      button1.textContent = "\u2715";
      t12 = space();
      div2 = element("div");
      div1 = element("div");
      t13 = space();
      if (if_block) if_block.c();
      if_block_anchor = empty();
      attr(button0, "class", "el-exit");
      attr(button0, "title", "\u5220\u9664\u5F53\u524D\u8BCD\uFF08\u7B14\u8BB0\u8FDB\u56DE\u6536\u7AD9\uFF0C\u8FDB\u5EA6\u4E00\u5E76\u6E05\u9664\uFF09");
      attr(button1, "class", "el-exit");
      attr(button1, "title", "\u7ED3\u675F\u672C\u8F6E\uFF08\u5DF2\u5B66\u8FDB\u5EA6\u5DF2\u4FDD\u5B58\uFF09");
      attr(span2, "class", "el-progress-right");
      attr(div0, "class", "el-progress-info");
      attr(div1, "class", "el-progress-fill");
      set_style(
        div1,
        "width",
        /*pct*/
        ctx[37] + "%"
      );
      attr(div2, "class", "el-progress-bar");
    },
    m(target, anchor) {
      insert(target, div0, anchor);
      append(div0, span0);
      append(span0, t0);
      append(span0, t1);
      append(span0, t2);
      append(div0, t3);
      append(div0, span2);
      append(span2, span1);
      append(span1, t4);
      append(span1, t5);
      append(span1, t6);
      append(span2, t7);
      mount_component(helptip, span2, null);
      append(span2, t8);
      append(span2, button0);
      append(span2, t10);
      append(span2, button1);
      insert(target, t12, anchor);
      insert(target, div2, anchor);
      append(div2, div1);
      insert(target, t13, anchor);
      if (~current_block_type_index) {
        if_blocks[current_block_type_index].m(target, anchor);
      }
      insert(target, if_block_anchor, anchor);
      current = true;
      if (!mounted) {
        dispose = [
          listen(
            button0,
            "click",
            /*deleteCurrent*/
            ctx[60]
          ),
          listen(
            button1,
            "click",
            /*finish*/
            ctx[57]
          )
        ];
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (!current || dirty[1] & /*themeLabel*/
      16) set_data(
        t0,
        /*themeLabel*/
        ctx2[35]
      );
      if (!current || dirty[1] & /*roundLabel*/
      32) set_data(
        t1,
        /*roundLabel*/
        ctx2[36]
      );
      if ((!current || dirty[0] & /*hardMode*/
      1024) && t2_value !== (t2_value = /*hardMode*/
      ctx2[10] ? " \xB7 \u96BE\u8BCD" : "")) set_data(t2, t2_value);
      if ((!current || dirty[0] & /*idx*/
      4) && t4_value !== (t4_value = /*idx*/
      ctx2[2] + 1 + "")) set_data(t4, t4_value);
      if (!current || dirty[0] & /*total*/
      128) set_data(
        t6,
        /*total*/
        ctx2[7]
      );
      if (!current || dirty[1] & /*pct*/
      64) {
        set_style(
          div1,
          "width",
          /*pct*/
          ctx2[37] + "%"
        );
      }
      let previous_block_index = current_block_type_index;
      current_block_type_index = select_block_type_2(ctx2, dirty);
      if (current_block_type_index === previous_block_index) {
        if (~current_block_type_index) {
          if_blocks[current_block_type_index].p(ctx2, dirty);
        }
      } else {
        if (if_block) {
          group_outros();
          transition_out(if_blocks[previous_block_index], 1, 1, () => {
            if_blocks[previous_block_index] = null;
          });
          check_outros();
        }
        if (~current_block_type_index) {
          if_block = if_blocks[current_block_type_index];
          if (!if_block) {
            if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx2);
            if_block.c();
          } else {
            if_block.p(ctx2, dirty);
          }
          transition_in(if_block, 1);
          if_block.m(if_block_anchor.parentNode, if_block_anchor);
        } else {
          if_block = null;
        }
      }
    },
    i(local) {
      if (current) return;
      transition_in(helptip.$$.fragment, local);
      transition_in(if_block);
      current = true;
    },
    o(local) {
      transition_out(helptip.$$.fragment, local);
      transition_out(if_block);
      current = false;
    },
    d(detaching) {
      if (detaching) {
        detach(div0);
        detach(t12);
        detach(div2);
        detach(t13);
        detach(if_block_anchor);
      }
      destroy_component(helptip);
      if (~current_block_type_index) {
        if_blocks[current_block_type_index].d(detaching);
      }
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_if_block_93(ctx) {
  let div3;
  let div0;
  let t1;
  let h2;
  let t2_value = (
    /*hardMode*/
    ctx[10] || /*themeName*/
    ctx[5] ? `${sessionLabel(
      /*themeName*/
      ctx[5],
      /*hardMode*/
      ctx[10]
    )}\u5B66\u4E60\u5B8C\u6210` : "\u4ECA\u65E5\u5B66\u4E60\u5B8C\u6210"
  );
  let t2;
  let t3;
  let div1;
  let span0;
  let t4;
  let t5_value = (
    /*stats*/
    ctx[12].rev + ""
  );
  let t5;
  let t6;
  let span1;
  let t7;
  let t8_value = (
    /*stats*/
    ctx[12].new + ""
  );
  let t8;
  let t9;
  let t10;
  let span2;
  let t11;
  let t12_value = (
    /*stats*/
    ctx[12].quizOk + /*stats*/
    ctx[12].quizBad > 0 ? `${/*stats*/
    ctx[12].quizOk}/${/*stats*/
    ctx[12].quizOk + /*stats*/
    ctx[12].quizBad}` : "\u2014"
  );
  let t12;
  let t13;
  let span3;
  let t14;
  let t15;
  let t16;
  let t17;
  let span4;
  let t18;
  let t19_value = (
    /*plugin*/
    ctx[0].db.stats.streak + ""
  );
  let t19;
  let t20;
  let t21;
  let t22;
  let t23;
  let t24;
  let t25;
  let t26;
  let div2;
  let t27;
  let t28;
  let t29;
  let button;
  let mounted;
  let dispose;
  let if_block0 = (
    /*stats*/
    ctx[12].easy && create_if_block_182(ctx)
  );
  let if_block1 = (
    /*todayTotals*/
    ctx[23].new + /*todayTotals*/
    ctx[23].rev > /*stats*/
    ctx[12].rev + /*stats*/
    ctx[12].new + /*stats*/
    ctx[12].easy && create_if_block_172(ctx)
  );
  let if_block2 = (
    /*masteredNow*/
    ctx[13].length && create_if_block_162(ctx)
  );
  let if_block3 = (
    /*weakNow*/
    ctx[38].length && create_if_block_153(ctx)
  );
  let if_block4 = !/*hardMode*/
  ctx[10] && /*dueTotal*/
  ctx[11] > /*stats*/
  ctx[12].rev && create_if_block_143(ctx);
  let if_block5 = (
    /*tomorrowDue*/
    ctx[22] > 0 && create_if_block_133(ctx)
  );
  let if_block6 = (
    /*remaining*/
    ctx[14] > 0 && create_if_block_123(ctx)
  );
  let if_block7 = !/*hardMode*/
  ctx[10] && /*remaining*/
  ctx[14] === 0 && /*finishFresh*/
  ctx[21] > 0 && /*dailyLimit*/
  ctx[19] > 0 && create_if_block_113(ctx);
  let if_block8 = !/*hardMode*/
  ctx[10] && /*hardInTheme*/
  ctx[28] > 0 && create_if_block_103(ctx);
  return {
    c() {
      div3 = element("div");
      div0 = element("div");
      div0.textContent = "\u{1F389}";
      t1 = space();
      h2 = element("h2");
      t2 = text(t2_value);
      t3 = space();
      div1 = element("div");
      span0 = element("span");
      t4 = text("\u590D\u4E60 ");
      t5 = text(t5_value);
      t6 = space();
      span1 = element("span");
      t7 = text("\u65B0\u5B66 ");
      t8 = text(t8_value);
      t9 = space();
      if (if_block0) if_block0.c();
      t10 = space();
      span2 = element("span");
      t11 = text("\u5DE9\u56FA ");
      t12 = text(t12_value);
      t13 = space();
      span3 = element("span");
      t14 = text("\u7528\u65F6 ");
      t15 = text(
        /*sessionMinutes*/
        ctx[24]
      );
      t16 = text(" \u5206\u949F");
      t17 = space();
      span4 = element("span");
      t18 = text("\u8FDE\u7EED ");
      t19 = text(t19_value);
      t20 = text(" \u5929");
      t21 = space();
      if (if_block1) if_block1.c();
      t22 = space();
      if (if_block2) if_block2.c();
      t23 = space();
      if (if_block3) if_block3.c();
      t24 = space();
      if (if_block4) if_block4.c();
      t25 = space();
      if (if_block5) if_block5.c();
      t26 = space();
      div2 = element("div");
      if (if_block6) if_block6.c();
      t27 = space();
      if (if_block7) if_block7.c();
      t28 = space();
      if (if_block8) if_block8.c();
      t29 = space();
      button = element("button");
      button.textContent = "\u8FD4\u56DE\u4E3B\u9898\u5E93";
      attr(div0, "class", "el-end-emoji");
      attr(div1, "class", "el-end-stats");
      set_style(div2, "margin-top", "14px");
      set_style(div2, "display", "flex");
      set_style(div2, "gap", "8px");
      set_style(div2, "justify-content", "center");
      attr(div3, "class", "el-card el-end");
    },
    m(target, anchor) {
      insert(target, div3, anchor);
      append(div3, div0);
      append(div3, t1);
      append(div3, h2);
      append(h2, t2);
      append(div3, t3);
      append(div3, div1);
      append(div1, span0);
      append(span0, t4);
      append(span0, t5);
      append(div1, t6);
      append(div1, span1);
      append(span1, t7);
      append(span1, t8);
      append(div1, t9);
      if (if_block0) if_block0.m(div1, null);
      append(div1, t10);
      append(div1, span2);
      append(span2, t11);
      append(span2, t12);
      append(div1, t13);
      append(div1, span3);
      append(span3, t14);
      append(span3, t15);
      append(span3, t16);
      append(div1, t17);
      append(div1, span4);
      append(span4, t18);
      append(span4, t19);
      append(span4, t20);
      append(div3, t21);
      if (if_block1) if_block1.m(div3, null);
      append(div3, t22);
      if (if_block2) if_block2.m(div3, null);
      append(div3, t23);
      if (if_block3) if_block3.m(div3, null);
      append(div3, t24);
      if (if_block4) if_block4.m(div3, null);
      append(div3, t25);
      if (if_block5) if_block5.m(div3, null);
      append(div3, t26);
      append(div3, div2);
      if (if_block6) if_block6.m(div2, null);
      append(div2, t27);
      if (if_block7) if_block7.m(div2, null);
      append(div2, t28);
      if (if_block8) if_block8.m(div2, null);
      append(div2, t29);
      append(div2, button);
      if (!mounted) {
        dispose = listen(
          button,
          "click",
          /*back*/
          ctx[61]
        );
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*hardMode, themeName*/
      1056 && t2_value !== (t2_value = /*hardMode*/
      ctx2[10] || /*themeName*/
      ctx2[5] ? `${sessionLabel(
        /*themeName*/
        ctx2[5],
        /*hardMode*/
        ctx2[10]
      )}\u5B66\u4E60\u5B8C\u6210` : "\u4ECA\u65E5\u5B66\u4E60\u5B8C\u6210")) set_data(t2, t2_value);
      if (dirty[0] & /*stats*/
      4096 && t5_value !== (t5_value = /*stats*/
      ctx2[12].rev + "")) set_data(t5, t5_value);
      if (dirty[0] & /*stats*/
      4096 && t8_value !== (t8_value = /*stats*/
      ctx2[12].new + "")) set_data(t8, t8_value);
      if (
        /*stats*/
        ctx2[12].easy
      ) {
        if (if_block0) {
          if_block0.p(ctx2, dirty);
        } else {
          if_block0 = create_if_block_182(ctx2);
          if_block0.c();
          if_block0.m(div1, t10);
        }
      } else if (if_block0) {
        if_block0.d(1);
        if_block0 = null;
      }
      if (dirty[0] & /*stats*/
      4096 && t12_value !== (t12_value = /*stats*/
      ctx2[12].quizOk + /*stats*/
      ctx2[12].quizBad > 0 ? `${/*stats*/
      ctx2[12].quizOk}/${/*stats*/
      ctx2[12].quizOk + /*stats*/
      ctx2[12].quizBad}` : "\u2014")) set_data(t12, t12_value);
      if (dirty[0] & /*sessionMinutes*/
      16777216) set_data(
        t15,
        /*sessionMinutes*/
        ctx2[24]
      );
      if (dirty[0] & /*plugin*/
      1 && t19_value !== (t19_value = /*plugin*/
      ctx2[0].db.stats.streak + "")) set_data(t19, t19_value);
      if (
        /*todayTotals*/
        ctx2[23].new + /*todayTotals*/
        ctx2[23].rev > /*stats*/
        ctx2[12].rev + /*stats*/
        ctx2[12].new + /*stats*/
        ctx2[12].easy
      ) {
        if (if_block1) {
          if_block1.p(ctx2, dirty);
        } else {
          if_block1 = create_if_block_172(ctx2);
          if_block1.c();
          if_block1.m(div3, t22);
        }
      } else if (if_block1) {
        if_block1.d(1);
        if_block1 = null;
      }
      if (
        /*masteredNow*/
        ctx2[13].length
      ) {
        if (if_block2) {
          if_block2.p(ctx2, dirty);
        } else {
          if_block2 = create_if_block_162(ctx2);
          if_block2.c();
          if_block2.m(div3, t23);
        }
      } else if (if_block2) {
        if_block2.d(1);
        if_block2 = null;
      }
      if (
        /*weakNow*/
        ctx2[38].length
      ) if_block3.p(ctx2, dirty);
      if (!/*hardMode*/
      ctx2[10] && /*dueTotal*/
      ctx2[11] > /*stats*/
      ctx2[12].rev) {
        if (if_block4) {
          if_block4.p(ctx2, dirty);
        } else {
          if_block4 = create_if_block_143(ctx2);
          if_block4.c();
          if_block4.m(div3, t25);
        }
      } else if (if_block4) {
        if_block4.d(1);
        if_block4 = null;
      }
      if (
        /*tomorrowDue*/
        ctx2[22] > 0
      ) {
        if (if_block5) {
          if_block5.p(ctx2, dirty);
        } else {
          if_block5 = create_if_block_133(ctx2);
          if_block5.c();
          if_block5.m(div3, t26);
        }
      } else if (if_block5) {
        if_block5.d(1);
        if_block5 = null;
      }
      if (
        /*remaining*/
        ctx2[14] > 0
      ) {
        if (if_block6) {
          if_block6.p(ctx2, dirty);
        } else {
          if_block6 = create_if_block_123(ctx2);
          if_block6.c();
          if_block6.m(div2, t27);
        }
      } else if (if_block6) {
        if_block6.d(1);
        if_block6 = null;
      }
      if (!/*hardMode*/
      ctx2[10] && /*remaining*/
      ctx2[14] === 0 && /*finishFresh*/
      ctx2[21] > 0 && /*dailyLimit*/
      ctx2[19] > 0) {
        if (if_block7) {
          if_block7.p(ctx2, dirty);
        } else {
          if_block7 = create_if_block_113(ctx2);
          if_block7.c();
          if_block7.m(div2, t28);
        }
      } else if (if_block7) {
        if_block7.d(1);
        if_block7 = null;
      }
      if (!/*hardMode*/
      ctx2[10] && /*hardInTheme*/
      ctx2[28] > 0) {
        if (if_block8) {
          if_block8.p(ctx2, dirty);
        } else {
          if_block8 = create_if_block_103(ctx2);
          if_block8.c();
          if_block8.m(div2, t29);
        }
      } else if (if_block8) {
        if_block8.d(1);
        if_block8 = null;
      }
    },
    i: noop,
    o: noop,
    d(detaching) {
      if (detaching) {
        detach(div3);
      }
      if (if_block0) if_block0.d();
      if (if_block1) if_block1.d();
      if (if_block2) if_block2.d();
      if (if_block3) if_block3.d();
      if (if_block4) if_block4.d();
      if (if_block5) if_block5.d();
      if (if_block6) if_block6.d();
      if (if_block7) if_block7.d();
      if (if_block8) if_block8.d();
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_43(ctx) {
  let div2;
  let div0;
  let t1;
  let t2;
  let div1;
  let t3;
  let show_if = (
    /*hardInThemeLive*/
    ctx[54]() > 0
  );
  let t4;
  let button;
  let mounted;
  let dispose;
  function select_block_type_1(ctx2, dirty) {
    if (
      /*hardMode*/
      ctx2[10]
    ) return create_if_block_73;
    if (
      /*themeName*/
      ctx2[5]
    ) return create_if_block_83;
    return create_else_block4;
  }
  let current_block_type = select_block_type_1(ctx, [-1, -1, -1, -1]);
  let if_block0 = current_block_type(ctx);
  let if_block1 = !/*hardMode*/
  ctx[10] && /*doneFresh*/
  ctx[20] > 0 && /*dailyLimit*/
  ctx[19] > 0 && create_if_block_63(ctx);
  let if_block2 = show_if && create_if_block_53(ctx);
  return {
    c() {
      div2 = element("div");
      div0 = element("div");
      div0.textContent = "\u2705";
      t1 = space();
      if_block0.c();
      t2 = space();
      div1 = element("div");
      if (if_block1) if_block1.c();
      t3 = space();
      if (if_block2) if_block2.c();
      t4 = space();
      button = element("button");
      button.textContent = "\u8FD4\u56DE\u4E3B\u9898\u5E93";
      attr(div0, "class", "el-end-emoji");
      set_style(div1, "margin-top", "14px");
      set_style(div1, "display", "flex");
      set_style(div1, "gap", "8px");
      set_style(div1, "justify-content", "center");
      attr(div2, "class", "el-card el-end");
    },
    m(target, anchor) {
      insert(target, div2, anchor);
      append(div2, div0);
      append(div2, t1);
      if_block0.m(div2, null);
      append(div2, t2);
      append(div2, div1);
      if (if_block1) if_block1.m(div1, null);
      append(div1, t3);
      if (if_block2) if_block2.m(div1, null);
      append(div1, t4);
      append(div1, button);
      if (!mounted) {
        dispose = listen(
          button,
          "click",
          /*back*/
          ctx[61]
        );
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (current_block_type === (current_block_type = select_block_type_1(ctx2, dirty)) && if_block0) {
        if_block0.p(ctx2, dirty);
      } else {
        if_block0.d(1);
        if_block0 = current_block_type(ctx2);
        if (if_block0) {
          if_block0.c();
          if_block0.m(div2, t2);
        }
      }
      if (!/*hardMode*/
      ctx2[10] && /*doneFresh*/
      ctx2[20] > 0 && /*dailyLimit*/
      ctx2[19] > 0) {
        if (if_block1) {
          if_block1.p(ctx2, dirty);
        } else {
          if_block1 = create_if_block_63(ctx2);
          if_block1.c();
          if_block1.m(div1, t3);
        }
      } else if (if_block1) {
        if_block1.d(1);
        if_block1 = null;
      }
      if (show_if) if_block2.p(ctx2, dirty);
    },
    i: noop,
    o: noop,
    d(detaching) {
      if (detaching) {
        detach(div2);
      }
      if_block0.d();
      if (if_block1) if_block1.d();
      if (if_block2) if_block2.d();
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_33(ctx) {
  let div3;
  let div0;
  let t1;
  let h2;
  let t2;
  let t3;
  let t4;
  let t5;
  let div1;
  let t7;
  let div2;
  let button;
  let mounted;
  let dispose;
  return {
    c() {
      div3 = element("div");
      div0 = element("div");
      div0.textContent = "\u{1F5C2}\uFE0F";
      t1 = space();
      h2 = element("h2");
      t2 = text("\u4E3B\u9898\u300C");
      t3 = text(
        /*themeName*/
        ctx[5]
      );
      t4 = text("\u300D\u8FD8\u6CA1\u6709\u8BCD");
      t5 = space();
      div1 = element("div");
      div1.textContent = "\u5148\u5728\u4E3B\u9898\u5E93\u91CC\u4E3A\u5B83\u6269\u8BCD\u6216\u5BFC\u5165\u8BCD\u8868\uFF0C\u518D\u5F00\u59CB\u5B66\u4E60\u3002";
      t7 = space();
      div2 = element("div");
      button = element("button");
      button.textContent = "\u53BB\u4E3B\u9898\u5E93";
      attr(div0, "class", "el-end-emoji");
      attr(div1, "class", "el-muted");
      attr(button, "class", "mod-cta");
      set_style(div2, "margin-top", "14px");
      attr(div3, "class", "el-card el-end");
    },
    m(target, anchor) {
      insert(target, div3, anchor);
      append(div3, div0);
      append(div3, t1);
      append(div3, h2);
      append(h2, t2);
      append(h2, t3);
      append(h2, t4);
      append(div3, t5);
      append(div3, div1);
      append(div3, t7);
      append(div3, div2);
      append(div2, button);
      if (!mounted) {
        dispose = listen(
          button,
          "click",
          /*back*/
          ctx[61]
        );
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*themeName*/
      32) set_data(
        t3,
        /*themeName*/
        ctx2[5]
      );
    },
    i: noop,
    o: noop,
    d(detaching) {
      if (detaching) {
        detach(div3);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_23(ctx) {
  let div3;
  let div0;
  let t1;
  let h2;
  let t2_value = (
    /*hardMode*/
    ctx[10] ? "\u6CA1\u6709\u9700\u8981\u4E13\u9879\u8BAD\u7EC3\u7684\u96BE\u8BCD" : "\u8FD8\u6CA1\u6709\u53EF\u5B66\u7684\u8BCD"
  );
  let t2;
  let t3;
  let div1;
  let t5;
  let div2;
  let button;
  let mounted;
  let dispose;
  return {
    c() {
      div3 = element("div");
      div0 = element("div");
      div0.textContent = "\u{1F5C2}\uFE0F";
      t1 = space();
      h2 = element("h2");
      t2 = text(t2_value);
      t3 = space();
      div1 = element("div");
      div1.textContent = "\u5148\u5728\u4E3B\u9898\u5E93\u65B0\u5EFA\u4E3B\u9898\uFF0C\u518D\u6269\u8BCD\u6216\u5BFC\u5165\u8BCD\u8868\u3002";
      t5 = space();
      div2 = element("div");
      button = element("button");
      button.textContent = "\u53BB\u4E3B\u9898\u5E93";
      attr(div0, "class", "el-end-emoji");
      attr(div1, "class", "el-muted");
      attr(button, "class", "mod-cta");
      set_style(div2, "margin-top", "14px");
      attr(div3, "class", "el-card el-end");
    },
    m(target, anchor) {
      insert(target, div3, anchor);
      append(div3, div0);
      append(div3, t1);
      append(div3, h2);
      append(h2, t2);
      append(div3, t3);
      append(div3, div1);
      append(div3, t5);
      append(div3, div2);
      append(div2, button);
      if (!mounted) {
        dispose = listen(
          button,
          "click",
          /*back*/
          ctx[61]
        );
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*hardMode*/
      1024 && t2_value !== (t2_value = /*hardMode*/
      ctx2[10] ? "\u6CA1\u6709\u9700\u8981\u4E13\u9879\u8BAD\u7EC3\u7684\u96BE\u8BCD" : "\u8FD8\u6CA1\u6709\u53EF\u5B66\u7684\u8BCD")) set_data(t2, t2_value);
    },
    i: noop,
    o: noop,
    d(detaching) {
      if (detaching) {
        detach(div3);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_110(ctx) {
  let div3;
  let div0;
  let t1;
  let h2;
  let t3;
  let div1;
  let t4;
  let t5;
  let div2;
  let button0;
  let t7;
  let button1;
  let mounted;
  let dispose;
  return {
    c() {
      div3 = element("div");
      div0 = element("div");
      div0.textContent = "\u26A0\uFE0F";
      t1 = space();
      h2 = element("h2");
      h2.textContent = "\u5B66\u4E60\u4F1A\u8BDD\u52A0\u8F7D\u5931\u8D25";
      t3 = space();
      div1 = element("div");
      t4 = text(
        /*loadError*/
        ctx[25]
      );
      t5 = space();
      div2 = element("div");
      button0 = element("button");
      button0.textContent = "\u91CD\u8BD5";
      t7 = space();
      button1 = element("button");
      button1.textContent = "\u8FD4\u56DE\u4E3B\u9898\u5E93";
      attr(div0, "class", "el-end-emoji");
      attr(div1, "class", "el-muted");
      attr(button0, "class", "mod-cta");
      set_style(div2, "margin-top", "14px");
      set_style(div2, "display", "flex");
      set_style(div2, "gap", "8px");
      set_style(div2, "justify-content", "center");
      attr(div3, "class", "el-card el-end");
    },
    m(target, anchor) {
      insert(target, div3, anchor);
      append(div3, div0);
      append(div3, t1);
      append(div3, h2);
      append(div3, t3);
      append(div3, div1);
      append(div1, t4);
      append(div3, t5);
      append(div3, div2);
      append(div2, button0);
      append(div2, t7);
      append(div2, button1);
      if (!mounted) {
        dispose = [
          listen(
            button0,
            "click",
            /*click_handler*/
            ctx[63]
          ),
          listen(
            button1,
            "click",
            /*back*/
            ctx[61]
          )
        ];
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*loadError*/
      33554432) set_data(
        t4,
        /*loadError*/
        ctx2[25]
      );
    },
    i: noop,
    o: noop,
    d(detaching) {
      if (detaching) {
        detach(div3);
      }
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_if_block4(ctx) {
  let div;
  return {
    c() {
      div = element("div");
      div.textContent = "\u52A0\u8F7D\u4E2D\u2026";
      attr(div, "class", "el-muted");
    },
    m(target, anchor) {
      insert(target, div, anchor);
    },
    p: noop,
    i: noop,
    o: noop,
    d(detaching) {
      if (detaching) {
        detach(div);
      }
    }
  };
}
function create_if_block_31(ctx) {
  let div0;
  let t0;
  let t1;
  let div1;
  let t2;
  let if_block2_anchor;
  let current;
  function select_block_type_7(ctx2, dirty) {
    if (
      /*cur*/
      ctx2[6].quiz.kind === "spell"
    ) return create_if_block_34;
    if (
      /*cur*/
      ctx2[6].quiz.kind === "cloze"
    ) return create_if_block_432;
    if (
      /*cur*/
      ctx2[6].quiz.question === /*cur*/
      ctx2[6].doc.word
    ) return create_if_block_44;
    return create_else_block_4;
  }
  let current_block_type = select_block_type_7(ctx, [-1, -1, -1, -1]);
  let if_block0 = current_block_type(ctx);
  let if_block1 = (
    /*quizPicked*/
    ctx[8] >= 0 && !/*quizCorrect*/
    ctx[9] && create_if_block_332(ctx)
  );
  let each_value_2 = ensure_array_like(
    /*cur*/
    ctx[6].quiz.options
  );
  let each_blocks = [];
  for (let i = 0; i < each_value_2.length; i += 1) {
    each_blocks[i] = create_each_block_22(get_each_context_22(ctx, each_value_2, i));
  }
  let if_block2 = (
    /*quizPicked*/
    ctx[8] >= 0 && !/*quizCorrect*/
    ctx[9] && create_if_block_322(ctx)
  );
  return {
    c() {
      div0 = element("div");
      if_block0.c();
      t0 = space();
      if (if_block1) if_block1.c();
      t1 = space();
      div1 = element("div");
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      t2 = space();
      if (if_block2) if_block2.c();
      if_block2_anchor = empty();
      attr(div0, "class", "el-card");
      attr(div1, "class", "el-quiz-options");
    },
    m(target, anchor) {
      insert(target, div0, anchor);
      if_block0.m(div0, null);
      append(div0, t0);
      if (if_block1) if_block1.m(div0, null);
      insert(target, t1, anchor);
      insert(target, div1, anchor);
      for (let i = 0; i < each_blocks.length; i += 1) {
        if (each_blocks[i]) {
          each_blocks[i].m(div1, null);
        }
      }
      insert(target, t2, anchor);
      if (if_block2) if_block2.m(target, anchor);
      insert(target, if_block2_anchor, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      if (current_block_type === (current_block_type = select_block_type_7(ctx2, dirty)) && if_block0) {
        if_block0.p(ctx2, dirty);
      } else {
        if_block0.d(1);
        if_block0 = current_block_type(ctx2);
        if (if_block0) {
          if_block0.c();
          if_block0.m(div0, t0);
        }
      }
      if (
        /*quizPicked*/
        ctx2[8] >= 0 && !/*quizCorrect*/
        ctx2[9]
      ) {
        if (if_block1) {
          if_block1.p(ctx2, dirty);
          if (dirty[0] & /*quizPicked, quizCorrect*/
          768) {
            transition_in(if_block1, 1);
          }
        } else {
          if_block1 = create_if_block_332(ctx2);
          if_block1.c();
          transition_in(if_block1, 1);
          if_block1.m(div0, null);
        }
      } else if (if_block1) {
        group_outros();
        transition_out(if_block1, 1, 1, () => {
          if_block1 = null;
        });
        check_outros();
      }
      if (dirty[0] & /*quizPicked, cur, quizCorrect*/
      832 | dirty[1] & /*pick*/
      4194304) {
        each_value_2 = ensure_array_like(
          /*cur*/
          ctx2[6].quiz.options
        );
        let i;
        for (i = 0; i < each_value_2.length; i += 1) {
          const child_ctx = get_each_context_22(ctx2, each_value_2, i);
          if (each_blocks[i]) {
            each_blocks[i].p(child_ctx, dirty);
          } else {
            each_blocks[i] = create_each_block_22(child_ctx);
            each_blocks[i].c();
            each_blocks[i].m(div1, null);
          }
        }
        for (; i < each_blocks.length; i += 1) {
          each_blocks[i].d(1);
        }
        each_blocks.length = each_value_2.length;
      }
      if (
        /*quizPicked*/
        ctx2[8] >= 0 && !/*quizCorrect*/
        ctx2[9]
      ) {
        if (if_block2) {
          if_block2.p(ctx2, dirty);
        } else {
          if_block2 = create_if_block_322(ctx2);
          if_block2.c();
          if_block2.m(if_block2_anchor.parentNode, if_block2_anchor);
        }
      } else if (if_block2) {
        if_block2.d(1);
        if_block2 = null;
      }
    },
    i(local) {
      if (current) return;
      transition_in(if_block1);
      current = true;
    },
    o(local) {
      transition_out(if_block1);
      current = false;
    },
    d(detaching) {
      if (detaching) {
        detach(div0);
        detach(t1);
        detach(div1);
        detach(t2);
        detach(if_block2_anchor);
      }
      if_block0.d();
      if (if_block1) if_block1.d();
      destroy_each(each_blocks, detaching);
      if (if_block2) if_block2.d(detaching);
    }
  };
}
function create_if_block_27(ctx) {
  let div;
  let current_block_type_index;
  let if_block0;
  let t;
  let if_block1_anchor;
  let current;
  const if_block_creators = [create_if_block_29, create_else_block_22];
  const if_blocks = [];
  function select_block_type_5(ctx2, dirty) {
    if (
      /*cur*/
      ctx2[6].reverse && !/*revealed*/
      ctx2[3]
    ) return 0;
    return 1;
  }
  current_block_type_index = select_block_type_5(ctx, [-1, -1, -1, -1]);
  if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
  function select_block_type_6(ctx2, dirty) {
    if (!/*revealed*/
    ctx2[3]) return create_if_block_28;
    return create_else_block_13;
  }
  let current_block_type = select_block_type_6(ctx, [-1, -1, -1, -1]);
  let if_block1 = current_block_type(ctx);
  return {
    c() {
      div = element("div");
      if_block0.c();
      t = space();
      if_block1.c();
      if_block1_anchor = empty();
      attr(div, "class", "el-card");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      if_blocks[current_block_type_index].m(div, null);
      insert(target, t, anchor);
      if_block1.m(target, anchor);
      insert(target, if_block1_anchor, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      let previous_block_index = current_block_type_index;
      current_block_type_index = select_block_type_5(ctx2, dirty);
      if (current_block_type_index === previous_block_index) {
        if_blocks[current_block_type_index].p(ctx2, dirty);
      } else {
        group_outros();
        transition_out(if_blocks[previous_block_index], 1, 1, () => {
          if_blocks[previous_block_index] = null;
        });
        check_outros();
        if_block0 = if_blocks[current_block_type_index];
        if (!if_block0) {
          if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx2);
          if_block0.c();
        } else {
          if_block0.p(ctx2, dirty);
        }
        transition_in(if_block0, 1);
        if_block0.m(div, null);
      }
      if (current_block_type === (current_block_type = select_block_type_6(ctx2, dirty)) && if_block1) {
        if_block1.p(ctx2, dirty);
      } else {
        if_block1.d(1);
        if_block1 = current_block_type(ctx2);
        if (if_block1) {
          if_block1.c();
          if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
        }
      }
    },
    i(local) {
      if (current) return;
      transition_in(if_block0);
      current = true;
    },
    o(local) {
      transition_out(if_block0);
      current = false;
    },
    d(detaching) {
      if (detaching) {
        detach(div);
        detach(t);
        detach(if_block1_anchor);
      }
      if_blocks[current_block_type_index].d();
      if_block1.d(detaching);
    }
  };
}
function create_if_block_21(ctx) {
  let div;
  let t0;
  let wordfullcard;
  let t1;
  let t2;
  let if_block2_anchor;
  let current;
  function select_block_type_3(ctx2, dirty) {
    if (
      /*cur*/
      ctx2[6].kind === "confirm"
    ) return create_if_block_25;
    if (
      /*cur*/
      ctx2[6].kind === "restudy" && !/*revealed*/
      ctx2[3]
    ) return create_if_block_26;
  }
  let current_block_type = select_block_type_3(ctx, [-1, -1, -1, -1]);
  let if_block0 = current_block_type && current_block_type(ctx);
  wordfullcard = new WordFullCard_default({
    props: {
      plugin: (
        /*plugin*/
        ctx[0]
      ),
      doc: (
        /*cur*/
        ctx[6].doc
      ),
      synonyms: (
        /*synRow*/
        ctx[26]
      ),
      antonyms: (
        /*antRow*/
        ctx[27]
      ),
      showAi: (
        /*showFull*/
        ctx[33]
      ),
      showBody: (
        /*showFull*/
        ctx[33]
      )
    }
  });
  let if_block1 = (
    /*cur*/
    ctx[6].kind === "restudy" && !/*revealed*/
    ctx[3] && create_if_block_24(ctx)
  );
  function select_block_type_4(ctx2, dirty) {
    if (
      /*cur*/
      ctx2[6].kind === "study" || /*cur*/
      ctx2[6].kind === "restudy" && /*revealed*/
      ctx2[3]
    ) return create_if_block_222;
    if (
      /*cur*/
      ctx2[6].kind === "confirm"
    ) return create_if_block_232;
  }
  let current_block_type_1 = select_block_type_4(ctx, [-1, -1, -1, -1]);
  let if_block2 = current_block_type_1 && current_block_type_1(ctx);
  return {
    c() {
      div = element("div");
      if (if_block0) if_block0.c();
      t0 = space();
      create_component(wordfullcard.$$.fragment);
      t1 = space();
      if (if_block1) if_block1.c();
      t2 = space();
      if (if_block2) if_block2.c();
      if_block2_anchor = empty();
      attr(div, "class", "el-card");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      if (if_block0) if_block0.m(div, null);
      append(div, t0);
      mount_component(wordfullcard, div, null);
      append(div, t1);
      if (if_block1) if_block1.m(div, null);
      insert(target, t2, anchor);
      if (if_block2) if_block2.m(target, anchor);
      insert(target, if_block2_anchor, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      if (current_block_type !== (current_block_type = select_block_type_3(ctx2, dirty))) {
        if (if_block0) if_block0.d(1);
        if_block0 = current_block_type && current_block_type(ctx2);
        if (if_block0) {
          if_block0.c();
          if_block0.m(div, t0);
        }
      }
      const wordfullcard_changes = {};
      if (dirty[0] & /*plugin*/
      1) wordfullcard_changes.plugin = /*plugin*/
      ctx2[0];
      if (dirty[0] & /*cur*/
      64) wordfullcard_changes.doc = /*cur*/
      ctx2[6].doc;
      if (dirty[0] & /*synRow*/
      67108864) wordfullcard_changes.synonyms = /*synRow*/
      ctx2[26];
      if (dirty[0] & /*antRow*/
      134217728) wordfullcard_changes.antonyms = /*antRow*/
      ctx2[27];
      if (dirty[1] & /*showFull*/
      4) wordfullcard_changes.showAi = /*showFull*/
      ctx2[33];
      if (dirty[1] & /*showFull*/
      4) wordfullcard_changes.showBody = /*showFull*/
      ctx2[33];
      wordfullcard.$set(wordfullcard_changes);
      if (
        /*cur*/
        ctx2[6].kind === "restudy" && !/*revealed*/
        ctx2[3]
      ) {
        if (if_block1) {
          if_block1.p(ctx2, dirty);
        } else {
          if_block1 = create_if_block_24(ctx2);
          if_block1.c();
          if_block1.m(div, null);
        }
      } else if (if_block1) {
        if_block1.d(1);
        if_block1 = null;
      }
      if (current_block_type_1 === (current_block_type_1 = select_block_type_4(ctx2, dirty)) && if_block2) {
        if_block2.p(ctx2, dirty);
      } else {
        if (if_block2) if_block2.d(1);
        if_block2 = current_block_type_1 && current_block_type_1(ctx2);
        if (if_block2) {
          if_block2.c();
          if_block2.m(if_block2_anchor.parentNode, if_block2_anchor);
        }
      }
    },
    i(local) {
      if (current) return;
      transition_in(wordfullcard.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(wordfullcard.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching) {
        detach(div);
        detach(t2);
        detach(if_block2_anchor);
      }
      if (if_block0) {
        if_block0.d();
      }
      destroy_component(wordfullcard);
      if (if_block1) if_block1.d();
      if (if_block2) {
        if_block2.d(detaching);
      }
    }
  };
}
function create_if_block_20(ctx) {
  let div1;
  let div0;
  let t1;
  let wordfullcard;
  let t2;
  let div2;
  let button0;
  let t5;
  let button1;
  let t8;
  let button2;
  let current;
  let mounted;
  let dispose;
  wordfullcard = new WordFullCard_default({
    props: {
      plugin: (
        /*plugin*/
        ctx[0]
      ),
      doc: (
        /*cur*/
        ctx[6].doc
      ),
      showAi: false,
      showBody: false
    }
  });
  return {
    c() {
      div1 = element("div");
      div0 = element("div");
      div0.textContent = "\u8FD8\u8BB0\u5F97\u8FD9\u4E2A\u8BCD\u5417\uFF1F";
      t1 = space();
      create_component(wordfullcard.$$.fragment);
      t2 = space();
      div2 = element("div");
      button0 = element("button");
      button0.innerHTML = `\u592A\u7B80\u5355<span class="el-kbd">1</span>`;
      t5 = space();
      button1 = element("button");
      button1.innerHTML = `\u8BA4\u8BC6<span class="el-kbd">2</span>`;
      t8 = space();
      button2 = element("button");
      button2.innerHTML = `\u4E0D\u8BA4\u8BC6<span class="el-kbd">3</span>`;
      attr(div0, "class", "el-hint");
      attr(div1, "class", "el-card");
      attr(button0, "class", "el-grade g3");
      attr(button1, "class", "el-grade g2 el-grade-ok");
      attr(button2, "class", "el-grade g1");
      attr(div2, "class", "el-grade-btns");
    },
    m(target, anchor) {
      insert(target, div1, anchor);
      append(div1, div0);
      append(div1, t1);
      mount_component(wordfullcard, div1, null);
      insert(target, t2, anchor);
      insert(target, div2, anchor);
      append(div2, button0);
      append(div2, t5);
      append(div2, button1);
      append(div2, t8);
      append(div2, button2);
      current = true;
      if (!mounted) {
        dispose = [
          listen(
            button0,
            "click",
            /*tooEasy*/
            ctx[40]
          ),
          listen(
            button1,
            "click",
            /*knowIt*/
            ctx[41]
          ),
          listen(
            button2,
            "click",
            /*unknownWord*/
            ctx[42]
          )
        ];
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      const wordfullcard_changes = {};
      if (dirty[0] & /*plugin*/
      1) wordfullcard_changes.plugin = /*plugin*/
      ctx2[0];
      if (dirty[0] & /*cur*/
      64) wordfullcard_changes.doc = /*cur*/
      ctx2[6].doc;
      wordfullcard.$set(wordfullcard_changes);
    },
    i(local) {
      if (current) return;
      transition_in(wordfullcard.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(wordfullcard.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching) {
        detach(div1);
        detach(t2);
        detach(div2);
      }
      destroy_component(wordfullcard);
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_else_block_4(ctx) {
  let div0;
  let t1;
  let div1;
  let t2_value = (
    /*cur*/
    ctx[6].quiz.question + ""
  );
  let t2;
  return {
    c() {
      div0 = element("div");
      div0.textContent = "\u9009\u51FA\u5BF9\u5E94\u7684\u5355\u8BCD";
      t1 = space();
      div1 = element("div");
      t2 = text(t2_value);
      attr(div0, "class", "el-hint");
      attr(div1, "class", "el-quiz-question");
    },
    m(target, anchor) {
      insert(target, div0, anchor);
      insert(target, t1, anchor);
      insert(target, div1, anchor);
      append(div1, t2);
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*cur*/
      64 && t2_value !== (t2_value = /*cur*/
      ctx2[6].quiz.question + "")) set_data(t2, t2_value);
    },
    d(detaching) {
      if (detaching) {
        detach(div0);
        detach(t1);
        detach(div1);
      }
    }
  };
}
function create_if_block_44(ctx) {
  let div0;
  let t1;
  let div1;
  let t2_value = (
    /*cur*/
    ctx[6].quiz.question + ""
  );
  let t2;
  let show_if = isPhrase(
    /*cur*/
    ctx[6].doc.word
  );
  let t3;
  let if_block1_anchor;
  let if_block0 = show_if && create_if_block_46(ctx);
  let if_block1 = (
    /*cur*/
    ctx[6].quiz.phonetic && create_if_block_45(ctx)
  );
  return {
    c() {
      div0 = element("div");
      div0.textContent = "\u9009\u51FA\u6B63\u786E\u91CA\u4E49";
      t1 = space();
      div1 = element("div");
      t2 = text(t2_value);
      if (if_block0) if_block0.c();
      t3 = space();
      if (if_block1) if_block1.c();
      if_block1_anchor = empty();
      attr(div0, "class", "el-hint");
      attr(div1, "class", "el-word");
      set_style(div1, "font-size", "30px");
    },
    m(target, anchor) {
      insert(target, div0, anchor);
      insert(target, t1, anchor);
      insert(target, div1, anchor);
      append(div1, t2);
      if (if_block0) if_block0.m(div1, null);
      insert(target, t3, anchor);
      if (if_block1) if_block1.m(target, anchor);
      insert(target, if_block1_anchor, anchor);
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*cur*/
      64 && t2_value !== (t2_value = /*cur*/
      ctx2[6].quiz.question + "")) set_data(t2, t2_value);
      if (dirty[0] & /*cur*/
      64) show_if = isPhrase(
        /*cur*/
        ctx2[6].doc.word
      );
      if (show_if) {
        if (if_block0) {
        } else {
          if_block0 = create_if_block_46(ctx2);
          if_block0.c();
          if_block0.m(div1, null);
        }
      } else if (if_block0) {
        if_block0.d(1);
        if_block0 = null;
      }
      if (
        /*cur*/
        ctx2[6].quiz.phonetic
      ) {
        if (if_block1) {
          if_block1.p(ctx2, dirty);
        } else {
          if_block1 = create_if_block_45(ctx2);
          if_block1.c();
          if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
        }
      } else if (if_block1) {
        if_block1.d(1);
        if_block1 = null;
      }
    },
    d(detaching) {
      if (detaching) {
        detach(div0);
        detach(t1);
        detach(div1);
        detach(t3);
        detach(if_block1_anchor);
      }
      if (if_block0) if_block0.d();
      if (if_block1) if_block1.d(detaching);
    }
  };
}
function create_if_block_432(ctx) {
  let div0;
  let t1;
  let div1;
  let t2_value = (
    /*cur*/
    ctx[6].quiz.question + ""
  );
  let t2;
  return {
    c() {
      div0 = element("div");
      div0.textContent = "\u9009\u51FA\u586B\u5165\u7A7A\u683C\u7684\u8BCD";
      t1 = space();
      div1 = element("div");
      t2 = text(t2_value);
      attr(div0, "class", "el-hint");
      attr(div1, "class", "el-quiz-question");
    },
    m(target, anchor) {
      insert(target, div0, anchor);
      insert(target, t1, anchor);
      insert(target, div1, anchor);
      append(div1, t2);
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*cur*/
      64 && t2_value !== (t2_value = /*cur*/
      ctx2[6].quiz.question + "")) set_data(t2, t2_value);
    },
    d(detaching) {
      if (detaching) {
        detach(div0);
        detach(t1);
        detach(div1);
      }
    }
  };
}
function create_if_block_34(ctx) {
  let t;
  let if_block1_anchor;
  function select_block_type_8(ctx2, dirty) {
    if (
      /*cur*/
      ctx2[6].quiz.audioOnly
    ) return create_if_block_41;
    return create_else_block_3;
  }
  let current_block_type = select_block_type_8(ctx, [-1, -1, -1, -1]);
  let if_block0 = current_block_type(ctx);
  function select_block_type_9(ctx2, dirty) {
    if (
      /*quizPicked*/
      ctx2[8] < 0
    ) return create_if_block_35;
    if (
      /*quizCorrect*/
      ctx2[9]
    ) return create_if_block_40;
  }
  let current_block_type_1 = select_block_type_9(ctx, [-1, -1, -1, -1]);
  let if_block1 = current_block_type_1 && current_block_type_1(ctx);
  return {
    c() {
      if_block0.c();
      t = space();
      if (if_block1) if_block1.c();
      if_block1_anchor = empty();
    },
    m(target, anchor) {
      if_block0.m(target, anchor);
      insert(target, t, anchor);
      if (if_block1) if_block1.m(target, anchor);
      insert(target, if_block1_anchor, anchor);
    },
    p(ctx2, dirty) {
      if (current_block_type === (current_block_type = select_block_type_8(ctx2, dirty)) && if_block0) {
        if_block0.p(ctx2, dirty);
      } else {
        if_block0.d(1);
        if_block0 = current_block_type(ctx2);
        if (if_block0) {
          if_block0.c();
          if_block0.m(t.parentNode, t);
        }
      }
      if (current_block_type_1 === (current_block_type_1 = select_block_type_9(ctx2, dirty)) && if_block1) {
        if_block1.p(ctx2, dirty);
      } else {
        if (if_block1) if_block1.d(1);
        if_block1 = current_block_type_1 && current_block_type_1(ctx2);
        if (if_block1) {
          if_block1.c();
          if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
        }
      }
    },
    d(detaching) {
      if (detaching) {
        detach(t);
        detach(if_block1_anchor);
      }
      if_block0.d(detaching);
      if (if_block1) {
        if_block1.d(detaching);
      }
    }
  };
}
function create_if_block_46(ctx) {
  let span;
  return {
    c() {
      span = element("span");
      span.textContent = "\u77ED\u8BED";
      attr(span, "class", "el-chip");
    },
    m(target, anchor) {
      insert(target, span, anchor);
    },
    d(detaching) {
      if (detaching) {
        detach(span);
      }
    }
  };
}
function create_if_block_45(ctx) {
  let div;
  let t_value = (
    /*cur*/
    ctx[6].quiz.phonetic + ""
  );
  let t;
  return {
    c() {
      div = element("div");
      t = text(t_value);
      attr(div, "class", "el-phonetic");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, t);
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*cur*/
      64 && t_value !== (t_value = /*cur*/
      ctx2[6].quiz.phonetic + "")) set_data(t, t_value);
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
    }
  };
}
function create_else_block_3(ctx) {
  let div0;
  let t1;
  let div1;
  let t2_value = (
    /*cur*/
    ctx[6].quiz.question + ""
  );
  let t2;
  let t3;
  let if_block_anchor;
  let if_block = (
    /*cur*/
    ctx[6].quiz.phonetic && create_if_block_422(ctx)
  );
  return {
    c() {
      div0 = element("div");
      div0.textContent = "\u62FC\u51FA\u8FD9\u4E2A\u5355\u8BCD\uFF08\u56DE\u8F66\u63D0\u4EA4\uFF09";
      t1 = space();
      div1 = element("div");
      t2 = text(t2_value);
      t3 = space();
      if (if_block) if_block.c();
      if_block_anchor = empty();
      attr(div0, "class", "el-hint");
      attr(div1, "class", "el-quiz-question");
    },
    m(target, anchor) {
      insert(target, div0, anchor);
      insert(target, t1, anchor);
      insert(target, div1, anchor);
      append(div1, t2);
      insert(target, t3, anchor);
      if (if_block) if_block.m(target, anchor);
      insert(target, if_block_anchor, anchor);
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*cur*/
      64 && t2_value !== (t2_value = /*cur*/
      ctx2[6].quiz.question + "")) set_data(t2, t2_value);
      if (
        /*cur*/
        ctx2[6].quiz.phonetic
      ) {
        if (if_block) {
          if_block.p(ctx2, dirty);
        } else {
          if_block = create_if_block_422(ctx2);
          if_block.c();
          if_block.m(if_block_anchor.parentNode, if_block_anchor);
        }
      } else if (if_block) {
        if_block.d(1);
        if_block = null;
      }
    },
    d(detaching) {
      if (detaching) {
        detach(div0);
        detach(t1);
        detach(div1);
        detach(t3);
        detach(if_block_anchor);
      }
      if (if_block) if_block.d(detaching);
    }
  };
}
function create_if_block_41(ctx) {
  let div;
  let t1;
  let button;
  let t2_value = (
    /*hasAudio*/
    ctx[29] ? "\u{1F464}" : "\u{1F50A}"
  );
  let t2;
  let button_title_value;
  let mounted;
  let dispose;
  return {
    c() {
      div = element("div");
      div.textContent = "\u542C\u97F3\u62FC\u5199\uFF1A\u70B9\u5587\u53ED\u542C\u53D1\u97F3\uFF0C\u62FC\u51FA\u4F60\u542C\u5230\u7684\u8BCD";
      t1 = space();
      button = element("button");
      t2 = text(t2_value);
      attr(div, "class", "el-hint");
      attr(button, "class", "el-spell-audio");
      attr(button, "title", button_title_value = /*hasAudio*/
      ctx[29] ? "\u6807\u51C6\u53D1\u97F3 \xB7 \u518D\u542C\u4E00\u904D" : "\u7CFB\u7EDF TTS \xB7 \u518D\u542C\u4E00\u904D");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      insert(target, t1, anchor);
      insert(target, button, anchor);
      append(button, t2);
      if (!mounted) {
        dispose = listen(
          button,
          "click",
          /*click_handler_11*/
          ctx[74]
        );
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*hasAudio*/
      536870912 && t2_value !== (t2_value = /*hasAudio*/
      ctx2[29] ? "\u{1F464}" : "\u{1F50A}")) set_data(t2, t2_value);
      if (dirty[0] & /*hasAudio*/
      536870912 && button_title_value !== (button_title_value = /*hasAudio*/
      ctx2[29] ? "\u6807\u51C6\u53D1\u97F3 \xB7 \u518D\u542C\u4E00\u904D" : "\u7CFB\u7EDF TTS \xB7 \u518D\u542C\u4E00\u904D")) {
        attr(button, "title", button_title_value);
      }
    },
    d(detaching) {
      if (detaching) {
        detach(div);
        detach(t1);
        detach(button);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_422(ctx) {
  let div;
  let t_value = (
    /*cur*/
    ctx[6].quiz.phonetic + ""
  );
  let t;
  return {
    c() {
      div = element("div");
      t = text(t_value);
      attr(div, "class", "el-phonetic");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, t);
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*cur*/
      64 && t_value !== (t_value = /*cur*/
      ctx2[6].quiz.phonetic + "")) set_data(t, t_value);
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
    }
  };
}
function create_if_block_40(ctx) {
  let div;
  let t0;
  let t1_value = (
    /*cur*/
    ctx[6].quiz.reveal + ""
  );
  let t1;
  return {
    c() {
      div = element("div");
      t0 = text("\u2705 \u62FC\u5199\u6B63\u786E\uFF1A");
      t1 = text(t1_value);
      attr(div, "class", "el-quiz-reveal");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, t0);
      append(div, t1);
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*cur*/
      64 && t1_value !== (t1_value = /*cur*/
      ctx2[6].quiz.reveal + "")) set_data(t1, t1_value);
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
    }
  };
}
function create_if_block_35(ctx) {
  let t0;
  let t1;
  let div;
  let input;
  let focusOnMount_action;
  let t2;
  let t3;
  let button0;
  let t5;
  let button1;
  let t6_value = (
    /*spellHinted*/
    ctx[31] ? `${/*cur*/
    ctx[6].doc.word.slice(0, 1)}${"\xB7".repeat(Math.max(
      /*cur*/
      ctx[6].doc.word.length - 1,
      0
    ))}\uFF08${/*cur*/
    ctx[6].doc.word.length} \u4E2A\u5B57\u6BCD\uFF09` : "\u8981\u63D0\u793A\u5417\uFF1F"
  );
  let t6;
  let mounted;
  let dispose;
  let if_block0 = (
    /*cur*/
    ctx[6].quiz.audioOnly && !/*spellShowQ*/
    ctx[32] && create_if_block_39(ctx)
  );
  let if_block1 = (!/*cur*/
  ctx[6].quiz.audioOnly || /*spellShowQ*/
  ctx[32]) && create_if_block_37(ctx);
  let if_block2 = !/*cur*/
  ctx[6].quiz.audioOnly && create_if_block_36(ctx);
  return {
    c() {
      if (if_block0) if_block0.c();
      t0 = space();
      if (if_block1) if_block1.c();
      t1 = space();
      div = element("div");
      input = element("input");
      t2 = space();
      if (if_block2) if_block2.c();
      t3 = space();
      button0 = element("button");
      button0.textContent = "\u63D0\u4EA4";
      t5 = space();
      button1 = element("button");
      t6 = text(t6_value);
      attr(input, "class", "el-spell-in");
      attr(input, "type", "text");
      attr(input, "autocomplete", "off");
      attr(input, "autocapitalize", "off");
      attr(input, "spellcheck", "false");
      attr(input, "placeholder", "\u8F93\u5165\u5355\u8BCD");
      attr(button0, "class", "el-spell-go");
      attr(div, "class", "el-spell");
      attr(button1, "class", "el-spell-hint");
    },
    m(target, anchor) {
      if (if_block0) if_block0.m(target, anchor);
      insert(target, t0, anchor);
      if (if_block1) if_block1.m(target, anchor);
      insert(target, t1, anchor);
      insert(target, div, anchor);
      append(div, input);
      set_input_value(
        input,
        /*spellInput*/
        ctx[30]
      );
      append(div, t2);
      if (if_block2) if_block2.m(div, null);
      append(div, t3);
      append(div, button0);
      insert(target, t5, anchor);
      insert(target, button1, anchor);
      append(button1, t6);
      if (!mounted) {
        dispose = [
          listen(
            input,
            "input",
            /*input_input_handler*/
            ctx[76]
          ),
          action_destroyer(focusOnMount_action = focusOnMount.call(null, input)),
          listen(
            input,
            "keydown",
            /*spellKeydown*/
            ctx[51]
          ),
          listen(
            button0,
            "click",
            /*submitSpell*/
            ctx[52]
          ),
          listen(
            button1,
            "click",
            /*click_handler_14*/
            ctx[78]
          )
        ];
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (
        /*cur*/
        ctx2[6].quiz.audioOnly && !/*spellShowQ*/
        ctx2[32]
      ) {
        if (if_block0) {
          if_block0.p(ctx2, dirty);
        } else {
          if_block0 = create_if_block_39(ctx2);
          if_block0.c();
          if_block0.m(t0.parentNode, t0);
        }
      } else if (if_block0) {
        if_block0.d(1);
        if_block0 = null;
      }
      if (!/*cur*/
      ctx2[6].quiz.audioOnly || /*spellShowQ*/
      ctx2[32]) {
        if (if_block1) {
          if_block1.p(ctx2, dirty);
        } else {
          if_block1 = create_if_block_37(ctx2);
          if_block1.c();
          if_block1.m(t1.parentNode, t1);
        }
      } else if (if_block1) {
        if_block1.d(1);
        if_block1 = null;
      }
      if (dirty[0] & /*spellInput*/
      1073741824 && input.value !== /*spellInput*/
      ctx2[30]) {
        set_input_value(
          input,
          /*spellInput*/
          ctx2[30]
        );
      }
      if (!/*cur*/
      ctx2[6].quiz.audioOnly) {
        if (if_block2) {
          if_block2.p(ctx2, dirty);
        } else {
          if_block2 = create_if_block_36(ctx2);
          if_block2.c();
          if_block2.m(div, t3);
        }
      } else if (if_block2) {
        if_block2.d(1);
        if_block2 = null;
      }
      if (dirty[0] & /*cur*/
      64 | dirty[1] & /*spellHinted*/
      1 && t6_value !== (t6_value = /*spellHinted*/
      ctx2[31] ? `${/*cur*/
      ctx2[6].doc.word.slice(0, 1)}${"\xB7".repeat(Math.max(
        /*cur*/
        ctx2[6].doc.word.length - 1,
        0
      ))}\uFF08${/*cur*/
      ctx2[6].doc.word.length} \u4E2A\u5B57\u6BCD\uFF09` : "\u8981\u63D0\u793A\u5417\uFF1F")) set_data(t6, t6_value);
    },
    d(detaching) {
      if (detaching) {
        detach(t0);
        detach(t1);
        detach(div);
        detach(t5);
        detach(button1);
      }
      if (if_block0) if_block0.d(detaching);
      if (if_block1) if_block1.d(detaching);
      if (if_block2) if_block2.d();
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_if_block_39(ctx) {
  let button;
  let mounted;
  let dispose;
  return {
    c() {
      button = element("button");
      button.textContent = "\u542C\u4E0D\u89C1\uFF1F\u6539\u4E3A\u770B\u4E49\u62FC\u5199";
      attr(button, "class", "el-spell-degrade");
    },
    m(target, anchor) {
      insert(target, button, anchor);
      if (!mounted) {
        dispose = listen(
          button,
          "click",
          /*click_handler_12*/
          ctx[75]
        );
        mounted = true;
      }
    },
    p: noop,
    d(detaching) {
      if (detaching) {
        detach(button);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_37(ctx) {
  let div;
  let t0_value = (
    /*cur*/
    ctx[6].quiz.question + ""
  );
  let t0;
  let t1;
  let if_block_anchor;
  let if_block = (
    /*cur*/
    ctx[6].quiz.phonetic && create_if_block_38(ctx)
  );
  return {
    c() {
      div = element("div");
      t0 = text(t0_value);
      t1 = space();
      if (if_block) if_block.c();
      if_block_anchor = empty();
      attr(div, "class", "el-quiz-question");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, t0);
      insert(target, t1, anchor);
      if (if_block) if_block.m(target, anchor);
      insert(target, if_block_anchor, anchor);
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*cur*/
      64 && t0_value !== (t0_value = /*cur*/
      ctx2[6].quiz.question + "")) set_data(t0, t0_value);
      if (
        /*cur*/
        ctx2[6].quiz.phonetic
      ) {
        if (if_block) {
          if_block.p(ctx2, dirty);
        } else {
          if_block = create_if_block_38(ctx2);
          if_block.c();
          if_block.m(if_block_anchor.parentNode, if_block_anchor);
        }
      } else if (if_block) {
        if_block.d(1);
        if_block = null;
      }
    },
    d(detaching) {
      if (detaching) {
        detach(div);
        detach(t1);
        detach(if_block_anchor);
      }
      if (if_block) if_block.d(detaching);
    }
  };
}
function create_if_block_38(ctx) {
  let div;
  let t_value = (
    /*cur*/
    ctx[6].quiz.phonetic + ""
  );
  let t;
  return {
    c() {
      div = element("div");
      t = text(t_value);
      attr(div, "class", "el-phonetic");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, t);
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*cur*/
      64 && t_value !== (t_value = /*cur*/
      ctx2[6].quiz.phonetic + "")) set_data(t, t_value);
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
    }
  };
}
function create_if_block_36(ctx) {
  let button;
  let t_value = (
    /*hasAudio*/
    ctx[29] ? "\u{1F464}" : "\u{1F50A}"
  );
  let t;
  let button_title_value;
  let mounted;
  let dispose;
  return {
    c() {
      button = element("button");
      t = text(t_value);
      attr(button, "class", "el-tts");
      attr(button, "title", button_title_value = /*hasAudio*/
      ctx[29] ? "\u6807\u51C6\u53D1\u97F3\u63D0\u793A\uFF08\u7B97\u4F5C\u63D0\u793A\uFF0C\u4E0D\u6CC4\u62FC\u5199\uFF09" : "TTS \u53D1\u97F3\u63D0\u793A\uFF08\u7B97\u4F5C\u63D0\u793A\uFF0C\u4E0D\u6CC4\u62FC\u5199\uFF09");
    },
    m(target, anchor) {
      insert(target, button, anchor);
      append(button, t);
      if (!mounted) {
        dispose = listen(
          button,
          "click",
          /*click_handler_13*/
          ctx[77]
        );
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*hasAudio*/
      536870912 && t_value !== (t_value = /*hasAudio*/
      ctx2[29] ? "\u{1F464}" : "\u{1F50A}")) set_data(t, t_value);
      if (dirty[0] & /*hasAudio*/
      536870912 && button_title_value !== (button_title_value = /*hasAudio*/
      ctx2[29] ? "\u6807\u51C6\u53D1\u97F3\u63D0\u793A\uFF08\u7B97\u4F5C\u63D0\u793A\uFF0C\u4E0D\u6CC4\u62FC\u5199\uFF09" : "TTS \u53D1\u97F3\u63D0\u793A\uFF08\u7B97\u4F5C\u63D0\u793A\uFF0C\u4E0D\u6CC4\u62FC\u5199\uFF09")) {
        attr(button, "title", button_title_value);
      }
    },
    d(detaching) {
      if (detaching) {
        detach(button);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_332(ctx) {
  let div0;
  let t0;
  let t1_value = (
    /*cur*/
    ctx[6].quiz.reveal + ""
  );
  let t1;
  let t2;
  let wordfullcard;
  let t3;
  let div1;
  let current;
  wordfullcard = new WordFullCard_default({
    props: {
      plugin: (
        /*plugin*/
        ctx[0]
      ),
      doc: (
        /*cur*/
        ctx[6].doc
      ),
      synonyms: (
        /*synRow*/
        ctx[26]
      ),
      antonyms: (
        /*antRow*/
        ctx[27]
      )
    }
  });
  return {
    c() {
      div0 = element("div");
      t0 = text("\u274C \u6B63\u786E\u7B54\u6848\uFF1A");
      t1 = text(t1_value);
      t2 = space();
      create_component(wordfullcard.$$.fragment);
      t3 = space();
      div1 = element("div");
      div1.textContent = "\u8FD9\u4E2A\u8BCD\u7A0D\u540E\u4F1A\u518D\u6D4B\u4E00\u6B21";
      attr(div0, "class", "el-quiz-reveal");
      attr(div1, "class", "el-muted");
      set_style(div1, "margin-top", "8px");
    },
    m(target, anchor) {
      insert(target, div0, anchor);
      append(div0, t0);
      append(div0, t1);
      insert(target, t2, anchor);
      mount_component(wordfullcard, target, anchor);
      insert(target, t3, anchor);
      insert(target, div1, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      if ((!current || dirty[0] & /*cur*/
      64) && t1_value !== (t1_value = /*cur*/
      ctx2[6].quiz.reveal + "")) set_data(t1, t1_value);
      const wordfullcard_changes = {};
      if (dirty[0] & /*plugin*/
      1) wordfullcard_changes.plugin = /*plugin*/
      ctx2[0];
      if (dirty[0] & /*cur*/
      64) wordfullcard_changes.doc = /*cur*/
      ctx2[6].doc;
      if (dirty[0] & /*synRow*/
      67108864) wordfullcard_changes.synonyms = /*synRow*/
      ctx2[26];
      if (dirty[0] & /*antRow*/
      134217728) wordfullcard_changes.antonyms = /*antRow*/
      ctx2[27];
      wordfullcard.$set(wordfullcard_changes);
    },
    i(local) {
      if (current) return;
      transition_in(wordfullcard.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(wordfullcard.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching) {
        detach(div0);
        detach(t2);
        detach(t3);
        detach(div1);
      }
      destroy_component(wordfullcard, detaching);
    }
  };
}
function create_each_block_22(ctx) {
  let button;
  let span0;
  let t1;
  let span1;
  let t2_value = (
    /*opt*/
    ctx[106] + ""
  );
  let t2;
  let t3;
  let button_disabled_value;
  let mounted;
  let dispose;
  function click_handler_15() {
    return (
      /*click_handler_15*/
      ctx[79](
        /*i*/
        ctx[108]
      )
    );
  }
  return {
    c() {
      button = element("button");
      span0 = element("span");
      span0.textContent = `${/*i*/
      ctx[108] + 1}`;
      t1 = space();
      span1 = element("span");
      t2 = text(t2_value);
      t3 = space();
      attr(span0, "class", "el-kbd");
      attr(span1, "class", "el-opt-text");
      attr(button, "class", "el-opt");
      button.disabled = button_disabled_value = /*quizPicked*/
      ctx[8] >= 0;
      toggle_class(
        button,
        "is-correct",
        /*quizPicked*/
        ctx[8] >= 0 && /*i*/
        ctx[108] === /*cur*/
        ctx[6].quiz.answer
      );
      toggle_class(
        button,
        "is-wrong",
        /*quizPicked*/
        ctx[8] === /*i*/
        ctx[108] && !/*quizCorrect*/
        ctx[9]
      );
    },
    m(target, anchor) {
      insert(target, button, anchor);
      append(button, span0);
      append(button, t1);
      append(button, span1);
      append(span1, t2);
      append(button, t3);
      if (!mounted) {
        dispose = listen(button, "click", click_handler_15);
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (dirty[0] & /*cur*/
      64 && t2_value !== (t2_value = /*opt*/
      ctx[106] + "")) set_data(t2, t2_value);
      if (dirty[0] & /*quizPicked*/
      256 && button_disabled_value !== (button_disabled_value = /*quizPicked*/
      ctx[8] >= 0)) {
        button.disabled = button_disabled_value;
      }
      if (dirty[0] & /*quizPicked, cur*/
      320) {
        toggle_class(
          button,
          "is-correct",
          /*quizPicked*/
          ctx[8] >= 0 && /*i*/
          ctx[108] === /*cur*/
          ctx[6].quiz.answer
        );
      }
      if (dirty[0] & /*quizPicked, quizCorrect*/
      768) {
        toggle_class(
          button,
          "is-wrong",
          /*quizPicked*/
          ctx[8] === /*i*/
          ctx[108] && !/*quizCorrect*/
          ctx[9]
        );
      }
    },
    d(detaching) {
      if (detaching) {
        detach(button);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_322(ctx) {
  let button;
  let mounted;
  let dispose;
  return {
    c() {
      button = element("button");
      button.textContent = "\u7EE7\u7EED\uFF08\u7A7A\u683C\uFF09";
      attr(button, "class", "el-reveal");
    },
    m(target, anchor) {
      insert(target, button, anchor);
      if (!mounted) {
        dispose = listen(
          button,
          "click",
          /*advance*/
          ctx[39]
        );
        mounted = true;
      }
    },
    p: noop,
    d(detaching) {
      if (detaching) {
        detach(button);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_else_block_22(ctx) {
  let wordfullcard;
  let current;
  wordfullcard = new WordFullCard_default({
    props: {
      plugin: (
        /*plugin*/
        ctx[0]
      ),
      doc: (
        /*cur*/
        ctx[6].doc
      ),
      synonyms: (
        /*synRow*/
        ctx[26]
      ),
      antonyms: (
        /*antRow*/
        ctx[27]
      ),
      showBody: (
        /*revealed*/
        ctx[3]
      )
    }
  });
  return {
    c() {
      create_component(wordfullcard.$$.fragment);
    },
    m(target, anchor) {
      mount_component(wordfullcard, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const wordfullcard_changes = {};
      if (dirty[0] & /*plugin*/
      1) wordfullcard_changes.plugin = /*plugin*/
      ctx2[0];
      if (dirty[0] & /*cur*/
      64) wordfullcard_changes.doc = /*cur*/
      ctx2[6].doc;
      if (dirty[0] & /*synRow*/
      67108864) wordfullcard_changes.synonyms = /*synRow*/
      ctx2[26];
      if (dirty[0] & /*antRow*/
      134217728) wordfullcard_changes.antonyms = /*antRow*/
      ctx2[27];
      if (dirty[0] & /*revealed*/
      8) wordfullcard_changes.showBody = /*revealed*/
      ctx2[3];
      wordfullcard.$set(wordfullcard_changes);
    },
    i(local) {
      if (current) return;
      transition_in(wordfullcard.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(wordfullcard.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(wordfullcard, detaching);
    }
  };
}
function create_if_block_29(ctx) {
  let div0;
  let t1;
  let div1;
  let t2_value = (sensesOf(
    /*cur*/
    ctx[6].doc
  )[0] || "\uFF08\u91CA\u4E49\u5F85\u8865\u5145\uFF09") + "";
  let t2;
  let t3;
  let if_block_anchor;
  let if_block = (
    /*reverseHint*/
    ctx[34] && create_if_block_30(ctx)
  );
  return {
    c() {
      div0 = element("div");
      div0.textContent = "\u56DE\u5FC6\u5BF9\u5E94\u7684\u82F1\u6587\u5355\u8BCD";
      t1 = space();
      div1 = element("div");
      t2 = text(t2_value);
      t3 = space();
      if (if_block) if_block.c();
      if_block_anchor = empty();
      attr(div0, "class", "el-hint");
      attr(div1, "class", "el-translation");
      set_style(div1, "margin-top", "10px");
    },
    m(target, anchor) {
      insert(target, div0, anchor);
      insert(target, t1, anchor);
      insert(target, div1, anchor);
      append(div1, t2);
      insert(target, t3, anchor);
      if (if_block) if_block.m(target, anchor);
      insert(target, if_block_anchor, anchor);
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*cur*/
      64 && t2_value !== (t2_value = (sensesOf(
        /*cur*/
        ctx2[6].doc
      )[0] || "\uFF08\u91CA\u4E49\u5F85\u8865\u5145\uFF09") + "")) set_data(t2, t2_value);
      if (
        /*reverseHint*/
        ctx2[34]
      ) {
        if (if_block) {
          if_block.p(ctx2, dirty);
        } else {
          if_block = create_if_block_30(ctx2);
          if_block.c();
          if_block.m(if_block_anchor.parentNode, if_block_anchor);
        }
      } else if (if_block) {
        if_block.d(1);
        if_block = null;
      }
    },
    i: noop,
    o: noop,
    d(detaching) {
      if (detaching) {
        detach(div0);
        detach(t1);
        detach(div1);
        detach(t3);
        detach(if_block_anchor);
      }
      if (if_block) if_block.d(detaching);
    }
  };
}
function create_if_block_30(ctx) {
  let div;
  let t;
  return {
    c() {
      div = element("div");
      t = text(
        /*reverseHint*/
        ctx[34]
      );
      attr(div, "class", "el-example");
      set_style(div, "margin-top", "10px");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, t);
    },
    p(ctx2, dirty) {
      if (dirty[1] & /*reverseHint*/
      8) set_data(
        t,
        /*reverseHint*/
        ctx2[34]
      );
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
    }
  };
}
function create_else_block_13(ctx) {
  let div;
  let button0;
  let t2;
  let button1;
  let t5;
  let button2;
  let t8;
  let button3;
  let mounted;
  let dispose;
  return {
    c() {
      div = element("div");
      button0 = element("button");
      button0.innerHTML = `\u5FD8\u8BB0<span class="el-kbd">1</span>`;
      t2 = space();
      button1 = element("button");
      button1.innerHTML = `\u6A21\u7CCA<span class="el-kbd">2</span>`;
      t5 = space();
      button2 = element("button");
      button2.innerHTML = `\u8BA4\u8BC6<span class="el-kbd">3</span>`;
      t8 = space();
      button3 = element("button");
      button3.innerHTML = `\u592A\u7B80\u5355<span class="el-kbd">4</span>`;
      attr(button0, "class", "el-grade g1");
      attr(button1, "class", "el-grade g2");
      attr(button2, "class", "el-grade g3 el-grade-ok");
      attr(button3, "class", "el-grade g3");
      attr(button3, "title", "\u76F4\u63A5\u6807\u8BB0\u638C\u63E1\uFF0C\u8DF3\u8FC7\u5269\u4F59\u590D\u4E60\u6863\u4F4D");
      attr(div, "class", "el-grade-btns");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, button0);
      append(div, t2);
      append(div, button1);
      append(div, t5);
      append(div, button2);
      append(div, t8);
      append(div, button3);
      if (!mounted) {
        dispose = [
          listen(
            button0,
            "click",
            /*click_handler_8*/
            ctx[71]
          ),
          listen(
            button1,
            "click",
            /*click_handler_9*/
            ctx[72]
          ),
          listen(
            button2,
            "click",
            /*click_handler_10*/
            ctx[73]
          ),
          listen(
            button3,
            "click",
            /*reviewEasy*/
            ctx[50]
          )
        ];
        mounted = true;
      }
    },
    p: noop,
    d(detaching) {
      if (detaching) {
        detach(div);
      }
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_if_block_28(ctx) {
  let button;
  let mounted;
  let dispose;
  return {
    c() {
      button = element("button");
      button.textContent = "\u663E\u793A\u7B54\u6848\uFF08\u7A7A\u683C\uFF09";
      attr(button, "class", "el-reveal el-reveal-ok");
    },
    m(target, anchor) {
      insert(target, button, anchor);
      if (!mounted) {
        dispose = listen(
          button,
          "click",
          /*reveal*/
          ctx[48]
        );
        mounted = true;
      }
    },
    p: noop,
    d(detaching) {
      if (detaching) {
        detach(button);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_26(ctx) {
  let div;
  return {
    c() {
      div = element("div");
      div.textContent = "\u5148\u81EA\u5DF1\u56DE\u5FC6\uFF0C\u518D\u5BF9\u7167\u7B54\u6848";
      attr(div, "class", "el-hint");
    },
    m(target, anchor) {
      insert(target, div, anchor);
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
    }
  };
}
function create_if_block_25(ctx) {
  let div;
  return {
    c() {
      div = element("div");
      div.textContent = "\u786E\u8BA4\u4E00\u4E0B\u4F60\u7684\u8BB0\u5FC6";
      attr(div, "class", "el-hint");
    },
    m(target, anchor) {
      insert(target, div, anchor);
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
    }
  };
}
function create_if_block_24(ctx) {
  let div;
  let button;
  let mounted;
  let dispose;
  return {
    c() {
      div = element("div");
      button = element("button");
      button.textContent = "\u663E\u793A\u7B54\u6848\uFF08\u7A7A\u683C\uFF09";
      attr(button, "class", "el-reveal el-reveal-ok");
      set_style(div, "margin-top", "14px");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, button);
      if (!mounted) {
        dispose = listen(
          button,
          "click",
          /*reveal*/
          ctx[48]
        );
        mounted = true;
      }
    },
    p: noop,
    d(detaching) {
      if (detaching) {
        detach(div);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_232(ctx) {
  let div;
  let button0;
  let t2;
  let button1;
  let t4;
  let button2;
  let mounted;
  let dispose;
  return {
    c() {
      div = element("div");
      button0 = element("button");
      button0.innerHTML = `\u592A\u7B80\u5355<span class="el-kbd">1</span>`;
      t2 = space();
      button1 = element("button");
      button1.textContent = "\u7EE7\u7EED\uFF08\u7A7A\u683C\uFF09";
      t4 = space();
      button2 = element("button");
      button2.innerHTML = `\u5176\u5B9E\u4E0D\u8BA4\u8BC6<span class="el-kbd">3</span>`;
      attr(button0, "class", "el-grade g3");
      attr(button1, "class", "el-grade el-grade-ok");
      attr(button2, "class", "el-grade g1");
      attr(div, "class", "el-grade-btns");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, button0);
      append(div, t2);
      append(div, button1);
      append(div, t4);
      append(div, button2);
      if (!mounted) {
        dispose = [
          listen(
            button0,
            "click",
            /*studyEasy*/
            ctx[45]
          ),
          listen(
            button1,
            "click",
            /*confirmContinue*/
            ctx[46]
          ),
          listen(
            button2,
            "click",
            /*confirmNo*/
            ctx[47]
          )
        ];
        mounted = true;
      }
    },
    p: noop,
    d(detaching) {
      if (detaching) {
        detach(div);
      }
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_if_block_222(ctx) {
  let div;
  let button0;
  let t2;
  let button1;
  let t4;
  let button2;
  let mounted;
  let dispose;
  return {
    c() {
      div = element("div");
      button0 = element("button");
      button0.innerHTML = `\u592A\u7B80\u5355<span class="el-kbd">1</span>`;
      t2 = space();
      button1 = element("button");
      button1.textContent = "\u8BB0\u4F4F\u4E86\uFF08Enter\uFF09";
      t4 = space();
      button2 = element("button");
      button2.innerHTML = `\u518D\u5B66\u4E00\u6B21<span class="el-kbd">4</span>`;
      attr(button0, "class", "el-reveal");
      attr(button1, "class", "el-reveal el-reveal-ok");
      attr(button2, "class", "el-reveal");
      attr(div, "class", "el-study-btns");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, button0);
      append(div, t2);
      append(div, button1);
      append(div, t4);
      append(div, button2);
      if (!mounted) {
        dispose = [
          listen(
            button0,
            "click",
            /*studyEasy*/
            ctx[45]
          ),
          listen(
            button1,
            "click",
            /*studied*/
            ctx[43]
          ),
          listen(
            button2,
            "click",
            /*restudy*/
            ctx[44]
          )
        ];
        mounted = true;
      }
    },
    p: noop,
    d(detaching) {
      if (detaching) {
        detach(div);
      }
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_if_block_182(ctx) {
  let span;
  let t0;
  let t1_value = (
    /*stats*/
    ctx[12].easy + ""
  );
  let t1;
  return {
    c() {
      span = element("span");
      t0 = text("\u592A\u7B80\u5355 ");
      t1 = text(t1_value);
    },
    m(target, anchor) {
      insert(target, span, anchor);
      append(span, t0);
      append(span, t1);
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*stats*/
      4096 && t1_value !== (t1_value = /*stats*/
      ctx2[12].easy + "")) set_data(t1, t1_value);
    },
    d(detaching) {
      if (detaching) {
        detach(span);
      }
    }
  };
}
function create_if_block_172(ctx) {
  let div;
  let t0;
  let t1_value = (
    /*todayTotals*/
    ctx[23].new + ""
  );
  let t1;
  let t2;
  let t3_value = (
    /*todayTotals*/
    ctx[23].rev + ""
  );
  let t3;
  return {
    c() {
      div = element("div");
      t0 = text("\u4ECA\u65E5\u5168\u5E93\u7D2F\u8BA1\uFF1A\u65B0\u5B66 ");
      t1 = text(t1_value);
      t2 = text(" \xB7 \u590D\u4E60 ");
      t3 = text(t3_value);
      attr(div, "class", "el-muted");
      set_style(div, "margin-top", "2px");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, t0);
      append(div, t1);
      append(div, t2);
      append(div, t3);
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*todayTotals*/
      8388608 && t1_value !== (t1_value = /*todayTotals*/
      ctx2[23].new + "")) set_data(t1, t1_value);
      if (dirty[0] & /*todayTotals*/
      8388608 && t3_value !== (t3_value = /*todayTotals*/
      ctx2[23].rev + "")) set_data(t3, t3_value);
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
    }
  };
}
function create_if_block_162(ctx) {
  let div;
  let t;
  let each_value_1 = ensure_array_like(
    /*masteredNow*/
    ctx[13]
  );
  let each_blocks = [];
  for (let i = 0; i < each_value_1.length; i += 1) {
    each_blocks[i] = create_each_block_13(get_each_context_13(ctx, each_value_1, i));
  }
  return {
    c() {
      div = element("div");
      t = text("\u65B0\u638C\u63E1\uFF1A");
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      attr(div, "class", "el-end-mastered");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, t);
      for (let i = 0; i < each_blocks.length; i += 1) {
        if (each_blocks[i]) {
          each_blocks[i].m(div, null);
        }
      }
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*plugin, masteredNow*/
      8193) {
        each_value_1 = ensure_array_like(
          /*masteredNow*/
          ctx2[13]
        );
        let i;
        for (i = 0; i < each_value_1.length; i += 1) {
          const child_ctx = get_each_context_13(ctx2, each_value_1, i);
          if (each_blocks[i]) {
            each_blocks[i].p(child_ctx, dirty);
          } else {
            each_blocks[i] = create_each_block_13(child_ctx);
            each_blocks[i].c();
            each_blocks[i].m(div, null);
          }
        }
        for (; i < each_blocks.length; i += 1) {
          each_blocks[i].d(1);
        }
        each_blocks.length = each_value_1.length;
      }
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
      destroy_each(each_blocks, detaching);
    }
  };
}
function create_each_block_13(ctx) {
  let button;
  let t_value = (
    /*w*/
    ctx[101] + ""
  );
  let t;
  let mounted;
  let dispose;
  function click_handler_3() {
    return (
      /*click_handler_3*/
      ctx[66](
        /*w*/
        ctx[101]
      )
    );
  }
  return {
    c() {
      button = element("button");
      t = text(t_value);
      attr(button, "class", "el-related-w");
      attr(button, "title", "\u53D1\u97F3");
    },
    m(target, anchor) {
      insert(target, button, anchor);
      append(button, t);
      if (!mounted) {
        dispose = listen(button, "click", click_handler_3);
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (dirty[0] & /*masteredNow*/
      8192 && t_value !== (t_value = /*w*/
      ctx[101] + "")) set_data(t, t_value);
    },
    d(detaching) {
      if (detaching) {
        detach(button);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_153(ctx) {
  let div;
  let t;
  let each_value = ensure_array_like(
    /*weakNow*/
    ctx[38]
  );
  let each_blocks = [];
  for (let i = 0; i < each_value.length; i += 1) {
    each_blocks[i] = create_each_block4(get_each_context4(ctx, each_value, i));
  }
  return {
    c() {
      div = element("div");
      t = text("\u672A\u5DE9\u56FA\uFF1A");
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      attr(div, "class", "el-end-mastered el-end-weak");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, t);
      for (let i = 0; i < each_blocks.length; i += 1) {
        if (each_blocks[i]) {
          each_blocks[i].m(div, null);
        }
      }
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*plugin*/
      1 | dirty[1] & /*weakNow*/
      128) {
        each_value = ensure_array_like(
          /*weakNow*/
          ctx2[38]
        );
        let i;
        for (i = 0; i < each_value.length; i += 1) {
          const child_ctx = get_each_context4(ctx2, each_value, i);
          if (each_blocks[i]) {
            each_blocks[i].p(child_ctx, dirty);
          } else {
            each_blocks[i] = create_each_block4(child_ctx);
            each_blocks[i].c();
            each_blocks[i].m(div, null);
          }
        }
        for (; i < each_blocks.length; i += 1) {
          each_blocks[i].d(1);
        }
        each_blocks.length = each_value.length;
      }
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
      destroy_each(each_blocks, detaching);
    }
  };
}
function create_each_block4(ctx) {
  let button;
  let mounted;
  let dispose;
  function click_handler_4() {
    return (
      /*click_handler_4*/
      ctx[67](
        /*w*/
        ctx[101]
      )
    );
  }
  return {
    c() {
      button = element("button");
      button.textContent = `${/*w*/
      ctx[101]}`;
      attr(button, "class", "el-related-w");
      attr(button, "title", "\u53D1\u97F3");
    },
    m(target, anchor) {
      insert(target, button, anchor);
      if (!mounted) {
        dispose = listen(button, "click", click_handler_4);
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
    },
    d(detaching) {
      if (detaching) {
        detach(button);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_143(ctx) {
  let div;
  let t0;
  let t1_value = (
    /*dueTotal*/
    ctx[11] - /*stats*/
    ctx[12].rev + ""
  );
  let t1;
  let t2;
  return {
    c() {
      div = element("div");
      t0 = text("\u8FD8\u6709 ");
      t1 = text(t1_value);
      t2 = text(" \u4E2A\u5F85\u590D\u4E60\uFF08\u53D7\u6BCF\u65E5\u4E0A\u9650\u6216\u65B0\u8BCD\u914D\u989D\u9650\u5236\uFF09");
      attr(div, "class", "el-muted");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, t0);
      append(div, t1);
      append(div, t2);
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*dueTotal, stats*/
      6144 && t1_value !== (t1_value = /*dueTotal*/
      ctx2[11] - /*stats*/
      ctx2[12].rev + "")) set_data(t1, t1_value);
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
    }
  };
}
function create_if_block_133(ctx) {
  let div;
  let t0;
  let t1;
  let t2;
  return {
    c() {
      div = element("div");
      t0 = text("\u660E\u5929\u5C06\u6709 ");
      t1 = text(
        /*tomorrowDue*/
        ctx[22]
      );
      t2 = text(" \u4E2A\u8BCD\u5230\u671F\u590D\u4E60");
      attr(div, "class", "el-muted");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, t0);
      append(div, t1);
      append(div, t2);
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*tomorrowDue*/
      4194304) set_data(
        t1,
        /*tomorrowDue*/
        ctx2[22]
      );
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
    }
  };
}
function create_if_block_123(ctx) {
  let button;
  let t0;
  let t1;
  let t2;
  let mounted;
  let dispose;
  return {
    c() {
      button = element("button");
      t0 = text("\u518D\u6765\u4E00\u8F6E\uFF08");
      t1 = text(
        /*remaining*/
        ctx[14]
      );
      t2 = text("\uFF09");
      attr(button, "class", "mod-cta");
    },
    m(target, anchor) {
      insert(target, button, anchor);
      append(button, t0);
      append(button, t1);
      append(button, t2);
      if (!mounted) {
        dispose = listen(
          button,
          "click",
          /*click_handler_5*/
          ctx[68]
        );
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*remaining*/
      16384) set_data(
        t1,
        /*remaining*/
        ctx2[14]
      );
    },
    d(detaching) {
      if (detaching) {
        detach(button);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_113(ctx) {
  let button;
  let t0;
  let t1_value = Math.min(
    /*finishFresh*/
    ctx[21],
    /*dailyLimit*/
    ctx[19]
  ) + "";
  let t1;
  let t2;
  let mounted;
  let dispose;
  return {
    c() {
      button = element("button");
      t0 = text("\u518D\u6765\u4E00\u6279\uFF08");
      t1 = text(t1_value);
      t2 = text("\uFF09");
      attr(button, "class", "mod-cta");
      attr(button, "title", "\u65E0\u89C6\u6BCF\u65E5\u65B0\u8BCD\u914D\u989D\uFF0C\u7ACB\u5373\u52A0\u5B66\u4E00\u6279\u65B0\u8BCD");
    },
    m(target, anchor) {
      insert(target, button, anchor);
      append(button, t0);
      append(button, t1);
      append(button, t2);
      if (!mounted) {
        dispose = listen(
          button,
          "click",
          /*click_handler_6*/
          ctx[69]
        );
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*finishFresh, dailyLimit*/
      2621440 && t1_value !== (t1_value = Math.min(
        /*finishFresh*/
        ctx2[21],
        /*dailyLimit*/
        ctx2[19]
      ) + "")) set_data(t1, t1_value);
    },
    d(detaching) {
      if (detaching) {
        detach(button);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_103(ctx) {
  let button;
  let t0;
  let t1;
  let t2;
  let mounted;
  let dispose;
  return {
    c() {
      button = element("button");
      t0 = text("\u96BE\u8BCD\u590D\u4E60\uFF08");
      t1 = text(
        /*hardInTheme*/
        ctx[28]
      );
      t2 = text("\uFF09");
      attr(button, "class", "mod-warning");
    },
    m(target, anchor) {
      insert(target, button, anchor);
      append(button, t0);
      append(button, t1);
      append(button, t2);
      if (!mounted) {
        dispose = listen(
          button,
          "click",
          /*click_handler_7*/
          ctx[70]
        );
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*hardInTheme*/
      268435456) set_data(
        t1,
        /*hardInTheme*/
        ctx2[28]
      );
    },
    d(detaching) {
      if (detaching) {
        detach(button);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_else_block4(ctx) {
  let h2;
  let t1;
  let div;
  let t2;
  let t3;
  let t4;
  let t5;
  let t6;
  return {
    c() {
      h2 = element("h2");
      h2.textContent = "\u4ECA\u65E5\u4EFB\u52A1\u5DF2\u5B8C\u6210";
      t1 = space();
      div = element("div");
      t2 = text("\u4ECA\u65E5\u65B0\u8BCD ");
      t3 = text(
        /*todayNew*/
        ctx[18]
      );
      t4 = text("/");
      t5 = text(
        /*dailyLimit*/
        ctx[19]
      );
      t6 = text("\uFF0C\u5230\u671F\u590D\u4E60\u4E5F\u6E05\u7A7A\u4E86\u3002");
      attr(div, "class", "el-muted");
    },
    m(target, anchor) {
      insert(target, h2, anchor);
      insert(target, t1, anchor);
      insert(target, div, anchor);
      append(div, t2);
      append(div, t3);
      append(div, t4);
      append(div, t5);
      append(div, t6);
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*todayNew*/
      262144) set_data(
        t3,
        /*todayNew*/
        ctx2[18]
      );
      if (dirty[0] & /*dailyLimit*/
      524288) set_data(
        t5,
        /*dailyLimit*/
        ctx2[19]
      );
    },
    d(detaching) {
      if (detaching) {
        detach(h2);
        detach(t1);
        detach(div);
      }
    }
  };
}
function create_if_block_83(ctx) {
  let h2;
  let t0;
  let t1;
  let t2;
  let t3;
  let div0;
  let t6;
  let div1;
  return {
    c() {
      h2 = element("h2");
      t0 = text("\u4E3B\u9898\u300C");
      t1 = text(
        /*themeName*/
        ctx[5]
      );
      t2 = text("\u300D\u73B0\u5728\u6CA1\u6709\u8981\u5B66\u7684\u8BCD");
      t3 = space();
      div0 = element("div");
      div0.textContent = `${/*themeIdleText*/
      ctx[55]()}\u3002`;
      t6 = space();
      div1 = element("div");
      div1.textContent = `${/*todayQuotaText*/
      ctx[56]()}\u3002`;
      attr(div0, "class", "el-muted");
      attr(div1, "class", "el-muted");
    },
    m(target, anchor) {
      insert(target, h2, anchor);
      append(h2, t0);
      append(h2, t1);
      append(h2, t2);
      insert(target, t3, anchor);
      insert(target, div0, anchor);
      insert(target, t6, anchor);
      insert(target, div1, anchor);
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*themeName*/
      32) set_data(
        t1,
        /*themeName*/
        ctx2[5]
      );
    },
    d(detaching) {
      if (detaching) {
        detach(h2);
        detach(t3);
        detach(div0);
        detach(t6);
        detach(div1);
      }
    }
  };
}
function create_if_block_73(ctx) {
  let h2;
  return {
    c() {
      h2 = element("h2");
      h2.textContent = "\u6CA1\u6709\u9700\u8981\u4E13\u9879\u8BAD\u7EC3\u7684\u96BE\u8BCD";
    },
    m(target, anchor) {
      insert(target, h2, anchor);
    },
    p: noop,
    d(detaching) {
      if (detaching) {
        detach(h2);
      }
    }
  };
}
function create_if_block_63(ctx) {
  let button;
  let t0;
  let t1_value = Math.min(
    /*doneFresh*/
    ctx[20],
    /*dailyLimit*/
    ctx[19]
  ) + "";
  let t1;
  let t2;
  let mounted;
  let dispose;
  return {
    c() {
      button = element("button");
      t0 = text("\u518D\u6765\u4E00\u6279\uFF08");
      t1 = text(t1_value);
      t2 = text("\uFF09");
      attr(button, "class", "mod-cta");
      attr(button, "title", "\u65E0\u89C6\u6BCF\u65E5\u65B0\u8BCD\u914D\u989D\uFF0C\u7ACB\u5373\u52A0\u5B66\u4E00\u6279\u65B0\u8BCD");
    },
    m(target, anchor) {
      insert(target, button, anchor);
      append(button, t0);
      append(button, t1);
      append(button, t2);
      if (!mounted) {
        dispose = listen(
          button,
          "click",
          /*click_handler_1*/
          ctx[64]
        );
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*doneFresh, dailyLimit*/
      1572864 && t1_value !== (t1_value = Math.min(
        /*doneFresh*/
        ctx2[20],
        /*dailyLimit*/
        ctx2[19]
      ) + "")) set_data(t1, t1_value);
    },
    d(detaching) {
      if (detaching) {
        detach(button);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_53(ctx) {
  let button;
  let mounted;
  let dispose;
  return {
    c() {
      button = element("button");
      button.textContent = `\u96BE\u8BCD\u590D\u4E60\uFF08${/*hardInThemeLive*/
      ctx[54]()}\uFF09`;
      attr(button, "class", "mod-warning");
    },
    m(target, anchor) {
      insert(target, button, anchor);
      if (!mounted) {
        dispose = listen(
          button,
          "click",
          /*click_handler_2*/
          ctx[65]
        );
        mounted = true;
      }
    },
    p: noop,
    d(detaching) {
      if (detaching) {
        detach(button);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_fragment5(ctx) {
  let div;
  let current_block_type_index;
  let if_block;
  let current;
  let mounted;
  let dispose;
  const if_block_creators = [
    create_if_block4,
    create_if_block_110,
    create_if_block_23,
    create_if_block_33,
    create_if_block_43,
    create_if_block_93,
    create_if_block_192
  ];
  const if_blocks = [];
  function select_block_type(ctx2, dirty) {
    if (
      /*loading*/
      ctx2[1]
    ) return 0;
    if (
      /*loadError*/
      ctx2[25]
    ) return 1;
    if (
      /*empty*/
      ctx2[15]
    ) return 2;
    if (
      /*emptyTheme*/
      ctx2[16]
    ) return 3;
    if (
      /*done*/
      ctx2[17]
    ) return 4;
    if (
      /*finished*/
      ctx2[4]
    ) return 5;
    if (
      /*cur*/
      ctx2[6]
    ) return 6;
    return -1;
  }
  if (~(current_block_type_index = select_block_type(ctx, [-1, -1, -1, -1]))) {
    if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
  }
  return {
    c() {
      div = element("div");
      if (if_block) if_block.c();
      attr(div, "class", "el-learn");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      if (~current_block_type_index) {
        if_blocks[current_block_type_index].m(div, null);
      }
      current = true;
      if (!mounted) {
        dispose = listen(
          window_1,
          "keydown",
          /*onKey*/
          ctx[59]
        );
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      let previous_block_index = current_block_type_index;
      current_block_type_index = select_block_type(ctx2, dirty);
      if (current_block_type_index === previous_block_index) {
        if (~current_block_type_index) {
          if_blocks[current_block_type_index].p(ctx2, dirty);
        }
      } else {
        if (if_block) {
          group_outros();
          transition_out(if_blocks[previous_block_index], 1, 1, () => {
            if_blocks[previous_block_index] = null;
          });
          check_outros();
        }
        if (~current_block_type_index) {
          if_block = if_blocks[current_block_type_index];
          if (!if_block) {
            if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx2);
            if_block.c();
          } else {
            if_block.p(ctx2, dirty);
          }
          transition_in(if_block, 1);
          if_block.m(div, null);
        } else {
          if_block = null;
        }
      }
    },
    i(local) {
      if (current) return;
      transition_in(if_block);
      current = true;
    },
    o(local) {
      transition_out(if_block);
      current = false;
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
      if (~current_block_type_index) {
        if_blocks[current_block_type_index].d();
      }
      mounted = false;
      dispose();
    }
  };
}
var KEYS_TIP = "1~4 \u8BC4\u5206/\u9009\u9879\n\u7A7A\u683C \u663E\u793A\u7B54\u6848\nEnter \u8BB0\u4F4F\u4E86/\u63D0\u4EA4\u62FC\u5199\nR \u91CD\u542C\u53D1\u97F3\nB \u8BB0\u52A9\u8BB0\nEsc \u7ED3\u675F\u672C\u8F6E";
function focusOnMount(node) {
  node.focus();
  const vv = window.visualViewport;
  const keepVisible = () => {
    var _a, _b;
    window.scrollTo(0, 0);
    const vh = (_a = vv === null || vv === void 0 ? void 0 : vv.height) !== null && _a !== void 0 ? _a : window.innerHeight;
    const off = (_b = vv === null || vv === void 0 ? void 0 : vv.offsetTop) !== null && _b !== void 0 ? _b : 0;
    const r = node.getBoundingClientRect();
    if (r.top < off || r.bottom > off + vh) node.scrollIntoView({ block: "center" });
  };
  vv === null || vv === void 0 ? void 0 : vv.addEventListener("resize", keepVisible);
  const timer = setTimeout(keepVisible, 350);
  const onBlur = () => vv === null || vv === void 0 ? void 0 : vv.removeEventListener("resize", keepVisible);
  node.addEventListener("blur", onBlur);
  return () => {
    clearTimeout(timer);
    node.removeEventListener("blur", onBlur);
    vv === null || vv === void 0 ? void 0 : vv.removeEventListener("resize", keepVisible);
  };
}
function instance5($$self, $$props, $$invalidate) {
  let total;
  let cur;
  let pct;
  let roundLabel;
  let themeLabel;
  let reverseHint;
  let showFull;
  let { plugin } = $$props;
  let loading = true;
  let cards = [];
  let idx = 0;
  let revealed = false;
  let quizPicked = -1;
  let quizCorrect = false;
  let finished = false;
  let themeName = "";
  let hardMode = false;
  let dueTotal = 0;
  let stats = {
    rev: 0,
    new: 0,
    easy: 0,
    quizOk: 0,
    quizBad: 0
  };
  let masteredNow = [];
  let weakNow = [];
  let studiedDocs = [];
  let reinforcementBuilt = false;
  let quizPool = [];
  let retested = /* @__PURE__ */ new Set();
  let remaining = -1;
  let empty2 = false;
  let emptyTheme = false;
  let done = false;
  let todayNew = 0;
  let dailyLimit = 0;
  let doneFresh = 0;
  let finishFresh = 0;
  let tomorrowDue = 0;
  let todayTotals = { new: 0, rev: 0 };
  let startedAt = 0;
  let sessionMinutes = 0;
  let loadError = "";
  let synRow = [];
  let antRow = [];
  let relLoadSeq = 0;
  async function loadRelWords(doc) {
    if (!doc) {
      $$invalidate(26, synRow = []);
      $$invalidate(27, antRow = []);
      return;
    }
    const seq = ++relLoadSeq;
    $$invalidate(26, synRow = []);
    $$invalidate(27, antRow = []);
    const r = await plugin.relWords(doc);
    if (seq !== relLoadSeq) return;
    $$invalidate(26, synRow = r.synonyms);
    $$invalidate(27, antRow = r.antonyms);
  }
  const phonicTried = /* @__PURE__ */ new Set();
  async function backfillPhonetic(doc) {
    if (!doc || doc.phonetic || isPhrase(doc.word) || phonicTried.has(doc.word)) return;
    phonicTried.add(doc.word);
    await plugin.ensurePhonetic(doc);
    $$invalidate(62, cards);
  }
  let hardInTheme = 0;
  let hasAudio = false;
  let audioSeq = 0;
  async function checkAudio(w) {
    const seq = ++audioSeq;
    const ok = w ? await plugin.audio.has(w) : false;
    if (seq !== audioSeq) return;
    $$invalidate(29, hasAudio = ok);
  }
  onDestroy(plugin.audio.onCached(() => void checkAudio(cur === null || cur === void 0 ? void 0 : cur.doc.word)));
  onMount(async () => {
    var _a, _b, _c;
    $$invalidate(5, themeName = (_a = plugin.sessionTheme) !== null && _a !== void 0 ? _a : "");
    $$invalidate(10, hardMode = plugin.sessionHard);
    let s;
    try {
      s = await plugin.buildSession(plugin.sessionTheme, plugin.sessionHard);
    } catch (e) {
      $$invalidate(25, loadError = e instanceof Error ? e.message : String(e));
      $$invalidate(1, loading = false);
      return;
    }
    $$invalidate(11, dueTotal = s.dueTotal);
    $$invalidate(62, cards = [
      ...s.queue.slice(0, s.dueFirst).map(reviewCard),
      ...s.queue.slice(s.dueFirst).map((doc) => ({ kind: "new", doc }))
    ]);
    $$invalidate(1, loading = false);
    startedAt = Date.now();
    $$invalidate(0, plugin.sessionActive = true, plugin);
    if (!cards.length) {
      $$invalidate(0, plugin.sessionActive = false, plugin);
      const pool = themeName ? plugin.words.byTheme(themeName) : plugin.activeWords();
      if (!pool.length) {
        if (themeName && !hardMode) $$invalidate(16, emptyTheme = true);
        else $$invalidate(15, empty2 = true);
      } else {
        $$invalidate(17, done = true);
        $$invalidate(18, todayNew = (_c = (_b = plugin.db.stats.days[fmtDate(Date.now())]) === null || _b === void 0 ? void 0 : _b.new) !== null && _c !== void 0 ? _c : 0);
        $$invalidate(19, dailyLimit = plugin.db.settings.dailyNew);
        $$invalidate(20, doneFresh = pool.filter((w) => !plugin.db.progress[w.word]).length);
      }
    } else autoSpeak(cards[0]);
  });
  const offNoteChange = plugin.app.metadataCache.on("changed", (f) => {
    if (!cards.some((c) => c.doc.path === f.path)) return;
    void (async () => {
      try {
        await plugin.words.scan();
      } catch (e) {
        console.error("\u7B14\u8BB0\u53D8\u66F4\u540E\u91CD\u626B\u5931\u8D25:", e);
        return;
      }
      let changed = false;
      $$invalidate(62, cards = cards.map((c) => {
        const fresh = plugin.words.get(c.doc.word);
        if (!fresh || fresh === c.doc) return c;
        changed = true;
        return { ...c, doc: fresh };
      }));
      if (!changed) return;
      studiedDocs = studiedDocs.map((x) => {
        var _a;
        return (_a = plugin.words.get(x.word)) !== null && _a !== void 0 ? _a : x;
      });
      quizPool = quizPool.map((x) => {
        var _a;
        return (_a = plugin.words.get(x.word)) !== null && _a !== void 0 ? _a : x;
      });
    })();
  });
  onDestroy(() => {
    offNoteChange.off();
    $$invalidate(0, plugin.sessionActive = false, plugin);
  });
  function reviewCard(doc) {
    const reverseOk = plugin.db.settings.reviewReverse !== false && !!doc.translation;
    return {
      kind: "review",
      doc,
      reverse: reverseOk && Math.random() < 0.5
    };
  }
  function autoSpeak(card = cur) {
    if (!card) return;
    if (card.kind === "quiz" && quizPicked < 0) {
      if (card.quiz.kind === "spell" && card.quiz.audioOnly) plugin.speakWord(card.doc.word);
      return;
    }
    if (card.kind === "review" && card.reverse && !revealed) return;
    plugin.speakWord(card.doc.word);
  }
  function advance() {
    $$invalidate(2, idx++, idx);
    $$invalidate(3, revealed = false);
    $$invalidate(8, quizPicked = -1);
    $$invalidate(30, spellInput = "");
    $$invalidate(31, spellHinted = false);
    $$invalidate(32, spellShowQ = false);
    if (idx >= cards.length) {
      if (!reinforcementBuilt) buildReinforcement();
      else finish();
    } else {
      autoSpeak(cards[idx]);
    }
  }
  function insertNext(card) {
    cards.splice(idx + 1, 0, card);
    $$invalidate(62, cards);
  }
  function finishGrade(r) {
    if (r.isNew) $$invalidate(12, stats.new++, stats);
    else $$invalidate(12, stats.rev++, stats);
    if (r.masteredNow && cur) masteredNow.push(cur.doc.word);
  }
  function tooEasy() {
    if ((cur === null || cur === void 0 ? void 0 : cur.kind) !== "new") return;
    plugin.markMastered(cur.doc.word);
    $$invalidate(12, stats.easy++, stats);
    masteredNow.push(cur.doc.word);
    advance();
  }
  function knowIt() {
    if ((cur === null || cur === void 0 ? void 0 : cur.kind) !== "new") return;
    const doc = cur.doc;
    finishGrade(plugin.recordGrade(doc.word, 3));
    studiedDocs.push(doc);
    insertNext({ kind: "confirm", doc });
    advance();
  }
  function unknownWord() {
    if ((cur === null || cur === void 0 ? void 0 : cur.kind) !== "new") return;
    studiedDocs.push(cur.doc);
    insertNext({ kind: "study", doc: cur.doc });
    advance();
  }
  const studyTries = /* @__PURE__ */ new Map();
  function studied() {
    var _a;
    if ((cur === null || cur === void 0 ? void 0 : cur.kind) !== "study" && (cur === null || cur === void 0 ? void 0 : cur.kind) !== "restudy") return;
    finishGrade(plugin.recordGrade(cur.doc.word, 1));
    if (((_a = studyTries.get(cur.doc.word)) !== null && _a !== void 0 ? _a : 0) >= 2) plugin.bumpStruggle(cur.doc.word);
    advance();
  }
  function restudy() {
    var _a;
    if ((cur === null || cur === void 0 ? void 0 : cur.kind) !== "study" && (cur === null || cur === void 0 ? void 0 : cur.kind) !== "restudy") return;
    studyTries.set(cur.doc.word, ((_a = studyTries.get(cur.doc.word)) !== null && _a !== void 0 ? _a : 0) + 1);
    cards.splice(idx + 3, 0, { kind: "restudy", doc: cur.doc });
    $$invalidate(62, cards);
    advance();
  }
  function studyEasy() {
    if ((cur === null || cur === void 0 ? void 0 : cur.kind) !== "study" && (cur === null || cur === void 0 ? void 0 : cur.kind) !== "confirm" && (cur === null || cur === void 0 ? void 0 : cur.kind) !== "restudy") return;
    studiedDocs = studiedDocs.filter((d) => d.word !== cur.doc.word);
    plugin.markMastered(cur.doc.word);
    $$invalidate(12, stats.easy++, stats);
    masteredNow.push(cur.doc.word);
    advance();
  }
  function confirmContinue() {
    advance();
  }
  function confirmNo() {
    if ((cur === null || cur === void 0 ? void 0 : cur.kind) !== "confirm") return;
    plugin.recordGrade(cur.doc.word, 1);
    $$invalidate(12, stats.rev++, stats);
    insertNext({ kind: "study", doc: cur.doc });
    advance();
  }
  function reveal() {
    $$invalidate(3, revealed = true);
    autoSpeak();
  }
  function grade(g) {
    if ((cur === null || cur === void 0 ? void 0 : cur.kind) !== "review") return;
    finishGrade(plugin.recordGrade(cur.doc.word, g));
    advance();
  }
  function reviewEasy() {
    if ((cur === null || cur === void 0 ? void 0 : cur.kind) !== "review" || !revealed) return;
    plugin.markMastered(cur.doc.word);
    $$invalidate(12, stats.rev++, stats);
    masteredNow.push(cur.doc.word);
    advance();
  }
  let spellInput = "";
  let spellHinted = false;
  let spellShowQ = false;
  function spellKeydown(ev) {
    var _a;
    if (ev.key === "Enter") submitSpell();
    else if (ev.key === "Escape") (_a = ev.currentTarget) === null || _a === void 0 ? void 0 : _a.blur();
  }
  function submitSpell() {
    var _a;
    if ((cur === null || cur === void 0 ? void 0 : cur.kind) !== "quiz" || cur.quiz.kind !== "spell" || quizPicked >= 0) return;
    if (!spellInput.trim()) return;
    const ok = normalizeWord(spellInput) === cur.doc.word;
    $$invalidate(8, quizPicked = 0);
    $$invalidate(9, quizCorrect = ok);
    const r = plugin.recordGrade(cur.doc.word, ok ? 3 : 1);
    if (!r.isNew) $$invalidate(12, stats.rev++, stats);
    if (ok) $$invalidate(12, stats.quizOk++, stats);
    else {
      $$invalidate(12, stats.quizBad++, stats);
      if (!weakNow.includes(cur.doc.word)) weakNow.push(cur.doc.word);
      autoSpeak();
      if (!retested.has(cur.doc.word)) {
        retested.add(cur.doc.word);
        const again = (_a = buildQuiz(cur.doc, quizPool, quizOpts())) !== null && _a !== void 0 ? _a : cur.quiz;
        cards.push({ kind: "quiz", doc: cur.doc, quiz: again });
        $$invalidate(62, cards);
      }
    }
    if (r.masteredNow) masteredNow.push(cur.doc.word);
    if (ok) {
      plugin.speakWord(cur.doc.word);
      setTimeout(advance, 1100);
    }
  }
  function pick(i) {
    var _a;
    if ((cur === null || cur === void 0 ? void 0 : cur.kind) !== "quiz" || quizPicked >= 0) return;
    if (cur.quiz.kind === "spell") return;
    $$invalidate(8, quizPicked = i);
    $$invalidate(9, quizCorrect = i === cur.quiz.answer);
    const r = plugin.recordGrade(cur.doc.word, quizCorrect ? 3 : 1);
    if (!r.isNew) $$invalidate(12, stats.rev++, stats);
    if (quizCorrect) $$invalidate(12, stats.quizOk++, stats);
    else {
      $$invalidate(12, stats.quizBad++, stats);
      if (!weakNow.includes(cur.doc.word)) weakNow.push(cur.doc.word);
      autoSpeak();
      if (!retested.has(cur.doc.word)) {
        retested.add(cur.doc.word);
        const again = (_a = buildQuiz(cur.doc, quizPool, quizOpts())) !== null && _a !== void 0 ? _a : cur.quiz;
        cards.push({ kind: "quiz", doc: cur.doc, quiz: again });
        $$invalidate(62, cards);
      }
    }
    if (r.masteredNow) masteredNow.push(cur.doc.word);
    if (quizCorrect) {
      plugin.speakWord(cur.doc.word);
      setTimeout(advance, 1100);
    }
  }
  function quizOpts() {
    var _a, _b;
    return {
      spellChance: (_a = plugin.db.settings.spellChance) !== null && _a !== void 0 ? _a : 0.3,
      audioChance: (_b = plugin.db.settings.audioChance) !== null && _b !== void 0 ? _b : 0.4
    };
  }
  function buildReinforcement() {
    reinforcementBuilt = true;
    if (!studiedDocs.length) {
      finish();
      return;
    }
    const theme = plugin.sessionTheme;
    const pool = (theme ? plugin.words.byTheme(theme) : plugin.activeWords()).filter((d) => d.word);
    quizPool = pool;
    const quizzes = [];
    for (const doc of studiedDocs) {
      const q = buildQuiz(doc, pool, quizOpts());
      if (q) quizzes.push({ kind: "quiz", doc, quiz: q });
    }
    if (!quizzes.length) {
      finish();
      return;
    }
    $$invalidate(62, cards = [...cards, ...quizzes]);
  }
  function hardInThemeLive() {
    const pool = themeName ? plugin.words.byTheme(themeName) : plugin.activeWords();
    return pool.filter((w) => {
      const p = plugin.db.progress[w.word];
      return p && !isMastered(p) && isHardWord(p);
    }).length;
  }
  function freshLeftCount() {
    const pool = themeName ? plugin.words.byTheme(themeName) : plugin.activeWords();
    return pool.filter((w) => !plugin.db.progress[w.word]).length;
  }
  function themeIdleText() {
    const now2 = Date.now();
    let learn = 0;
    let nextMin = Infinity;
    for (const w of plugin.words.byTheme(themeName)) {
      const p = plugin.db.progress[w.word];
      if (!p || isMastered(p) || isHardWord(p) || p.next <= now2) continue;
      learn++;
      nextMin = Math.min(nextMin, Math.ceil((p.next - now2) / 6e4));
    }
    if (!learn) return "\u4E3B\u9898\u91CC\u6682\u65F6\u6CA1\u6709\u5728\u590D\u4E60\u95F4\u9694\u4E2D\u7684\u8BCD";
    const when = nextMin < 60 ? `${nextMin} \u5206\u949F\u540E` : nextMin < 1440 ? `${Math.round(nextMin / 60)} \u5C0F\u65F6\u540E` : `${Math.round(nextMin / 1440)} \u5929\u540E`;
    return `${learn} \u4E2A\u8BCD\u5728\u590D\u4E60\u95F4\u9694\u4E2D\uFF0C\u6700\u65E9 ${when}\u5230\u671F`;
  }
  function todayQuotaText() {
    if (dailyLimit <= 0) return `\u4ECA\u65E5\u5168\u5E93\u5DF2\u5B66\u65B0\u8BCD ${todayNew}\uFF08\u672A\u8BBE\u6BCF\u65E5\u65B0\u8BCD\u914D\u989D\uFF09`;
    const over = todayNew >= dailyLimit ? "\uFF0C\u65B0\u8BCD\u914D\u989D\u5DF2\u7528\u5B8C" : "";
    return `\u4ECA\u65E5\u5168\u5E93\u5DF2\u5B66\u65B0\u8BCD ${todayNew}/${dailyLimit}${over}`;
  }
  function finish() {
    var _a;
    $$invalidate(4, finished = true);
    $$invalidate(0, plugin.sessionActive = false, plugin);
    $$invalidate(24, sessionMinutes = Math.max(1, Math.round((Date.now() - startedAt) / 6e4)));
    $$invalidate(23, todayTotals = (_a = plugin.db.stats.days[fmtDate(Date.now())]) !== null && _a !== void 0 ? _a : { new: 0, rev: 0 });
    $$invalidate(28, hardInTheme = hardInThemeLive());
    $$invalidate(21, finishFresh = freshLeftCount());
    const now2 = Date.now();
    const tmrEnd = (/* @__PURE__ */ new Date()).setHours(24, 0, 0, 0) + 864e5;
    $$invalidate(22, tomorrowDue = Object.values(plugin.db.progress).filter((p) => !isMastered(p) && p.next > now2 && p.next <= tmrEnd).length);
    void plugin.finishSession();
    void updateRemaining();
  }
  async function updateRemaining() {
    if (hardMode) {
      $$invalidate(14, remaining = 0);
      return;
    }
    try {
      const s = await plugin.buildSession(themeName || null, false);
      $$invalidate(14, remaining = s.queue.length);
    } catch (_a) {
      $$invalidate(14, remaining = 0);
    }
  }
  async function extraRound(extraNew = 0) {
    let s;
    try {
      s = await plugin.buildSession(themeName || null, false, extraNew);
    } catch (e) {
      new import_obsidian10.Notice(`\u52A0\u8F7D\u65B0\u4E00\u8F6E\u5931\u8D25\uFF1A${e instanceof Error ? e.message : e}`);
      return;
    }
    if (!s.queue.length) {
      $$invalidate(14, remaining = 0);
      $$invalidate(20, doneFresh = freshLeftCount());
      return;
    }
    $$invalidate(11, dueTotal = s.dueTotal);
    $$invalidate(62, cards = [
      ...s.queue.slice(0, s.dueFirst).map(reviewCard),
      ...s.queue.slice(s.dueFirst).map((doc) => ({ kind: "new", doc }))
    ]);
    $$invalidate(2, idx = 0);
    $$invalidate(3, revealed = false);
    $$invalidate(8, quizPicked = -1);
    $$invalidate(30, spellInput = "");
    $$invalidate(31, spellHinted = false);
    $$invalidate(32, spellShowQ = false);
    studiedDocs = [];
    reinforcementBuilt = false;
    retested = /* @__PURE__ */ new Set();
    $$invalidate(12, stats = {
      rev: 0,
      new: 0,
      easy: 0,
      quizOk: 0,
      quizBad: 0
    });
    startedAt = Date.now();
    $$invalidate(14, remaining = -1);
    $$invalidate(4, finished = false);
    $$invalidate(17, done = false);
    autoSpeak(cards[idx]);
  }
  function onKey(e) {
    if (loading) return;
    const t = e.target;
    if (t && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))) return;
    const k = e.key;
    if (k === "?") {
      const tip = document.querySelector(".el-learn .el-helptip");
      if (tip) showTipBubble(tip, KEYS_TIP);
      else new import_obsidian10.Notice(KEYS_TIP, 8e3);
      return;
    }
    if (k === "Escape") {
      if (!finished) finish();
      return;
    }
    if (finished) return;
    if (k.toLowerCase() === "r") {
      autoSpeak();
      return;
    }
    if (k.toLowerCase() === "b" && cur) {
      new MemoModal(plugin.app, plugin, cur.doc, () => ($$invalidate(6, cur), $$invalidate(4, finished), $$invalidate(1, loading), $$invalidate(62, cards), $$invalidate(2, idx))).open();
      return;
    }
    if ((cur === null || cur === void 0 ? void 0 : cur.kind) === "quiz") {
      if (quizPicked < 0 && ["1", "2", "3", "4"].includes(k)) {
        pick(Number(k) - 1);
      } else if (quizPicked >= 0 && !quizCorrect && k === " ") {
        e.preventDefault();
        advance();
      }
      return;
    }
    if (k === " ") {
      e.preventDefault();
      if ((cur === null || cur === void 0 ? void 0 : cur.kind) === "review" && !revealed) reveal();
      else if ((cur === null || cur === void 0 ? void 0 : cur.kind) === "confirm") confirmContinue();
      return;
    }
    if ((cur === null || cur === void 0 ? void 0 : cur.kind) === "review" && revealed && ["1", "2", "3"].includes(k)) {
      grade(Number(k));
    } else if ((cur === null || cur === void 0 ? void 0 : cur.kind) === "review" && revealed && k === "4") {
      reviewEasy();
    } else if ((cur === null || cur === void 0 ? void 0 : cur.kind) === "new") {
      if (k === "1") tooEasy();
      else if (k === "2") knowIt();
      else if (k === "3") unknownWord();
    } else if ((cur === null || cur === void 0 ? void 0 : cur.kind) === "study") {
      if (k === "Enter") studied();
      else if (k === "4") restudy();
      else if (k === "1") studyEasy();
    } else if ((cur === null || cur === void 0 ? void 0 : cur.kind) === "restudy") {
      if (!revealed && (k === " " || k === "Enter")) {
        e.preventDefault();
        reveal();
      } else if (revealed) {
        if (k === "Enter") studied();
        else if (k === "4") restudy();
        else if (k === "1") studyEasy();
      }
    } else if ((cur === null || cur === void 0 ? void 0 : cur.kind) === "confirm") {
      if (k === "3") confirmNo();
      else if (k === "1") studyEasy();
    }
  }
  function deleteCurrent() {
    if (!cur) return;
    const w = cur.doc.word;
    void confirmDeleteWord(plugin.app, w).then((ok) => {
      if (!ok) return;
      $$invalidate(62, cards = cards.filter((c) => c.doc.word !== w));
      studiedDocs = studiedDocs.filter((d) => d.word !== w);
      quizPool = quizPool.filter((d) => d.word !== w);
      $$invalidate(13, masteredNow = masteredNow.filter((x) => x !== w));
      $$invalidate(3, revealed = false);
      $$invalidate(8, quizPicked = -1);
      $$invalidate(30, spellInput = "");
      $$invalidate(31, spellHinted = false);
      $$invalidate(32, spellShowQ = false);
      if (idx >= cards.length) {
        if (!reinforcementBuilt) buildReinforcement();
        else finish();
      } else {
        autoSpeak(cards[idx]);
      }
      plugin.deleteWord(w).then(() => new import_obsidian10.Notice(`\u5DF2\u5220\u9664\u300C${w}\u300D`)).catch((e) => new import_obsidian10.Notice(`\u5220\u9664\u5931\u8D25\uFF08\u300C${w}\u300D\u53EF\u80FD\u8FD8\u5728\u8BCD\u5E93\uFF09\uFF1A${e instanceof Error ? e.message : e}`));
    });
  }
  function back() {
    var _a;
    (_a = plugin.app.workspace.getLeavesOfType(LEARN_VIEW_TYPE)[0]) === null || _a === void 0 ? void 0 : _a.detach();
    void plugin.activateView(THEME_VIEW_TYPE);
  }
  const click_handler = () => location.reload();
  const click_handler_1 = () => void extraRound(dailyLimit);
  const click_handler_2 = () => {
    void plugin.startSession(themeName || null, true);
  };
  const click_handler_3 = (w) => plugin.speakWord(w);
  const click_handler_4 = (w) => plugin.speakWord(w);
  const click_handler_5 = () => void extraRound();
  const click_handler_6 = () => void extraRound(dailyLimit);
  const click_handler_7 = () => {
    void plugin.startSession(themeName || null, true);
  };
  const click_handler_8 = () => grade(1);
  const click_handler_9 = () => grade(2);
  const click_handler_10 = () => grade(3);
  const click_handler_11 = () => plugin.speakWord(cur.doc.word);
  const click_handler_12 = () => $$invalidate(32, spellShowQ = true);
  function input_input_handler() {
    spellInput = this.value;
    $$invalidate(30, spellInput);
  }
  const click_handler_13 = () => plugin.speakWord(cur.doc.word);
  const click_handler_14 = () => $$invalidate(31, spellHinted = true);
  const click_handler_15 = (i) => pick(i);
  $$self.$$set = ($$props2) => {
    if ("plugin" in $$props2) $$invalidate(0, plugin = $$props2.plugin);
  };
  $$self.$$.update = () => {
    if ($$self.$$.dirty[2] & /*cards*/
    1) {
      $: $$invalidate(7, total = cards.length);
    }
    if ($$self.$$.dirty[0] & /*finished, loading, idx*/
    22 | $$self.$$.dirty[2] & /*cards*/
    1) {
      $: $$invalidate(6, cur = finished || loading ? void 0 : cards[idx]);
    }
    if ($$self.$$.dirty[0] & /*total, idx*/
    132) {
      $: $$invalidate(37, pct = total ? idx / total * 100 : 0);
    }
    if ($$self.$$.dirty[0] & /*cur*/
    64) {
      $: $$invalidate(36, roundLabel = (cur === null || cur === void 0 ? void 0 : cur.kind) === "review" ? cur.reverse ? "\u590D\u4E60 \xB7 \u770B\u4E49\u56DE\u5FC6" : "\u590D\u4E60 \xB7 \u770B\u8BCD\u56DE\u5FC6" : (cur === null || cur === void 0 ? void 0 : cur.kind) === "quiz" ? "\u5DE9\u56FA\u6D4B\u8BD5" : "\u65B0\u8BCD");
    }
    if ($$self.$$.dirty[0] & /*themeName, cur*/
    96) {
      $: $$invalidate(35, themeLabel = themeName ? "" : (cur === null || cur === void 0 ? void 0 : cur.doc.themes.length) ? `${cur.doc.themes.join(" / ")} \xB7 ` : "");
    }
    if ($$self.$$.dirty[0] & /*cur*/
    64) {
      $: $$invalidate(34, reverseHint = (cur === null || cur === void 0 ? void 0 : cur.kind) === "review" && cur.reverse ? pickClozeHint(cur.doc) : null);
    }
    if ($$self.$$.dirty[0] & /*cur, revealed*/
    72) {
      $: $$invalidate(33, showFull = (cur === null || cur === void 0 ? void 0 : cur.kind) !== "restudy" || revealed);
    }
    if ($$self.$$.dirty[0] & /*cur*/
    64) {
      $: loadRelWords(cur && cur.kind !== "new" ? cur.doc : void 0);
    }
    if ($$self.$$.dirty[0] & /*cur*/
    64) {
      $: backfillPhonetic(cur === null || cur === void 0 ? void 0 : cur.doc);
    }
    if ($$self.$$.dirty[0] & /*cur*/
    64) {
      $: void checkAudio(cur === null || cur === void 0 ? void 0 : cur.doc.word);
    }
  };
  return [
    plugin,
    loading,
    idx,
    revealed,
    finished,
    themeName,
    cur,
    total,
    quizPicked,
    quizCorrect,
    hardMode,
    dueTotal,
    stats,
    masteredNow,
    remaining,
    empty2,
    emptyTheme,
    done,
    todayNew,
    dailyLimit,
    doneFresh,
    finishFresh,
    tomorrowDue,
    todayTotals,
    sessionMinutes,
    loadError,
    synRow,
    antRow,
    hardInTheme,
    hasAudio,
    spellInput,
    spellHinted,
    spellShowQ,
    showFull,
    reverseHint,
    themeLabel,
    roundLabel,
    pct,
    weakNow,
    advance,
    tooEasy,
    knowIt,
    unknownWord,
    studied,
    restudy,
    studyEasy,
    confirmContinue,
    confirmNo,
    reveal,
    grade,
    reviewEasy,
    spellKeydown,
    submitSpell,
    pick,
    hardInThemeLive,
    themeIdleText,
    todayQuotaText,
    finish,
    extraRound,
    onKey,
    deleteCurrent,
    back,
    cards,
    click_handler,
    click_handler_1,
    click_handler_2,
    click_handler_3,
    click_handler_4,
    click_handler_5,
    click_handler_6,
    click_handler_7,
    click_handler_8,
    click_handler_9,
    click_handler_10,
    click_handler_11,
    click_handler_12,
    input_input_handler,
    click_handler_13,
    click_handler_14,
    click_handler_15
  ];
}
var LearnSession = class extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance5, create_fragment5, safe_not_equal, { plugin: 0 }, null, [-1, -1, -1, -1]);
  }
};
var LearnSession_default = LearnSession;

// src/ui/learn-view.ts
var LearnView = class extends import_obsidian11.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
  }
  getViewType() {
    return LEARN_VIEW_TYPE;
  }
  getDisplayText() {
    return "\u4ECA\u65E5\u5B66\u4E60";
  }
  getIcon() {
    return "graduation-cap";
  }
  async onOpen() {
    this.mount();
  }
  async onClose() {
    var _a;
    (_a = this.comp) == null ? void 0 : _a.$destroy();
  }
  /** 重建组件：视图常驻时再次 startSession（换主题/学完再来）必须重载会话，否则显示旧页 */
  restart() {
    var _a;
    (_a = this.comp) == null ? void 0 : _a.$destroy();
    this.mount();
  }
  mount() {
    this.contentEl.empty();
    this.comp = new LearnSession_default({ target: this.contentEl, props: { plugin: this.plugin } });
  }
};

// src/ui/theme-view.ts
var import_obsidian13 = require("obsidian");

// src/components/ThemePanel.svelte
var import_obsidian12 = require("obsidian");
function get_each_context5(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[47] = list[i];
  return child_ctx;
}
function get_each_context_14(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[50] = list[i];
  child_ctx[52] = i;
  return child_ctx;
}
function get_each_context_23(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[53] = list[i];
  return child_ctx;
}
function get_each_context_32(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[56] = list[i];
  return child_ctx;
}
function get_each_context_42(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[52] = list[i];
  child_ctx[60] = i;
  return child_ctx;
}
function get_each_context_52(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[52] = list[i];
  child_ctx[60] = i;
  return child_ctx;
}
function create_if_block_163(ctx) {
  let button;
  let t0;
  let t1_value = (
    /*totals*/
    ctx[3].hard + ""
  );
  let t1;
  let mounted;
  let dispose;
  return {
    c() {
      button = element("button");
      t0 = text("\u96BE\u8BCD\u4E13\u9879 ");
      t1 = text(t1_value);
      attr(button, "class", "mod-warning");
    },
    m(target, anchor) {
      insert(target, button, anchor);
      append(button, t0);
      append(button, t1);
      if (!mounted) {
        dispose = listen(
          button,
          "click",
          /*click_handler*/
          ctx[26]
        );
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*totals*/
      8 && t1_value !== (t1_value = /*totals*/
      ctx2[3].hard + "")) set_data(t1, t1_value);
    },
    d(detaching) {
      if (detaching) {
        detach(button);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_154(ctx) {
  let button;
  let t0;
  let t1_value = (
    /*todayPending*/
    ctx[4] > 0 ? `\uFF08${/*todayPending*/
    ctx[4]}\uFF09` : ""
  );
  let t1;
  let mounted;
  let dispose;
  return {
    c() {
      button = element("button");
      t0 = text("\u4ECA\u65E5\u5B66\u4E60");
      t1 = text(t1_value);
      attr(button, "class", "mod-cta");
    },
    m(target, anchor) {
      insert(target, button, anchor);
      append(button, t0);
      append(button, t1);
      if (!mounted) {
        dispose = listen(
          button,
          "click",
          /*click_handler_1*/
          ctx[27]
        );
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*todayPending*/
      16 && t1_value !== (t1_value = /*todayPending*/
      ctx2[4] > 0 ? `\uFF08${/*todayPending*/
      ctx2[4]}\uFF09` : "")) set_data(t1, t1_value);
    },
    d(detaching) {
      if (detaching) {
        detach(button);
      }
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_144(ctx) {
  let div;
  let span;
  let t1;
  let button0;
  let t3;
  let button1;
  let mounted;
  let dispose;
  return {
    c() {
      div = element("div");
      span = element("span");
      span.textContent = "\u2728 \u914D\u7F6E AI \u6E90\uFF0C\u89E3\u9501\u4F8B\u53E5 / \u6269\u8BCD / \u52A9\u8BB0";
      t1 = space();
      button0 = element("button");
      button0.textContent = "\u53BB\u914D\u7F6E";
      t3 = space();
      button1 = element("button");
      button1.textContent = "\xD7";
      attr(span, "class", "el-guide-text");
      attr(button1, "class", "el-guide-close");
      attr(button1, "title", "\u4E0D\u518D\u63D0\u793A");
      attr(button1, "aria-label", "\u4E0D\u518D\u63D0\u793A");
      attr(div, "class", "el-guide-banner");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, span);
      append(div, t1);
      append(div, button0);
      append(div, t3);
      append(div, button1);
      if (!mounted) {
        dispose = [
          listen(
            button0,
            "click",
            /*openGuide*/
            ctx[16]
          ),
          listen(
            button1,
            "click",
            /*dismissGuide*/
            ctx[17]
          )
        ];
        mounted = true;
      }
    },
    p: noop,
    d(detaching) {
      if (detaching) {
        detach(div);
      }
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_if_block_134(ctx) {
  let t0;
  let span;
  let t1;
  let t2_value = (
    /*totals*/
    ctx[3].hard + ""
  );
  let t2;
  return {
    c() {
      t0 = text("\xB7 ");
      span = element("span");
      t1 = text("\u96BE\u8BCD ");
      t2 = text(t2_value);
      set_style(span, "color", "var(--text-error)");
    },
    m(target, anchor) {
      insert(target, t0, anchor);
      insert(target, span, anchor);
      append(span, t1);
      append(span, t2);
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*totals*/
      8 && t2_value !== (t2_value = /*totals*/
      ctx2[3].hard + "")) set_data(t2, t2_value);
    },
    d(detaching) {
      if (detaching) {
        detach(t0);
        detach(span);
      }
    }
  };
}
function create_if_block_84(ctx) {
  let div3;
  let div0;
  let span0;
  let t1;
  let span1;
  let t3;
  let span2;
  let t4;
  let t5;
  let t6;
  let t7;
  let div1;
  let t8;
  let div2;
  let t9;
  let mounted;
  let dispose;
  let each_value_5 = ensure_array_like(
    /*days*/
    ctx[1]
  );
  let each_blocks_1 = [];
  for (let i = 0; i < each_value_5.length; i += 1) {
    each_blocks_1[i] = create_each_block_52(get_each_context_52(ctx, each_value_5, i));
  }
  let each_value_4 = ensure_array_like(
    /*days*/
    ctx[1]
  );
  let each_blocks = [];
  for (let i = 0; i < each_value_4.length; i += 1) {
    each_blocks[i] = create_each_block_42(get_each_context_42(ctx, each_value_4, i));
  }
  let if_block = (
    /*tipDay*/
    ctx[7] >= 0 && /*days*/
    ctx[1][
      /*tipDay*/
      ctx[7]
    ] && create_if_block_94(ctx)
  );
  return {
    c() {
      div3 = element("div");
      div0 = element("div");
      span0 = element("span");
      span0.innerHTML = `<i class="swatch sw-new"></i>\u65B0\u5B66`;
      t1 = space();
      span1 = element("span");
      span1.innerHTML = `<i class="swatch sw-rev"></i>\u590D\u4E60`;
      t3 = space();
      span2 = element("span");
      t4 = text("\u8FD1 14 \u5929\u5171 ");
      t5 = text(
        /*chartSum*/
        ctx[11]
      );
      t6 = text(" \u6B21");
      t7 = space();
      div1 = element("div");
      for (let i = 0; i < each_blocks_1.length; i += 1) {
        each_blocks_1[i].c();
      }
      t8 = space();
      div2 = element("div");
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      t9 = space();
      if (if_block) if_block.c();
      attr(span2, "class", "el-chart-sum");
      attr(div0, "class", "el-chart-legend");
      attr(div1, "class", "el-chart");
      attr(div2, "class", "el-chart-x");
      attr(div3, "class", "el-chart-wrap");
      attr(div3, "role", "presentation");
    },
    m(target, anchor) {
      insert(target, div3, anchor);
      append(div3, div0);
      append(div0, span0);
      append(div0, t1);
      append(div0, span1);
      append(div0, t3);
      append(div0, span2);
      append(span2, t4);
      append(span2, t5);
      append(span2, t6);
      append(div3, t7);
      append(div3, div1);
      for (let i = 0; i < each_blocks_1.length; i += 1) {
        if (each_blocks_1[i]) {
          each_blocks_1[i].m(div1, null);
        }
      }
      append(div3, t8);
      append(div3, div2);
      for (let i = 0; i < each_blocks.length; i += 1) {
        if (each_blocks[i]) {
          each_blocks[i].m(div2, null);
        }
      }
      append(div3, t9);
      if (if_block) if_block.m(div3, null);
      if (!mounted) {
        dispose = listen(
          div3,
          "mouseleave",
          /*mouseleave_handler*/
          ctx[31]
        );
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*chartSum*/
      2048) set_data(
        t5,
        /*chartSum*/
        ctx2[11]
      );
      if (dirty[0] & /*days, tipDay, barH*/
      4226) {
        each_value_5 = ensure_array_like(
          /*days*/
          ctx2[1]
        );
        let i;
        for (i = 0; i < each_value_5.length; i += 1) {
          const child_ctx = get_each_context_52(ctx2, each_value_5, i);
          if (each_blocks_1[i]) {
            each_blocks_1[i].p(child_ctx, dirty);
          } else {
            each_blocks_1[i] = create_each_block_52(child_ctx);
            each_blocks_1[i].c();
            each_blocks_1[i].m(div1, null);
          }
        }
        for (; i < each_blocks_1.length; i += 1) {
          each_blocks_1[i].d(1);
        }
        each_blocks_1.length = each_value_5.length;
      }
      if (dirty[0] & /*days*/
      2) {
        each_value_4 = ensure_array_like(
          /*days*/
          ctx2[1]
        );
        let i;
        for (i = 0; i < each_value_4.length; i += 1) {
          const child_ctx = get_each_context_42(ctx2, each_value_4, i);
          if (each_blocks[i]) {
            each_blocks[i].p(child_ctx, dirty);
          } else {
            each_blocks[i] = create_each_block_42(child_ctx);
            each_blocks[i].c();
            each_blocks[i].m(div2, null);
          }
        }
        for (; i < each_blocks.length; i += 1) {
          each_blocks[i].d(1);
        }
        each_blocks.length = each_value_4.length;
      }
      if (
        /*tipDay*/
        ctx2[7] >= 0 && /*days*/
        ctx2[1][
          /*tipDay*/
          ctx2[7]
        ]
      ) {
        if (if_block) {
          if_block.p(ctx2, dirty);
        } else {
          if_block = create_if_block_94(ctx2);
          if_block.c();
          if_block.m(div3, null);
        }
      } else if (if_block) {
        if_block.d(1);
        if_block = null;
      }
    },
    d(detaching) {
      if (detaching) {
        detach(div3);
      }
      destroy_each(each_blocks_1, detaching);
      destroy_each(each_blocks, detaching);
      if (if_block) if_block.d();
      mounted = false;
      dispose();
    }
  };
}
function create_else_block_23(ctx) {
  let div;
  return {
    c() {
      div = element("div");
      attr(div, "class", "seg seg-none");
    },
    m(target, anchor) {
      insert(target, div, anchor);
    },
    p: noop,
    d(detaching) {
      if (detaching) {
        detach(div);
      }
    }
  };
}
function create_if_block_104(ctx) {
  let t_1;
  let if_block1_anchor;
  let if_block0 = (
    /*d*/
    ctx[52].new > 0 && create_if_block_124(ctx)
  );
  let if_block1 = (
    /*d*/
    ctx[52].rev > 0 && create_if_block_114(ctx)
  );
  return {
    c() {
      if (if_block0) if_block0.c();
      t_1 = space();
      if (if_block1) if_block1.c();
      if_block1_anchor = empty();
    },
    m(target, anchor) {
      if (if_block0) if_block0.m(target, anchor);
      insert(target, t_1, anchor);
      if (if_block1) if_block1.m(target, anchor);
      insert(target, if_block1_anchor, anchor);
    },
    p(ctx2, dirty) {
      if (
        /*d*/
        ctx2[52].new > 0
      ) {
        if (if_block0) {
          if_block0.p(ctx2, dirty);
        } else {
          if_block0 = create_if_block_124(ctx2);
          if_block0.c();
          if_block0.m(t_1.parentNode, t_1);
        }
      } else if (if_block0) {
        if_block0.d(1);
        if_block0 = null;
      }
      if (
        /*d*/
        ctx2[52].rev > 0
      ) {
        if (if_block1) {
          if_block1.p(ctx2, dirty);
        } else {
          if_block1 = create_if_block_114(ctx2);
          if_block1.c();
          if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
        }
      } else if (if_block1) {
        if_block1.d(1);
        if_block1 = null;
      }
    },
    d(detaching) {
      if (detaching) {
        detach(t_1);
        detach(if_block1_anchor);
      }
      if (if_block0) if_block0.d(detaching);
      if (if_block1) if_block1.d(detaching);
    }
  };
}
function create_if_block_124(ctx) {
  let div;
  return {
    c() {
      div = element("div");
      attr(div, "class", "seg seg-new");
      set_style(
        div,
        "height",
        /*barH*/
        ctx[12](
          /*d*/
          ctx[52].new
        ) + "px"
      );
      toggle_class(
        div,
        "seg-top",
        /*d*/
        ctx[52].rev === 0
      );
    },
    m(target, anchor) {
      insert(target, div, anchor);
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*days*/
      2) {
        set_style(
          div,
          "height",
          /*barH*/
          ctx2[12](
            /*d*/
            ctx2[52].new
          ) + "px"
        );
      }
      if (dirty[0] & /*days*/
      2) {
        toggle_class(
          div,
          "seg-top",
          /*d*/
          ctx2[52].rev === 0
        );
      }
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
    }
  };
}
function create_if_block_114(ctx) {
  let div;
  return {
    c() {
      div = element("div");
      attr(div, "class", "seg seg-rev seg-top");
      set_style(
        div,
        "height",
        /*barH*/
        ctx[12](
          /*d*/
          ctx[52].rev
        ) + "px"
      );
    },
    m(target, anchor) {
      insert(target, div, anchor);
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*days*/
      2) {
        set_style(
          div,
          "height",
          /*barH*/
          ctx2[12](
            /*d*/
            ctx2[52].rev
          ) + "px"
        );
      }
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
    }
  };
}
function create_each_block_52(ctx) {
  let div;
  let t_1;
  let div_aria_label_value;
  let div_title_value;
  let mounted;
  let dispose;
  function select_block_type(ctx2, dirty) {
    if (
      /*d*/
      ctx2[52].rev + /*d*/
      ctx2[52].new > 0
    ) return create_if_block_104;
    return create_else_block_23;
  }
  let current_block_type = select_block_type(ctx, [-1, -1]);
  let if_block = current_block_type(ctx);
  function mouseenter_handler() {
    return (
      /*mouseenter_handler*/
      ctx[28](
        /*i*/
        ctx[60]
      )
    );
  }
  function click_handler_2() {
    return (
      /*click_handler_2*/
      ctx[29](
        /*i*/
        ctx[60]
      )
    );
  }
  function keydown_handler(...args) {
    return (
      /*keydown_handler*/
      ctx[30](
        /*i*/
        ctx[60],
        ...args
      )
    );
  }
  return {
    c() {
      div = element("div");
      if_block.c();
      t_1 = space();
      attr(div, "class", "el-chart-col");
      attr(div, "role", "img");
      attr(div, "aria-label", div_aria_label_value = /*d*/
      ctx[52].date + "\uFF1A\u65B0\u5B66 " + /*d*/
      ctx[52].new + "\uFF0C\u590D\u4E60 " + /*d*/
      ctx[52].rev);
      attr(div, "title", div_title_value = /*d*/
      ctx[52].date + "\uFF1A\u65B0\u5B66 " + /*d*/
      ctx[52].new + " \xB7 \u590D\u4E60 " + /*d*/
      ctx[52].rev);
      attr(div, "tabindex", "-1");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      if_block.m(div, null);
      append(div, t_1);
      if (!mounted) {
        dispose = [
          listen(div, "mouseenter", mouseenter_handler),
          listen(div, "click", click_handler_2),
          listen(div, "keydown", keydown_handler)
        ];
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (current_block_type === (current_block_type = select_block_type(ctx, dirty)) && if_block) {
        if_block.p(ctx, dirty);
      } else {
        if_block.d(1);
        if_block = current_block_type(ctx);
        if (if_block) {
          if_block.c();
          if_block.m(div, t_1);
        }
      }
      if (dirty[0] & /*days*/
      2 && div_aria_label_value !== (div_aria_label_value = /*d*/
      ctx[52].date + "\uFF1A\u65B0\u5B66 " + /*d*/
      ctx[52].new + "\uFF0C\u590D\u4E60 " + /*d*/
      ctx[52].rev)) {
        attr(div, "aria-label", div_aria_label_value);
      }
      if (dirty[0] & /*days*/
      2 && div_title_value !== (div_title_value = /*d*/
      ctx[52].date + "\uFF1A\u65B0\u5B66 " + /*d*/
      ctx[52].new + " \xB7 \u590D\u4E60 " + /*d*/
      ctx[52].rev)) {
        attr(div, "title", div_title_value);
      }
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
      if_block.d();
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_each_block_42(ctx) {
  let span;
  let t_1_value = (
    /*i*/
    (ctx[60] === 0 || /*i*/
    ctx[60] === 7 || /*i*/
    ctx[60] === 13 ? (
      /*d*/
      ctx[52].label
    ) : "") + ""
  );
  let t_1;
  return {
    c() {
      span = element("span");
      t_1 = text(t_1_value);
      attr(span, "class", "el-chart-xlab");
    },
    m(target, anchor) {
      insert(target, span, anchor);
      append(span, t_1);
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*days*/
      2 && t_1_value !== (t_1_value = /*i*/
      (ctx2[60] === 0 || /*i*/
      ctx2[60] === 7 || /*i*/
      ctx2[60] === 13 ? (
        /*d*/
        ctx2[52].label
      ) : "") + "")) set_data(t_1, t_1_value);
    },
    d(detaching) {
      if (detaching) {
        detach(span);
      }
    }
  };
}
function create_if_block_94(ctx) {
  let div;
  let t0_value = (
    /*days*/
    ctx[1][
      /*tipDay*/
      ctx[7]
    ].date + ""
  );
  let t0;
  let t1;
  let t2_value = (
    /*days*/
    ctx[1][
      /*tipDay*/
      ctx[7]
    ].new + ""
  );
  let t2;
  let t3;
  let t4_value = (
    /*days*/
    ctx[1][
      /*tipDay*/
      ctx[7]
    ].rev + ""
  );
  let t4;
  return {
    c() {
      div = element("div");
      t0 = text(t0_value);
      t1 = text("\uFF1A\u65B0\u5B66 ");
      t2 = text(t2_value);
      t3 = text(" \xB7 \u590D\u4E60 ");
      t4 = text(t4_value);
      attr(div, "class", "el-chart-tip");
      set_style(div, "left", "min(max(" + /*tipDay*/
      (ctx[7] + 0.5) * (100 / 14) + "%, 42px), calc(100% - 42px))");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, t0);
      append(div, t1);
      append(div, t2);
      append(div, t3);
      append(div, t4);
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*days, tipDay*/
      130 && t0_value !== (t0_value = /*days*/
      ctx2[1][
        /*tipDay*/
        ctx2[7]
      ].date + "")) set_data(t0, t0_value);
      if (dirty[0] & /*days, tipDay*/
      130 && t2_value !== (t2_value = /*days*/
      ctx2[1][
        /*tipDay*/
        ctx2[7]
      ].new + "")) set_data(t2, t2_value);
      if (dirty[0] & /*days, tipDay*/
      130 && t4_value !== (t4_value = /*days*/
      ctx2[1][
        /*tipDay*/
        ctx2[7]
      ].rev + "")) set_data(t4, t4_value);
      if (dirty[0] & /*tipDay*/
      128) {
        set_style(div, "left", "min(max(" + /*tipDay*/
        (ctx2[7] + 0.5) * (100 / 14) + "%, 42px), calc(100% - 42px))");
      }
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
    }
  };
}
function create_else_block_14(ctx) {
  let div;
  let each_blocks = [];
  let each_1_lookup = /* @__PURE__ */ new Map();
  let each_value_2 = ensure_array_like(
    /*rows*/
    ctx[2]
  );
  const get_key = (ctx2) => (
    /*t*/
    ctx2[53].name
  );
  for (let i = 0; i < each_value_2.length; i += 1) {
    let child_ctx = get_each_context_23(ctx, each_value_2, i);
    let key = get_key(child_ctx);
    each_1_lookup.set(key, each_blocks[i] = create_each_block_23(key, child_ctx));
  }
  return {
    c() {
      div = element("div");
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      attr(div, "class", "el-theme-list");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      for (let i = 0; i < each_blocks.length; i += 1) {
        if (each_blocks[i]) {
          each_blocks[i].m(div, null);
        }
      }
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*openEdit, rows, openExpand, start, openWords, togglePin, disableTheme*/
      15499268) {
        each_value_2 = ensure_array_like(
          /*rows*/
          ctx2[2]
        );
        each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx2, each_value_2, each_1_lookup, div, destroy_block, create_each_block_23, null, get_each_context_23);
      }
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].d();
      }
    }
  };
}
function create_if_block_310(ctx) {
  let div;
  return {
    c() {
      div = element("div");
      div.innerHTML = `\u8FD8\u6CA1\u6709\u4E3B\u9898\u3002<br/>
      \u70B9\u51FB\u300C\u65B0\u5EFA\u4E3B\u9898\u300D\u521B\u5EFA\u4E00\u4E2A\uFF08\u5982\u300C\u79D1\u6280\u300D\uFF09\uFF0C\u5EFA\u597D\u5373\u53EF\u6269\u8BCD\u6216\u5BFC\u5165\u8BCD\u8868\u3002`;
      attr(div, "class", "el-empty");
    },
    m(target, anchor) {
      insert(target, div, anchor);
    },
    p: noop,
    d(detaching) {
      if (detaching) {
        detach(div);
      }
    }
  };
}
function create_if_block_210(ctx) {
  let div;
  return {
    c() {
      div = element("div");
      div.textContent = "\u52A0\u8F7D\u4E2D\u2026";
      attr(div, "class", "el-muted");
    },
    m(target, anchor) {
      insert(target, div, anchor);
    },
    p: noop,
    d(detaching) {
      if (detaching) {
        detach(div);
      }
    }
  };
}
function create_if_block_74(ctx) {
  let div1;
  let div0;
  let span0;
  let t0;
  let span1;
  let div0_aria_label_value;
  let t1;
  let span2;
  let t2;
  let t3_value = (
    /*t*/
    ctx[53].count - /*t*/
    ctx[53].fresh + ""
  );
  let t3;
  let t4;
  let t5_value = (
    /*t*/
    ctx[53].count + ""
  );
  let t5;
  let t6;
  let t7_value = (
    /*t*/
    ctx[53].mastered + ""
  );
  let t7;
  return {
    c() {
      div1 = element("div");
      div0 = element("div");
      span0 = element("span");
      t0 = space();
      span1 = element("span");
      t1 = space();
      span2 = element("span");
      t2 = text("\u5DF2\u5B66 ");
      t3 = text(t3_value);
      t4 = text("/");
      t5 = text(t5_value);
      t6 = text(" \xB7 \u638C\u63E1 ");
      t7 = text(t7_value);
      attr(span0, "class", "el-theme-bar-seg is-mastered");
      set_style(
        span0,
        "width",
        /*t*/
        ctx[53].mastered / /*t*/
        ctx[53].count * 100 + "%"
      );
      attr(span1, "class", "el-theme-bar-seg is-learning");
      set_style(
        span1,
        "width",
        /*t*/
        (ctx[53].count - /*t*/
        ctx[53].fresh - /*t*/
        ctx[53].mastered) / /*t*/
        ctx[53].count * 100 + "%"
      );
      attr(div0, "class", "el-theme-bar");
      attr(div0, "role", "img");
      attr(div0, "aria-label", div0_aria_label_value = "\u5DF2\u5B66 " + /*t*/
      (ctx[53].count - /*t*/
      ctx[53].fresh) + "/" + /*t*/
      ctx[53].count + "\uFF0C\u5DF2\u638C\u63E1 " + /*t*/
      ctx[53].mastered + "\uFF0C\u672A\u5B66 " + /*t*/
      ctx[53].fresh);
      attr(span2, "class", "el-theme-bar-label");
      attr(div1, "class", "el-theme-bar-row");
    },
    m(target, anchor) {
      insert(target, div1, anchor);
      append(div1, div0);
      append(div0, span0);
      append(div0, t0);
      append(div0, span1);
      append(div1, t1);
      append(div1, span2);
      append(span2, t2);
      append(span2, t3);
      append(span2, t4);
      append(span2, t5);
      append(span2, t6);
      append(span2, t7);
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*rows*/
      4) {
        set_style(
          span0,
          "width",
          /*t*/
          ctx2[53].mastered / /*t*/
          ctx2[53].count * 100 + "%"
        );
      }
      if (dirty[0] & /*rows*/
      4) {
        set_style(
          span1,
          "width",
          /*t*/
          (ctx2[53].count - /*t*/
          ctx2[53].fresh - /*t*/
          ctx2[53].mastered) / /*t*/
          ctx2[53].count * 100 + "%"
        );
      }
      if (dirty[0] & /*rows*/
      4 && div0_aria_label_value !== (div0_aria_label_value = "\u5DF2\u5B66 " + /*t*/
      (ctx2[53].count - /*t*/
      ctx2[53].fresh) + "/" + /*t*/
      ctx2[53].count + "\uFF0C\u5DF2\u638C\u63E1 " + /*t*/
      ctx2[53].mastered + "\uFF0C\u672A\u5B66 " + /*t*/
      ctx2[53].fresh)) {
        attr(div0, "aria-label", div0_aria_label_value);
      }
      if (dirty[0] & /*rows*/
      4 && t3_value !== (t3_value = /*t*/
      ctx2[53].count - /*t*/
      ctx2[53].fresh + "")) set_data(t3, t3_value);
      if (dirty[0] & /*rows*/
      4 && t5_value !== (t5_value = /*t*/
      ctx2[53].count + "")) set_data(t5, t5_value);
      if (dirty[0] & /*rows*/
      4 && t7_value !== (t7_value = /*t*/
      ctx2[53].mastered + "")) set_data(t7, t7_value);
    },
    d(detaching) {
      if (detaching) {
        detach(div1);
      }
    }
  };
}
function create_if_block_64(ctx) {
  let t0;
  let t1_value = (
    /*t*/
    ctx[53].learn + ""
  );
  let t1;
  return {
    c() {
      t0 = text("\xB7 \u5B66\u4E60\u4E2D ");
      t1 = text(t1_value);
    },
    m(target, anchor) {
      insert(target, t0, anchor);
      insert(target, t1, anchor);
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*rows*/
      4 && t1_value !== (t1_value = /*t*/
      ctx2[53].learn + "")) set_data(t1, t1_value);
    },
    d(detaching) {
      if (detaching) {
        detach(t0);
        detach(t1);
      }
    }
  };
}
function create_if_block_54(ctx) {
  let span;
  let t0;
  let t1_value = (
    /*t*/
    ctx[53].hard + ""
  );
  let t1;
  let span_title_value;
  let mounted;
  let dispose;
  function click_handler_5() {
    return (
      /*click_handler_5*/
      ctx[34](
        /*t*/
        ctx[53]
      )
    );
  }
  function keydown_handler_1(...args) {
    return (
      /*keydown_handler_1*/
      ctx[35](
        /*t*/
        ctx[53],
        ...args
      )
    );
  }
  return {
    c() {
      span = element("span");
      t0 = text("\xB7 \u96BE\u8BCD ");
      t1 = text(t1_value);
      set_style(span, "color", "var(--text-error)");
      set_style(span, "cursor", "pointer");
      attr(span, "title", span_title_value = "\u70B9\u51FB\u5F00\u59CB\u300C" + /*t*/
      ctx[53].name + "\u300D\u96BE\u8BCD\u4E13\u9879");
      attr(span, "role", "button");
      attr(span, "tabindex", "-1");
    },
    m(target, anchor) {
      insert(target, span, anchor);
      append(span, t0);
      append(span, t1);
      if (!mounted) {
        dispose = [
          listen(span, "click", stop_propagation(click_handler_5)),
          listen(span, "keydown", keydown_handler_1)
        ];
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (dirty[0] & /*rows*/
      4 && t1_value !== (t1_value = /*t*/
      ctx[53].hard + "")) set_data(t1, t1_value);
      if (dirty[0] & /*rows*/
      4 && span_title_value !== (span_title_value = "\u70B9\u51FB\u5F00\u59CB\u300C" + /*t*/
      ctx[53].name + "\u300D\u96BE\u8BCD\u4E13\u9879")) {
        attr(span, "title", span_title_value);
      }
    },
    d(detaching) {
      if (detaching) {
        detach(span);
      }
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_if_block_47(ctx) {
  let div;
  let each_blocks = [];
  let each_1_lookup = /* @__PURE__ */ new Map();
  let each_value_3 = ensure_array_like(
    /*t*/
    ctx[53].keywords
  );
  const get_key = (ctx2) => (
    /*k*/
    ctx2[56]
  );
  for (let i = 0; i < each_value_3.length; i += 1) {
    let child_ctx = get_each_context_32(ctx, each_value_3, i);
    let key = get_key(child_ctx);
    each_1_lookup.set(key, each_blocks[i] = create_each_block_32(key, child_ctx));
  }
  return {
    c() {
      div = element("div");
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      attr(div, "class", "el-keywords");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      for (let i = 0; i < each_blocks.length; i += 1) {
        if (each_blocks[i]) {
          each_blocks[i].m(div, null);
        }
      }
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*rows*/
      4) {
        each_value_3 = ensure_array_like(
          /*t*/
          ctx2[53].keywords
        );
        each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx2, each_value_3, each_1_lookup, div, destroy_block, create_each_block_32, null, get_each_context_32);
      }
    },
    d(detaching) {
      if (detaching) {
        detach(div);
      }
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].d();
      }
    }
  };
}
function create_each_block_32(key_1, ctx) {
  let span;
  let t_1_value = (
    /*k*/
    ctx[56] + ""
  );
  let t_1;
  return {
    key: key_1,
    first: null,
    c() {
      span = element("span");
      t_1 = text(t_1_value);
      attr(span, "class", "el-chip");
      this.first = span;
    },
    m(target, anchor) {
      insert(target, span, anchor);
      append(span, t_1);
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (dirty[0] & /*rows*/
      4 && t_1_value !== (t_1_value = /*k*/
      ctx[56] + "")) set_data(t_1, t_1_value);
    },
    d(detaching) {
      if (detaching) {
        detach(span);
      }
    }
  };
}
function create_each_block_23(key_1, ctx) {
  let div5;
  let div0;
  let button0;
  let t1;
  let button1;
  let t2;
  let button1_title_value;
  let t3;
  let div3;
  let div1;
  let t4_value = (
    /*t*/
    ctx[53].name + ""
  );
  let t4;
  let t5;
  let t6;
  let div2;
  let t7;
  let t8_value = (
    /*t*/
    ctx[53].todayNew + ""
  );
  let t8;
  let t9;
  let t10_value = (
    /*t*/
    ctx[53].due + ""
  );
  let t10;
  let t11;
  let t12;
  let t13_value = (
    /*t*/
    ctx[53].fresh + ""
  );
  let t13;
  let t14;
  let t15;
  let t16;
  let div4;
  let button2;
  let t18;
  let button3;
  let t20;
  let button4;
  let t22;
  let mounted;
  let dispose;
  function click_handler_3() {
    return (
      /*click_handler_3*/
      ctx[32](
        /*t*/
        ctx[53]
      )
    );
  }
  function click_handler_4() {
    return (
      /*click_handler_4*/
      ctx[33](
        /*t*/
        ctx[53]
      )
    );
  }
  let if_block0 = (
    /*t*/
    ctx[53].count > 0 && create_if_block_74(ctx)
  );
  let if_block1 = (
    /*t*/
    ctx[53].learn > 0 && create_if_block_64(ctx)
  );
  let if_block2 = (
    /*t*/
    ctx[53].hard > 0 && create_if_block_54(ctx)
  );
  let if_block3 = (
    /*t*/
    ctx[53].keywords.length && create_if_block_47(ctx)
  );
  function click_handler_6() {
    return (
      /*click_handler_6*/
      ctx[36](
        /*t*/
        ctx[53]
      )
    );
  }
  function keydown_handler_2(...args) {
    return (
      /*keydown_handler_2*/
      ctx[37](
        /*t*/
        ctx[53],
        ...args
      )
    );
  }
  function click_handler_7() {
    return (
      /*click_handler_7*/
      ctx[38](
        /*t*/
        ctx[53]
      )
    );
  }
  function click_handler_8() {
    return (
      /*click_handler_8*/
      ctx[39](
        /*t*/
        ctx[53]
      )
    );
  }
  function click_handler_9() {
    return (
      /*click_handler_9*/
      ctx[40](
        /*t*/
        ctx[53]
      )
    );
  }
  return {
    key: key_1,
    first: null,
    c() {
      div5 = element("div");
      div0 = element("div");
      button0 = element("button");
      button0.textContent = "\u{1F6AB}";
      t1 = space();
      button1 = element("button");
      t2 = text("\u{1F4CC}");
      t3 = space();
      div3 = element("div");
      div1 = element("div");
      t4 = text(t4_value);
      t5 = space();
      if (if_block0) if_block0.c();
      t6 = space();
      div2 = element("div");
      t7 = text("\u4ECA\u65E5 +");
      t8 = text(t8_value);
      t9 = text(" \xB7 \u5F85\u590D\u4E60 ");
      t10 = text(t10_value);
      t11 = space();
      if (if_block1) if_block1.c();
      t12 = text(" \xB7 \u672A\u5B66 ");
      t13 = text(t13_value);
      t14 = space();
      if (if_block2) if_block2.c();
      t15 = space();
      if (if_block3) if_block3.c();
      t16 = space();
      div4 = element("div");
      button2 = element("button");
      button2.textContent = "\u5B66\u4E60";
      t18 = space();
      button3 = element("button");
      button3.textContent = "\u6269\u8BCD";
      t20 = space();
      button4 = element("button");
      button4.textContent = "\u7F16\u8F91";
      t22 = space();
      attr(button0, "type", "button");
      attr(button0, "class", "el-theme-toggle");
      attr(button0, "title", "\u505C\u7528\u4E3B\u9898\uFF08\u9690\u85CF\u4E14\u4E0D\u53C2\u4E0E\u5B66\u4E60\uFF0C\u53EF\u5728\u300C\u65B0\u5EFA\u4E3B\u9898\u300D\u5F39\u7A97\u6062\u590D\uFF09");
      attr(button1, "type", "button");
      attr(button1, "class", "el-theme-pin");
      attr(button1, "title", button1_title_value = /*t*/
      ctx[53].pinned ? "\u53D6\u6D88\u7F6E\u9876" : "\u7F6E\u9876\uFF08\u6392\u5728\u5217\u8868\u6700\u524D\uFF09");
      toggle_class(
        button1,
        "is-pinned",
        /*t*/
        ctx[53].pinned
      );
      attr(div0, "class", "el-theme-corner");
      attr(div1, "class", "el-theme-name");
      attr(div2, "class", "el-meta");
      attr(div3, "class", "el-theme-info");
      attr(div3, "role", "button");
      attr(div3, "tabindex", "0");
      attr(div3, "title", "\u70B9\u51FB\u67E5\u770B\u8BCD\u8868");
      attr(button2, "class", "mod-cta");
      attr(div4, "class", "el-theme-actions");
      attr(div5, "class", "el-theme-item");
      this.first = div5;
    },
    m(target, anchor) {
      insert(target, div5, anchor);
      append(div5, div0);
      append(div0, button0);
      append(div0, t1);
      append(div0, button1);
      append(button1, t2);
      append(div5, t3);
      append(div5, div3);
      append(div3, div1);
      append(div1, t4);
      append(div3, t5);
      if (if_block0) if_block0.m(div3, null);
      append(div3, t6);
      append(div3, div2);
      append(div2, t7);
      append(div2, t8);
      append(div2, t9);
      append(div2, t10);
      append(div2, t11);
      if (if_block1) if_block1.m(div2, null);
      append(div2, t12);
      append(div2, t13);
      append(div2, t14);
      if (if_block2) if_block2.m(div2, null);
      append(div3, t15);
      if (if_block3) if_block3.m(div3, null);
      append(div5, t16);
      append(div5, div4);
      append(div4, button2);
      append(div4, t18);
      append(div4, button3);
      append(div4, t20);
      append(div4, button4);
      append(div5, t22);
      if (!mounted) {
        dispose = [
          listen(button0, "click", click_handler_3),
          listen(button1, "click", click_handler_4),
          listen(div3, "click", click_handler_6),
          listen(div3, "keydown", keydown_handler_2),
          listen(button2, "click", click_handler_7),
          listen(button3, "click", click_handler_8),
          listen(button4, "click", click_handler_9)
        ];
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (dirty[0] & /*rows*/
      4 && button1_title_value !== (button1_title_value = /*t*/
      ctx[53].pinned ? "\u53D6\u6D88\u7F6E\u9876" : "\u7F6E\u9876\uFF08\u6392\u5728\u5217\u8868\u6700\u524D\uFF09")) {
        attr(button1, "title", button1_title_value);
      }
      if (dirty[0] & /*rows*/
      4) {
        toggle_class(
          button1,
          "is-pinned",
          /*t*/
          ctx[53].pinned
        );
      }
      if (dirty[0] & /*rows*/
      4 && t4_value !== (t4_value = /*t*/
      ctx[53].name + "")) set_data(t4, t4_value);
      if (
        /*t*/
        ctx[53].count > 0
      ) {
        if (if_block0) {
          if_block0.p(ctx, dirty);
        } else {
          if_block0 = create_if_block_74(ctx);
          if_block0.c();
          if_block0.m(div3, t6);
        }
      } else if (if_block0) {
        if_block0.d(1);
        if_block0 = null;
      }
      if (dirty[0] & /*rows*/
      4 && t8_value !== (t8_value = /*t*/
      ctx[53].todayNew + "")) set_data(t8, t8_value);
      if (dirty[0] & /*rows*/
      4 && t10_value !== (t10_value = /*t*/
      ctx[53].due + "")) set_data(t10, t10_value);
      if (
        /*t*/
        ctx[53].learn > 0
      ) {
        if (if_block1) {
          if_block1.p(ctx, dirty);
        } else {
          if_block1 = create_if_block_64(ctx);
          if_block1.c();
          if_block1.m(div2, t12);
        }
      } else if (if_block1) {
        if_block1.d(1);
        if_block1 = null;
      }
      if (dirty[0] & /*rows*/
      4 && t13_value !== (t13_value = /*t*/
      ctx[53].fresh + "")) set_data(t13, t13_value);
      if (
        /*t*/
        ctx[53].hard > 0
      ) {
        if (if_block2) {
          if_block2.p(ctx, dirty);
        } else {
          if_block2 = create_if_block_54(ctx);
          if_block2.c();
          if_block2.m(div2, null);
        }
      } else if (if_block2) {
        if_block2.d(1);
        if_block2 = null;
      }
      if (
        /*t*/
        ctx[53].keywords.length
      ) {
        if (if_block3) {
          if_block3.p(ctx, dirty);
        } else {
          if_block3 = create_if_block_47(ctx);
          if_block3.c();
          if_block3.m(div3, null);
        }
      } else if (if_block3) {
        if_block3.d(1);
        if_block3 = null;
      }
    },
    d(detaching) {
      if (detaching) {
        detach(div5);
      }
      if (if_block0) if_block0.d();
      if (if_block1) if_block1.d();
      if (if_block2) if_block2.d();
      if (if_block3) if_block3.d();
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_if_block5(ctx) {
  let div2;
  let div0;
  let span0;
  let t0;
  let t1;
  let t2;
  let t3;
  let span1;
  let t9;
  let div1;
  let each_blocks = [];
  let each_1_lookup = /* @__PURE__ */ new Map();
  let div2_aria_label_value;
  let each_value = ensure_array_like(
    /*heat*/
    ctx[8]
  );
  const get_key = (ctx2) => {
    var _a;
    return (
      /*w*/
      (_a = ctx2[47].cells[0]) == null ? void 0 : _a.date
    );
  };
  for (let i = 0; i < each_value.length; i += 1) {
    let child_ctx = get_each_context5(ctx, each_value, i);
    let key = get_key(child_ctx);
    each_1_lookup.set(key, each_blocks[i] = create_each_block5(key, child_ctx));
  }
  return {
    c() {
      div2 = element("div");
      div0 = element("div");
      span0 = element("span");
      t0 = text("\u8FD1 12 \u5468\u5171 ");
      t1 = text(
        /*heatSum*/
        ctx[9]
      );
      t2 = text(" \u6B21");
      t3 = space();
      span1 = element("span");
      span1.innerHTML = `\u5C11<i class="el-heat-sw h0"></i><i class="el-heat-sw h1"></i>4<i class="el-heat-sw h2"></i>9<i class="el-heat-sw h3"></i>19<i class="el-heat-sw h4"></i>20+`;
      t9 = space();
      div1 = element("div");
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      attr(span1, "class", "el-heat-legend");
      attr(span1, "title", "\u6309\u5F53\u65E5\u5B66\u4E60\u6B21\u6570\u5206\u6863\uFF1A1-4 / 5-9 / 10-19 / 20+");
      attr(div0, "class", "el-heat-head");
      attr(div1, "class", "el-heat-grid");
      attr(div2, "class", "el-heat");
      attr(div2, "role", "img");
      attr(div2, "aria-label", div2_aria_label_value = "\u8FD1 12 \u5468\u6253\u5361\u65E5\u5386\uFF0C\u5171 " + /*heatSum*/
      ctx[9] + " \u6B21\u5B66\u4E60\u6D3B\u52A8");
    },
    m(target, anchor) {
      insert(target, div2, anchor);
      append(div2, div0);
      append(div0, span0);
      append(span0, t0);
      append(span0, t1);
      append(span0, t2);
      append(div0, t3);
      append(div0, span1);
      append(div2, t9);
      append(div2, div1);
      for (let i = 0; i < each_blocks.length; i += 1) {
        if (each_blocks[i]) {
          each_blocks[i].m(div1, null);
        }
      }
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*heatSum*/
      512) set_data(
        t1,
        /*heatSum*/
        ctx2[9]
      );
      if (dirty[0] & /*heat, heatLevel, cellTip*/
      24832) {
        each_value = ensure_array_like(
          /*heat*/
          ctx2[8]
        );
        each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx2, each_value, each_1_lookup, div1, destroy_block, create_each_block5, null, get_each_context5);
      }
      if (dirty[0] & /*heatSum*/
      512 && div2_aria_label_value !== (div2_aria_label_value = "\u8FD1 12 \u5468\u6253\u5361\u65E5\u5386\uFF0C\u5171 " + /*heatSum*/
      ctx2[9] + " \u6B21\u5B66\u4E60\u6D3B\u52A8")) {
        attr(div2, "aria-label", div2_aria_label_value);
      }
    },
    d(detaching) {
      if (detaching) {
        detach(div2);
      }
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].d();
      }
    }
  };
}
function create_else_block5(ctx) {
  let i;
  return {
    c() {
      i = element("i");
      attr(i, "class", "el-heat-cell is-blank");
    },
    m(target, anchor) {
      insert(target, i, anchor);
    },
    p: noop,
    d(detaching) {
      if (detaching) {
        detach(i);
      }
    }
  };
}
function create_if_block_111(ctx) {
  let i;
  let i_class_value;
  let i_title_value;
  let i_aria_label_value;
  let mounted;
  let dispose;
  function click_handler_10() {
    return (
      /*click_handler_10*/
      ctx[41](
        /*c*/
        ctx[50]
      )
    );
  }
  function keydown_handler_3(...args) {
    return (
      /*keydown_handler_3*/
      ctx[42](
        /*c*/
        ctx[50],
        ...args
      )
    );
  }
  return {
    c() {
      i = element("i");
      attr(i, "class", i_class_value = "el-heat-cell h" + /*heatLevel*/
      ctx[13](
        /*c*/
        ctx[50].n
      ));
      attr(i, "title", i_title_value = /*cellTip*/
      ctx[14](
        /*c*/
        ctx[50]
      ));
      attr(i, "aria-label", i_aria_label_value = /*cellTip*/
      ctx[14](
        /*c*/
        ctx[50]
      ));
      attr(i, "role", "button");
      attr(i, "tabindex", "-1");
      toggle_class(
        i,
        "is-today",
        /*c*/
        ctx[50].isNew
      );
    },
    m(target, anchor) {
      insert(target, i, anchor);
      if (!mounted) {
        dispose = [
          listen(i, "click", click_handler_10),
          listen(i, "keydown", keydown_handler_3)
        ];
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (dirty[0] & /*heat*/
      256 && i_class_value !== (i_class_value = "el-heat-cell h" + /*heatLevel*/
      ctx[13](
        /*c*/
        ctx[50].n
      ))) {
        attr(i, "class", i_class_value);
      }
      if (dirty[0] & /*heat*/
      256 && i_title_value !== (i_title_value = /*cellTip*/
      ctx[14](
        /*c*/
        ctx[50]
      ))) {
        attr(i, "title", i_title_value);
      }
      if (dirty[0] & /*heat*/
      256 && i_aria_label_value !== (i_aria_label_value = /*cellTip*/
      ctx[14](
        /*c*/
        ctx[50]
      ))) {
        attr(i, "aria-label", i_aria_label_value);
      }
      if (dirty[0] & /*heat, heat*/
      256) {
        toggle_class(
          i,
          "is-today",
          /*c*/
          ctx[50].isNew
        );
      }
    },
    d(detaching) {
      if (detaching) {
        detach(i);
      }
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_each_block_14(key_1, ctx) {
  let first;
  let if_block_anchor;
  function select_block_type_2(ctx2, dirty) {
    if (
      /*c*/
      ctx2[50]
    ) return create_if_block_111;
    return create_else_block5;
  }
  let current_block_type = select_block_type_2(ctx, [-1, -1]);
  let if_block = current_block_type(ctx);
  return {
    key: key_1,
    first: null,
    c() {
      first = empty();
      if_block.c();
      if_block_anchor = empty();
      this.first = first;
    },
    m(target, anchor) {
      insert(target, first, anchor);
      if_block.m(target, anchor);
      insert(target, if_block_anchor, anchor);
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (current_block_type === (current_block_type = select_block_type_2(ctx, dirty)) && if_block) {
        if_block.p(ctx, dirty);
      } else {
        if_block.d(1);
        if_block = current_block_type(ctx);
        if (if_block) {
          if_block.c();
          if_block.m(if_block_anchor.parentNode, if_block_anchor);
        }
      }
    },
    d(detaching) {
      if (detaching) {
        detach(first);
        detach(if_block_anchor);
      }
      if_block.d(detaching);
    }
  };
}
function create_each_block5(key_1, ctx) {
  let div1;
  let div0;
  let t0_value = (
    /*w*/
    ctx[47].month + ""
  );
  let t0;
  let t1;
  let each_blocks = [];
  let each_1_lookup = /* @__PURE__ */ new Map();
  let t2;
  let each_value_1 = ensure_array_like(
    /*w*/
    ctx[47].cells
  );
  const get_key = (ctx2) => (
    /*d*/
    ctx2[52]
  );
  for (let i = 0; i < each_value_1.length; i += 1) {
    let child_ctx = get_each_context_14(ctx, each_value_1, i);
    let key = get_key(child_ctx);
    each_1_lookup.set(key, each_blocks[i] = create_each_block_14(key, child_ctx));
  }
  return {
    key: key_1,
    first: null,
    c() {
      div1 = element("div");
      div0 = element("div");
      t0 = text(t0_value);
      t1 = space();
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      t2 = space();
      attr(div0, "class", "el-heat-mon");
      attr(div1, "class", "el-heat-col");
      this.first = div1;
    },
    m(target, anchor) {
      insert(target, div1, anchor);
      append(div1, div0);
      append(div0, t0);
      append(div1, t1);
      for (let i = 0; i < each_blocks.length; i += 1) {
        if (each_blocks[i]) {
          each_blocks[i].m(div1, null);
        }
      }
      append(div1, t2);
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (dirty[0] & /*heat*/
      256 && t0_value !== (t0_value = /*w*/
      ctx[47].month + "")) set_data(t0, t0_value);
      if (dirty[0] & /*heatLevel, heat, cellTip*/
      24832) {
        each_value_1 = ensure_array_like(
          /*w*/
          ctx[47].cells
        );
        each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_1, each_1_lookup, div1, destroy_block, create_each_block_14, t2, get_each_context_14);
      }
    },
    d(detaching) {
      if (detaching) {
        detach(div1);
      }
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].d();
      }
    }
  };
}
function create_fragment6(ctx) {
  let div3;
  let div1;
  let h3;
  let t1;
  let div0;
  let button0;
  let t3;
  let button1;
  let t5;
  let t6;
  let t7;
  let t8;
  let div2;
  let t9;
  let t10;
  let t11;
  let t12_value = (
    /*totals*/
    ctx[3].due + ""
  );
  let t12;
  let t13;
  let t14_value = (
    /*totals*/
    ctx[3].learn + ""
  );
  let t14;
  let t15;
  let t16_value = (
    /*totals*/
    ctx[3].mastered + ""
  );
  let t16;
  let t17;
  let t18_value = (
    /*totals*/
    ctx[3].words + ""
  );
  let t18;
  let t19;
  let t20;
  let t21_value = (
    /*plugin*/
    ctx[0].db.stats.streak + ""
  );
  let t21;
  let t22;
  let t23;
  let t24;
  let t25;
  let mounted;
  let dispose;
  let if_block0 = (
    /*totals*/
    ctx[3].hard > 0 && create_if_block_163(ctx)
  );
  let if_block1 = (
    /*totals*/
    ctx[3].words > 0 && create_if_block_154(ctx)
  );
  let if_block2 = (
    /*guideVisible*/
    ctx[10] && create_if_block_144(ctx)
  );
  let if_block3 = (
    /*totals*/
    ctx[3].hard > 0 && create_if_block_134(ctx)
  );
  let if_block4 = !/*loading*/
  ctx[6] && /*chartSum*/
  ctx[11] > 0 && create_if_block_84(ctx);
  function select_block_type_1(ctx2, dirty) {
    if (
      /*loading*/
      ctx2[6]
    ) return create_if_block_210;
    if (
      /*rows*/
      ctx2[2].length === 0
    ) return create_if_block_310;
    return create_else_block_14;
  }
  let current_block_type = select_block_type_1(ctx, [-1, -1]);
  let if_block5 = current_block_type(ctx);
  let if_block6 = !/*loading*/
  ctx[6] && /*heatSum*/
  ctx[9] > 0 && create_if_block5(ctx);
  return {
    c() {
      div3 = element("div");
      div1 = element("div");
      h3 = element("h3");
      h3.textContent = "\u4E3B\u9898\u8BCD\u5E93";
      t1 = space();
      div0 = element("div");
      button0 = element("button");
      button0.textContent = "\u65B0\u5EFA\u4E3B\u9898";
      t3 = space();
      button1 = element("button");
      button1.textContent = "\u6570\u636E\u8865\u5168";
      t5 = space();
      if (if_block0) if_block0.c();
      t6 = space();
      if (if_block1) if_block1.c();
      t7 = space();
      if (if_block2) if_block2.c();
      t8 = space();
      div2 = element("div");
      t9 = text("\u4ECA\u65E5 +");
      t10 = text(
        /*todayCount*/
        ctx[5]
      );
      t11 = text(" \xB7 \u5F85\u590D\u4E60 ");
      t12 = text(t12_value);
      t13 = text(" \xB7 \u5B66\u4E60\u4E2D ");
      t14 = text(t14_value);
      t15 = text(" \xB7 \u638C\u63E1 ");
      t16 = text(t16_value);
      t17 = text("/");
      t18 = text(t18_value);
      t19 = space();
      if (if_block3) if_block3.c();
      t20 = text("\n    \xB7 \u8FDE\u7EED\u6253\u5361 ");
      t21 = text(t21_value);
      t22 = text(" \u5929");
      t23 = space();
      if (if_block4) if_block4.c();
      t24 = space();
      if_block5.c();
      t25 = space();
      if (if_block6) if_block6.c();
      attr(button1, "title", "\u6279\u91CF\u8865\u5168\uFF1A\u4F8B\u53E5 / \u4E49\u9879 / \u4F8B\u53E5\u7FFB\u8BD1 / \u540C\u53CD\u4E49\u8BCD");
      attr(div0, "class", "el-actions");
      attr(div1, "class", "el-header");
      attr(div2, "class", "el-totals");
      attr(div3, "class", "el-panel");
    },
    m(target, anchor) {
      insert(target, div3, anchor);
      append(div3, div1);
      append(div1, h3);
      append(div1, t1);
      append(div1, div0);
      append(div0, button0);
      append(div0, t3);
      append(div0, button1);
      append(div0, t5);
      if (if_block0) if_block0.m(div0, null);
      append(div0, t6);
      if (if_block1) if_block1.m(div0, null);
      append(div3, t7);
      if (if_block2) if_block2.m(div3, null);
      append(div3, t8);
      append(div3, div2);
      append(div2, t9);
      append(div2, t10);
      append(div2, t11);
      append(div2, t12);
      append(div2, t13);
      append(div2, t14);
      append(div2, t15);
      append(div2, t16);
      append(div2, t17);
      append(div2, t18);
      append(div2, t19);
      if (if_block3) if_block3.m(div2, null);
      append(div2, t20);
      append(div2, t21);
      append(div2, t22);
      append(div3, t23);
      if (if_block4) if_block4.m(div3, null);
      append(div3, t24);
      if_block5.m(div3, null);
      append(div3, t25);
      if (if_block6) if_block6.m(div3, null);
      if (!mounted) {
        dispose = [
          listen(
            button0,
            "click",
            /*openCreate*/
            ctx[20]
          ),
          listen(
            button1,
            "click",
            /*openBackfill*/
            ctx[24]
          )
        ];
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (
        /*totals*/
        ctx2[3].hard > 0
      ) {
        if (if_block0) {
          if_block0.p(ctx2, dirty);
        } else {
          if_block0 = create_if_block_163(ctx2);
          if_block0.c();
          if_block0.m(div0, t6);
        }
      } else if (if_block0) {
        if_block0.d(1);
        if_block0 = null;
      }
      if (
        /*totals*/
        ctx2[3].words > 0
      ) {
        if (if_block1) {
          if_block1.p(ctx2, dirty);
        } else {
          if_block1 = create_if_block_154(ctx2);
          if_block1.c();
          if_block1.m(div0, null);
        }
      } else if (if_block1) {
        if_block1.d(1);
        if_block1 = null;
      }
      if (
        /*guideVisible*/
        ctx2[10]
      ) {
        if (if_block2) {
          if_block2.p(ctx2, dirty);
        } else {
          if_block2 = create_if_block_144(ctx2);
          if_block2.c();
          if_block2.m(div3, t8);
        }
      } else if (if_block2) {
        if_block2.d(1);
        if_block2 = null;
      }
      if (dirty[0] & /*todayCount*/
      32) set_data(
        t10,
        /*todayCount*/
        ctx2[5]
      );
      if (dirty[0] & /*totals*/
      8 && t12_value !== (t12_value = /*totals*/
      ctx2[3].due + "")) set_data(t12, t12_value);
      if (dirty[0] & /*totals*/
      8 && t14_value !== (t14_value = /*totals*/
      ctx2[3].learn + "")) set_data(t14, t14_value);
      if (dirty[0] & /*totals*/
      8 && t16_value !== (t16_value = /*totals*/
      ctx2[3].mastered + "")) set_data(t16, t16_value);
      if (dirty[0] & /*totals*/
      8 && t18_value !== (t18_value = /*totals*/
      ctx2[3].words + "")) set_data(t18, t18_value);
      if (
        /*totals*/
        ctx2[3].hard > 0
      ) {
        if (if_block3) {
          if_block3.p(ctx2, dirty);
        } else {
          if_block3 = create_if_block_134(ctx2);
          if_block3.c();
          if_block3.m(div2, t20);
        }
      } else if (if_block3) {
        if_block3.d(1);
        if_block3 = null;
      }
      if (dirty[0] & /*plugin*/
      1 && t21_value !== (t21_value = /*plugin*/
      ctx2[0].db.stats.streak + "")) set_data(t21, t21_value);
      if (!/*loading*/
      ctx2[6] && /*chartSum*/
      ctx2[11] > 0) {
        if (if_block4) {
          if_block4.p(ctx2, dirty);
        } else {
          if_block4 = create_if_block_84(ctx2);
          if_block4.c();
          if_block4.m(div3, t24);
        }
      } else if (if_block4) {
        if_block4.d(1);
        if_block4 = null;
      }
      if (current_block_type === (current_block_type = select_block_type_1(ctx2, dirty)) && if_block5) {
        if_block5.p(ctx2, dirty);
      } else {
        if_block5.d(1);
        if_block5 = current_block_type(ctx2);
        if (if_block5) {
          if_block5.c();
          if_block5.m(div3, t25);
        }
      }
      if (!/*loading*/
      ctx2[6] && /*heatSum*/
      ctx2[9] > 0) {
        if (if_block6) {
          if_block6.p(ctx2, dirty);
        } else {
          if_block6 = create_if_block5(ctx2);
          if_block6.c();
          if_block6.m(div3, null);
        }
      } else if (if_block6) {
        if_block6.d(1);
        if_block6 = null;
      }
    },
    i: noop,
    o: noop,
    d(detaching) {
      if (detaching) {
        detach(div3);
      }
      if (if_block0) if_block0.d();
      if (if_block1) if_block1.d();
      if (if_block2) if_block2.d();
      if (if_block3) if_block3.d();
      if (if_block4) if_block4.d();
      if_block5.d();
      if (if_block6) if_block6.d();
      mounted = false;
      run_all(dispose);
    }
  };
}
var CHART_H = 34;
var HEAT_WEEKS = 12;
function sortRows(list) {
  return [...list].sort((a, b) => Number(b.pinned) - Number(a.pinned) || (a.pinned && b.pinned ? b.pinnedAt - a.pinnedAt : 0) || b.due - a.due || b.count - a.count);
}
function instance6($$self, $$props, $$invalidate) {
  let chartSum;
  let { plugin } = $$props;
  let rows = [];
  let totals = {
    words: 0,
    due: 0,
    fresh: 0,
    mastered: 0,
    hard: 0,
    learn: 0
  };
  let todayPending = 0;
  let todayCount = 0;
  let loading = true;
  let days = [];
  let maxDay = 1;
  let tipDay = -1;
  function barH(v) {
    return v <= 0 ? 0 : Math.max(3, Math.round(v / maxDay * CHART_H));
  }
  function buildDays() {
    var _a, _b;
    $$invalidate(1, days = []);
    for (let i = 13; i >= 0; i--) {
      const d = /* @__PURE__ */ new Date();
      d.setDate(d.getDate() - i);
      const s = plugin.db.stats.days[fmtDate(d)];
      days.push({
        date: fmtDate(d),
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        rev: (_a = s === null || s === void 0 ? void 0 : s.rev) !== null && _a !== void 0 ? _a : 0,
        new: (_b = s === null || s === void 0 ? void 0 : s.new) !== null && _b !== void 0 ? _b : 0
      });
    }
    maxDay = Math.max(1, ...days.map((d) => d.rev + d.new));
  }
  let heat = [];
  let heatSum = 0;
  const heatLevel = (n) => n <= 0 ? 0 : n <= 4 ? 1 : n <= 9 ? 2 : n <= 19 ? 3 : 4;
  const cellTip = (c) => `${c.date}\uFF1A\u65B0\u5B66 ${c.newCount} \xB7 \u590D\u4E60 ${c.revCount}`;
  function buildHeat() {
    var _a, _b;
    const today = /* @__PURE__ */ new Date();
    today.setHours(12, 0, 0, 0);
    const todayIso = fmtDate(today);
    const start2 = new Date(today);
    start2.setDate(start2.getDate() - (today.getDay() + 6) % 7 - (HEAT_WEEKS - 1) * 7);
    const weeks = [];
    let lastMonth = -1;
    let sum = 0;
    for (let w = 0; w < HEAT_WEEKS; w++) {
      const cells = [];
      let month = "";
      for (let d = 0; d < 7; d++) {
        const cur = new Date(start2);
        cur.setDate(start2.getDate() + w * 7 + d);
        if (cur > today) {
          cells.push(null);
          continue;
        }
        const s = plugin.db.stats.days[fmtDate(cur)];
        const newCount = (_a = s === null || s === void 0 ? void 0 : s.new) !== null && _a !== void 0 ? _a : 0;
        const revCount = (_b = s === null || s === void 0 ? void 0 : s.rev) !== null && _b !== void 0 ? _b : 0;
        const n = newCount + revCount;
        sum += n;
        if (d === 0 && cur.getMonth() !== lastMonth) {
          month = `${cur.getMonth() + 1}\u6708`;
          lastMonth = cur.getMonth();
        }
        cells.push({
          date: fmtDate(cur),
          n,
          newCount,
          revCount,
          isNew: fmtDate(cur) === todayIso ? true : void 0
        });
      }
      weeks.push({ cells, month });
    }
    $$invalidate(8, heat = weeks);
    $$invalidate(9, heatSum = sum);
  }
  function openWords(name) {
    new WordListModal(plugin.app, plugin, name).open();
  }
  let guideVisible = plugin.db.settings.aiGuideDone !== true;
  function openGuide() {
    new AiSetupModal(plugin.app, plugin, () => $$invalidate(10, guideVisible = false)).open();
  }
  function dismissGuide() {
    $$invalidate(0, plugin.db.settings.aiGuideDone = true, plugin);
    plugin.store.touch();
    $$invalidate(10, guideVisible = false);
  }
  onMount(() => void refresh());
  function buildRows() {
    const now2 = Date.now();
    const todayIso = fmtDate(now2);
    const progress = plugin.db.progress;
    return Object.values(plugin.db.themes).filter((t) => t.enabled !== false).map((t) => {
      var _a, _b;
      const words = plugin.words.byTheme(t.name);
      let due = 0;
      let fresh = 0;
      let mastered = 0;
      let hard = 0;
      let learn = 0;
      let todayNew = 0;
      for (const w of words) {
        const p = progress[w.word];
        if (!p) fresh++;
        else {
          if (p.hist.length && fmtDate(p.hist[0][0]) === todayIso) todayNew++;
          if (isMastered(p)) mastered++;
          else {
            if (p.next <= now2) due++;
            if (isHardWord(p)) hard++;
            else if (p.next > now2) learn++;
          }
        }
      }
      return {
        name: t.name,
        pinned: !!t.pinned,
        pinnedAt: (_a = t.pinnedAt) !== null && _a !== void 0 ? _a : 0,
        keywords: (_b = t.keywords) !== null && _b !== void 0 ? _b : [],
        count: words.length,
        due,
        fresh,
        mastered,
        hard,
        learn,
        todayNew
      };
    });
  }
  async function refresh(silent = false) {
    var _a, _b;
    if (!silent) $$invalidate(6, loading = true);
    await plugin.words.scan();
    const now2 = Date.now();
    const progress = plugin.db.progress;
    $$invalidate(2, rows = sortRows(buildRows()));
    let words = 0;
    let due = 0;
    let fresh = 0;
    let mastered = 0;
    let hard = 0;
    let learn = 0;
    for (const doc of plugin.activeWords()) {
      words++;
      const p = progress[doc.word];
      if (!p) fresh++;
      else if (isMastered(p)) mastered++;
      else {
        if (p.next <= now2) due++;
        if (isHardWord(p)) hard++;
        else if (p.next > now2) learn++;
      }
    }
    $$invalidate(3, totals = { words, due, fresh, mastered, hard, learn });
    $$invalidate(5, todayCount = (_b = (_a = plugin.db.stats.days[fmtDate(now2)]) === null || _a === void 0 ? void 0 : _a.new) !== null && _b !== void 0 ? _b : 0);
    const quota = Math.max(0, plugin.db.settings.dailyNew - todayCount);
    $$invalidate(4, todayPending = totals.due + Math.min(quota, totals.fresh));
    buildDays();
    buildHeat();
    if (!silent) $$invalidate(6, loading = false);
  }
  function togglePin(name) {
    const t = plugin.db.themes[name];
    if (!t) return;
    t.pinned = !t.pinned;
    if (t.pinned) t.pinnedAt = Date.now();
    plugin.store.touch();
    $$invalidate(2, rows = sortRows(buildRows()));
  }
  function disableTheme(name) {
    const t = plugin.db.themes[name];
    if (!t) return;
    t.enabled = false;
    plugin.store.touch();
    void refresh(true);
    void plugin.refreshStatusBar();
    new import_obsidian12.Notice(`\u5DF2\u505C\u7528\u300C${name}\u300D\uFF0C\u53EF\u5728\u300C\u65B0\u5EFA\u4E3B\u9898\u300D\u5F39\u7A97\u4E2D\u91CD\u65B0\u542F\u7528`, 6e3);
  }
  function openCreate() {
    new CreateThemeModal(
      plugin.app,
      plugin,
      (created) => {
        var _a, _b;
        void refresh();
        if (created && plugin.words.byTheme(created).length === 0) {
          const hasKw = ((_b = (_a = plugin.db.themes[created]) === null || _a === void 0 ? void 0 : _a.keywords) !== null && _b !== void 0 ? _b : []).length > 0;
          openExpand(created, hasKw ? void 0 : "import", hasKw);
        }
      }
    ).open();
  }
  function openExpand(theme, tab, autoRun = false) {
    new ExpandModal(plugin.app, plugin, theme, () => void refresh(), tab, autoRun).open();
  }
  function openEdit(theme) {
    new EditThemeModal(plugin.app, plugin, theme, () => void refresh()).open();
  }
  function start(theme, hard = false) {
    void plugin.startSession(theme, hard);
  }
  function openBackfill() {
    new DataBackfillModal(plugin.app, plugin, () => void refresh()).open();
  }
  const click_handler = () => start(null, true);
  const click_handler_1 = () => start(null);
  const mouseenter_handler = (i) => $$invalidate(7, tipDay = i);
  const click_handler_2 = (i) => $$invalidate(7, tipDay = i);
  const keydown_handler = (i, e) => e.key === "Enter" && $$invalidate(7, tipDay = i);
  const mouseleave_handler = () => $$invalidate(7, tipDay = -1);
  const click_handler_3 = (t) => disableTheme(t.name);
  const click_handler_4 = (t) => togglePin(t.name);
  const click_handler_5 = (t) => start(t.name, true);
  const keydown_handler_1 = (t, e) => e.key === "Enter" && start(t.name, true);
  const click_handler_6 = (t) => openWords(t.name);
  const keydown_handler_2 = (t, e) => e.key === "Enter" && openWords(t.name);
  const click_handler_7 = (t) => start(t.name);
  const click_handler_8 = (t) => openExpand(t.name);
  const click_handler_9 = (t) => openEdit(t.name);
  const click_handler_10 = (c) => new import_obsidian12.Notice(cellTip(c), 4e3);
  const keydown_handler_3 = (c, e) => e.key === "Enter" && new import_obsidian12.Notice(cellTip(c), 4e3);
  $$self.$$set = ($$props2) => {
    if ("plugin" in $$props2) $$invalidate(0, plugin = $$props2.plugin);
  };
  $$self.$$.update = () => {
    if ($$self.$$.dirty[0] & /*days*/
    2) {
      $: $$invalidate(11, chartSum = days.reduce((s, d) => s + d.new + d.rev, 0));
    }
  };
  return [
    plugin,
    days,
    rows,
    totals,
    todayPending,
    todayCount,
    loading,
    tipDay,
    heat,
    heatSum,
    guideVisible,
    chartSum,
    barH,
    heatLevel,
    cellTip,
    openWords,
    openGuide,
    dismissGuide,
    togglePin,
    disableTheme,
    openCreate,
    openExpand,
    openEdit,
    start,
    openBackfill,
    refresh,
    click_handler,
    click_handler_1,
    mouseenter_handler,
    click_handler_2,
    keydown_handler,
    mouseleave_handler,
    click_handler_3,
    click_handler_4,
    click_handler_5,
    keydown_handler_1,
    click_handler_6,
    keydown_handler_2,
    click_handler_7,
    click_handler_8,
    click_handler_9,
    click_handler_10,
    keydown_handler_3
  ];
}
var ThemePanel = class extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance6, create_fragment6, safe_not_equal, { plugin: 0, refresh: 25 }, null, [-1, -1]);
  }
  get refresh() {
    return this.$$.ctx[25];
  }
};
var ThemePanel_default = ThemePanel;

// src/ui/theme-view.ts
var ThemeView = class extends import_obsidian13.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
  }
  getViewType() {
    return THEME_VIEW_TYPE;
  }
  getDisplayText() {
    return "\u4E3B\u9898\u8BCD\u5E93";
  }
  getIcon() {
    return "book-open";
  }
  async onOpen() {
    this.contentEl.empty();
    this.comp = new ThemePanel_default({ target: this.contentEl, props: { plugin: this.plugin } });
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", (leaf) => {
        var _a;
        if (leaf === this.leaf) (_a = this.comp) == null ? void 0 : _a.refresh(true).catch((e) => console.error("\u9762\u677F\u5237\u65B0\u5931\u8D25:", e));
      })
    );
  }
  async onClose() {
    var _a;
    (_a = this.comp) == null ? void 0 : _a.$destroy();
  }
};

// src/word-card-modal.ts
var import_obsidian14 = require("obsidian");
var WordCardModal = class _WordCardModal extends import_obsidian14.Modal {
  constructor(app, plugin, wdoc) {
    super(app);
    this.plugin = plugin;
    this.wdoc = wdoc;
  }
  async onOpen() {
    var _a;
    (_a = _WordCardModal.current) == null ? void 0 : _a.close();
    _WordCardModal.current = this;
    this.modalEl.addClass("el-wordcard-modal");
    this.comp = new WordFullCard_default({
      target: this.contentEl,
      props: { plugin: this.plugin, doc: this.wdoc }
    });
    try {
      const r = await this.plugin.relWords(this.wdoc);
      if (_WordCardModal.current !== this) return;
      this.comp.$set({ synonyms: r.synonyms, antonyms: r.antonyms });
    } catch (e) {
    }
  }
  onClose() {
    var _a;
    if (_WordCardModal.current === this) _WordCardModal.current = void 0;
    (_a = this.comp) == null ? void 0 : _a.$destroy();
    this.contentEl.empty();
  }
};

// src/starter-packs.ts
var DEFAULT_PACK_IDS = ["tech-ai", "business", "kids"];
var STARTER_PACKS = [
  {
    id: "tech-ai",
    name: "\u79D1\u6280 / AI",
    description: "54 \u4E2A\u79D1\u6280\u4E0E\u4EBA\u5DE5\u667A\u80FD\u6838\u5FC3\u8BCD",
    keywords: ["AI", "technology", "software", "programming"],
    words: [
      ["algorithm", "n. \u7B97\u6CD5"],
      ["artificial", "adj. \u4EBA\u9020\u7684\uFF0C\u4EBA\u5DE5\u7684"],
      ["intelligence", "n. \u667A\u529B\uFF0C\u667A\u80FD"],
      ["neural", "adj. \u795E\u7ECF\u7684"],
      ["network", "n. \u7F51\u7EDC"],
      ["database", "n. \u6570\u636E\u5E93"],
      ["software", "n. \u8F6F\u4EF6"],
      ["hardware", "n. \u786C\u4EF6"],
      ["processor", "n. \u5904\u7406\u5668"],
      ["bandwidth", "n. \u5E26\u5BBD"],
      ["server", "n. \u670D\u52A1\u5668"],
      ["deploy", "v. \u90E8\u7F72"],
      ["framework", "n. \u6846\u67B6"],
      ["interface", "n. \u754C\u9762\uFF0C\u63A5\u53E3"],
      ["protocol", "n. \u534F\u8BAE"],
      ["encryption", "n. \u52A0\u5BC6"],
      ["firewall", "n. \u9632\u706B\u5899"],
      ["debug", "v. \u8C03\u8BD5"],
      ["compile", "v. \u7F16\u8BD1"],
      ["render", "v. \u6E32\u67D3"],
      ["iterate", "v. \u8FED\u4EE3"],
      ["scalable", "adj. \u53EF\u6269\u5C55\u7684"],
      ["redundancy", "n. \u5197\u4F59"],
      ["latency", "n. \u5EF6\u8FDF"],
      ["throughput", "n. \u541E\u5410\u91CF"],
      ["quantum", "n. \u91CF\u5B50"],
      ["sensor", "n. \u4F20\u611F\u5668"],
      ["robotics", "n. \u673A\u5668\u4EBA\u5B66"],
      ["simulation", "n. \u4EFF\u771F\uFF0C\u6A21\u62DF"],
      ["virtual", "adj. \u865A\u62DF\u7684"],
      ["automation", "n. \u81EA\u52A8\u5316"],
      ["cryptographic", "adj. \u52A0\u5BC6\u7684"],
      ["dataset", "n. \u6570\u636E\u96C6"],
      ["inference", "n. \u63A8\u7406\uFF0C\u63A8\u65AD"],
      ["architecture", "n. \u67B6\u6784"],
      ["cache", "n./v. \u7F13\u5B58"],
      ["concurrency", "n. \u5E76\u53D1"],
      ["repository", "n. \u4ED3\u5E93\uFF0C\u4EE3\u7801\u5E93"],
      ["prototype", "n. \u539F\u578B"],
      ["bottleneck", "n. \u74F6\u9888"],
      ["outage", "n. \u505C\u673A\uFF0C\u6545\u969C\u671F"],
      ["rollout", "n. \u7070\u5EA6\u53D1\u5E03\uFF0C\u63A8\u51FA"],
      ["migrate", "v. \u8FC1\u79FB"],
      ["cluster", "n. \u96C6\u7FA4"],
      ["container", "n. \u5BB9\u5668"],
      ["pipeline", "n. \u6D41\u6C34\u7EBF"],
      ["threshold", "n. \u9608\u503C"],
      ["gradient", "n. \u68AF\u5EA6"],
      ["overfitting", "n. \u8FC7\u62DF\u5408"],
      ["embedding", "n. \u5D4C\u5165\u5411\u91CF"],
      ["benchmark", "n. \u57FA\u51C6\u6D4B\u8BD5"],
      ["hallucination", "n. \u5E7B\u89C9\uFF08\u6A21\u578B\u865A\u6784\u5185\u5BB9\uFF09"],
      ["parameter", "n. \u53C2\u6570"],
      ["prompt", "n. \u63D0\u793A\u8BCD"]
    ]
  },
  {
    id: "business",
    name: "\u5546\u52A1\u804C\u573A",
    description: "48 \u4E2A\u5546\u52A1\u4E0E\u804C\u573A\u9AD8\u9891\u8BCD",
    keywords: ["business", "workplace", "career", "management"],
    words: [
      ["negotiate", "v. \u8C08\u5224\uFF0C\u534F\u5546"],
      ["contract", "n. \u5408\u540C"],
      ["invoice", "n. \u53D1\u7968"],
      ["revenue", "n. \u6536\u5165\uFF0C\u8425\u6536"],
      ["budget", "n. \u9884\u7B97"],
      ["profit", "n. \u5229\u6DA6"],
      ["stakeholder", "n. \u5229\u76CA\u76F8\u5173\u65B9"],
      ["deadline", "n. \u622A\u6B62\u65E5\u671F"],
      ["schedule", "n./v. \u65E5\u7A0B\uFF0C\u5B89\u6392"],
      ["presentation", "n. \u6F14\u793A\uFF0C\u6C47\u62A5"],
      ["client", "n. \u5BA2\u6237"],
      ["vendor", "n. \u4F9B\u5E94\u5546"],
      ["quarterly", "adj. \u5B63\u5EA6\u7684"],
      ["forecast", "n./v. \u9884\u6D4B"],
      ["strategy", "n. \u6218\u7565\uFF0C\u7B56\u7565"],
      ["incentive", "n. \u6FC0\u52B1"],
      ["commission", "n. \u4F63\u91D1"],
      ["recruit", "v. \u62DB\u8058"],
      ["onboarding", "n. \u5165\u804C\u57F9\u8BAD"],
      ["appraisal", "n. \u8BC4\u4F30\uFF0C\u8003\u6838"],
      ["delegate", "v. \u59D4\u6D3E"],
      ["milestone", "n. \u91CC\u7A0B\u7891"],
      ["deliverable", "n. \u4EA4\u4ED8\u7269"],
      ["workload", "n. \u5DE5\u4F5C\u91CF"],
      ["overtime", "n. \u52A0\u73ED"],
      ["compensation", "n. \u85AA\u916C\uFF0C\u8865\u507F"],
      ["attrition", "n. \u4EBA\u5458\u6D41\u5931"],
      ["alignment", "n. \u5BF9\u9F50\uFF0C\u4E00\u81F4"],
      ["leverage", "v. \u5229\u7528 n. \u6760\u6746"],
      ["workflow", "n. \u5DE5\u4F5C\u6D41"],
      ["acquisition", "n. \u6536\u8D2D"],
      ["merger", "n. \u5408\u5E76"],
      ["subsidiary", "n. \u5B50\u516C\u53F8"],
      ["turnover", "n. \u8425\u4E1A\u989D\uFF1B\u4EBA\u5458\u6D41\u52A8\u7387"],
      ["margin", "n. \u5229\u6DA6\u7387"],
      ["expenditure", "n. \u652F\u51FA"],
      ["audit", "n./v. \u5BA1\u8BA1"],
      ["compliance", "n. \u5408\u89C4"],
      ["liability", "n. \u8D23\u4EFB\uFF1B\u8D1F\u503A"],
      ["equity", "n. \u80A1\u6743"],
      ["prospect", "n. \u6F5C\u5728\u5BA2\u6237"],
      ["referral", "n. \u8F6C\u4ECB\u7ECD"],
      ["retain", "v. \u7559\u4F4F\uFF0C\u7EF4\u6301"],
      ["churn", "n. \u5BA2\u6237\u6D41\u5931\u7387"],
      ["headcount", "n. \u4EBA\u5458\u7F16\u5236\u6570"],
      ["consensus", "n. \u5171\u8BC6"],
      ["escalate", "v. \u4E0A\u62A5\uFF1B\u5347\u7EA7"],
      ["initiative", "n. \u5021\u8BAE\uFF1B\u4E3B\u52A8\u6027"]
    ]
  },
  {
    id: "academic",
    name: "\u5B66\u672F\u5199\u4F5C",
    description: "46 \u4E2A\u5B66\u672F\u9605\u8BFB\u4E0E\u5199\u4F5C\u6838\u5FC3\u8BCD",
    keywords: ["academia", "research", "education", "writing"],
    words: [
      ["hypothesis", "n. \u5047\u8BBE"],
      ["methodology", "n. \u65B9\u6CD5\u8BBA"],
      ["empirical", "adj. \u5B9E\u8BC1\u7684"],
      ["qualitative", "adj. \u5B9A\u6027\u7684"],
      ["quantitative", "adj. \u5B9A\u91CF\u7684"],
      ["variable", "n. \u53D8\u91CF"],
      ["correlation", "n. \u76F8\u5173\u6027"],
      ["causation", "n. \u56E0\u679C\u5173\u7CFB"],
      ["sample", "n. \u6837\u672C"],
      ["literature", "n. \u6587\u732E"],
      ["cite", "v. \u5F15\u7528"],
      ["plagiarism", "n. \u527D\u7A83"],
      ["abstract", "n. \u6458\u8981"],
      ["thesis", "n. \u8BBA\u6587\uFF0C\u8BBA\u70B9"],
      ["dissertation", "n. \u5B66\u4F4D\u8BBA\u6587"],
      ["journal", "n. \u671F\u520A"],
      ["finding", "n. \u7814\u7A76\u7ED3\u679C"],
      ["implication", "n. \u542B\u4E49\uFF0C\u5F71\u54CD"],
      ["limitation", "n. \u5C40\u9650\u6027"],
      ["robust", "adj. \u7A33\u5065\u7684"],
      ["significant", "adj. \u663E\u8457\u7684"],
      ["approximate", "adj./v. \u8FD1\u4F3C\u7684\uFF0C\u8FD1\u4F3C"],
      ["derivation", "n. \u63A8\u5BFC"],
      ["notion", "n. \u6982\u5FF5\uFF0C\u89C2\u5FF5"],
      ["paradigm", "n. \u8303\u5F0F"],
      ["criterion", "n. \u6807\u51C6\uFF08\u590D\u6570 criteria\uFF09"],
      ["substantiate", "v. \u8BC1\u5B9E"],
      ["ambiguous", "adj. \u6A21\u68F1\u4E24\u53EF\u7684"],
      ["coherent", "adj. \u8FDE\u8D2F\u7684"],
      ["rigorous", "adj. \u4E25\u8C28\u7684"],
      ["premise", "n. \u524D\u63D0"],
      ["assumption", "n. \u5047\u5B9A"],
      ["synthesis", "n. \u7EFC\u5408"],
      ["taxonomy", "n. \u5206\u7C7B\u6CD5"],
      ["anomaly", "n. \u5F02\u5E38"],
      ["discrepancy", "n. \u5DEE\u5F02\uFF0C\u4E0D\u4E00\u81F4"],
      ["feasibility", "n. \u53EF\u884C\u6027"],
      ["longitudinal", "adj. \u7EB5\u5411\u7684"],
      ["retrospective", "adj. \u56DE\u987E\u6027\u7684"],
      ["scrutinize", "v. \u4ED4\u7EC6\u5BA1\u67E5"],
      ["underpin", "v. \u652F\u6491\uFF0C\u6784\u6210\u2026\u7684\u57FA\u7840"],
      ["concise", "adj. \u7B80\u660E\u7684"],
      ["elaborate", "v. \u8BE6\u7EC6\u9610\u8FF0 adj. \u7CBE\u5FC3\u5236\u4F5C\u7684"],
      ["subsequent", "adj. \u968F\u540E\u7684"],
      ["preliminary", "adj. \u521D\u6B65\u7684"],
      ["peer", "n. \u540C\u884C\uFF0C\u540C\u9F84\u4EBA"]
    ]
  },
  {
    id: "kids",
    name: "\u5E7C\u6559\u542F\u8499",
    description: "51 \u4E2A\u5E7C\u513F\u82F1\u8BED\u542F\u8499\u4E0E\u5E7C\u6559\u8BFE\u5802\u6838\u5FC3\u8BCD",
    keywords: ["kindergarten", "preschool", "kids", "nursery"],
    words: [
      // —— 幼教课堂 ——
      ["kindergarten", "n. \u5E7C\u513F\u56ED"],
      ["preschool", "n. \u5B66\u524D\u73ED adj. \u5B66\u9F84\u524D\u7684"],
      ["nursery", "n. \u6258\u513F\u6240\uFF1B\u4FDD\u80B2\u5BA4"],
      ["toddler", "n. \u5B66\u6B65\u5E7C\u513F"],
      ["classroom", "n. \u6559\u5BA4"],
      ["playground", "n. \u64CD\u573A\uFF0C\u6E38\u4E50\u573A"],
      ["teacher", "n. \u8001\u5E08"],
      ["alphabet", "n. \u5B57\u6BCD\u8868"],
      ["flashcard", "n. \u95EA\u5361\uFF0C\u6559\u5B66\u5361\u7247"],
      ["storybook", "n. \u6545\u4E8B\u4E66\uFF0C\u7ED8\u672C"],
      ["rhyme", "n. \u513F\u6B4C\uFF0C\u7AE5\u8C23 v. \u62BC\u97F5"],
      ["crayon", "n. \u8721\u7B14"],
      ["sticker", "n. \u8D34\u7EB8"],
      ["puppet", "n. \u624B\u5076\uFF0C\u6728\u5076"],
      // —— 玩具游乐 ——
      ["toy", "n. \u73A9\u5177"],
      ["block", "n. \u79EF\u6728\uFF1B\u5757"],
      ["puzzle", "n. \u62FC\u56FE\uFF1B\u8C1C\u9898"],
      ["balloon", "n. \u6C14\u7403"],
      ["swing", "n. \u79CB\u5343 v. \u6447\u6446"],
      ["slide", "n. \u6ED1\u68AF v. \u6ED1\u52A8"],
      ["seesaw", "n. \u8DF7\u8DF7\u677F"],
      ["tricycle", "n. \u4E09\u8F6E\u8F66"],
      // —— 动物 ——
      ["puppy", "n. \u5C0F\u72D7"],
      ["kitten", "n. \u5C0F\u732B"],
      ["bunny", "n. \u5154\u5B50\uFF08\u513F\u8BED\uFF09"],
      ["duckling", "n. \u5C0F\u9E2D"],
      ["panda", "n. \u718A\u732B"],
      ["monkey", "n. \u7334\u5B50"],
      ["elephant", "n. \u5927\u8C61"],
      ["giraffe", "n. \u957F\u9888\u9E7F"],
      ["penguin", "n. \u4F01\u9E45"],
      // —— 颜色自然 ——
      ["rainbow", "n. \u5F69\u8679"],
      ["purple", "adj./n. \u7D2B\u8272\uFF08\u7684\uFF09"],
      ["golden", "adj. \u91D1\u8272\u7684"],
      // —— 动作 ——
      ["clap", "v. \u62CD\u624B"],
      ["hop", "v. \u5355\u811A\u8DF3\uFF1B\u8E66\u8DF3"],
      ["hug", "v./n. \u62E5\u62B1"],
      ["kiss", "v./n. \u4EB2\u543B"],
      ["tickle", "v. \u6320\u75D2\u75D2"],
      ["share", "v. \u5206\u4EAB"],
      ["smile", "v./n. \u5FAE\u7B11"],
      ["nap", "n. \u5348\u7761\uFF0C\u5C0F\u7761"],
      ["potty", "n. \u5E7C\u513F\u5750\u4FBF\u5668"],
      // —— 形容 ——
      ["big", "adj. \u5927\u7684"],
      ["little", "adj. \u5C0F\u7684"],
      ["soft", "adj. \u67D4\u8F6F\u7684"],
      ["round", "adj. \u5706\u7684"],
      ["hungry", "adj. \u997F\u7684"],
      ["sleepy", "adj. \u56F0\u7684\uFF0C\u778C\u7761\u7684"],
      ["tidy", "v. \u6536\u62FE\u6574\u9F50 adj. \u6574\u6D01\u7684"],
      ["yummy", "adj. \u597D\u5403\u7684\uFF08\u513F\u8BED\uFF09"]
    ]
  }
];

// src/main.ts
var DEFAULT_DATA = {
  settings: {
    root: "EnglishLearn",
    dailyNew: 10,
    dailyReviewMax: 100,
    reviewReverse: true,
    fuzzyHalve: true,
    spellChance: 0.3,
    audioChance: 0.4,
    dictBase: "",
    ttsRate: 1,
    ttsSentenceRate: 0.85,
    autoBackup: true,
    llmProvider: "ollama",
    llmSaved: { ollama: { ...LLM_OLLAMA_PRESET } },
    exampleCount: 3,
    expandCount: 12
  },
  themes: {},
  progress: {},
  stats: { streak: 0, days: {} },
  ignored: {},
  dictExhausted: { ver: STARTER_VER, words: {} }
};
var EnglishLearnPlugin = class extends import_obsidian15.Plugin {
  constructor() {
    super(...arguments);
    this.db = structuredClone(DEFAULT_DATA);
    this.sessionTheme = null;
    this.sessionHard = false;
    /** 会话进行中（未结束也未关闭）：其他「学习」入口此时切换主题需确认，防误触丢队列 */
    this.sessionActive = false;
    /** 上次收词用的主题：连续收录时弹窗默认选中（会话级，重启清零） */
    this.lastAddTheme = null;
    this.statusEl = null;
    /** 编辑态注入的词笔记顶栏（挂在宿主 markdown 视图上，不要求它一直是活动视图） */
    this.editBar = null;
    /** 后台补全串行队列：连续几批入库不并发打同一批词，前一批跑完自动接下一批 */
    this.enrichQueue = Promise.resolve();
  }
  /** 词笔记顶栏内容（阅读态 post-processor 与编辑态注入共用）：发音/音标/进度/主题/删除 */
  renderWordBar(bar, word, fm) {
    const ttsBtn = bar.createEl("button", { text: "\u{1F50A}", cls: "el-tts" });
    ttsBtn.onClickEvent(() => {
      this.speakWord(word);
      window.setTimeout(() => void this.audio.badge(ttsBtn, word), 1200);
    });
    void this.audio.badge(ttsBtn, word);
    if (typeof fm.phonetic === "string" && fm.phonetic) {
      bar.createEl("span", { text: fm.phonetic, cls: "el-note-phonetic" });
    }
    const p = this.db.progress[word];
    bar.createEl("span", {
      cls: "el-note-progress",
      text: p ? isMastered(p) ? `\u5DF2\u638C\u63E1 \u2713\uFF08\u5171\u6D4B ${p.count} \u6B21\uFF09` : `\u590D\u4E60\u9636\u6BB5 ${p.stage}/${MASTERED_STAGE} \xB7 \u5DF2\u6D4B ${p.count} \u6B21 \xB7 \u4E0B\u6B21 ${fmtDue(p.next)}` : "\u672A\u5F00\u59CB\u5B66\u4E60"
    });
    if (p && isHardWord(p)) bar.createEl("span", { text: "\u96BE\u8BCD", cls: "el-chip el-chip-hard" });
    for (const t of Array.isArray(fm.themes) ? fm.themes.map(String) : []) {
      bar.createEl("span", { text: `#${t}`, cls: "el-chip" });
    }
    bar.createEl("button", { text: "\u{1F5D1}", cls: "el-note-del", attr: { title: "\u5220\u9664\u8BCD\u6761" } }).onClickEvent(async () => {
      if (!await confirmDeleteWord(this.app, word)) return;
      await this.deleteWord(word);
      new import_obsidian15.Notice(`\u5DF2\u5220\u9664\u300C${word}\u300D`);
    });
  }
  /** 编辑态（live preview / source）词笔记顶部注入同一条顶栏；阅读态交还给 post-processor */
  refreshEditNoteBar() {
    var _a, _b, _c, _d, _e;
    const root = `${this.db.settings.root}/words/`;
    if (this.editBar) {
      const view2 = this.editBar.leaf.view;
      const file2 = view2 instanceof import_obsidian15.MarkdownView ? view2.file : null;
      const fmWord = file2 ? (_b = (_a = this.app.metadataCache.getFileCache(file2)) == null ? void 0 : _a.frontmatter) == null ? void 0 : _b.word : void 0;
      const still = this.editBar.el.isConnected && view2 instanceof import_obsidian15.MarkdownView && (file2 == null ? void 0 : file2.path) === this.editBar.path && view2.getMode() === "source" && fmWord === this.editBar.word;
      if (!still) {
        this.editBar.el.remove();
        this.editBar = null;
      } else {
        const pk = JSON.stringify((_c = this.db.progress[this.editBar.word]) != null ? _c : null);
        if (pk !== this.editBar.progressKey) {
          this.editBar.el.remove();
          this.editBar = null;
        }
      }
    }
    if (this.editBar) return;
    const view = this.app.workspace.getActiveViewOfType(import_obsidian15.MarkdownView);
    const file = this.app.workspace.getActiveFile();
    if (!view || !file || !file.path.startsWith(root) || view.getMode() !== "source") return;
    const fm = (_d = this.app.metadataCache.getFileCache(file)) == null ? void 0 : _d.frontmatter;
    const word = typeof (fm == null ? void 0 : fm.word) === "string" ? fm.word : "";
    if (!word) return;
    const bar = view.contentEl.createDiv({ cls: "el-note-bar el-note-bar-edit" });
    this.renderWordBar(bar, word, fm != null ? fm : {});
    this.editBar = {
      el: bar,
      leaf: view.leaf,
      path: file.path,
      word,
      progressKey: JSON.stringify((_e = this.db.progress[word]) != null ? _e : null)
    };
  }
  async onload() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p;
    const loaded = await this.loadData();
    const firstInstall = loaded === null;
    this.db = {
      ...structuredClone(DEFAULT_DATA),
      ...loaded,
      settings: { ...DEFAULT_DATA.settings, ...loaded == null ? void 0 : loaded.settings },
      stats: { ...DEFAULT_DATA.stats, ...loaded == null ? void 0 : loaded.stats },
      themes: (_a = loaded == null ? void 0 : loaded.themes) != null ? _a : {},
      progress: (_b = loaded == null ? void 0 : loaded.progress) != null ? _b : {},
      ignored: (_c = loaded == null ? void 0 : loaded.ignored) != null ? _c : {}
    };
    const legacy = loaded == null ? void 0 : loaded.settings;
    if (!(legacy == null ? void 0 : legacy.llmProvider)) {
      const url = (_d = legacy == null ? void 0 : legacy.llmBaseUrl) != null ? _d : "";
      this.db.settings.llmProvider = url.includes("11434") ? "ollama" : url.includes("deepseek") ? "deepseek" : "custom";
    }
    if (legacy) {
      const s = this.db.settings;
      const pool = s.llmSaved = (_e = s.llmSaved) != null ? _e : {};
      const m = legacy.llmMobile;
      if (m) {
        for (const [k, v] of Object.entries((_f = m.saved) != null ? _f : {})) (_g = pool[k]) != null ? _g : pool[k] = v;
        if (m.provider !== s.llmProvider) (_i = pool[_h = m.provider]) != null ? _i : pool[_h] = { baseUrl: m.baseUrl, apiKey: m.apiKey, model: m.model };
        s.llmMobileProvider = m.provider;
        delete s.llmMobile;
      }
      if (legacy.llmBaseUrl !== void 0) {
        pool[s.llmProvider] = { baseUrl: legacy.llmBaseUrl, apiKey: (_j = legacy.llmApiKey) != null ? _j : "", model: (_k = legacy.llmModel) != null ? _k : "" };
        delete s.llmBaseUrl;
        delete s.llmApiKey;
        delete s.llmModel;
      }
    }
    if (loaded) (_m = (_l = this.db.settings).aiGuideDone) != null ? _m : _l.aiGuideDone = true;
    this.store = new DataStore(this);
    this.words = new WordStore(this);
    this.dict = new EcdictDict(this.app, (_n = this.manifest.dir) != null ? _n : "", () => this.db.settings.dictBase);
    this.audio = new AudioCache(this.app, (_o = this.manifest.dir) != null ? _o : "");
    setPreferredVoice((_p = this.db.settings.ttsVoice) != null ? _p : null);
    this.registerView(THEME_VIEW_TYPE, (leaf) => new ThemeView(leaf, this));
    this.registerView(LEARN_VIEW_TYPE, (leaf) => new LearnView(leaf, this));
    this.registerEditorExtension([vocabHighlight(this), vocabHover(this), ...vocabTapTranslate(this)]);
    this.addRibbonIcon(
      "book-open",
      "English Learn",
      () => this.activateView(THEME_VIEW_TYPE)
    );
    this.addCommand({
      id: "open-themes",
      name: "\u6253\u5F00\u4E3B\u9898\u8BCD\u5E93",
      hotkeys: [{ modifiers: ["Mod", "Shift"], key: "e" }],
      // 默认热键（用户可在快捷键设置改）
      callback: () => this.activateView(THEME_VIEW_TYPE)
    });
    this.addCommand({
      id: "start-session",
      name: "\u5F00\u59CB\u4ECA\u65E5\u5B66\u4E60",
      callback: () => this.startSession(null)
    });
    this.addCommand({
      id: "hard-session",
      name: "\u96BE\u8BCD\u4E13\u9879\u8BAD\u7EC3",
      callback: () => this.startSession(null, true)
    });
    this.addCommand({
      id: "add-word",
      name: "\u6536\u5F55\u5355\u8BCD\u5230\u4E3B\u9898",
      callback: () => new AddWordModal(this.app, this).open()
    });
    this.addCommand({
      id: "backfill",
      name: "\u4E3A\u7F3A\u5931\u91CA\u4E49/\u97F3\u6807\u7684\u8BCD\u8865\u5168",
      callback: () => this.backfillTranslations()
    });
    this.addCommand({
      id: "backfill-examples",
      name: "\u4E3A\u7F3A\u4F8B\u53E5\u7684\u8BCD\u751F\u6210\u4F8B\u53E5\uFF08AI\uFF09",
      callback: () => this.backfillExamples()
    });
    this.addCommand({
      id: "backfill-senses",
      name: "\u4E3A\u7F3A\u4E49\u9879\u7684\u8BCD\u751F\u6210\u4E49\u9879\uFF08AI\uFF09",
      callback: () => this.backfillSenses()
    });
    this.addCommand({
      id: "backfill-example-zh",
      name: "\u4E3A\u7F3A\u7FFB\u8BD1\u7684\u4F8B\u53E5\u8865\u4E2D\u6587\uFF08AI\uFF09",
      callback: () => this.backfillExampleTranslations()
    });
    this.addCommand({
      id: "backfill-relwords",
      name: "\u4E3A\u7F3A\u540C/\u53CD\u4E49\u8BCD\u7684\u8BCD\u8865\u5168\uFF08Datamuse\uFF09",
      callback: () => this.backfillRelWords()
    });
    this.addCommand({
      id: "restore-progress",
      name: "\u4ECE\u5907\u4EFD\u5FEB\u7167\u6062\u590D\u7F3A\u5931\u7684\u5B66\u4E60\u6570\u636E\uFF08\u8FDB\u5EA6/\u4E3B\u9898/\u6253\u5361\u8BB0\u5F55\uFF09",
      callback: () => this.restoreProgress()
    });
    this.addCommand({
      id: "download-dict",
      name: "\u4E0B\u8F7D\u5B8C\u6574\u8BCD\u5178\u5206\u7247",
      callback: () => this.downloadDict()
    });
    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu, editor) => {
        const sel = editor.getSelection().trim();
        if (!sel || !/^[a-zA-Z][a-zA-Z'-]*(\s+[a-zA-Z'-]+){0,3}$/.test(sel)) return;
        if (!Object.keys(this.db.themes).length) return;
        menu.addItem(
          (item) => item.setTitle(`English Learn\uFF1A\u6536\u5F55\u300C${sel}\u300D`).setIcon("book-plus").onClick(() => new AddWordModal(this.app, this, sel).open())
        );
      })
    );
    this.addSettingTab(new EnglishLearnSettingTab(this.app, this));
    this.registerMarkdownPostProcessor((el, ctx) => {
      var _a2;
      const word = (_a2 = ctx.frontmatter) == null ? void 0 : _a2.word;
      if (typeof word !== "string" || !word) return;
      if (!ctx.sourcePath.startsWith(`${this.db.settings.root}/words/`)) return;
      const container = el.closest(".markdown-preview-view");
      if (!container || container.querySelector(".el-note-bar")) return;
      const bar = el.createEl("div", { cls: "el-note-bar" });
      el.prepend(bar);
      this.renderWordBar(bar, word, ctx.frontmatter);
    });
    this.registerEvent(this.app.workspace.on("active-leaf-change", () => this.refreshEditNoteBar()));
    this.registerEvent(this.app.workspace.on("layout-change", () => this.refreshEditNoteBar()));
    this.registerEvent(
      this.app.metadataCache.on("changed", (f) => {
        if (this.editBar && f.path === this.editBar.path) this.refreshEditNoteBar();
      })
    );
    this.registerEvent(
      this.app.metadataCache.on("resolved", () => {
        void this.words.scan().then(() => {
          this.refreshEditNoteBar();
          void this.refreshStatusBar();
        });
      })
    );
    this.app.workspace.onLayoutReady(() => {
      void (async () => {
        try {
          await this.ensureFolders();
          if (firstInstall) await this.seedDefaultThemes();
          this.refreshEditNoteBar();
          this.statusEl = this.addStatusBarItem();
          this.statusEl.addClass("el-status");
          this.statusEl.title = "\u4ECA\u65E5\u5F85\u5B66 = \u5230\u671F\u590D\u4E60 + \u65B0\u8BCD\u914D\u989D\u5269\u4F59\uFF1B\u70B9\u51FB\u5F00\u59CB\u5B66\u4E60";
          this.statusEl.onClickEvent(() => void this.startSession(null));
          const pending = await this.refreshStatusBar();
          this.remindOnce(pending);
        } catch (e) {
          new import_obsidian15.Notice(`English Learn \u521D\u59CB\u5316\u5931\u8D25\uFF1A${e instanceof Error ? e.message : e}`);
        }
      })();
    });
  }
  onunload() {
    void this.store.flush();
  }
  async ensureFolders() {
    const root = this.db.settings.root;
    for (const dir of [root, `${root}/words`, `${root}/backup`]) {
      await mkdirp(this.app, dir);
    }
  }
  /** 首次安装：内置 3 个默认主题（关键词 + 自带释义词包，离线即可直接学） */
  async seedDefaultThemes() {
    const packs = DEFAULT_PACK_IDS.map((id) => STARTER_PACKS.find((p) => p.id === id)).filter(
      (p) => !!p && !this.db.themes[p.name]
    );
    if (!packs.length) return;
    for (const pack of packs) {
      this.db.themes[pack.name] = {
        name: pack.name,
        keywords: [...pack.keywords],
        created: Date.now()
      };
    }
    await this.store.touchNow();
    for (const pack of packs) {
      await runPool(
        pack.words,
        6,
        ([w, trans]) => (
          // skipOnline：批量入库跳过在线补音标（国外 API 每词一请求，会拖慢首启数分钟），后续走「补全」
          this.addWord(w, pack.name, { translation: trans, skipOnline: true }).then(() => void 0)
        )
      );
    }
  }
  async activateView(type) {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(type)[0];
    if (leaf && leaf.getRoot() !== workspace.rootSplit) {
      leaf.detach();
      leaf = void 0;
    }
    if (!leaf) {
      leaf = workspace.getLeaf(true);
      await leaf.setViewState({ type, active: true });
    }
    workspace.revealLeaf(leaf);
  }
  /** @returns 是否真正启动（用户取消则 false，调用方可据此保持原界面） */
  async startSession(theme, hard = false) {
    var _a;
    if (this.sessionActive) {
      if (theme === this.sessionTheme && hard === this.sessionHard) {
        await this.activateView(LEARN_VIEW_TYPE);
        return true;
      }
      const pick = await askActiveSession(this.app, this.sessionTheme, this.sessionHard);
      if (pick === void 0) return false;
      if (pick) {
        await this.activateView(LEARN_VIEW_TYPE);
        return true;
      }
    }
    this.sessionTheme = theme;
    this.sessionHard = hard;
    await this.activateView(LEARN_VIEW_TYPE);
    const view = (_a = this.app.workspace.getLeavesOfType(LEARN_VIEW_TYPE)[0]) == null ? void 0 : _a.view;
    if (view instanceof LearnView) view.restart();
    return true;
  }
  async downloadDict() {
    const meta = await this.dict.installedMeta();
    if (meta && !this.db.settings.dictBase.trim()) {
      if (!starterNeedsUpgrade(meta)) {
        new import_obsidian15.Notice(`\u57FA\u7840\u8BCD\u5178 v${meta.ver} \u5DF2\u5B89\u88C5\uFF08${meta.count} \u8BCD\u6761\uFF0C${fmtDate(meta.installed)}\uFF09\uFF0C\u65E0\u9700\u91CD\u590D\u4E0B\u8F7D`);
        return;
      }
      new import_obsidian15.Notice(`\u68C0\u6D4B\u5230\u57FA\u7840\u8BCD\u5178 v${meta.ver}\uFF0C\u5347\u7EA7\u5230 v${STARTER_VER}\u2026`);
      await this.dict.ensureStarter().catch(() => new import_obsidian15.Notice("\u5347\u7EA7\u5931\u8D25\uFF1A\u7A0D\u540E\u67E5\u8BCD\u65F6\u4F1A\u81EA\u52A8\u91CD\u8BD5"));
      return;
    }
    new import_obsidian15.Notice(meta ? "\u5F00\u59CB\u68C0\u67E5\u8BCD\u5178\u5206\u7247\u2026" : "\u5F00\u59CB\u4E0B\u8F7D\u8BCD\u5178\u5206\u7247\u2026");
    const ok = await this.dict.downloadAll();
    new import_obsidian15.Notice(ok ? "\u8BCD\u5178\u4E0B\u8F7D\u5B8C\u6210" : "\u90E8\u5206\u5206\u7247\u4E0B\u8F7D\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u8BBE\u7F6E\u4E2D\u7684\u5206\u7247\u5730\u5740");
  }
  /** 全库口径：排除仅属于停用主题的词（enabled === false；全库会话/状态栏/面板合计共用，防口径漂移） */
  activeWords() {
    const on = new Set(Object.keys(this.db.themes).filter((n) => this.db.themes[n].enabled !== false));
    return this.words.all().filter((w) => w.themes.some((t) => on.has(t)));
  }
  /** 状态栏：今日待学（到期复习 + 新词配额剩余），返回待学数（供提醒用） */
  async refreshStatusBar() {
    var _a;
    if (!this.statusEl) return null;
    try {
      await this.words.scan();
      const now2 = Date.now();
      let due = 0;
      let fresh = 0;
      for (const w of this.activeWords()) {
        const p = this.db.progress[w.word];
        if (!p) fresh++;
        else if (p.next <= now2) due++;
      }
      const day = (_a = this.db.stats.days[fmtDate(now2)]) != null ? _a : { new: 0, rev: 0 };
      const quota = Math.max(0, this.db.settings.dailyNew - day.new);
      const n = due + Math.min(quota, fresh);
      const fire = this.db.stats.streak > 0 ? ` \xB7 \u{1F525}${this.db.stats.streak}` : "";
      this.statusEl.setText(n > 0 ? `\u{1F4D6} \u5F85\u5B66 ${n}${fire}` : `\u{1F4D6} \u2713${fire}`);
      return n;
    } catch (e) {
      return null;
    }
  }
  /** 打卡召回：今天还没学且有待学内容时，每天最多提醒一次 */
  remindOnce(pending) {
    if (!pending) return;
    const today = fmtDate(Date.now());
    if (this.db.lastRemind === today) return;
    const day = this.db.stats.days[today];
    if (day && day.new + day.rev > 0) return;
    this.db.lastRemind = today;
    this.store.touch();
    new import_obsidian15.Notice(`\u{1F4D6} English Learn\uFF1A\u4ECA\u65E5\u5F85\u5B66 ${pending} \u4E2A\u8BCD\uFF0C\u70B9\u51FB\u72B6\u6001\u680F\u5F00\u59CB`, 8e3);
  }
  // ———————— 学习会话 ————————
  /** 组装一次学习会话：到期复习（按时限）+ 新词（按每日配额；extraNew 为超配额的加学批，供"再来一批"用）；hard=true 为难词专项 */
  async buildSession(theme, hard = false, extraNew = 0) {
    var _a;
    await this.ensureFolders();
    await this.words.scan();
    const now2 = Date.now();
    if (hard) {
      const pool2 = (theme ? this.words.byTheme(theme) : this.activeWords()).filter((w) => {
        const p = this.db.progress[w.word];
        return p && !isMastered(p) && isHardWord(p);
      });
      return { queue: pool2, dueFirst: pool2.length, dueTotal: pool2.length };
    }
    const pool = theme ? this.words.byTheme(theme) : this.activeWords();
    const reviews = [];
    const fresh = [];
    for (const w of pool) {
      const p = this.db.progress[w.word];
      if (!p) fresh.push(w);
      else if (p.next <= now2) reviews.push(w);
    }
    reviews.sort(
      (a, b) => this.db.progress[a.word].next - this.db.progress[b.word].next
    );
    fresh.sort((a, b) => {
      var _a2, _b;
      return ((_a2 = b.added) != null ? _a2 : 0) - ((_b = a.added) != null ? _b : 0);
    });
    const day = (_a = this.db.stats.days[fmtDate(now2)]) != null ? _a : { new: 0, rev: 0 };
    const quota = Math.max(0, this.db.settings.dailyNew - day.new);
    const qReviews = reviews.slice(0, this.db.settings.dailyReviewMax);
    const qFresh = fresh.slice(0, quota + extraNew);
    return {
      queue: [...qReviews, ...qFresh],
      dueFirst: qReviews.length,
      dueTotal: reviews.length
    };
  }
  /** 记录一次评分，返回 {是否新词, 是否本次达成掌握} */
  recordGrade(word, grade) {
    var _a, _b, _c, _d;
    const now2 = Date.now();
    const prev = this.db.progress[word];
    const next = applyGrade(prev, grade, now2, { fuzzyHalve: this.db.settings.fuzzyHalve });
    this.db.progress[word] = next;
    const day = (_c = (_a = this.db.stats.days)[_b = fmtDate(now2)]) != null ? _c : _a[_b] = { new: 0, rev: 0 };
    if (!prev) day.new++;
    else day.rev++;
    const masteredNow = isMastered(next) && !(prev && isMastered(prev));
    if (masteredNow) day.m = ((_d = day.m) != null ? _d : 0) + 1;
    this.recomputeStreak();
    this.store.touch();
    this.refreshEditNoteBar();
    return {
      isNew: !prev,
      masteredNow
    };
  }
  /** 新词学习阶段重看 ≥2 次：额外补一条「忘记」史喂难词判定（不影响调度与统计）。
   *  必须在 recordGrade 之后调用：首学时 progress 还不存在 */
  bumpStruggle(word) {
    const p = this.db.progress[word];
    if (!p) return;
    p.hist = [...p.hist, [Date.now(), 1]].slice(-30);
    this.store.touch();
  }
  /** 会话结束：立即落盘 + 进度快照备份到 vault + 刷新状态栏 */
  async finishSession() {
    await this.store.touchNow();
    void this.refreshStatusBar();
    if (!this.db.settings.autoBackup) return;
    const path = `${this.db.settings.root}/backup/progress-${fmtDate(Date.now())}.json`;
    const body = JSON.stringify(
      {
        exported: (/* @__PURE__ */ new Date()).toISOString(),
        progress: this.db.progress,
        // 主题结构与学习量：data.json 丢失时不止进度，主题/关键词/打卡史也能恢复（R53）
        themes: this.db.themes,
        stats: this.db.stats,
        // 忽略表不恢复会回到学习队列（噪音词重现）
        ignored: this.db.ignored
      },
      null,
      2
    );
    try {
      const existing = this.app.vault.getAbstractFileByPath(path);
      if (existing instanceof import_obsidian15.TFile) await this.app.vault.modify(existing, body);
      else await this.app.vault.create(path, body);
      const snaps = this.app.vault.getFiles().filter((f) => f.path.startsWith(`${this.db.settings.root}/backup/progress-`)).sort((a, b) => a.name < b.name ? 1 : -1);
      for (const f of snaps.slice(14)) await this.app.vault.trash(f, false);
    } catch (e) {
      new import_obsidian15.Notice(`\u8FDB\u5EA6\u5907\u4EFD\u5931\u8D25: ${e}`);
    }
  }
  /** 用户自评「太简单」：直接标记掌握并计入当日新词 */
  markMastered(word) {
    var _a, _b, _c, _d;
    const now2 = Date.now();
    const prev = this.db.progress[word];
    if (prev && isMastered(prev)) return;
    this.db.progress[word] = masteredProgress(prev, now2);
    const day = (_c = (_a = this.db.stats.days)[_b = fmtDate(now2)]) != null ? _c : _a[_b] = { new: 0, rev: 0 };
    if (!prev) day.new++;
    else day.rev++;
    day.m = ((_d = day.m) != null ? _d : 0) + 1;
    this.recomputeStreak();
    this.store.touch();
    this.refreshEditNoteBar();
  }
  recomputeStreak() {
    const days = this.db.stats.days;
    const d = /* @__PURE__ */ new Date();
    const today = days[fmtDate(d)];
    if (!today || today.new + today.rev === 0) d.setDate(d.getDate() - 1);
    let streak = 0;
    for (; ; ) {
      const s = days[fmtDate(d)];
      if (s && s.new + s.rev > 0) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else break;
    }
    this.db.stats.streak = streak;
  }
  // ———————— 词汇 ————————
  /** 当前 LLM 配置（设置页与各调用点共用，配置增删字段只改这里）。
   *  配置池 llmSaved 各源一份、桌面/移动共用；两端各选启用的源，移动端未选时跟随桌面 */
  get llmCfg() {
    var _a;
    const s = this.db.settings;
    const p = (_a = import_obsidian15.Platform.isMobile ? s.llmMobileProvider : void 0) != null ? _a : s.llmProvider;
    return llmConf(s.llmSaved, p);
  }
  /** 主题语境串：主题名 + 关键词（AI 例句围绕该领域写，同主题词在语境中复现） */
  topicOf(theme) {
    var _a;
    const info = theme ? this.db.themes[theme] : void 0;
    return [theme, ...(_a = info == null ? void 0 : info.keywords) != null ? _a : []].filter(Boolean).join(" / ");
  }
  /** 同义/反义关联词：优先读词笔记 frontmatter 缓存（离线直读），再查基础词典（v2 携带同反义词），
   *  都未命中才请求 Datamuse 并回写（单侧结果也缓存） */
  async relWords(doc) {
    var _a, _b, _c, _d, _e, _f;
    if (doc.synonyms || doc.antonyms) {
      return { synonyms: (_a = doc.synonyms) != null ? _a : [], antonyms: (_b = doc.antonyms) != null ? _b : [] };
    }
    const entry = await this.dict.lookup(doc.word);
    if (((_c = entry == null ? void 0 : entry.synonyms) == null ? void 0 : _c.length) || ((_d = entry == null ? void 0 : entry.antonyms) == null ? void 0 : _d.length)) {
      await this.words.setRelWords(doc, { synonyms: entry.synonyms, antonyms: entry.antonyms });
      return { synonyms: (_e = entry.synonyms) != null ? _e : [], antonyms: (_f = entry.antonyms) != null ? _f : [] };
    }
    const [synR, antR] = await Promise.allSettled([fetchSynonyms(doc.word), fetchAntonyms(doc.word)]);
    const syn = synR.status === "fulfilled" ? synR.value : void 0;
    const ant = antR.status === "fulfilled" ? antR.value : void 0;
    if ((syn == null ? void 0 : syn.length) || (ant == null ? void 0 : ant.length)) {
      await this.words.setRelWords(doc, { synonyms: syn, antonyms: ant });
      return { synonyms: syn != null ? syn : [], antonyms: ant != null ? ant : [] };
    }
    if (synR.status === "fulfilled" && antR.status === "fulfilled") {
      await this.words.setRelWords(doc, { synonyms: [], antonyms: [] });
    }
    return { synonyms: syn != null ? syn : [], antonyms: ant != null ? ant : [] };
  }
  /** 批量补同/反义词：为从未抓取过的词预填记忆关联，词卡同反义行开箱即有。
   *  只处理两侧都缺（从未抓取）的词——抓过但为空的词是负缓存语义，不重复请求；短语跳过。
   *  单词解析复用 relWords（frontmatter → 词典 → Datamuse 级联），此处不再重复实现。
   *  only：限定词集（新词入库后台补全用），不传 = 全库缺口 */
  async backfillRelWords(limit, only) {
    await this.words.scan();
    const missing = this.words.all().filter(
      (w) => w.synonyms === void 0 && w.antonyms === void 0 && !isPhrase(w.word) && (!only || only.has(w.word.toLowerCase()))
    );
    if (!missing.length) {
      new import_obsidian15.Notice("\u6240\u6709\u8BCD\u90FD\u6293\u53D6\u8FC7\u540C/\u53CD\u4E49\u8BCD\u4E86\uFF08\u65E0\u7ED3\u679C\u7684\u8BCD\u4E0D\u518D\u91CD\u590D\u8BF7\u6C42\uFF09");
      return;
    }
    const batch = limit && limit > 0 ? missing.slice(0, limit) : missing;
    let done = 0;
    let processed = 0;
    let netFail = 0;
    const prog = new import_obsidian15.Notice(`\u6293\u53D6\u540C/\u53CD\u4E49\u8BCD 0/${batch.length}\u2026`, 0);
    await runPool(batch, 6, async (doc) => {
      const r = await this.relWords(doc);
      if (r.synonyms.length || r.antonyms.length) done++;
      else if (doc.synonyms === void 0 && doc.antonyms === void 0) netFail++;
      processed++;
      prog.setMessage(`\u6293\u53D6\u540C/\u53CD\u4E49\u8BCD ${processed}/${batch.length}\u2026`);
    });
    prog.hide();
    this.store.touch();
    new import_obsidian15.Notice(
      `\u540C/\u53CD\u4E49\u8BCD\u8865\u5168\u5B8C\u6210\uFF1A${done}/${batch.length} \u8BCD\u8865\u5230` + (netFail ? `\uFF08${netFail} \u8BCD\u7F51\u7EDC\u5931\u8D25\u672A\u8BB0\u5F55\uFF0C\u53EF\u91CD\u8DD1\u518D\u8BD5\uFF09` : done < batch.length ? `\uFF08\u5176\u4F59\u5728\u8BCD\u5178\u4E0E Datamuse \u5747\u65E0\u6536\u5F55\uFF0C\u5DF2\u8BB0\u5F55\u4E0D\u518D\u91CD\u8BD5\uFF09` : "")
    );
  }
  /** 负缓存读取（只认当前 starter 版本的条目：升版/重装/旧格式数据自动失配作废） */
  exhaustedWords() {
    const c = this.db.dictExhausted;
    return (c == null ? void 0 : c.ver) === STARTER_VER ? c.words : {};
  }
  /** 负缓存写入：词典 + 在线兜底走完仍一无所获才标 */
  markDictExhausted(word) {
    const c = this.db.dictExhausted;
    if ((c == null ? void 0 : c.ver) === STARTER_VER) c.words[word] = true;
    else this.db.dictExhausted = { ver: STARTER_VER, words: { [word]: true } };
  }
  /** 音标缺就补（同 relWords 的惰性回填）：离线词典优先，在线兜底，回写 frontmatter；
   *  已确认在线也没有的词（dictExhausted）直接放弃，避免词卡每次都白打请求 */
  async ensurePhonetic(doc) {
    var _a, _b;
    if (doc.phonetic || isPhrase(doc.word)) return doc.phonetic;
    if (this.exhaustedWords()[doc.word]) return void 0;
    const entry = await this.dict.lookup(doc.word);
    const phonetic = (_b = entry == null ? void 0 : entry.phonetic) != null ? _b : (_a = await lookupOnline(doc.word)) == null ? void 0 : _a.phonetic;
    if (phonetic) await this.words.updateWordDoc(doc, { phonetic });
    else this.markDictExhausted(doc.word);
    return phonetic;
  }
  /** 追加不与现有重复的例句，返回新增条数 */
  async appendNewExamples(doc, exs) {
    let added = 0;
    for (const ex of exs) {
      if (!doc.examples.some((e) => e.text === ex.text)) {
        await this.words.appendExample(doc, { text: ex.text, translation: ex.zh, source: "AI" });
        added++;
      }
    }
    return added;
  }
  /** 加词：已存在则合并主题+追加例句，否则查词典（离线+在线补全）建笔记。返回 created | merged | skipped */
  async addWord(raw, theme, opts) {
    var _a, _b, _c;
    const o = opts != null ? opts : {};
    const word = normalizeWord(raw);
    if (!word) return "skipped";
    const existing = this.words.get(word);
    if (existing) {
      await this.words.addTheme(existing, theme);
      for (const ex of (_a = o.examples) != null ? _a : []) {
        if (!existing.examples.some((e) => e.text === ex.text)) {
          await this.words.appendExample(existing, ex);
        }
      }
      return "merged";
    }
    const entry = await this.dict.lookup(word);
    let phonetic = entry == null ? void 0 : entry.phonetic;
    let translation = ((_b = o.translation) == null ? void 0 : _b.trim()) || (entry == null ? void 0 : entry.translation) || "";
    if (!o.skipOnline && (!phonetic || !translation)) {
      const on = await lookupOnline(word);
      phonetic != null ? phonetic : phonetic = on == null ? void 0 : on.phonetic;
      if (!translation && (on == null ? void 0 : on.definition)) translation = `[\u82F1] ${on.definition}`;
    }
    const dictEx = (entry == null ? void 0 : entry.ex) ? [{ text: entry.ex[0], translation: entry.ex[1], source: "\u8BCD\u5178" }] : void 0;
    await this.words.create(word, {
      themes: [theme],
      phonetic,
      level: levelFromTag(entry == null ? void 0 : entry.tag),
      translation,
      examples: ((_c = o.examples) == null ? void 0 : _c.length) ? o.examples : dictEx
    });
    return "created";
  }
  /** 各批量补全任务的缺口统计（DataBackfillModal 展示与禁用按钮用）。
   *  与各任务自身的 missing 过滤同源——此前弹窗手工镜像五组谓词，任务口径一变统计就悄悄失真 */
  async backfillGaps() {
    await this.words.scan();
    const all = this.words.all();
    const wantEx = Math.max(1, this.db.settings.exampleCount || 3);
    const exhausted = this.exhaustedWords();
    return {
      ex: all.filter((w) => w.examples.length < wantEx).length,
      senses: all.filter((w) => {
        var _a;
        return !((_a = w.senses) == null ? void 0 : _a.length);
      }).length,
      zh: all.reduce((s, w) => s + w.examples.filter((e) => {
        var _a;
        return !((_a = e.translation) == null ? void 0 : _a.trim());
      }).length, 0),
      rel: all.filter((w) => w.synonyms === void 0 && w.antonyms === void 0 && !isPhrase(w.word)).length,
      trans: all.filter(
        (w) => (!w.translation || !w.phonetic) && !isPhrase(w.word) && !exhausted[w.word]
      ).length
    };
  }
  /** 为缺失释义或音标的词批量补全（离线词典优先，在线兜底）。only：限定词集，不传 = 全库缺口 */
  async backfillTranslations(only) {
    await this.words.scan();
    const missing = this.words.all().filter(
      (w) => (!w.translation || !w.phonetic) && !isPhrase(w.word) && !this.exhaustedWords()[w.word] && (!only || only.has(w.word.toLowerCase()))
    );
    if (!missing.length) {
      new import_obsidian15.Notice("\u6CA1\u6709\u7F3A\u5931\u91CA\u4E49\u7684\u8BCD");
      return;
    }
    let done = 0;
    let processed = 0;
    const prog = new import_obsidian15.Notice(`\u8865\u5168\u4E2D 0/${missing.length}\u2026`, 0);
    await runPool(missing, 6, async (doc) => {
      var _a;
      const entry = await this.dict.lookup(doc.word);
      let translation = (_a = entry == null ? void 0 : entry.translation) != null ? _a : "";
      let phonetic = entry == null ? void 0 : entry.phonetic;
      if (!translation || !phonetic) {
        const on = await lookupOnline(doc.word);
        if (!translation) translation = (on == null ? void 0 : on.definition) ? `[\u82F1] ${on.definition}` : "";
        phonetic != null ? phonetic : phonetic = on == null ? void 0 : on.phonetic;
      }
      if (translation || phonetic) {
        await this.words.updateWordDoc(doc, {
          translation: doc.translation ? void 0 : translation,
          phonetic,
          level: doc.level ? void 0 : levelFromTag(entry == null ? void 0 : entry.tag)
        });
        if (translation && !doc.translation || phonetic) done++;
      }
      if (!translation || !phonetic) this.markDictExhausted(doc.word);
      processed++;
      prog.setMessage(`\u8865\u5168\u4E2D ${processed}/${missing.length}\u2026`);
    });
    prog.hide();
    this.store.touch();
    new import_obsidian15.Notice(
      `\u8865\u5168\u5B8C\u6210\uFF1A${done}/${missing.length} \u8BCD\u8865\u5230` + (done < missing.length ? `\uFF08\u5176\u4F59\u8BCD\u8BCD\u5178\u4E0E\u5728\u7EBF\u5747\u65E0\u6536\u5F55\u6216\u7F51\u7EDC\u5931\u8D25\uFF0C\u53EF\u91CD\u8DD1\u518D\u8BD5\uFF09` : "")
    );
    void this.refreshStatusBar();
  }
  /** AI 补例句：为例句数不足 want（默认 exampleCount）的词批量生成。
   *  limit：本次最多补多少词（例句最少的优先）；onProgress：完成数回调（弹窗进度显示用）；
   *  only：限定词集（新词入库后台补全用），不传 = 全库缺口 */
  async backfillExamples(wantOpt, limit, onProgress, shouldStop, only) {
    const cfg = this.llmCfg;
    if (!llmReady(cfg)) {
      new import_obsidian15.Notice("\u8BF7\u5148\u5728 \u8BBE\u7F6E \u2192 English Learn \u914D\u7F6E LLM API\uFF08\u672C\u5730 Ollama \u6216\u4E91\u7AEF\u5747\u53EF\uFF09");
      return;
    }
    const want = Math.max(1, wantOpt != null ? wantOpt : this.db.settings.exampleCount || 3);
    await this.words.scan();
    let missing = this.words.all().filter((w) => w.examples.length < want);
    if (only) missing = missing.filter((w) => only.has(w.word.toLowerCase()));
    if (!missing.length) {
      new import_obsidian15.Notice(`\u6240\u6709\u8BCD\u90FD\u5DF2\u6709\u81F3\u5C11 ${want} \u6761\u4F8B\u53E5\u4E86`);
      return;
    }
    missing.sort((a, b) => a.examples.length - b.examples.length);
    if (limit && limit > 0 && limit < missing.length) missing = missing.slice(0, limit);
    new import_obsidian15.Notice(`\u6B63\u5728\u4E3A ${missing.length} \u4E2A\u8BCD\u8865\u4F8B\u53E5\uFF08\u6BCF\u8BCD\u8865\u5230 ${want} \u6761\uFF09\u2026\uFF08\u672C\u5730\u5C0F\u6A21\u578B\u53EF\u80FD\u8F83\u6162\uFF09`);
    let done = 0;
    const generated = /* @__PURE__ */ new Set();
    const report = (extra) => onProgress == null ? void 0 : onProgress(generated.size, missing.length, extra);
    report();
    const m = await llmExamples(
      cfg,
      missing.map((d) => d.word),
      void 0,
      want,
      void 0,
      // 批次计数不再单独展示：词数已随批次推进
      shouldStop,
      (rest) => report(`\uFF08\u5C0F\u6279\u91CD\u8BD5 ${rest} \u8BCD\uFF09`),
      (ws) => {
        for (const w of ws) generated.add(w);
        report();
      }
    );
    for (const doc of missing) {
      const exs = m.get(doc.word.toLowerCase());
      if (!(exs == null ? void 0 : exs.length)) continue;
      const added = await this.appendNewExamples(doc, exs);
      if (added > 0) done++;
    }
    this.store.touch();
    new import_obsidian15.Notice(
      (shouldStop == null ? void 0 : shouldStop()) ? `\u5DF2\u505C\u6B62\uFF1A${done}/${missing.length}\uFF08\u5DF2\u751F\u6210\u7684\u7ED3\u679C\u5DF2\u4FDD\u7559\uFF09` : done === missing.length ? `\u4F8B\u53E5\u751F\u6210\u5B8C\u6210\uFF1A${done}/${missing.length}` : `\u4F8B\u53E5\u751F\u6210\u5B8C\u6210\uFF1A${done}/${missing.length}\uFF08\u5176\u4F59\u751F\u6210\u5931\u8D25\u6216\u4E3A\u7A7A\uFF0C\u7A0D\u540E\u53EF\u518D\u8DD1\u4E00\u6B21\uFF09`
    );
  }
  /** AI 批量补义项：为没有 AI 义项的词批量拆多义（带词性），写回 frontmatter，词卡 SenseList 优先渲染。
   *  只补缺不覆盖；义项输出短、生成快，Notice 常驻进度即可，不必像例句回填那样开弹窗。
   *  only：限定词集（新词入库后台补全用），不传 = 全库缺口 */
  async backfillSenses(limit, only) {
    const cfg = this.llmCfg;
    if (!llmReady(cfg)) {
      new import_obsidian15.Notice("\u8BF7\u5148\u5728 \u8BBE\u7F6E \u2192 English Learn \u914D\u7F6E LLM API\uFF08\u672C\u5730 Ollama \u6216\u4E91\u7AEF\u5747\u53EF\uFF09");
      return;
    }
    await this.words.scan();
    let missing = this.words.all().filter((w) => {
      var _a;
      return !((_a = w.senses) == null ? void 0 : _a.length);
    });
    if (only) missing = missing.filter((w) => only.has(w.word.toLowerCase()));
    if (!missing.length) {
      new import_obsidian15.Notice("\u6240\u6709\u8BCD\u90FD\u5DF2\u6709 AI \u4E49\u9879\u4E86");
      return;
    }
    const batch = limit && limit > 0 ? missing.slice(0, limit) : missing;
    let done = 0;
    const prog = new import_obsidian15.Notice(`\u6B63\u5728\u4E3A ${batch.length} \u4E2A\u8BCD\u751F\u6210\u4E49\u9879\u2026\uFF08\u672C\u5730\u5C0F\u6A21\u578B\u53EF\u80FD\u8F83\u6162\uFF09`, 0);
    try {
      const m = await llmSenses(cfg, batch.map((d) => d.word), (ws) => {
        done += ws.length;
        prog.setMessage(`\u751F\u6210\u4E49\u9879\u4E2D ${done}/${batch.length}\u2026`);
      });
      let written = 0;
      for (const doc of batch) {
        const senses = m.get(doc.word.toLowerCase());
        if (!(senses == null ? void 0 : senses.length)) continue;
        await this.words.setSenses(doc, senses);
        written++;
      }
      this.store.touch();
      new import_obsidian15.Notice(
        written === batch.length ? `\u4E49\u9879\u751F\u6210\u5B8C\u6210\uFF1A${written}/${batch.length}` : `\u4E49\u9879\u751F\u6210\u5B8C\u6210\uFF1A${written}/${batch.length}\uFF08\u5176\u4F59\u751F\u6210\u5931\u8D25\u6216\u4E3A\u7A7A\uFF0C\u7A0D\u540E\u53EF\u518D\u8DD1\u4E00\u6B21\uFF09`
      );
      void this.refreshStatusBar();
    } catch (e) {
      new import_obsidian15.Notice(`\u6279\u91CF\u8865\u4E49\u9879\u5931\u8D25\uFF1A${e instanceof Error ? e.message : e}`);
    } finally {
      prog.hide();
    }
  }
  /** AI 批量补例句翻译：为没有中文翻译的例句回填（手工添加/导入时未带翻译的例句）。
   *  按词分批请求（一词条句一次），Notice 常驻进度；只补缺不动已有翻译。
   *  only：限定词集（新词入库后台补全用），不传 = 全库缺口 */
  async backfillExampleTranslations(limit, only) {
    const cfg = this.llmCfg;
    if (!llmReady(cfg)) {
      new import_obsidian15.Notice("\u8BF7\u5148\u5728 \u8BBE\u7F6E \u2192 English Learn \u914D\u7F6E LLM API\uFF08\u672C\u5730 Ollama \u6216\u4E91\u7AEF\u5747\u53EF\uFF09");
      return;
    }
    await this.words.scan();
    let targets = this.words.all().map((d) => ({
      doc: d,
      missing: d.examples.map((e, i) => {
        var _a;
        return ((_a = e.translation) == null ? void 0 : _a.trim()) ? -1 : i;
      }).filter((i) => i >= 0)
    })).filter((x) => x.missing.length);
    if (only) targets = targets.filter((x) => only.has(x.doc.word.toLowerCase()));
    const total = targets.reduce((s, x) => s + x.missing.length, 0);
    if (!total) {
      new import_obsidian15.Notice("\u6240\u6709\u4F8B\u53E5\u90FD\u5DF2\u6709\u4E2D\u6587\u7FFB\u8BD1");
      return;
    }
    const batch = limit && limit > 0 ? targets.slice(0, limit) : targets;
    const batchTotal = batch.reduce((s, x) => s + x.missing.length, 0);
    let done = 0;
    let processed = 0;
    const prog = new import_obsidian15.Notice(`\u6B63\u5728\u4E3A ${batchTotal} \u6761\u4F8B\u53E5\u8865\u7FFB\u8BD1\u2026\uFF08\u672C\u5730\u5C0F\u6A21\u578B\u53EF\u80FD\u8F83\u6162\uFF09`, 0);
    try {
      await runPool(batch, 2, async ({ doc, missing }) => {
        const zh = await llmTranslateSentences(
          cfg,
          missing.map((i) => doc.examples[i].text)
        ).catch(() => []);
        for (let j = 0; j < missing.length; j++) {
          if (!zh[j]) continue;
          await this.words.updateExampleTranslation(doc, missing[j], zh[j]);
          done++;
        }
        processed++;
        prog.setMessage(`\u8865\u4F8B\u53E5\u7FFB\u8BD1\u4E2D ${processed}/${batch.length} \u8BCD\u2026`);
      });
      this.store.touch();
      new import_obsidian15.Notice(
        done === batchTotal ? `\u4F8B\u53E5\u7FFB\u8BD1\u8865\u5168\uFF1A${done}/${batchTotal}` : `\u4F8B\u53E5\u7FFB\u8BD1\u8865\u5168\uFF1A${done}/${batchTotal}\uFF08\u5176\u4F59\u751F\u6210\u5931\u8D25\u6216\u4E3A\u7A7A\uFF0C\u7A0D\u540E\u53EF\u518D\u8DD1\u4E00\u6B21\uFF09`
      );
    } catch (e) {
      new import_obsidian15.Notice(`\u8865\u4F8B\u53E5\u7FFB\u8BD1\u5931\u8D25\uFF1A${e instanceof Error ? e.message : e}`);
    } finally {
      prog.hide();
    }
  }
  /** 打开本插件设置页（AI 未配置等场景一键跳转） */
  openSettings() {
    const setting = this.app.setting;
    if (!setting) return;
    setting.open();
    setting.openTabById(this.manifest.id);
  }
  /** 新词后台统一补全入口：入库只做快动作（本地词典释义+已有例句），勾选加入即返回；
   *  例句/义项/音标/同反义/例句翻译全部转到这里后台跑，词卡数据随补齐自动出现 */
  enrichWordsInBackground(words) {
    if (!words.length) return;
    this.enrichQueue = this.enrichQueue.then(() => this.enrichWordsNow(words)).catch(() => {
    });
  }
  async enrichWordsNow(words) {
    await this.words.scan();
    const only = new Set(words.map((w) => w.toLowerCase()));
    const docs = words.map((w) => this.words.get(w)).filter((d) => !!d);
    if (!docs.length) return;
    const wantEx = Math.max(1, this.db.settings.exampleCount || 3);
    const gaps = {
      trans: docs.some((d) => (!d.translation || !d.phonetic) && !isPhrase(d.word) && !this.exhaustedWords()[d.word]),
      rel: docs.some((d) => d.synonyms === void 0 && d.antonyms === void 0 && !isPhrase(d.word)),
      ex: docs.some((d) => d.examples.length < wantEx),
      senses: docs.some((d) => {
        var _a;
        return !((_a = d.senses) == null ? void 0 : _a.length);
      }),
      zh: docs.some((d) => d.examples.some((e) => {
        var _a;
        return !((_a = e.translation) == null ? void 0 : _a.trim());
      }))
    };
    const llm = llmReady(this.llmCfg);
    if (!llm && (gaps.ex || gaps.senses || gaps.zh)) {
      const frag = document.createDocumentFragment();
      frag.append("\u5DF2\u5F00\u59CB\u540E\u53F0\u8865\u5168\u97F3\u6807/\u91CA\u4E49/\u540C\u53CD\u4E49\u8BCD\u3002");
      const link = document.createElement("span");
      link.textContent = "\u914D\u7F6E AI \u6A21\u578B";
      link.className = "el-notice-link";
      link.addEventListener("click", () => this.openSettings());
      frag.append(link);
      frag.append("\u540E\u4F8B\u53E5\u4E0E\u4E49\u9879\u5C06\u81EA\u52A8\u8865\u9F50");
      new import_obsidian15.Notice(frag, 1e4);
    }
    const step = async (run2) => {
      try {
        await run2();
      } catch (e) {
        new import_obsidian15.Notice(`\u540E\u53F0\u8865\u5168\u51FA\u9519\uFF1A${e instanceof Error ? e.message : e}`);
      }
    };
    if (gaps.trans) await step(() => this.backfillTranslations(only));
    if (gaps.rel) await step(() => this.backfillRelWords(void 0, only));
    if (llm && gaps.ex) await step(() => this.backfillExamples(void 0, void 0, void 0, void 0, only));
    if (llm && gaps.senses) await step(() => this.backfillSenses(void 0, only));
    if (llm && gaps.zh) await step(() => this.backfillExampleTranslations(void 0, only));
  }
  /** 词卡上手动为单个词补例句（每次 3 条，带主题语境），成功返回新增条数 */
  async aiExamplesFor(doc, count = 3) {
    var _a;
    const cfg = this.llmCfg;
    if (!llmReady(cfg)) {
      new import_obsidian15.Notice("\u8BF7\u5148\u5728 \u8BBE\u7F6E \u2192 English Learn \u914D\u7F6E LLM API\uFF08\u672C\u5730 Ollama \u6216\u4E91\u7AEF\u5747\u53EF\uFF09");
      return 0;
    }
    try {
      const m = await llmExamples(cfg, [doc.word], this.topicOf(doc.themes[0]) || void 0, count);
      const added = await this.appendNewExamples(doc, (_a = m.get(doc.word.toLowerCase())) != null ? _a : []);
      this.store.touch();
      new import_obsidian15.Notice(
        added ? `\u5DF2\u4E3A ${doc.word} \u8865 ${added} \u6761\u4F8B\u53E5` : "\u6CA1\u6709\u65B0\u589E\u4F8B\u53E5\uFF08\u53EF\u80FD\u4E0E\u73B0\u6709\u4F8B\u53E5\u91CD\u590D\uFF09\uFF0C\u53EF\u518D\u8BD5\u4E00\u6B21"
      );
      return added;
    } catch (e) {
      new import_obsidian15.Notice(`AI \u8865\u4F8B\u53E5\u5931\u8D25\uFF1A${e instanceof Error ? e.message : e}\uFF08\u8BF7\u68C0\u67E5 LLM \u670D\u52A1\u662F\u5426\u53EF\u7528\uFF09`);
      return 0;
    }
  }
  /** 词卡上手动为单个词补全义项：AI 拆多义（带词性），写入 frontmatter senses，词卡渲染优先 */
  async aiSensesFor(doc) {
    var _a;
    const cfg = this.llmCfg;
    if (!llmReady(cfg)) {
      new import_obsidian15.Notice("\u8BF7\u5148\u5728 \u8BBE\u7F6E \u2192 English Learn \u914D\u7F6E LLM API\uFF08\u672C\u5730 Ollama \u6216\u4E91\u7AEF\u5747\u53EF\uFF09");
      return 0;
    }
    try {
      const m = await llmSenses(cfg, [doc.word]);
      const senses = (_a = m.get(doc.word)) != null ? _a : [];
      if (!senses.length) {
        new import_obsidian15.Notice("\u6CA1\u6709\u751F\u6210\u51FA\u4E49\u9879\uFF08\u6A21\u578B\u8FD4\u56DE\u4E3A\u7A7A\u6216\u65E0\u6CD5\u89E3\u6790\uFF09\uFF0C\u53EF\u518D\u8BD5\u4E00\u6B21");
        return 0;
      }
      await this.words.setSenses(doc, senses);
      this.store.touch();
      new import_obsidian15.Notice(`\u5DF2\u4E3A ${doc.word} \u62C6\u51FA ${senses.length} \u4E2A\u4E49\u9879`);
      return senses.length;
    } catch (e) {
      new import_obsidian15.Notice(`AI \u8865\u4E49\u9879\u5931\u8D25\uFF1A${e instanceof Error ? e.message : e}\uFF08\u8BF7\u68C0\u67E5 LLM \u670D\u52A1\u662F\u5426\u53EF\u7528\uFF09`);
      return 0;
    }
  }
  /** 词级发音统一入口：标准发音缓存优先，未命中 TTS 即时兜底并后台预下载（下次起该词有道标准音） */
  speakWord(word, rate) {
    const w = word.trim().toLowerCase();
    void this.audio.play(w).then((ok) => {
      if (ok) return;
      speak(w, rate != null ? rate : this.db.settings.ttsRate);
      void this.audio.prefetch(w);
    });
  }
  /** 词卡弹窗统一入口：例句点已收录词时弹出对应词卡（弹窗类独立文件，避免与词卡组件循环 import） */
  openWordCard(doc) {
    new WordCardModal(this.app, this, doc).open();
  }
  /** 删除词条：词笔记移入回收站 + 清内存索引、学习进度与发音缓存 */
  async deleteWord(word) {
    const doc = this.words.get(word);
    if (doc) {
      const file = this.app.vault.getFileByPath(doc.path);
      if (file) await this.app.vault.trash(file, false);
      this.words.remove(word);
    }
    void this.audio.forget(word);
    delete this.db.progress[word];
    this.store.touch();
    void this.refreshStatusBar();
  }
  /** 从最新备份快照恢复进度：只补当前缺失的词（现有进度一律不动，安全无破坏） */
  async restoreProgress() {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const dir = `${this.db.settings.root}/backup`;
    const snaps = this.app.vault.getFiles().filter((f) => f.path.startsWith(`${dir}/progress-`)).sort((a, b) => a.name < b.name ? 1 : -1);
    for (const f of snaps) {
      try {
        const data = JSON.parse(await this.app.vault.read(f));
        let restored = 0;
        for (const [word, p] of Object.entries((_a = data.progress) != null ? _a : {})) {
          if (!this.db.progress[word]) {
            this.db.progress[word] = p;
            restored++;
          }
        }
        let restoredThemes = 0;
        for (const [name, info] of Object.entries((_b = data.themes) != null ? _b : {})) {
          if (!this.db.themes[name]) {
            this.db.themes[name] = info;
            restoredThemes++;
          }
        }
        let restoredDays = 0;
        for (const [date, d] of Object.entries((_d = (_c = data.stats) == null ? void 0 : _c.days) != null ? _d : {})) {
          if (!this.db.stats.days[date]) {
            this.db.stats.days[date] = d;
            restoredDays++;
          }
        }
        if (restoredDays) this.recomputeStreak();
        let restoredIgnored = 0;
        for (const [word, v] of Object.entries((_e = data.ignored) != null ? _e : {})) {
          if (!((_f = this.db.ignored) == null ? void 0 : _f[word])) {
            ((_h = (_g = this.db).ignored) != null ? _h : _g.ignored = {})[word] = v;
            restoredIgnored++;
          }
        }
        this.store.touch();
        void this.refreshStatusBar();
        const parts = [
          restored ? `${restored} \u4E2A\u8BCD\u7684\u8FDB\u5EA6` : "",
          restoredThemes ? `${restoredThemes} \u4E2A\u7F3A\u5931\u4E3B\u9898` : "",
          restoredDays ? `${restoredDays} \u5929\u5B66\u4E60\u8BB0\u5F55` : "",
          restoredIgnored ? `${restoredIgnored} \u4E2A\u5FFD\u7565\u8BCD` : ""
        ].filter(Boolean);
        new import_obsidian15.Notice(
          parts.length ? `\u5DF2\u6062\u590D ${parts.join("\u3001")}\uFF08\u73B0\u6709\u6570\u636E\u672A\u6539\u52A8\uFF09` : "\u6CA1\u6709\u53EF\u6062\u590D\u7684\u5185\u5BB9\uFF1A\u5F53\u524D\u6570\u636E\u5DF2\u662F\u5FEB\u7167\u7684\u8D85\u96C6"
        );
        return;
      } catch (e) {
        continue;
      }
    }
    new import_obsidian15.Notice("\u6CA1\u6709\u53EF\u7528\u7684\u5907\u4EFD\u5FEB\u7167\uFF08\u9700\u5148\u5F00\u542F\u81EA\u52A8\u5907\u4EFD\u5E76\u5B8C\u6210\u8FC7\u5B66\u4E60\uFF09");
  }
  /** 删除主题：词文件保留，仅解除 frontmatter 关联（含被忽略的词） */
  async deleteTheme(name) {
    var _a;
    delete this.db.themes[name];
    if (((_a = this.expandCache) == null ? void 0 : _a.theme) === name) this.expandCache = void 0;
    for (const doc of this.words.byThemeRaw(name)) {
      await this.words.removeTheme(doc, name);
    }
    this.store.touch();
  }
  /** 合并主题：from 的词全部并入 to 后删除 from（学习进度保留）。
   *  返回实际移入 to 的词数（两主题都有的词不算） */
  async mergeTheme(from, to) {
    const moved = this.words.byThemeRaw(from).filter((d) => !d.themes.includes(to));
    for (const doc of moved) {
      await this.words.addTheme(doc, to);
    }
    await this.deleteTheme(from);
    return moved.length;
  }
  /** 编辑主题：改名（同步全部词笔记 frontmatter）+ 更新关键词。返回错误信息或 null */
  async editTheme(oldName, newName, keywords) {
    const name = newName.trim();
    if (!name) return "\u4E3B\u9898\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A";
    if (name !== oldName && this.db.themes[name]) return "\u5DF2\u5B58\u5728\u540C\u540D\u4E3B\u9898";
    const info = this.db.themes[oldName];
    if (!info) return "\u4E3B\u9898\u4E0D\u5B58\u5728";
    if (name !== oldName) {
      delete this.db.themes[oldName];
      info.name = name;
      this.db.themes[name] = info;
      for (const doc of this.words.byThemeRaw(oldName)) {
        await this.words.renameTheme(doc, oldName, name);
      }
      if (this.sessionTheme === oldName) this.sessionTheme = name;
    }
    info.keywords = keywords;
    this.store.touch();
    return null;
  }
};
var EnglishLearnSettingTab = class extends import_obsidian15.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    const s = this.plugin.db.settings;
    containerEl.createEl("div", { text: `English Learn v${this.plugin.manifest.version}`, cls: "el-muted" });
    new import_obsidian15.Setting(containerEl).setName("\u8BCD\u5E93\u6839\u76EE\u5F55").setDesc("\u8BCD\u7B14\u8BB0\u5B58\u653E\u7684 vault \u76EE\u5F55").addText(
      (t) => t.setValue(s.root).onChange(async (v) => {
        s.root = v.trim() || "EnglishLearn";
        this.plugin.store.touch();
        await this.plugin.ensureFolders();
      })
    );
    addHelpTip(
      new import_obsidian15.Setting(containerEl).setName("\u6BCF\u65E5\u65B0\u8BCD\u6570").addText((t) => {
        t.inputEl.type = "number";
        t.setValue(String(s.dailyNew)).onChange((v) => {
          s.dailyNew = Math.max(0, parseInt(v) || 0);
          this.plugin.store.touch();
        });
      }),
      "\u6BCF\u5929\u9996\u6B21\u5B66\u4E60\u65F6\u6536\u5F55\u961F\u5217\u9876\u90E8\u7684\u65B0\u8BCD\u4E0A\u9650\uFF08\u5B8C\u6210\u9875\u300C\u518D\u6765\u4E00\u6279\u300D\u53EF\u8D85\u914D\u989D\u52A0\u5B66\uFF09"
    );
    addHelpTip(
      new import_obsidian15.Setting(containerEl).setName("\u6BCF\u65E5\u590D\u4E60\u4E0A\u9650").addText((t) => {
        t.inputEl.type = "number";
        t.setValue(String(s.dailyReviewMax)).onChange((v) => {
          s.dailyReviewMax = Math.max(0, parseInt(v) || 0);
          this.plugin.store.touch();
        });
      }),
      "\u6BCF\u5929\u5230\u671F\u7684\u590D\u4E60\u8BCD\u6700\u591A\u6536\u8FDB\u4F1A\u8BDD\u591A\u5C11\u4E2A\uFF1B\u79EF\u538B\u591A\u65F6\u9632\u6B62\u4E00\u6B21\u5B66\u4E0D\u5B8C"
    );
    addHelpTip(
      new import_obsidian15.Setting(containerEl).setName("\u53CC\u5411\u590D\u4E60").addToggle(
        (t) => t.setValue(s.reviewReverse !== false).onChange((v) => {
          s.reviewReverse = v;
          this.plugin.store.touch();
        })
      ),
      "\u590D\u4E60\u5361\u4E00\u534A\u6982\u7387\u770B\u91CA\u4E49\u56DE\u5FC6\u5355\u8BCD\uFF08\u4EA7\u51FA\u5F0F\u56DE\u5FC6\uFF0C\u8BB0\u5F97\u66F4\u7262\uFF09\uFF1B\u5173\u95ED\u540E\u53EA\u770B\u8BCD\u56DE\u5FC6\u91CA\u4E49"
    );
    addHelpTip(
      new import_obsidian15.Setting(containerEl).setName("\u300C\u6A21\u7CCA\u300D\u95F4\u9694\u51CF\u534A").addToggle(
        (t) => t.setValue(s.fuzzyHalve !== false).onChange((v) => {
          s.fuzzyHalve = v;
          this.plugin.store.touch();
        })
      ),
      "\u8BC4\u300C\u6A21\u7CCA\u300D\u65F6\u672C\u7EA7\u91CD\u590D\u5E76\u5728\u534A\u7A0B\u91CD\u89C1\uFF1B\u5173\u95ED\u540E\u6309\u5B8C\u6574\u95F4\u9694\u91CD\u89C1"
    );
    addHelpTip(
      new import_obsidian15.Setting(containerEl).setName("\u62FC\u5199\u9898\u6982\u7387").addSlider(
        (sl) => {
          var _a;
          return sl.setLimits(0, 1, 0.05).setValue((_a = s.spellChance) != null ? _a : 0.3).setDynamicTooltip().onChange((v) => {
            s.spellChance = v;
            this.plugin.store.touch();
          });
        }
      ),
      "\u5DE9\u56FA\u6D4B\u8BD5\u51FA\u300C\u770B\u4E49\u62FC\u8BCD\u300D\u9898\u7684\u6982\u7387\uFF1B\u62FC\u8BCD\u662F\u4EA7\u51FA\u5F0F\u56DE\u5FC6\uFF0C\u8BB0\u5F97\u6700\u7262\u30020 = \u5173\u95ED\u62FC\u5199\u9898"
    );
    addHelpTip(
      new import_obsidian15.Setting(containerEl).setName("\u542C\u5199\u5360\u6BD4").addSlider(
        (sl) => {
          var _a;
          return sl.setLimits(0, 1, 0.05).setValue((_a = s.audioChance) != null ? _a : 0.4).setDynamicTooltip().onChange((v) => {
            s.audioChance = v;
            this.plugin.store.touch();
          });
        }
      ),
      "\u62FC\u5199\u9898\u91CC\u53EA\u64AD\u53D1\u97F3\u4E0D\u663E\u91CA\u4E49\u7684\u542C\u5199\u53D8\u4F53\u5360\u6BD4\uFF1B\u542C\u529B+\u62FC\u5199\u53CC\u91CD\u4EA7\u51FA\u30020 = \u5168\u90E8\u770B\u4E49\u62FC\u5199"
    );
    new import_obsidian15.Setting(containerEl).setName("TTS \u8BED\u901F").addSlider(
      (sl) => sl.setLimits(0.5, 1.5, 0.05).setValue(s.ttsRate).setDynamicTooltip().onChange((v) => {
        s.ttsRate = v;
        this.plugin.store.touch();
      })
    );
    addHelpTip(
      new import_obsidian15.Setting(containerEl).setName("\u4F8B\u53E5\u8BED\u901F").addSlider(
        (sl) => {
          var _a;
          return sl.setLimits(0.5, 1.5, 0.05).setValue((_a = s.ttsSentenceRate) != null ? _a : s.ttsRate).setDynamicTooltip().onChange((v) => {
            s.ttsSentenceRate = v;
            this.plugin.store.touch();
          });
        }
      ),
      "\u8BFB\u4F8B\u53E5\u65F6\u7528\u5355\u72EC\u7684\u8BED\u901F\uFF0C\u6BD4\u5355\u8BCD\u6162\u4E00\u70B9\u66F4\u6613\u542C\u6E05"
    );
    const ttsVoices = "speechSynthesis" in window ? window.speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang)) : [];
    const ttsVoiceSetting = new import_obsidian15.Setting(containerEl).setName("TTS \u58F0\u97F3").addDropdown((d) => {
      var _a;
      d.addOption("", "\u81EA\u52A8\uFF08\u63A8\u8350\uFF09");
      for (const v of ttsVoices) d.addOption(v.name, `${v.name}\uFF08${v.lang}\uFF09`);
      d.setValue((_a = s.ttsVoice) != null ? _a : "");
      d.onChange((v) => {
        s.ttsVoice = v;
        this.plugin.store.touch();
        setPreferredVoice(v || null);
      });
    }).addButton(
      (b) => b.setButtonText("\u8BD5\u542C").setTooltip("\u6717\u8BFB\u4F8B\u53E5\u8BD5\u542C\u5F53\u524D\u58F0\u97F3").onClick(() => {
        setPreferredVoice(s.ttsVoice || null);
        speak("Hello, this is a voice test.", s.ttsRate);
      })
    );
    if (ttsVoices.length)
      addHelpTip(
        ttsVoiceSetting,
        "\u6307\u5B9A\u82F1\u6587\u58F0\uFF08\u5982\u82F1\u97F3\uFF09\uFF1B\u300C\u81EA\u52A8\u300D\u6309\u8D28\u91CF\u6311\u9009\uFF08Enhanced/Natural \u4F18\u5148\uFF09\u3002\u5217\u8868\u53EF\u80FD\u542B\u7CFB\u7EDF\u672A\u4E0B\u8F7D\u7684\u58F0\u97F3\uFF08\u53D1\u97F3\u4F1A\u5F02\u5E38\u56DE\u843D\uFF09\uFF0C\u5EFA\u8BAE\u9009\u540E\u8BD5\u542C\u786E\u8BA4"
      );
    else ttsVoiceSetting.setDesc("\u58F0\u97F3\u5217\u8868\u5C1A\u672A\u52A0\u8F7D\u5B8C\u6210\uFF0C\u91CD\u65B0\u6253\u5F00\u8BBE\u7F6E\u9875\u5373\u53EF\u9009\u62E9");
    let upgradeBtn;
    addHelpTip(
      new import_obsidian15.Setting(containerEl).setName("ECDICT \u5206\u7247\u5730\u5740").addText(
        (t) => t.setValue(s.dictBase).onChange((v) => {
          s.dictBase = v.trim();
          this.plugin.store.touch();
        })
      ).addButton((b) => {
        b.setButtonText("\u7ACB\u5373\u4E0B\u8F7D\u8BCD\u5178\u5206\u7247").onClick(async () => {
          await this.plugin.downloadDict();
          if (dictStatusEl.isConnected) void this.renderDictStatus(dictStatusEl, b);
        });
        upgradeBtn = b;
        return b;
      }),
      `\u7559\u7A7A = \u4F7F\u7528\u5185\u7F6E\u57FA\u7840\u8BCD\u5178 v${STARTER_VER}\uFF082.2 \u4E07\u8BCD\uFF0C\u542B\u97F3\u6807/\u8003\u7EA7\u6807\u7B7E/\u540C\u53CD\u4E49\u8BCD/\u540C\u6839\u8BCD/\u8BCD\u5F62\u53D8\u5316/\u4F8B\u53E5\uFF0C\u9996\u6B21\u67E5\u8BCD\u81EA\u52A8\u4E0B\u8F7D\uFF09\uFF1B\u586B\u5199\u540E\u4F18\u5148\u4ECE\u81EA\u6258\u7BA1\u5206\u7247\u52A0\u8F7D`
    );
    const dictStatusEl = containerEl.createDiv({ cls: "el-muted el-dict-status" });
    void this.renderDictStatus(dictStatusEl, upgradeBtn);
    addHelpTip(
      new import_obsidian15.Setting(containerEl).setName("\u81EA\u52A8\u5907\u4EFD\u5B66\u4E60\u6570\u636E").addToggle(
        (t) => t.setValue(s.autoBackup).onChange((v) => {
          s.autoBackup = v;
          this.plugin.store.touch();
        })
      ),
      "\u6BCF\u6B21\u5B66\u4E60\u7ED3\u675F\u628A\u8FDB\u5EA6/\u4E3B\u9898/\u6253\u5361\u8BB0\u5F55\u5FEB\u7167\u5199\u5165 \u8BCD\u5E93\u6839\u76EE\u5F55/backup/\uFF08\u6700\u8FD1 14 \u4EFD\uFF1B\u6570\u636E\u4E22\u5931\u53EF\u7528\u547D\u4EE4\u6062\u590D\uFF09"
    );
    new import_obsidian15.Setting(containerEl).setName("AI \u6269\u8BCD\uFF08LLM\uFF09").setHeading();
    addHelpTip(
      new import_obsidian15.Setting(containerEl).setName("\u6BCF\u8BCD\u4F8B\u53E5\u6570").addSlider(
        (sl) => sl.setLimits(1, 5, 1).setValue(s.exampleCount).setDynamicTooltip().onChange((v) => {
          s.exampleCount = v;
          this.plugin.store.touch();
        })
      ),
      "AI \u751F\u6210\u4F8B\u53E5\u65F6\u6BCF\u4E2A\u5355\u8BCD\u5199\u7684\u53E5\u5B50\u6570\uFF08\u8BED\u5883\u5404\u5F02\uFF1B\u8BCD\u5361\u9ED8\u8BA4\u5C55\u793A 3 \u6761\u3001\u53EF\u5C55\u5F00\u5168\u90E8\uFF0C\u590D\u4E60\u6316\u7A7A\u9898\u968F\u673A\u9009\u7528\uFF09"
    );
    const mobile = import_obsidian15.Platform.isMobile;
    const activeProvider = () => {
      var _a;
      const s2 = this.plugin.db.settings;
      return (_a = mobile ? s2.llmMobileProvider : void 0) != null ? _a : s2.llmProvider;
    };
    const conf = () => llmConf(this.plugin.db.settings.llmSaved, activeProvider());
    const writeConf = (patch) => {
      const s2 = this.plugin.db.settings;
      const p = activeProvider();
      s2.llmSaved = { ...s2.llmSaved, [p]: { ...conf(), ...patch } };
      this.plugin.store.touch();
    };
    let urlText = null;
    let keyText = null;
    let modelText = null;
    let keyGuideBtn = null;
    const syncKeyGuide = () => {
      const p = activeProvider();
      if (keyGuideBtn) keyGuideBtn.extraSettingsEl.hidden = p === "ollama" || p === "custom";
    };
    const syncUrlLock = () => {
      if (urlText) urlText.inputEl.disabled = llmUrlLocked(activeProvider());
    };
    const switchSource = (next) => {
      const s2 = this.plugin.db.settings;
      if (mobile) s2.llmMobileProvider = next;
      else s2.llmProvider = next;
      writeConf({});
      syncUrlLock();
      urlText == null ? void 0 : urlText.setValue(conf().baseUrl);
      keyText == null ? void 0 : keyText.setValue(conf().apiKey);
      modelText == null ? void 0 : modelText.setValue(conf().model);
      syncKeyGuide();
    };
    addHelpTip(
      new import_obsidian15.Setting(containerEl).setName("AI \u6E90").addDropdown(
        (d) => d.addOptions({
          ollama: "Ollama\uFF08\u672C\u5730\uFF09",
          deepseek: "DeepSeek",
          siliconflow: "\u7845\u57FA\u6D41\u52A8\uFF08\u514D\u8D39\u989D\u5EA6\uFF09",
          zhipu: "\u667A\u8C31 GLM\uFF08\u514D\u8D39\u6A21\u578B\uFF09",
          custom: "OpenAI \u517C\u5BB9\uFF08\u81EA\u5B9A\u4E49\uFF09"
        }).setValue(activeProvider()).onChange((v) => {
          switchSource(v);
        })
      ),
      mobile ? "\u624B\u673A\u542F\u7528\u54EA\u4E2A AI \u6E90\uFF08\u672A\u6539\u8FC7\u5219\u8DDF\u968F\u684C\u9762\u7AEF\uFF1B\u914D\u7F6E\u6C60\u4E24\u7AEF\u5171\u7528\uFF0C\u540C\u4E00\u6E90\u6539\u4E00\u5904\u4E24\u7AEF\u751F\u6548\uFF09\u3002\u672C\u5730 Ollama \u624B\u673A\u8FDE\u4E0D\u4E0A\uFF0C\u5EFA\u8BAE\u9009\u7845\u57FA\u6D41\u52A8\u7B49\u4E91\u7AEF API\uFF08\u514D\u8D39\u989D\u5EA6\uFF0C\u65C1\u6709 \u{1F511} \u5F15\u5BFC\u6CE8\u518C\uFF09" : "\u684C\u9762\u7AEF\u542F\u7528\u54EA\u4E2A AI \u6E90\uFF08\u624B\u673A\u9ED8\u8BA4\u8DDF\u968F\u6B64\u5904\uFF0C\u53EF\u5728\u624B\u673A\u4E0A\u53E6\u9009\uFF1B\u914D\u7F6E\u6C60\u4E24\u7AEF\u5171\u7528\uFF0C\u540C\u4E00\u6E90\u6539\u4E00\u5904\u4E24\u7AEF\u751F\u6548\uFF09\u3002Ollama \u4E3A\u672C\u5730\u6A21\u578B\uFF08\u9700\u5148 ollama pull qwen2.5:3b\uFF09\uFF1B\u7845\u57FA\u6D41\u52A8/DeepSeek \u9009\u540E\u70B9 Key \u680F \u{1F511} \u53EF\u5F15\u5BFC\u514D\u8D39\u6CE8\u518C"
    );
    new import_obsidian15.Setting(containerEl).setName("API \u5730\u5740").addText((t) => {
      urlText = t;
      t.setValue(conf().baseUrl).onChange((v) => {
        writeConf({ baseUrl: v.trim() });
      });
      t.inputEl.setAttribute("title", "\u9884\u8BBE\u6E90\u5B98\u65B9\u5730\u5740\u56FA\u5B9A\uFF0C\u65E0\u9700\u4FEE\u6539");
      syncUrlLock();
    });
    new import_obsidian15.Setting(containerEl).setName("API Key\uFF08\u672C\u5730\u6A21\u578B\u7559\u7A7A\u5373\u53EF\uFF09").addText((t) => {
      keyText = t;
      t.inputEl.type = "password";
      t.setValue(conf().apiKey).onChange((v) => {
        writeConf({ apiKey: v.trim() });
      });
    }).addExtraButton((b) => {
      keyGuideBtn = b;
      try {
        b.setIcon("key").setTooltip("\u514D\u8D39\u6CE8\u518C\uFF0C\u5F15\u5BFC\u83B7\u53D6 API Key").onClick(() => {
          const p = activeProvider();
          if (p === "ollama" || p === "custom") return;
          new KeyGuideModal(this.app, p, (key) => {
            writeConf({ apiKey: key });
            keyText == null ? void 0 : keyText.setValue(key);
            new import_obsidian15.Notice("API Key \u5DF2\u4FDD\u5B58\uFF0C\u53EF\u70B9\u4E0B\u65B9\u300C\u6D4B\u8BD5\u8FDE\u63A5\u300D\u9A8C\u8BC1");
          }).open();
        });
      } catch (e) {
        console.error("Key \u5F15\u5BFC\u6309\u94AE\u521D\u59CB\u5316\u5931\u8D25\uFF1A", e);
      }
      syncKeyGuide();
    });
    new import_obsidian15.Setting(containerEl).setName("\u6A21\u578B").addText((t) => {
      modelText = t;
      t.setValue(conf().model).onChange((v) => {
        writeConf({ model: v.trim() });
      });
    });
    new import_obsidian15.Setting(containerEl).setName("\u6D4B\u8BD5\u8FDE\u63A5").setDesc("\u5411\u5F53\u524D\u914D\u7F6E\u53D1\u9001\u4E00\u6761\u6D4B\u8BD5\u6D88\u606F").addButton(
      (b) => b.setButtonText("\u6D4B\u8BD5").setCta().onClick(async () => {
        if (!llmReady(this.plugin.llmCfg)) {
          new import_obsidian15.Notice("\u8BF7\u5148\u586B\u5199 API \u5730\u5740\u548C\u6A21\u578B\uFF08\u4E91\u7AEF API \u53E6\u9700 Key\uFF0C\u672C\u5730 Ollama \u4E0D\u7528\uFF09");
          return;
        }
        b.setDisabled(true).setButtonText("\u6D4B\u8BD5\u4E2D\u2026");
        try {
          await llmTest(this.plugin.llmCfg);
          new import_obsidian15.Notice("\u8FDE\u63A5\u6210\u529F \u2713");
        } catch (e) {
          new import_obsidian15.Notice(`\u8FDE\u63A5\u5931\u8D25\uFF1A${e instanceof Error ? e.message : String(e)}`);
        } finally {
          b.setDisabled(false).setButtonText("\u6D4B\u8BD5");
        }
      })
    );
  }
  /** 词典安装状态行（读 dict/meta.json，带版本：低于 STARTER_VER 提示升级；传按钮时同步其升级文案） */
  async renderDictStatus(el, upgradeBtn) {
    const meta = await this.plugin.dict.installedMeta();
    if (!meta) {
      el.setText("\u57FA\u7840\u8BCD\u5178\u672A\u5B89\u88C5\uFF1A\u9996\u6B21\u67E5\u8BCD\u65F6\u81EA\u52A8\u4E0B\u8F7D\uFF0C\u4E5F\u53EF\u70B9\u4E0B\u65B9\u6309\u94AE\u7ACB\u5373\u4E0B\u8F7D");
      return;
    }
    const upgrade = starterNeedsUpgrade(meta);
    upgradeBtn == null ? void 0 : upgradeBtn.setButtonText(upgrade ? `\u5347\u7EA7\u8BCD\u5178\u5230 v${STARTER_VER}` : "\u7ACB\u5373\u4E0B\u8F7D\u8BCD\u5178\u5206\u7247");
    el.setText(
      upgrade ? `\u57FA\u7840\u8BCD\u5178 v${meta.ver} \u5DF2\u5B89\u88C5\uFF1A${meta.count} \u8BCD\u6761\uFF08\u7F3A\u65B0\u7248\u5B57\u6BB5\uFF09\u2014\u2014\u4E0B\u6B21\u67E5\u8BCD\u81EA\u52A8\u5347\u7EA7\uFF0C\u6216\u70B9\u4E0B\u65B9\u6309\u94AE\u7ACB\u5373\u5347\u7EA7` : `\u57FA\u7840\u8BCD\u5178 v${meta.ver} \u5DF2\u5B89\u88C5\uFF1A${meta.count} \u8BCD\u6761\uFF08${fmtDate(meta.installed)} \u4E0B\u8F7D\uFF1B\u542B\u97F3\u6807/\u8003\u7EA7\u6807\u7B7E/\u540C\u53CD\u4E49\u8BCD/\u540C\u6839\u8BCD/\u8BCD\u5F62\u53D8\u5316/\u4F8B\u53E5\uFF09`
    );
  }
};
