# noroll-studio

Studio site for NO ROLL studio: AI cinematic production on the left, visual design on the right.
Layout modelled on laxspace.co — a 3D roll of the work on a grey floor, a works column in the middle,
the roll "unrolls" into a film strip on the side you open.

Plain HTML/CSS/JS (ES modules), no build step. Three.js loads from jsDelivr.

## Edit content

Everything lives in `assets/js/data.js`:

- `cinematic` — Vimeo videos (id, title, client, tags, text)
- `design` — visual work (cover + `images[]` stacked in the detail view)
- `info` — the "Studio Info" page: intro, services, tools, portrait
- `STUDIO` — name, email, LinkedIn

Images go in `assets/img/work/` (JPG, ~1600 px wide).

## URLs

- `/?view=cinematic` / `/?view=design` — works list
- `/?view=cinematic&work=monoprix` — a single work
- `/?view=design&work=studio` — studio info

## Controls (home)

Drag the roll to spin it, click it for points, `Tab` toggles orbit, `Space` rewinds, `Esc` closes.

## Run locally

```
python3 -m http.server 8000
```

## Hosting

GitHub Pages from `main` (root). All paths are relative, so it works on `veruniques.github.io/noroll-studio/` or a custom domain.
