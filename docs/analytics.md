# NEUIR analytics maintenance

## Resources

- Account: `289461424`.
- Dedicated property: `560472111`, **NEUIR — neuir.github.io**.
- Stream: `16189096620`, **NEUIR official website**, `https://neuir.github.io`.
- Measurement ID: `G-MSPTXQ8JYC`, configured once in `_config.yaml`.
- Old property: `411664319`, measurement ID `G-SFZ3SY2151`; historical data retained. Other sites were sharing this old ID.
- [Dedicated DebugView](https://analytics.google.com/analytics/web/#/a289461424p560472111/admin/debugview/overview).

The replacement ID is effective for real visitors after the source changes are deployed. Creating a property or seeing local test events does not prove that production has switched over.

## Collection

The site loads the asynchronous Google tag only for a production build on the allowlisted hostname. DNT and GPC disable collection. Normal localhost previews never load Google. Local `?analytics_debug=1` records at most 200 sanitized events, without sending them. On the production hostname the same flag also marks Google events as debug traffic.

`send_page_view:false` disables the tag's automatic initial event; the site sends one explicit `page_view`. In the stream's enhanced measurement settings, browser-history page changes and automatic site search are disabled. Keep the other automatic measurements enabled. Search uses `replaceState`; it must not create additional page views or send original search terms.

| Custom event | Meaning / useful parameters |
| --- | --- |
| `link_click` | Navigation, publication, project, member-homepage and footer links; `context`, destination domain/path, outbound/download flags |
| `contact_click` | Email or telephone action, with method and context; no address or phone number |
| `theme_change`, `navigation_toggle` | Theme or mobile menu changes |
| `image_open` | Original image path when a preview opens |
| `site_search` | Debounced final query length, result count and total count; no query text |
| `search_clear` | Clearing an active query; not emitted during initial empty search |
| `scroll_depth` | Once per 25/50/75/90/100% milestone after scrolling; short pages do not count as scrolled |
| `section_view` | Once when a section heading becomes visible |
| `reading_time` | Visible-page time milestones of 15/30/60/120/300 seconds |
| `page_engagement` | Accumulated visible time and maximum visible depth on page exit, including bfcache handling |
| `web_vitals` | Local official web-vitals library reports CLS, INP, LCP, FCP and TTFB with value, rating and navigation type |
| `site_error` | At most five resource, JavaScript or promise errors per page; excludes message/stack contents |

URLs sent by custom events omit query strings and fragments. Email links do not send their addresses. Google Signals and ad personalization are disabled in the code. Automatic enhanced events and custom events have different names: do not add `click` to `link_click`, or `scroll` to `scroll_depth`, as if they were independent unique actions.

## Reporting fields registered in GA4

Event-scoped dimensions: **Interaction context** (`context`), **Content section** (`section_id`), **Performance metric** (`metric_name`), **Performance rating** (`metric_rating`).

Custom metrics: **Web vital value** (`metric_value`, standard) and **Active reading seconds** (`active_seconds`, standard). Filter vital reports by metric name: CLS is unitless; the other values are milliseconds. Filter reading-time totals to `page_engagement`; `reading_time` contains cumulative milestones and must not be summed as additional total time. Newly registered fields can take time to appear in ordinary reports.

## Release verification

1. Build production and run `npm test`, `bundle exec ruby scripts/check_site.rb`, and `node --check _site/assets/js/site.js`.
2. Verify local debug events, one page view, search/clear, links, image preview, menu, theme and scrolling. Normal local browsing must have no Google requests.
3. After an authorized deployment, open the live site with `?analytics_debug=1`; confirm the new ID appears once, collect requests succeed, and DebugView receives the events.
4. Search on the live page; check that original query text is absent from collected payloads and no new `page_view` is created by changing the query.
5. Confirm ordinary live traffic in the new property. Respect browser privacy settings and blockers; absence of collection under those conditions is expected.

For the initial 2026-10-23 test only, development tools temporarily allowed a local tab to send anonymous debug events to the new property. The backend visibly received one `page_view`, search/clear, section views, image opening, reading time, page engagement and all five vital names. Reloading the tab removed that temporary change, and normal local no-collection behavior was checked again. There is no localhost opt-in backdoor in the shipped code.

References: [Google page-view configuration](https://developers.google.com/analytics/devguides/collection/ga4/views), [PII collection guidance](https://support.google.com/analytics/answer/6366371), [official web-vitals library](https://github.com/GoogleChrome/web-vitals).
