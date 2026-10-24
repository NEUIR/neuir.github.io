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
