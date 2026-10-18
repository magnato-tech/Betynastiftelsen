function svgDataUrl(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const BOOKS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="#E8E4D8"/><rect x="280" y="200" width="240" height="180" rx="8" fill="#8B5E3C"/><rect x="300" y="220" width="200" height="24" fill="#DFD9CB"/><rect x="300" y="260" width="200" height="24" fill="#DFD9CB"/><circle cx="400" cy="160" r="36" fill="#C45C3E"/><text x="400" y="540" text-anchor="middle" font-family="Georgia,serif" font-size="20" fill="#3C3C3C">Illustrasjonsbilde</text></svg>`;

const CLINIC_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="#EEF2F4"/><rect x="160" y="140" width="480" height="320" rx="12" fill="#FFFFFF" stroke="#B8C5CE"/><rect x="200" y="200" width="120" height="200" fill="#DDE4E8"/><rect x="480" y="220" width="120" height="80" fill="#DDE4E8"/><text x="400" y="540" text-anchor="middle" font-family="Georgia,serif" font-size="20" fill="#3C3C3C">Illustrasjonsbilde</text></svg>`;

const SEWING_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="#F6F4ED"/><rect x="220" y="180" width="360" height="240" rx="16" fill="#DFD9CB"/><circle cx="400" cy="300" r="80" fill="#4D6B3E" opacity="0.2"/><path d="M340 300 L460 300 M400 240 L400 360" stroke="#4D6B3E" stroke-width="8"/><text x="400" y="540" text-anchor="middle" font-family="Georgia,serif" font-size="20" fill="#3C3C3C">Illustrasjonsbilde</text></svg>`;

const CLASSROOM_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="#EBE7DC"/><rect x="140" y="160" width="520" height="280" rx="12" fill="#A3B18A" opacity="0.35"/><rect x="180" y="200" width="440" height="48" fill="#4D6B3E" opacity="0.25"/><rect x="180" y="280" width="200" height="120" fill="#4D6B3E" opacity="0.2"/><rect x="420" y="280" width="200" height="120" fill="#4D6B3E" opacity="0.3"/><text x="400" y="540" text-anchor="middle" font-family="Georgia,serif" font-size="20" fill="#3C3C3C">Illustrasjonsbilde</text></svg>`;

export type WaitingSponsorIllustrationPreset = {
  id: string;
  name: string;
  url: string;
};

export const WAITING_SPONSOR_ILLUSTRATION_PRESETS: WaitingSponsorIllustrationPreset[] = [
  { id: 'school', name: 'Skole og læring', url: svgDataUrl(CLASSROOM_SVG) },
  { id: 'books', name: 'Bøker og skolestart', url: svgDataUrl(BOOKS_SVG) },
  { id: 'health', name: 'Helse og omsorg', url: svgDataUrl(CLINIC_SVG) },
  { id: 'sewing', name: 'Yrkesopplæring / symaskin', url: svgDataUrl(SEWING_SVG) },
];
