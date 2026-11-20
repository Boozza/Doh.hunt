# D'oh! Hunt Planner (Netlify)

- `site/` is what Netlify publishes (no build step). Live at dohinvaders.netlify.app.
- Live data (status.json, news.json) is read at runtime from the public repo Boozza/Doh-data (refreshed daily, no Netlify deploy needed). `site/data/` is only a fallback.
- `src/` holds the sources. Rebuild `site/index.html` with `python3 src/build.py`.
