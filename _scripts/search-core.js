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
