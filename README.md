# noroll-studio

Portfolio of Veronika Dominiková, multidisciplinary creative. NO ROLL is the method / label.
Layout modelled on laxspace.co — a 3D tape roll printed with the work follows the cursor around an orange (#FF5700) floor
and lays the tape down frame by frame. A works column opens in the middle, with a film strip on the side you open.

Plain HTML/CSS/JS (ES modules). Three.js loads from jsDelivr. One tiny build step (Node, no dependencies)
pre-renders a static page per case for SEO:

```
node scripts/build.mjs
```

Run it after every change to `assets/js/data.js`, `assets/js/render.js` or `src/template.html`, then commit the
generated files (`index.html`, `cinematic/`, `about/`, `work/`, `404.html`, `sitemap.xml`, `robots.txt`).
Edit the page shell in `src/template.html`, never in the generated `index.html`.

## Edit content

Everything lives in `assets/js/data.js`:

- `cinematic` — Vimeo videos (id, title, client, tags, text)
- `design` — visual work (cover + `images[]` stacked in the detail view)
- `info` — the "Studio Info" page: intro, services, tools, portrait
- `STUDIO` — name, email, LinkedIn

Images go in `assets/img/work/` (JPG, ~1600 px wide).

## URLs

- `/cinematic/` — works list
- `/work/<id>/` — a single case (e.g. `/work/monoprix/`), a real static page with its own title, description and VideoObject data
- `/about/` — About me
- old `?view=cinematic&work=…` links and the old slugs (`rb-cinema`, `rb-hybrid`, `fameplay-voice`, `kofola`) still work and redirect
- `?view=design` — the design works, no longer linked from the navigation

## SEO

- Canonical address: `STUDIO.url` in `data.js`. Change it when the site moves to its own domain and rebuild.
- Every page: unique title + description, canonical, Open Graph / Twitter card (case pages use the Vimeo thumbnail),
  JSON-LD (Person, WebSite, VideoObject per case, BreadcrumbList, ProfilePage).
- `sitemap.xml` lists all pages. Submit it in Google Search Console.

## Fire and the fire dog

CINEMATIC and ABOUT are chrome lettering (Michroma with a chrome gradient).
Clicking CINEMATIC on the home view sets the title on fire; it keeps burning while you're in Cinematic.

Opening a case from the site: the case arrives folded under a tab. The chrome fire dog
(`assets/img/dog-run.webp`, keyed from a green-screen render, 86 frames, plays once) runs in from the right,
sits on the tab, raises a paw and slams it down; the case unfolds on the slam. Any scroll, key or tap skips it.
Direct visits (e.g. from Google) and reduced motion skip the dog and show the case open.
Timings live in `DOG` at the top of `assets/js/fire.js`.

## Controls (home)

Move the cursor (or drag a finger) and the roll follows it, laying tape. Orbit is always on: drag to
look around, scroll to zoom. `Space` rewinds the tape back into the roll, `Esc` closes a page.

## Run locally

```
python3 -m http.server 8000
```

## Hosting

GitHub Pages from `main` (root). All paths are relative, so it works on `veruniques.github.io/noroll-studio/` or a custom domain.
