// Small, literal client-side search. No regular expressions are built from queries.
(function (root) {
  const limit = 256;
  const clamp = value => String(value ?? "").slice(0, limit);
  const normalize = value => String(value ?? "").normalize("NFKC")
    .replace(/[“”]/g, '"').replace(/[‘’]/g, "'")
    .replace(/[‐‑‒–—−]/g, "-").toLowerCase().replace(/\s+/g, " ").trim();
  const normalizeTag = value => normalize(value).replace(/\s+/g, "-");
  const parse = value => {
    const raw = clamp(value);
    const normalized = normalize(raw).replace(/\bccf\s*[-_]?\s*([abc])\b/g, "ccf-$1");
    const terms = [], tags = [];
    for (const part of normalized.matchAll(/"([^"]*)(?:"|$)|([^\s"]+)/g)) {
      const token = (part[1] ?? part[2]).trim();
      if (!token) continue;
      if (/^tag:\s*\S/.test(token)) tags.push(normalizeTag(token.replace(/^tag:\s*/, "")));
      else terms.push(token);
    }
    return {raw, active: !!raw.trim(), terms: [...new Set(terms)], tags: [...new Set(tags)]};
  };
  const createRecord = ({text = "", aliases = {}, extra = "", tags = []} = {}) => ({
    text: normalize([text, extra, ...Object.keys(aliases), ...Object.values(aliases),
      ...Object.values(aliases).map(name => name.replace(/\s+/g, ""))].join(" ")),
    aliases: Object.entries(aliases).map(([alias, name]) => [normalize(alias), name]),
    tags: new Set(tags.map(normalizeTag))
  });
  const matches = (record, query) => query.terms.every(term => record.text.includes(term))
    && query.tags.every(tag => record.tags.has(tag));
  const highlightTerms = (record, query) => [...new Set([
    ...query.terms,
    ...record.aliases.filter(([alias]) => query.terms.some(term => alias.includes(term))).map(([, name]) => name)
  ])];
  const api = {limit, clamp, normalize, normalizeTag, parse, createRecord, matches, highlightTerms};
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.PaperSearch = api;
})(typeof window === "object" ? window : this);

