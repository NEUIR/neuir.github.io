/*
  manages light/dark mode.
*/

{
  // immediately load saved (or default) mode before page renders
  let savedMode;
  try { savedMode = window.localStorage.getItem("dark-mode"); } catch {}
  document.documentElement.dataset.dark = savedMode === "true" ? "true" : "false";

  const onLoad = () => {
    // update toggle button to match loaded mode
    const toggle = document.querySelector(".dark-toggle");
    if (toggle) toggle.checked = document.documentElement.dataset.dark === "true";
  };

  // after page loads
  document.addEventListener("DOMContentLoaded", onLoad);

  // when user toggles mode button
  window.onDarkToggleChange = (event) => {
    const value = event.target.checked;
    document.documentElement.dataset.dark = value;
    try { window.localStorage.setItem("dark-mode", value); } catch {}
    document.dispatchEvent(new CustomEvent("themechange", { detail: { theme: value ? "dark" : "light" } }));
  };
}
