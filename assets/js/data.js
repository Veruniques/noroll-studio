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
    title: 'Raiffeisenbank Cinema Spot',
    client: 'Raiffeisenbank',
    format: 'Sponsor spot for cinema · fully AI',
    tags: ['Fully AI', 'Cinema Sponsor Spot'],
    vimeo: '1193051888',
    ...CVC,
    text: 'A sponsor spot for the big screen, made entirely with AI. From the character to the last generated shot, then handed over for sound and grade.',
    role: [
      'Designed the character',
      'Created the storyboard',
      'Generated the input images and video scenes',
      'Built the full cut for the final editor to finish with SFX and colour grading',
    ],
    tools: ['Freepik', 'Nano Banana Pro', 'Kling 2.1', 'DaVinci Resolve', 'ChatGPT (prompts)', 'ElevenLabs'],
  },
  {
    id: 'monoprix',
    title: 'Monoprix',
    client: 'Monoprix',
    format: 'Commercial · fully AI',
    tags: ['Fully AI', 'Commercial'],
    vimeo: '1193051592',
    ...CVC,
    text: 'A fully AI commercial for Monoprix, owned end to end: from the first idea to the handover.',
    role: [
      'Came up with the concept',
      'Created the storyboard',
      'Generated the image and video scenes',
      'Managed communication and planning with the client from the first call to handover',
    ],
    tools: ['Nano Banana Pro', 'Kling 3.0', 'DaVinci Resolve', 'ChatGPT', 'ElevenLabs'],
  },
  {
    id: 'rb-hybrid',
    title: 'Raiffeisenbank Hybrid',
    client: 'Raiffeisenbank',
    format: 'Commercial · hybrid production (live action + AI)',
    tags: ['Hybrid', 'Live Action + AI'],
    vimeo: '1193051591',
    ...CVC,
    text: 'Live-action footage shot on set, worlds and effects generated with AI. A hybrid production where you stop asking which shot is real.',
    role: [
      'Concept and storyboard',
      'Created the AI backgrounds and the “VFX” effects',
      'Directed the live-action production',
      'Video edit',
      'Managed communication and planning with the client from the first call to handover',
    ],
    tools: ['Nano Banana', 'ChatGPT', 'Runway'],
  },
  {
    id: 'fameplay-voice',
    title: 'Fameplay',
    client: 'Fameplay',
    format: 'Commercial · fully AI',
    tags: ['Fully AI', 'Lip Sync'],
    vimeo: '1193052091',
    ...CVC,
    text: 'A fully AI commercial for Fameplay, the studio behind the Emmy-winning #marty_is_dead. Talking characters, lip-synced.',
    role: [
      'Co-created the concept',
      'Storyboard',
      'Produced the image and video scenes',
      'Lip sync',
    ],
    tools: ['ChatGPT', 'Nano Banana 2', 'HeyGen', 'Kling', 'DaVinci Resolve'],
  },
  {
    id: 'kofola',
    title: 'Kofola — Phteven',
    client: 'Kofola',
    format: 'Commercial · fully AI',
    tags: ['Fully AI', 'Trained Character'],
    vimeo: '1193051595',
    ...CVC,
    text: 'A fully AI Kofola commercial starring Phteven, a character trained for the job so he stays himself in every shot.',
    role: [
      'Trained the character',
      'Created the scenes: images and videos',
    ],
    tools: [],
  },
  {
    id: 'ppas',
    title: 'PPAS',
    client: 'PPAS',
    format: 'TV commercial',
    tags: ['AI Production', 'TV Commercial'],
    vimeo: '1193053922',
    ...CVC,
    text: 'A broadcast TV spot produced with AI, built to air next to traditionally shot ads and hold its own.',
    role: [],
    tools: [],
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