{
  const initializeSearch = () => {
    const core = window.PaperSearch;
    const root = document.getElementById("paper-results");
    const box = document.querySelector(".search-box");
    const info = document.querySelector(".search-info");
    const input = box?.querySelector(".search-input");
    const clearButton = box?.querySelector("button");
    if (!core || !root || !input || !clearButton || !info) return;

    window.normalizeTag = core.normalizeTag;
    const groups = [...root.querySelectorAll("[data-search-group]")];
    let items = [];
    const index = () => {
      items = [...root.querySelectorAll(".citation")].map(element => {
        let aliases = {};
        try { aliases = JSON.parse(element.dataset.searchAliases || "{}"); } catch {}
        const group = element.closest("[data-search-group]");
        const category = group?.dataset.searchGroup === "journal" ? "期刊 期刊论文 journal" : "会议 会议论文 conference";
        const text = [...element.querySelectorAll(".citation-title,.citation-authors,.citation-details,.citation-description")]
          .map(part => part.textContent).join(" ");
        const authors = element.querySelector(".citation-authors")?.textContent || "";
        const record = core.createRecord({
          text, aliases,
          extra: [category, element.dataset.searchKeywords || "", ...authors.split(",").map(name => name.replace(/\s+/g, ""))].join(" "),
          tags: [...element.querySelectorAll(".tag")].map(tag => tag.textContent)
        });
        return {element, group, record};
      });
    };
    index();

    let timer;
    let composing = false;
    let lastSignature;
    let revision = 0;
    const updateButton = () => {
      clearButton.disabled = !input.value.length;
      const icon = clearButton.querySelector(".icon");
      if (icon) icon.className = input.value.length ? "icon fa-solid fa-xmark" : "icon fa-solid fa-magnifying-glass";
    };
    const cancel = () => {
      clearTimeout(timer);
      root.setAttribute("aria-busy", "false");
    };
    const updateURL = raw => {
      const url = new URL(location.href);
      if (raw.trim()) url.searchParams.set("search", raw);
      else url.searchParams.delete("search");
      if (url.href !== location.href) {
        try { history.replaceState(history.state, "", url); } catch {}
      }
    };
    const updateInfo = (query, count) => {
      info.dataset.empty = String(!query.active);
      if (!query.active) {
        const status = document.createElement("span");
        status.className = "sr-only";
        status.textContent = `已显示全部 ${items.length} 篇论文。`;
        info.replaceChildren(status);
        return;
      }
      const summary = document.createElement("span");
      summary.textContent = `显示 ${count} / ${items.length} 条结果`;
      const reset = document.createElement("a");
      reset.href = "./";
      reset.dataset.searchClear = "";
      reset.textContent = "清除搜索";
      info.replaceChildren(summary, document.createElement("br"), reset);
      if (!count) {
        const tip = document.createElement("span");
        tip.className = "search-empty-tip";
        tip.textContent = "未找到匹配的论文，请减少关键词，或尝试中英文作者名、会议缩写或年份。";
        info.append(document.createElement("br"), tip);
      }
    };
    const highlight = (query, visible) => {
      const current = ++revision;
      if (typeof Mark !== "function") return;
      new Mark(root).unmark({done: () => {
        if (current !== revision || !query.active || !visible.length) return;
        const terms = [...new Set(visible.flatMap(item => core.highlightTerms(item.record, query)))];
        if (!terms.length) return;
        let count = 0;
        new Mark(visible.map(item => item.element.querySelector(".citation-text") || item.element)).mark(terms, {
          separateWordSearch: false,
          acrossElements: true,
          filter: () => count++ < 100
        });
      }});
    };
    const apply = (raw, {fromURL = false, force = false} = {}) => {
      cancel();
      const query = core.parse(raw);
      // Avoid assigning during normal typing: doing so disturbs caret/IME state.
      if ((fromURL || raw !== query.raw) && input.value !== query.raw) input.value = query.raw;
      updateButton();
      if (!fromURL || raw !== query.raw) updateURL(query.raw);
      const signature = JSON.stringify([query.terms, query.tags, query.active]);
      if (!force && signature === lastSignature) return;
      lastSignature = signature;
      const visible = [];
      const groupCounts = new Map(groups.map(group => [group, 0]));
      for (const item of items) {
        const matched = core.matches(item.record, query);
        item.element.style.display = matched ? "" : "none";
        if (matched) {
          visible.push(item);
          groupCounts.set(item.group, (groupCounts.get(item.group) || 0) + 1);
        }
      }
      groups.forEach(group => { group.hidden = !groupCounts.get(group); });
      root.hidden = !visible.length;
      updateInfo(query, visible.length);
      root.querySelectorAll(".tag").forEach(tag => {
        tag.toggleAttribute("data-active", query.tags.includes(core.normalizeTag(tag.textContent)));
      });
      highlight(query, visible);
      document.dispatchEvent(new CustomEvent("sitesearch", {detail: {
        queryLength: query.raw.trim().length, results: visible.length, total: items.length
      }}));
    };
    const queue = () => {
      cancel();
      root.setAttribute("aria-busy", "true");
      timer = setTimeout(() => apply(input.value), 150);
    };
    const clear = () => {
      composing = false;
      input.value = "";
      apply("");
      input.focus({preventScroll:true});
    };
    input.addEventListener("input", event => {
      updateButton();
      if (!composing && !event.isComposing) queue();
    });
    input.addEventListener("compositionstart", () => { composing = true; cancel(); });
    input.addEventListener("compositionend", () => { composing = false; updateButton(); queue(); });
    input.addEventListener("keydown", event => {
      if (composing || event.isComposing || event.keyCode === 229) return;
      if (event.key === "Enter") { event.preventDefault(); apply(input.value); }
      else if (event.key === "Escape") { event.preventDefault(); clear(); }
    });
    input.addEventListener("search", () => { if (!composing) apply(input.value); });
    clearButton.addEventListener("click", clear);
    info.addEventListener("click", event => {
      if (!event.target.closest("[data-search-clear]")) return;
      event.preventDefault();
      clear();
    });
    const fromURL = () => {
      composing = false;
      apply(new URLSearchParams(location.search).get("search") || "", {fromURL:true});
    };
    window.addEventListener("popstate", fromURL);
    window.addEventListener("pageshow", event => { if (event.persisted) fromURL(); });
    window.addEventListener("tagsfetched", () => { index(); lastSignature = null; fromURL(); });
    input.disabled = false;
    fromURL();
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initializeSearch, {once:true});
  else initializeSearch();
}

