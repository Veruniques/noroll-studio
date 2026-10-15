# noroll-studio

Studio site for NO ROLL studio: AI cinematic production on the left, visual design on the right.
Layout modelled on laxspace.co — a 3D tape roll printed with the work follows the cursor around an orange (#FF5700) floor
and lays the tape down frame by frame. A works column opens in the middle, with a film strip on the side you open.

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

## The fire dog

The CINEMATIC and DESIGN titles are chrome lettering (Unbounded 800 with a chrome gradient).
Clicking CINEMATIC on the home view sends the fire dog (`assets/img/dog-fire.webp`, cut out of
its black background) in from the left: it gallops, leaps onto the title and sets it on fire, then
the Cinematic works open. The title keeps burning while you're in Cinematic. Clicking DESIGN just
opens the Design works. Code: `assets/js/fire.js`. With reduced motion the title only ignites.

## Controls (home)

Move the cursor (or drag a finger) and the roll follows it, laying tape. Orbit is always on: drag to
look around, scroll to zoom. `Space` rewinds the tape back into the roll, `Esc` closes a page.

## Run locally

```
python3 -m http.server 8000
```

## Hosting

GitHub Pages from `main` (root). All paths are relative, so it works on `veruniques.github.io/noroll-studio/` or a custom domain.
