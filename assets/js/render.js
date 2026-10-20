/* Shared HTML + metadata for the works column.
   Used by app.js in the browser and by scripts/build.mjs to pre-render the static,
   crawlable pages (work/<id>/, about/, cinematic/). Pure functions: no DOM access. */

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const pad = n => String(n).padStart(2, '0');
export const STAR = '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M7 0v14M0 7h14M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.2"/></svg>';

const section = (title, html) => `<h2 class="work__h">${STAR}${esc(title)}</h2>${html}`;

/* ---------------- paths (relative to the site root) ---------------- */
export function pathFor(view, id) {
  if (view === 'design') return `?view=design${id ? `&work=${encodeURIComponent(id)}` : ''}`;
  if (id === 'studio') return 'about/';
  if (id) return `work/${encodeURIComponent(id)}/`;
  return view === 'home' ? '' : `${view}/`;
}

/* ---------------- list ---------------- */
export function listHTML(items, side) {
  return items.map((w, i) => `
    <li data-i="${i}" style="${w.kind === 'info' ? '--accent:#111' : ''}">
      <a class="works__row" href="${pathFor(side, w.id)}" data-open-work="${esc(w.id)}">
        <span class="works__title">${STAR}${esc(w.title)}</span>
        <span class="works__tags">// ${w.tags.map(esc).join(' // ')}</span>
      </a>
    </li>`).join('');
}

/* ---------------- a single work ---------------- */
export function workHTML(w, { index, next, side, studio, folded = false }) {
  const nextBtn = `<a class="work__next" href="${pathFor(side, next.id)}" data-open-work="${esc(next.id)}"><span>Next</span><span>${esc(next.title)}</span></a>`;
  const head = (kicker, title, meta) => `
    <p class="work__kicker">${esc(kicker)}</p>
    <h1 class="work__title">${esc(title)}</h1>
    ${meta ? `<div class="work__meta">${meta}</div>` : ''}`;

  if (w.kind === 'cinematic') {
    const meta = `<span><b>Client</b>${esc(w.client)}</span>${w.format ? `<span><b>Format</b>${esc(w.format)}</span>` : ''}${w.producedFor ? `<span><b>Produced for</b>${esc(w.producedFor)}</span>` : `<span><b>Director</b>${esc(studio.director)}</span>`}`;
    const content = `
      <div class="work__video"><iframe src="https://player.vimeo.com/video/${w.vimeo}?title=0&byline=0&portrait=0&dnt=1" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy" title="${esc(w.title)} — ${esc(w.format || 'AI commercial')}"></iframe></div>
      <div class="work__body">
        ${head(w.tags.join(' · '), w.title, meta)}
        ${w.idea ? section('Idea', `<p class="work__text">${esc(w.idea)}</p>`) : section('About', `<p class="work__text">${esc(w.text)}</p>`)}
        ${w.role && w.role.length ? section('My role', `<ul class="work__list">${w.role.map(r => `<li>${esc(r)}</li>`).join('')}</ul>${w.credits ? `<p class="work__text">${esc(w.credits)}</p>` : ''}`) : ''}
        ${w.result ? section('Result', `<p class="work__text">${esc(w.result)}</p>`) : ''}
        ${w.tools && w.tools.length ? section('Tools', `<ul class="chips">${w.tools.map(t => `<li>${esc(t)}</li>`).join('')}</ul>`) : ''}
        ${w.rights ? `<p class="work__rights">${esc(w.rights)}</p>` : ''}
        ${nextBtn}
      </div>`;
    // the tab the dog stamps on; the case unfolds from under it
    const tab = folded
      ? `<div class="work__tab" aria-hidden="true"><span>${pad(index + 1)}</span><span>${esc(w.title)}</span><span>${esc(w.tags.join(' · '))}</span></div>`
      : '';
    return `${tab}<div class="work__fold"><div class="work__fold-in">${content}</div></div>`;
  }

  if (w.kind === 'design') {
    return `
      <div class="work__body">
        ${head(w.tags.join(' · '), w.title, `<span><b>Client</b>${esc(w.client)}</span>`)}
        ${section('About', `<p class="work__text">${esc(w.text)}</p>`)}
      </div>
      <div class="work__gallery">${w.images.map((src, k) => `<img src="${src}" alt="${esc(w.title)} — visual ${k + 1}" loading="${k < 2 ? 'eager' : 'lazy'}" decoding="async">`).join('')}</div>
      <div class="work__body">${nextBtn}</div>`;
  }

  // about me
  return `
    <div class="work__body">
      ${head(w.role, studio.director, `<span><b>Method</b>NO ROLL</span><span><b>Based</b>Czech Republic, works everywhere</span>`)}
      ${w.lead ? `<p class="work__lead">${esc(w.lead)}</p>` : ''}
      ${section('About', w.intro.map(p => `<p class="work__text">${esc(p)}</p>`).join(''))}
      ${section('What I do', `<ul class="chips">${w.services.map(s => `<li>${esc(s)}</li>`).join('')}</ul>`)}
      ${section('Pipeline', `<ul class="chips">${w.tools.map(s => `<li>${esc(s)}</li>`).join('')}</ul>`)}
      ${section('Contact', `<div class="work__contact">
        <a href="mailto:${esc(studio.email)}"><span>Email</span><span>${esc(studio.email)}</span></a>
        <a href="${esc(studio.linkedin)}" target="_blank" rel="noopener"><span>LinkedIn</span><span>${esc(studio.director)} ↗</span></a>
      </div>`)}
      <img class="work__portrait" src="${esc(w.portrait)}" alt="${esc(studio.director)}, multidisciplinary creative" loading="lazy">
      ${nextBtn}
    </div>`;
}

