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
