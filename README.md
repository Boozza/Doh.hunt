# D'oh! Hunt Planner (Netlify)

- `site/` is what Netlify publishes (no build step). Live at dohinvaders.netlify.app.
- `site/data/status.json` and `site/data/news.json` are refreshed daily by the Invader daily-watch task; the app loads them on open.
- `src/` holds the sources. Rebuild `site/index.html` with `python3 src/build.py`.
