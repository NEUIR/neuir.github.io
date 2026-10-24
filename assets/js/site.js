

/*
  manages light/dark mode.
*/

{
  const onLoad = () => {
    // update toggle button to match loaded mode
    const toggle = document.querySelector(".dark-toggle");
    if (toggle) toggle.checked = document.documentElement.dataset.dark === "true";
  };

  // after page loads
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", onLoad, { once: true });
  else onLoad();

  // when user toggles mode button
  window.onDarkToggleChange = (event) => {
    const value = event.target.checked;
    document.documentElement.dataset.dark = value;
    try { window.localStorage.setItem("dark-mode", value); } catch {}
    document.dispatchEvent(new CustomEvent("themechange", { detail: { theme: value ? "dark" : "light" } }));
  };
}


// GA4 plus bounded interaction and field-performance measurement.
// Local previews never load Google or send traffic. ?analytics_debug=1 keeps
// a small, sanitized event log locally for QA without changing that rule.
{
  const node = document.getElementById("site-analytics-config");
  let config;
  try { config = JSON.parse(node?.textContent || "null"); } catch {}
  if (config?.measurementId) {
    const debug = new URLSearchParams(location.search).get("analytics_debug") === "1";
    const enabled = config.production && Array.isArray(config.hosts) && config.hosts.includes(location.hostname)
      && navigator.doNotTrack !== "1" && navigator.globalPrivacyControl !== true;
    const cleanURL = (value) => {
      try {
        const url = new URL(value, location.href);
        if (!/^https?:$/.test(url.protocol)) return "";
        return url.origin + url.pathname.replace(/[^/\s]+@[^/\s]+/g, "redacted");
      } catch { return ""; }
    };
    const events = [];
    const locationURL = cleanURL(location.href);
    const emit = (name, params = {}) => {
      const data = { page_location: locationURL, site_id: "neuir", ...params };
      if (debug) {
        events.push({ name, params: data });
        if (events.length > 200) events.shift();
      }
      if (enabled) window.gtag("event", name, { ...data, ...(debug ? {debug_mode:true} : {}), transport_type: "beacon" });
    };
    window.siteAnalytics = { enabled, debug, events };

    if (enabled) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
      window.gtag("js", new Date());
      window.gtag("config", config.measurementId, {
        send_page_view: false,
        page_location: locationURL,
        page_referrer: cleanURL(document.referrer),
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        ...(debug ? { debug_mode: true } : {})
      });
      const tag = document.createElement("script");
      tag.async = true;
      tag.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(config.measurementId)}`;
      document.head.appendChild(tag);
    }

    const initialize = () => {
      emit("page_view", { page_title: document.title });
      if (!enabled && !debug) return;

      document.addEventListener("click", (event) => {
        const link = event.target.closest("a[href]");
        if (!link) return;
        if (link.dataset?.searchClear !== undefined) return;
        const href = link.getAttribute("href");
        const context = link.closest("nav") ? "navigation"
          : link.closest(".portrait") ? "member_homepage"
          : link.closest(".citation") ? "publication"
          : link.closest(".project-entry") ? "project"
          : link.closest("footer") ? "footer" : "content";
        if (/^mailto:/i.test(href)) return emit("contact_click", { contact_method: "email", context });
        if (/^tel:/i.test(href)) return emit("contact_click", { contact_method: "phone", context });
        const sanitized = cleanURL(link.href);
        if (!sanitized) return;
        const target = new URL(sanitized);
        emit("link_click", {
          context,
          link_domain: target.hostname,
          link_path: target.pathname,
          outbound: target.origin !== location.origin,
          same_page: target.pathname === location.pathname && target.origin === location.origin,
          download: /\.(pdf|zip|pptx?|docx?|xlsx?|csv|tar|gz)$/i.test(target.pathname)
        });
      });

      document.addEventListener("themechange", event => emit("theme_change", event.detail));
      document.addEventListener("navigationtoggle", event => emit("navigation_toggle", event.detail));
      document.addEventListener("imageopen", event => emit("image_open", { image_path: event.detail.imagePath }));
      let searched = false;
      document.addEventListener("sitesearch", event => {
        const { queryLength, results, total } = event.detail;
        if (queryLength) {
          searched = true;
          emit("site_search", { query_length: queryLength, result_count: results, total_count: total });
        } else if (searched) {
          searched = false;
          emit("search_clear");
        }
      });

      const milestones = new Set();
      let maxDepth = 0;
      let scrollPending = false;
      const measureScroll = () => {
        scrollPending = false;
        const height = document.documentElement.scrollHeight;
        maxDepth = Math.max(maxDepth, Math.min(100, Math.round((scrollY + innerHeight) / height * 100)));
        if (scrollY <= 0 || height <= innerHeight) return;
        for (const depth of [25, 50, 75, 90, 100]) {
          if (maxDepth >= depth && !milestones.has(depth)) {
            milestones.add(depth);
            emit("scroll_depth", { percent_scrolled: depth });
          }
        }
      };
      addEventListener("scroll", () => {
        if (!scrollPending) { scrollPending = true; requestAnimationFrame(measureScroll); }
      }, { passive: true });
      measureScroll();

      if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(entries => {
          for (const entry of entries) if (entry.isIntersecting) {
            emit("section_view", { section_id: entry.target.id || entry.target.textContent.trim().slice(0, 80) });
            observer.unobserve(entry.target);
          }
        }, { threshold: 1 });
        document.querySelectorAll("main h2").forEach(heading => observer.observe(heading));
      }

      let activeMs = 0;
      let activeSince = document.hidden ? null : performance.now();
      let timer;
      let nextMilestone = 0;
      const readingMilestones = [15, 30, 60, 120, 300];
      const activeTime = () => activeMs + (activeSince === null ? 0 : performance.now() - activeSince);
      const scheduleReading = () => {
        clearTimeout(timer);
        if (activeSince === null || nextMilestone >= readingMilestones.length) return;
        const seconds = readingMilestones[nextMilestone];
        timer = setTimeout(() => {
          emit("reading_time", { active_seconds: seconds, percent_scrolled: maxDepth });
          nextMilestone++;
          scheduleReading();
        }, Math.max(0, seconds * 1000 - activeTime()));
      };
      const flushReading = () => {
        if (activeSince !== null) activeMs += performance.now() - activeSince;
        activeSince = null;
        clearTimeout(timer);
      };
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) flushReading();
        else { activeSince = performance.now(); scheduleReading(); }
      });
      addEventListener("pagehide", () => {
        flushReading();
        emit("page_engagement", { active_seconds: Math.round(activeMs / 1000), percent_scrolled: maxDepth });
      });
      addEventListener("pageshow", event => {
        if (event.persisted) { activeSince = document.hidden ? null : performance.now(); scheduleReading(); }
      });
      scheduleReading();

      const vitals = document.createElement("script");
      vitals.src = config.vitalsPath;
      vitals.async = true;
      vitals.onload = () => {
        const report = metric => emit("web_vitals", {
          metric_name: metric.name,
          metric_value: Number(metric.value.toFixed(4)),
          metric_delta: Number(metric.delta.toFixed(4)),
          metric_id: metric.id,
          metric_rating: metric.rating,
          navigation_type: metric.navigationType
        });
        for (const name of ["onCLS", "onINP", "onLCP", "onFCP", "onTTFB"]) window.webVitals?.[name]?.(report);
      };
      document.head.appendChild(vitals);
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
    else initialize();

    if (enabled || debug) {
      let errorCount = 0;
      addEventListener("error", event => {
        if (errorCount++ >= 5) return;
        emit("site_error", {
          error_kind: event.target?.tagName ? "resource" : "javascript",
          source_url: cleanURL(event.filename || event.target?.src || event.target?.href || ""),
          line_number: event.lineno || 0
        });
      }, true);
      addEventListener("unhandledrejection", () => {
        if (errorCount++ < 5) emit("site_error", { error_kind: "promise" });
      });
    }
  }
}


/*
  creates link next to each heading that links to that section.
*/

{
  const onLoad = () => {
    // for each heading
    const headings = document.querySelectorAll(
      "h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]"
    );
    for (const heading of headings) {
      // create anchor link
      if (heading.querySelector(".anchor")) continue;
      const link = document.createElement("a");
      link.classList.add("icon", "fa-solid", "fa-link", "anchor");
      link.href = "#" + heading.id;
      link.setAttribute(
        "aria-label",
        `跳转到“${heading.textContent.trim()}”小节`,
      );
      heading.append(link);

      // if first heading in the section, move id to parent section
      if (heading.matches("section > :first-child")) {
        heading.parentElement.id = heading.id;
        heading.removeAttribute("id");
      }
    }
  };

  // scroll to target of url hash
  const scrollToTarget = () => {
    let id;
    try {
      id = decodeURIComponent(window.location.hash.slice(1));
    } catch {
      return;
    }
    const target = document.getElementById(id);

    if (!target) return;
    const header = document.querySelector("header");
    const offset = header && getComputedStyle(header).position === "sticky"
      && getComputedStyle(header).top !== "auto"
      ? header.clientHeight : 0;
    window.scrollTo({
      top: target.getBoundingClientRect().top + window.scrollY - offset,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  };

  // after page loads
  document.addEventListener("DOMContentLoaded", onLoad);
  window.addEventListener("load", scrollToTarget);
  window.addEventListener("tagsfetched", scrollToTarget);

  // when hash nav happens
  window.addEventListener("hashchange", scrollToTarget);
}


// Native modal image viewer: keyboard, backdrop, and focus restoration.
{
  document.addEventListener("DOMContentLoaded", () => {
    if (!document.querySelector("[data-lightbox]")) return;
    const dialog = document.createElement("dialog");
    dialog.className = "lightbox";
    dialog.setAttribute("aria-label", "图片预览");
    dialog.innerHTML = '<button type="button" class="lightbox-close" aria-label="关闭图片预览" autofocus>×</button><img alt="图片预览">';
    document.body.appendChild(dialog);
    const image = dialog.querySelector("img");
    let opener;
    const open = (trigger) => {
      const source = trigger.dataset.lightbox;
      if (!source || dialog.open) return;
      opener = trigger;
      image.src = source;
      image.alt = trigger.querySelector("img")?.alt || "图片预览";
      dialog.showModal();
      document.dispatchEvent(new CustomEvent("imageopen", {
        detail: { imagePath: new URL(source, location.href).pathname }
      }));
    };
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog || event.target === image || event.target.closest(".lightbox-close")) dialog.close();
    });
    dialog.addEventListener("close", () => {
      image.removeAttribute("src");
      opener?.focus({ preventScroll: true });
    });
    document.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-lightbox]");
      if (!trigger) return;
      event.preventDefault();
      open(trigger);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const trigger = event.target.closest("[data-lightbox]");
      if (!trigger) return;
      event.preventDefault();
      open(trigger);
    });
  });
}


{
  document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.querySelector(".nav-toggle");
    const header = document.querySelector("header");
    if (!toggle || !header) return;
    const setExpanded = expanded => {
      if (toggle.getAttribute("aria-expanded") === String(expanded)) return;
      toggle.setAttribute("aria-expanded", String(expanded));
      document.dispatchEvent(new CustomEvent("navigationtoggle", { detail: { expanded } }));
    };
    const close = () => setExpanded(false);
    toggle.addEventListener("click", () => setExpanded(toggle.getAttribute("aria-expanded") !== "true"));
    document.addEventListener("click", (event) => {
      if (!header.contains(event.target) || event.target.closest("nav a")) close();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        close();
        toggle.focus();
      }
    });
  });
}


/*
  put a wrapper around each table to allow scrolling.
*/

{
  const onLoad = () => {
    // for each top-level table
    const tables = document.querySelectorAll("table:not(table table)");
    for (const table of tables) {
      // create wrapper with scroll
      const wrapper = document.createElement("div");
      wrapper.style.overflowX = "auto";
      wrapper.tabIndex = 0;
      wrapper.setAttribute("role", "region");
      wrapper.setAttribute("aria-label", "可横向滚动的表格");

      // undo css force-text-wrap
      table.style.overflowWrap = "normal";

      // add wrapper around table
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    }
  };

  // after page loads
  document.addEventListener("DOMContentLoaded", onLoad);
}


/* 
  shows a popup of text on hover/focus of any element with the data-tooltip
  attribute.
*/

{
  const onLoad = () => {
    // make sure Tippy library available
    if (typeof tippy === "undefined") return;

    // get elements with non-empty tooltips
    const elements = [...document.querySelectorAll("[data-tooltip]")].filter(
      (element) => element.dataset.tooltip.trim() && !element._tippy
    );

    // add tooltip to elements
    tippy(elements, {
      content: (element) => element.dataset.tooltip.trim(),
      delay: [200, 0],
      offset: [0, 20],
      allowHTML: false,
      interactive: true,
      appendTo: () => document.body,
      aria: {
        content: "describedby",
        expanded: null,
      },
      onShow: ({ reference, popper }) => {
        const dark = reference.closest("[data-dark]")?.dataset.dark;
        if (dark === "false") popper.dataset.dark = true;
        if (dark === "true") popper.dataset.dark = false;
      },
      // onHide: () => false, // debug
    });
  };

  // after page loads
  document.addEventListener("DOMContentLoaded", onLoad);
  // after tags load
  window.addEventListener("tagsfetched", onLoad);
}


// Keep project resources usable when a remote badge service is unavailable.
{
  const fallback = image => {
    if (image instanceof HTMLImageElement) image.closest('.project-shield')?.classList.add('is-unavailable');
  };
  document.addEventListener('error', event => fallback(event.target), true);
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.project-shield img').forEach(image => {
      if (image.complete && !image.naturalWidth) fallback(image);
    });
  });
}


