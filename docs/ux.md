**UX Notes & Design Decisions**

- Visual hierarchy: strong typographic masthead, high-contrast key indicators, and newspaper-style cards for credibility and scanability.
- Color system: use deep greens for positive fiscal items, rust/gold for alerts and emphasis. Keep background neutral paper tone.
- Layout: single-column for mobile, 2-3 column grid for larger screens. Keep important interactions above the fold (debt clock, budget overview).
- Interaction patterns:
  - Charts: click segments to drill down; emit events so multiple panels can synchronize.
  - Bill timeline: click nodes to highlight bill details in list.
  - Filters: client-side filters with visual counts and small summary badges for quick decisions.
- Accessibility:
  - Ensure all interactive controls are keyboard focusable and have aria-labels when needed.
  - Provide high-contrast mode (toggle) and large-text support.
  - Charts must include accessible data tables or aria-live descriptions for screen readers.
- Performance:
  - Defer heavy visualizations until user interaction (lazy-load D3/chart init on first view).
  - Serve processed JSON artifacts from CDN with long cache lifetime; use ETag and conditional requests for updates.

Roadmap / Expansion

- Add an annotations layer for major policy changes on timeseries charts.
- Add county map choropleth to show per-capita spending and vote weighting.
- Build a cemented ETL pipeline to normalize OFM/LEAP/Census datasets and publish sanitized JSON to `public/`.
- Add user accounts (read-only) for saved queries and reports, if required.
