# NO ROLL studio site — project notes

Handoff doc for picking this up later. Status as of 16 Oct 2026.

## What this is

The studio site for **NO ROLL studio**: AI cinematic production + visual design.
Separate from `noroll.studio`, which stays Veru's personal portfolio (repo `Veruniques/no-roll-studio`).

- **Repo:** `github.com/Veruniques/noroll-studio`, branch `main`
- **Stack:** plain HTML / CSS / JS (ES modules), no build step. Three.js 0.160 from jsDelivr.
- **Layout reference:** laxspace.co (3D tape roll, works column in the middle). Cinematic on the left, Design on the right.
- **Content source:** the old noroll.studio, **without** Kiwi.com, PFLB and Keboola (no case studies, no CV, no Kiwi references).

## Status

**Done**
- Orange (`#FF5700`) home with a 3D roll of tape printed with the work. It follows the mouse and lays the tape on the floor.
- Orbit always on (drag to look around, scroll to zoom). `Space` rewinds the tape.
- CINEMATIC / DESIGN titles in chrome lettering at the bottom.
- Clicking **CINEMATIC**: the fire dog gallops in from the left, leaps onto the title and sets it on fire, then the Cinematic works open. The title keeps burning while you're in Cinematic.
- Clicking **DESIGN**: opens the Design works, no animation.
- Works column (list → detail), film strip on the side of the open section, Studio Info page, mobile layout.

**Not live yet**
- The repo is **private** and GitHub Pages is **off**. To publish: make the repo public (or use a paid GitHub plan), then go to Settings → Pages → Deploy from branch → `main` / root. It will be at `veruniques.github.io/noroll-studio/`.
- No custom domain set. noroll.studio stays the personal site; pick a new domain for the studio and add a `CNAME` file when ready.

**Open items / ideas**
- [ ] **Contact email** `hello@noroll.studio` is a placeholder carried over from the old site. Confirm it in `assets/js/data.js` → `STUDIO.email`.
- [ ] **Tagline** "AI cinematic production + visual design. Made right on the first roll." is in `index.html` (`.hero`). Change it if it's not dry enough.
- [ ] **Fire dog run:** it's one still image (a leap pose) moved with a bounce, so the legs don't move. For a real gallop, get a short side-view video of this dog running on black. Key it into a sprite sheet (see "How the dog asset was made").
- [ ] Watch the dog + fire at real speed in a normal browser. It was only checked in a slow headless browser. Tune timings in `assets/js/fire.js` (below).
- [ ] Vimeo thumbnails load live in the browser. They show as dark "▶ title" frames until they arrive or if Vimeo is blocked.

## Files

```
index.html              page shell: logo, hero line, HUD (Rewind), Now Playing, bottom titles, works column
assets/css/style.css    all styles; colour tokens at the top (:root)
assets/js/data.js       ALL CONTENT — edit text, videos, images here
assets/js/app.js        UI: works list/detail, routing, film strips, Vimeo thumbs, title click → dog
assets/js/roll.js       the 3D scene (Three.js): roll, tape on the floor, orbit, rewind
assets/js/fire.js       the fire dog animation + flames on the title
assets/img/dog-fire.webp  the chrome fire dog, background removed (900×781, faces right)
assets/img/work/        design visuals (Fameplay, Kurník Šopa, Beyond PEAQ), ~1600 px wide JPGs
assets/img/portrait-*.jpg  portraits (portrait-1 is printed on the tape, portrait-3 on Studio Info)
assets/img/og.jpg       social share image
.nojekyll               tells GitHub Pages to serve files as-is
```

## Editing content (`assets/js/data.js`)

- `STUDIO` — name, tagline, email, LinkedIn, director.
- `cinematic[]` — the 6 Vimeo spots: `id`, `title`, `client`, `tags`, `vimeo` (video ID), `text`.
  All six spread `...CVC`, which adds "Produced for: Czech Video Center (Fameplay)" and the rights notice
  "Produced for Czech Video Center (Fameplay) as a freelancer. All rights belong to Czech Video Center a.s."
  on the work page. Remove `...CVC` from an item for work that is fully NO ROLL's.
  Also per work: `format` (shown as Format), `idea` (shown as "Idea", replaces About when set), `role[]` (shown as "My role" list), `credits` (line under the role list), `result` (shown as "Result"), `tools[]` (shown as chips).
  Empty `role` / `tools` arrays hide that section.
  Currently: Raiffeisenbank Cinema Spot, Monoprix, Raiffeisenbank Hybrid, Fameplay, PPAS, Kofola — Phteven.
- `design[]` — visual work: `id`, `title`, `client`, `tags`, `cover`, `text`, `images[]` (stacked full-width on the detail page).
  Currently: Fameplay, Kurník Šopa, Beyond PEAQ.
- `info` — the Studio Info page: `intro[]` paragraphs, `services[]`, `tools[]`, `portrait`.

The frames printed on the roll/tape are set in `app.js` → `designFrames` + `rollCards` (cinematic and design alternate).

## URLs

