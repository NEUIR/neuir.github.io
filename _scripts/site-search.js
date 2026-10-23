/*
  for site search component. searches site/domain via google.
*/

{
  // when user submits site search form/box
  window.onSiteSearchSubmit = (event) => {
    event.preventDefault();
    const query = event.target.elements.q.value.trim();
    if (!query) return;
    const site = document.querySelector('link[rel="canonical"]')?.href || location.origin;
    const url = new URL("https://www.google.com/search");
    url.searchParams.set("q", `site:${new URL(site).hostname} ${query}`);
    window.location.assign(url.href);
  };
}
