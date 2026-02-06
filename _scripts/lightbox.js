// lightweight lightbox using native <dialog>
{
  let dialog;
  let img;

  const onLoad = () => {
    // create dialog element
    dialog = document.createElement("dialog");
    dialog.className = "lightbox";
    dialog.innerHTML = '<img src="" alt="放大图片">';
    document.body.appendChild(dialog);
    img = dialog.querySelector("img");

    // close on backdrop click
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) dialog.close();
    });

    // close on image click too
    img.addEventListener("click", () => dialog.close());
  };

  // open lightbox on citation image click
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-lightbox]");
    if (!trigger || !dialog) return;
    e.preventDefault();
    img.src = trigger.dataset.lightbox;
    dialog.showModal();
  });

  // also support Enter/Space key for accessibility
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const trigger = e.target.closest("[data-lightbox]");
    if (!trigger || !dialog) return;
    e.preventDefault();
    img.src = trigger.dataset.lightbox;
    dialog.showModal();
  });

  // after page loads
  window.addEventListener("load", onLoad);
}
