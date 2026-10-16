/* =====================================================================
   NO ROLL STUDIO — content. Edit text, videos and images here.
   cinematic[]: Vimeo videos (left side of the site)
   design[]:    visual / brand work (right side)
   ===================================================================== */

export const STUDIO = {
  name: 'NO ROLL studio',
  domain: 'noroll.studio',
  tagline: 'AI cinematic production + visual design. Made right on the first roll.',
  email: 'hello@noroll.studio', // TODO: confirm address
  linkedin: 'https://www.linkedin.com/in/veronika-dominikova/',
  director: 'Veronika Dominiková',
};

// Work made as a freelancer under Czech Video Center (Fameplay): credit + rights notice on the work page
const CVC = {
  producedFor: 'Czech Video Center (Fameplay)',
  rights: 'Produced for Czech Video Center (Fameplay) as a freelancer. All rights belong to Czech Video Center a.s.',
};

export const cinematic = [
  {
    id: 'rb-cinema',
    title: 'RB Cinema Spot',
    client: 'RB',
    tags: ['AI Production', 'Cinema'],
    vimeo: '1193051888',
    ...CVC,
    text: 'An AI-generated sponsor spot built for the big screen. Written, art-directed and generated end to end, then graded for cinema projection.',
  },
  {
    id: 'monoprix',
    title: 'Monoprix',
    client: 'Monoprix',
    tags: ['AI Production', 'YT Commercial'],
    vimeo: '1193051592',
    ...CVC,
    text: 'A YouTube pre-roll for Monoprix. Short, punchy, made to survive the skip button.',
  },
  {
    id: 'fameplay-voice',
    title: 'Fameplay Voice',
    client: 'Fameplay',
    tags: ['AI Production', 'Voice'],
    vimeo: '1193052091',
    ...CVC,
    text: 'A voice-led AI commercial for Fameplay, the home of the Emmy-winning #marty_is_dead.',
  },
  {
    id: 'kofola',
    title: 'Kofola Remake',
    client: 'Kofola, asked by the original creator',
    tags: ['AI Production', 'Remake'],
    vimeo: '1193051595',
    ...CVC,
    text: 'The original creator of an iconic Kofola commercial asked for an AI remake. Same soul, new pipeline.',
  },
  {
    id: 'rb-hybrid',
    title: 'RB Hybrid',
    client: 'RB',
    tags: ['Hybrid', 'Live Action + AI'],
    vimeo: '1193051591',
    ...CVC,
    text: 'Live-action footage meets generated worlds. A hybrid production where you stop asking which shot is real.',
  },
  {
    id: 'ppas',
    title: 'PPAS',
    client: 'PPAS',
    tags: ['AI Production', 'TV Commercial'],
    vimeo: '1193053922',
    ...CVC,
    text: 'A broadcast TV spot produced with AI, built to air next to traditionally shot ads and hold its own.',
  },
];

const W = 'assets/img/work/';
const imgs = (prefix, nums) => nums.map(n => W + `x-${prefix}-${n}.jpg`);

export const design = [
  {
    id: 'fameplay',
    title: 'Fameplay',
    client: 'Fameplay — AI studio',
    tags: ['Branding', 'Campaign', 'Key Visuals'],
    cover: W + 'x-fameplay-chrome-logo.jpg',
    text: 'Brand system and key visuals for the AI studio: the chromatic logo and humanoid, type, icon set, the Avatar Pioneers event series with HeyGen, and campaign visuals.',
    images: [
      W + 'x-fameplay-chrome-logo.jpg',
      W + 'x-fameplay-chrome-logo2.jpg',
      W + 'x-fameplay-humanoid.jpg',
      W + 'x-fameplay-store.jpg',
      W + 'x-fameplay-face.jpg',
      ...imgs('fameplay', [0, 1, 19, 20, 23, 27, 43, 44, 45, 51]),
    ],
  },
  {
    id: 'kurnik',
    title: 'Kurník Šopa',
    client: 'Café',
    tags: ['Identity', 'Illustration'],
    cover: W + 'x-kurnik-0.jpg',
    text: 'A hand-drawn identity for a small café: the hen, the type, the menu, the merch.',
    images: imgs('kurnik', [0, 3, 4, 7, 18, 21, 24, 34, 40, 41]),
  },
  {
    id: 'peaq',
    title: 'Beyond PEAQ',
    client: 'Outdoor lifestyle brand',
    tags: ['Campaign', 'Social'],
    cover: W + 'x-peaq-22.jpg',
    text: 'Social and campaign visuals for an outdoor lifestyle brand.',
    images: imgs('peaq', [20, 22, 26]),
  },
];

export const info = {
  id: 'studio',
  title: 'Studio Info',
  tags: ['Who', 'How', 'Contact'],
  role: 'Creative Director & Founder',
  intro: [
    'NO ROLL is a small studio for AI cinematic production and visual design. The name is the method: we don’t gamble on endless re-rolls and hope something sticks. Every frame is written, directed and art-directed on purpose.',
    'Led by Veronika Dominiková, AI Creative Director who joined the team behind the first Emmy Award in Czech history, for the original series #marty_is_dead. Spots for cinema, TV and YouTube, combining storytelling, art direction and advanced AI workflows — visuals that lift products, services and ideas beyond standard AI content.',
    'The other half of the brain does brands: identities, campaign systems and posters, mostly for small teams that need a whole brand, not just a logo.',
  ],
  services: [
    'AI cinematic production',
    'Hybrid production (live action + AI)',
    'Creative & art direction',
    'Storytelling & scripting',
    'Brand design & identity',
    'Campaign key visuals',
    'Web design & development',
  ],
  tools: [
    'ComfyUI', 'Weavy', 'Magnific', 'Higgsfield', 'Midjourney', 'LoRA', 'Topaz',
    'DaVinci Resolve', 'ElevenLabs', 'Photoshop', 'Figma', 'Claude MCP',
  ],
  portrait: 'assets/img/portrait-3.jpg',
};
