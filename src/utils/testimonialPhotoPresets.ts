export type TestimonialPhotoPreset = {
  id: string;
  name: string;
  url: string;
  desc: string;
  /** Demo/placeholder — merkes som illustrasjon på forsiden. */
  illustration?: boolean;
};

function svgDataUrl(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const DEMO_PORTRAIT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="#DFD9CB"/><circle cx="400" cy="220" r="72" fill="#A3B18A"/><ellipse cx="400" cy="420" rx="140" ry="160" fill="#4D6B3E" opacity="0.35"/><text x="400" y="540" text-anchor="middle" font-family="Georgia, serif" font-size="22" fill="#3C3C3C">Illustrasjonsbilde</text></svg>`;

const DEMO_GROUP_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="#EBE7DC"/><circle cx="280" cy="260" r="48" fill="#A3B18A"/><circle cx="400" cy="240" r="56" fill="#4D6B3E" opacity="0.5"/><circle cx="520" cy="270" r="44" fill="#A3B18A"/><rect x="120" y="360" width="560" height="120" rx="16" fill="#4D6B3E" opacity="0.2"/><text x="400" y="540" text-anchor="middle" font-family="Georgia, serif" font-size="22" fill="#3C3C3C">Illustrasjonsbilde</text></svg>`;

const DEMO_WORKSHOP_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="#F6F4ED"/><rect x="140" y="180" width="520" height="280" rx="12" fill="#DFD9CB" stroke="#A3B18A" stroke-width="4"/><rect x="200" y="240" width="180" height="120" rx="8" fill="#4D6B3E" opacity="0.25"/><rect x="420" y="220" width="200" height="160" rx="8" fill="#4D6B3E" opacity="0.35"/><text x="400" y="540" text-anchor="middle" font-family="Georgia, serif" font-size="22" fill="#3C3C3C">Illustrasjonsbilde</text></svg>`;

/** Feltbilder som kan brukes som ekte foto (bytt ut URL når ekte bilde kommer). */
export const TESTIMONIAL_FIELD_PHOTO_PRESETS: TestimonialPhotoPreset[] = [
  {
    id: 'fullsizer',
    name: 'Jente som trenger symaskin (FullSizeR.jpg)',
    url: 'FullSizeR.jpg',
    desc: 'Innsendt feltbilde — erstatt med ekte portrett når det foreligger',
  },
  {
    id: 'img1194',
    name: 'Barn og koordinator (IMG_1194.jpg)',
    url: 'IMG_1194.jpg',
    desc: 'Gruppebilde fra felt — kan brukes midlertidig til ekte portrett finnes',
  },
];

/** Placeholdere (data-URL) — fungerer uten ekstra statiske filer på server. */
export const TESTIMONIAL_ILLUSTRATION_PHOTO_PRESETS: TestimonialPhotoPreset[] = [
  {
    id: 'demo-portrait',
    name: 'Illustrasjon — portrett (demo)',
    url: svgDataUrl(DEMO_PORTRAIT_SVG),
    illustration: true,
    desc: 'Generisk silhuett — vises som «Illustrasjonsbilde» på forsiden',
  },
  {
    id: 'demo-group',
    name: 'Illustrasjon — gruppe (demo)',
    url: svgDataUrl(DEMO_GROUP_SVG),
    illustration: true,
    desc: 'Generisk gruppemotiv — midlertidig placeholder',
  },
  {
    id: 'demo-workshop',
    name: 'Illustrasjon — verksted (demo)',
    url: svgDataUrl(DEMO_WORKSHOP_SVG),
    illustration: true,
    desc: 'Generisk yrkesopplæring — midlertidig placeholder',
  },
];

const ILLUSTRATION_URLS = new Set(
  TESTIMONIAL_ILLUSTRATION_PHOTO_PRESETS.flatMap((p) => {
    const withSlash = p.url.startsWith('/') ? p.url : `/${p.url}`;
    const bare = withSlash.replace(/^\//, '');
    return [p.url, withSlash, bare];
  })
);

export function isTestimonialIllustrationImageUrl(url?: string): boolean {
  if (!url?.trim()) return false;
  const trimmed = url.trim();
  if (ILLUSTRATION_URLS.has(trimmed)) return true;
  if (trimmed.startsWith('data:image/svg+xml') && trimmed.includes('Illustrasjonsbilde')) return true;
  return false;
}

export function testimonialPresetUrlForSrc(url: string): string {
  const trimmed = url.trim();
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('/')
  ) {
    return trimmed;
  }
  return `/${trimmed}`;
}