/* ---------------- metadata (title, description, structured data) ---------------- */
const clip = (s, n = 158) => (s.length <= n ? s : s.slice(0, s.lastIndexOf(' ', n - 1)).replace(/[,.:;—–-]$/, '') + '…');
const NAME = 'Veronika Dominiková';

export function pageMeta({ view, w, studio, cinematic }) {
  const root = studio.url;
  const person = {
    '@type': 'Person',
    '@id': `${root}#person`,
    name: NAME,
    jobTitle: 'Multidisciplinary Creative',
    description: 'Concept & Audiovisual Director creating AI-driven video campaigns and commercials for cinema, TV and YouTube.',
    url: root,
    email: `mailto:${studio.email}`,
    image: `${root}assets/img/og.jpg`,
    sameAs: [studio.linkedin],
    address: { '@type': 'PostalAddress', addressCountry: 'CZ' },
    knowsAbout: ['AI video production', 'AI commercials', 'Creative direction', 'Hybrid live action and AI production', 'Storyboarding', 'Campaign concepts', 'Art direction'],
  };
  const site = { '@type': 'WebSite', '@id': `${root}#website`, url: root, name: `${NAME} — NO ROLL`, inLanguage: 'en', publisher: { '@id': `${root}#person` } };

  if (w && w.kind === 'cinematic') {
    const url = `${root}work/${w.id}/`;
    const desc = clip(`${w.title}: ${(w.idea || w.text)} Concept and direction by ${NAME}.`);
    return {
      title: `${w.title} — ${w.format ? w.format.replace(' · ', ', ') : 'AI commercial'} | ${NAME}`,
      description: desc,
      url,
      image: w.thumb || `${root}assets/img/og.jpg`,
      type: 'video.other',
      jsonld: [person, site, {
        '@type': 'VideoObject',
        name: `${w.title} — ${w.client}`,
        description: w.idea || w.text,
        thumbnailUrl: [w.thumb],
        uploadDate: w.uploaded,
        duration: w.duration ? `PT${w.duration}S` : undefined,
        embedUrl: `https://player.vimeo.com/video/${w.vimeo}`,
        url,
        genre: w.tags.join(', '),
        creator: { '@id': `${root}#person` },
        copyrightHolder: w.producedFor ? { '@type': 'Organization', name: 'Czech Video Center a.s.' } : undefined,
      }, breadcrumbs(root, [['Cinematic', `${root}cinematic/`], [w.title, url]])],
    };
  }
  if (w && w.kind === 'info') {
    const url = `${root}about/`;
    return {
      title: `About — ${NAME}, multidisciplinary creative`,
      description: clip(`${w.lead} ${w.intro[0]}`),
      url, image: `${root}assets/img/og.jpg`, type: 'profile',
      jsonld: [person, site, { '@type': 'ProfilePage', url, mainEntity: { '@id': `${root}#person` } }, breadcrumbs(root, [['About', url]])],
    };
  }
  if (view === 'cinematic') {
    const url = `${root}cinematic/`;
    return {
      title: `Cinematic works — AI commercials & campaigns | ${NAME}`,
      description: clip(`AI commercials and campaigns by ${NAME}: ${cinematic.map(c => c.title).join(', ')}. Fully AI and hybrid live-action productions for cinema, TV and YouTube.`),
      url, image: `${root}assets/img/og.jpg`, type: 'website',
      jsonld: [person, site, {
        '@type': 'CollectionPage', url, name: 'Cinematic works',
        hasPart: cinematic.map(c => ({ '@type': 'VideoObject', name: c.title, url: `${root}work/${c.id}/`, thumbnailUrl: [c.thumb], uploadDate: c.uploaded })),
      }, breadcrumbs(root, [['Cinematic', url]])],
    };
  }
  return {
    title: `${NAME} — Multidisciplinary creative | NO ROLL`,
    description: `${NAME} is a multidisciplinary creative: concept, creative direction and AI-driven video campaigns and commercials for cinema, TV and YouTube. Raiffeisenbank, Monoprix, Kofola, PPAS.`,
    url: root, image: `${root}assets/img/og.jpg`, type: 'website',
    jsonld: [person, site],
  };
}

function breadcrumbs(root, trail) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: [['Home', root], ...trail].map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })),
  };
}

export function jsonLdScript(meta) {
  const graph = JSON.parse(JSON.stringify({ '@context': 'https://schema.org', '@graph': meta.jsonld })); // drops undefined
  return `<script type="application/ld+json">${JSON.stringify(graph).replace(/</g, '\\u003c')}</script>`;
}
