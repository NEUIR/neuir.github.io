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
