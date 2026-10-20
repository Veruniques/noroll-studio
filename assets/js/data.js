/* =====================================================================
   NO ROLL STUDIO — content. Edit text, videos and images here.
   cinematic[]: Vimeo videos (left side of the site)
   design[]:    visual / brand work (right side)
   ===================================================================== */

export const STUDIO = {
  name: 'NO ROLL studio',
  domain: 'noroll.studio',
  tagline: 'AI film & campaign director. Made right on the first roll.',
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
    idea: 'A sponsor spot conceived for the most demanding format of all: the cinema screen before the feature. Produced entirely with AI, without compromising on cinematic quality.',
    result: 'Screened in cinemas before films, launched in 2025.',
    role: [
      'Defined the character',
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
    idea: 'An exploration of Monoprix’s role as curator, taken to its logical extreme: a job interview in which Monoprix HR assesses a product’s suitability for its shelves. Every item must earn its place.',
    result: 'YouTube campaign.',
    role: [
      'Came up with the interview concept',
      'Set the visual language of the spot',
      'Defined the interior and the character’s look',
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
    idea: 'A bank addressing Gen Z in its own visual language: first-person perspectives that dissolve into a surreal, cinematic world, with live action and AI combined seamlessly within a single frame.',
    result: 'Test YouTube campaign targeting Gen Z.',
    credits: 'Acting script written by the partner agency.',
    role: [
      'Defined the visual concept and the effects',
      'Created the storyboard',
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
    format: 'Ad campaign · fully AI',
    tags: ['Fully AI', 'Lip Sync'],
    vimeo: '1193052091',
    ...CVC,
    text: 'A fully AI commercial for Fameplay, the studio behind the Emmy-winning #marty_is_dead. Talking characters, lip-synced.',
    idea: 'A demonstration of Fameplay’s brand-voice craft: characters without a voice of their own, each given one precisely matched to their face and nature. The result brings the “dead” convincingly to life.',
    result: 'Ad campaign across YouTube and social.',
    role: [
      'Developed the concept together with the voice director',
      'Defined the visual concept and the characters',
      'Created the storyboard',
      'Generated the images and video, lip-synced the characters',
      'Handed over to the Fameplay editor for post-production',
    ],
    tools: ['ChatGPT', 'Nano Banana 2', 'HeyGen', 'Kling', 'DaVinci Resolve'],
  },
  {
    id: 'ppas',
    title: 'PPAS',
    client: 'PPAS',
    format: 'TV commercial · AI',
    tags: ['AI Production', 'One-Take Shot'],
    vimeo: '1193053922',
    ...CVC,
    text: 'An AI TV spot built as one continuous take through a designed interior, with a parrot character who has to stay the same parrot from start to finish.',
    role: [
      'Designed the interior and the composition of the shot',
      'Kept the parrot character consistent',
      'Created the static images for the one-take scene',
      'Turned the stills into the video scene',
    ],
    tools: ['Kling 3.0'],
  },
  {
    id: 'kofola',
    title: 'Kofola — Phteven',
    client: 'Kofola',
    format: 'Commercial · fully AI',
    tags: ['Fully AI', 'Trained Character'],
    vimeo: '1193051595',
    ...CVC,
    text: 'A fully AI Kofola commercial starring Phteven, a dog trained as his own model so he stays himself in every shot.',
    role: [
      'Trained the Phteven dog model',
      'Created the first two scenes, from images to video, and handed them to post-production',
    ],
    tools: ['Freepik / Magnific (model training)'],
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
  title: 'About me',
  tags: ['Who', 'How', 'Contact'],
  role: 'AI Film & Campaign Director',
  intro: [
    'I direct AI films and campaigns for cinema, TV and YouTube. NO ROLL is not a company, it’s the method: no endless re-rolls in the hope that something sticks. Every frame is written, directed and art-directed with intent.',
    'I joined the team behind the first Emmy Award in Czech history, the original series #marty_is_dead, as AI Creative Director. Since then: a sponsor spot for the cinema screen, commercials for Raiffeisenbank, Monoprix, Fameplay, PPAS and Kofola, and hybrid productions combining live action and AI.',
    'Before that, years in product and leadership: design team lead at Kiwi.com, COO and CMO roles. Which is why the work starts with the brief and ends with a result, not with a pretty frame.',
    'Larger productions run with editors, voice directors and partner agencies, credited where they shaped the work.',
  ],
  services: [
    'AI film & commercial direction',
    'Hybrid production (live action + AI)',
    'Campaign concepts',
    'Creative & art direction',
    'Storytelling & scripting',
    'Campaign key visuals',
  ],
  tools: [
    'ComfyUI', 'Weavy', 'Magnific', 'Higgsfield', 'Midjourney', 'LoRA', 'Topaz',
    'DaVinci Resolve', 'ElevenLabs', 'Photoshop', 'Figma', 'Claude MCP',
  ],
  portrait: 'assets/img/portrait-3.jpg',
};
