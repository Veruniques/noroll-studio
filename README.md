# noroll-studio

Studio site for NO ROLL studio: AI cinematic production on the left, visual design on the right.
Layout modelled on laxspace.co — a 3D tape roll printed with the work follows the cursor around a grey floor
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

## The wolf intro

On the first visit of a browser session (landing on the home view) a wolf runs the roll on a leash
and writes "Welcome" in tape, then fades out. `Space` or `Esc` skips it. The route is the `WELCOME`
point list in `assets/js/roll.js`; the model is `assets/models/dog.glb` (any glTF with a `Run`
animation can replace it).

Model credits: Fox by PixelMannen (CC0), rigging & animation by tomkranis (CC BY 4.0),
glTF conversion by @AsoboStudio and @scurest (CC BY 4.0), via KhronosGroup/glTF-Sample-Assets.
Recoloured as a dark wolf.

## Controls (home)

Move the cursor (or drag a finger) and the roll follows it, laying tape. Drag to orbit the camera,
scroll to zoom. `Space` rewinds the tape back into the roll, `Esc` closes a page.

## Run locally

```
python3 -m http.server 8000
```

## Hosting

GitHub Pages from `main` (root). All paths are relative, so it works on `veruniques.github.io/noroll-studio/` or a custom domain.
