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
