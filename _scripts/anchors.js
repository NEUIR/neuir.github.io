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