| URL | Shows |
|---|---|
| `/` | home: roll + titles |
| `/?view=cinematic` | Cinematic works list |
| `/?view=design` | Design works list |
| `/?view=cinematic&work=monoprix` | one work (use the `id` from data.js) |
| `/?view=design&work=studio` | Studio Info |

`Esc` goes back (detail → list → home). The title in the column ("Works _ Cinematic.") switches sections.

## Look & feel

- **Colours** (`style.css` `:root`): page `--bg: #ff5700`, ink `#111`, works rows `#cdcdcd` / hover `#2e2e2e`, column black, dots `--cine: #e2402f` / `--design: #7a4cff`. The 3D floor colour is `BG` at the top of `roll.js` (keep both in sync).
- **Fonts:** Albert Sans for everything (Google Fonts). Unbounded 800 for the chrome CINEMATIC / DESIGN titles.
- **Chrome titles:** `.side-label__text` in `style.css`: a metal gradient clipped to the text. `.is-burning` is the red-hot version used while on fire.
- **Layout:** works column `--col-left: 28.2vw`, `--col-w: 43.6vw`; on screens under 820 px the column goes full width.

## The 3D roll (`assets/js/roll.js`)

- Tape texture = one canvas with all frames (`makeTape`), used on the roll and on the floor ribbon. Roll circumference = one full set of frames.
- Constants at the top: `W` tape width 1.6, `R` roll radius 2.16, `DS` sample spacing, `MAX` 6000 samples kept on the floor.
- Camera: `CAM_HOME` (0, 16, 14.5) looking at `LOOK`. OrbitControls always on, no panning, distance 10–60.
- Movement: the roll steers toward the floor point under the cursor (turn rate limited so the tape never folds). Samples are added every `DS` and become the ribbon.
- Rewind (`Space` or the HUD button): pops samples back to the start, label shows "Rewinding…".
- The scene fades out and stops rendering while a works column is open.

## The fire dog (`assets/js/fire.js`)

Wired in `app.js` click handler: only `.side-label--left` on the home view runs it, then `go('cinematic')`.
`extinguish()` runs whenever the view isn't Cinematic.

Timeline (all in `runDogOnto`):
1. **Run** `RUN = 900` ms: from off-screen left (`start`, 42 % down the screen) to the take-off point, with a bound every ~300 ms.
2. **Leap** `LEAP = 520` ms: arc onto the title (`land` = over the left part of CINEMATIC, paws on the letter tops).
3. **Land:** squash, `ignite(title)`.
4. **Hold** `wait(900)`, then the dog fades out and the Cinematic works open.

Size: `dogH = fontSize × 3.1` (min 110 px, max 30 % of screen height).

Flames (`ignite`): a canvas over the title. Particles spawn from the title's own letter shapes, mostly the top 42 %, and rise as tongues. Colours run white-hot → yellow → orange → deep red so they show on orange. Rate: burst `1100/s` for 0.5 s, then `520/s`. Opacity `0.4`.

With "reduce motion" turned on in the OS, there is no dog: the title just ignites and the page opens.

## How assets were made (to redo or replace)

- **Fire dog cut-out:** the original image (`dog on black`) was run through `rembg` with the `isnet-general-use` model. It was cropped to its bounds, resized to 900 px wide and saved as WebP (quality 88).
- **A future running-dog video:** take a side view on black and find one stride that loops (compare frames). Key out the black with a soft threshold on brightness, keeping the largest shape and dropping floor reflections. Lay out the frames as a sprite sheet (WebP) and step through frames like the earlier wolf version did (git history: commit `47b1c24`).

## History (git)

| Commit | What |
|---|---|
| `4ce7f76` | First version: 3D roll home, works column, studio info |
| `5f066a7` | Laxspace mechanics: roll follows the mouse, lays tape, rewind |
| `f96b8d6` → `d14d00f` | Wolf intro experiments (leash / push, "Welcome" → "HI"). **Dropped.** |
| `d580397` | Current: orange, chrome titles, fire dog on Cinematic, no intro |

To look at or restore the wolf intro: `git show d14d00f:assets/js/roll.js`.

## Run locally

```
cd noroll-studio
python3 -m http.server 8000
```

Open http://localhost:8000. It needs internet for Three.js, Google Fonts and Vimeo.

## Rights / credits to keep in mind

- Cinematic spots: made by Veru as a freelancer for Czech Video Center (Fameplay); **all rights belong to Czech Video Center a.s.** The notice is shown on each work page.
- Design visuals: Veru / NO ROLL clients.
- Fire dog image: supplied by Veru (AI-generated).
- No third-party 3D models are in use any more. The fox model and wolf stock clip were removed with the intro.


## 2026-10-20 — positioning: personal name, NO ROLL as the method
- Site now leads with Veronika Dominiková as AI film & campaign director; NO ROLL is the method/label, not a studio ("I", not "we").
- Right side label on the home screen is **About** (opens the About me page, id `studio`). Design is no longer in the navigation; its data and `?view=design` route still exist.
- About me services narrowed to film and campaign work (no identity, no web).
