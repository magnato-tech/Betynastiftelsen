import type { CatalogPhoto, Child, Report } from '../types';

export const COORDINATOR_PROFILE_PREFIX = 'profil:';

export function coordinatorChildProfileSection(childId: string): string {
  return `${COORDINATOR_PROFILE_PREFIX}${childId}`;
}

export function parseCoordinatorChildProfileId(section: string): string | null {
  if (!section.startsWith(COORDINATOR_PROFILE_PREFIX)) return null;
  const id = section.slice(COORDINATOR_PROFILE_PREFIX.length).trim();
  return id || null;
}

export function isCoordinatorChildProfileSection(section: string): boolean {
  return parseCoordinatorChildProfileId(section) !== null;
}

export function normalizePhotoTag(tag: string): string {
  return tag.trim().toLowerCase();
}

export function childMatchesPhotoTag(child: Child, tag: string): boolean {
  const t = normalizePhotoTag(tag);
  if (!t) return false;
  return (
    child.id.toLowerCase() === t ||
    child.internKode.toLowerCase() === t ||
    child.fornavn.toLowerCase() === t
  );
}

export function photoTaggedForChild(photo: CatalogPhoto, child: Child): boolean {
  return photo.barnIds.some((tag) => childMatchesPhotoTag(child, tag));
}

export function catalogPhotosForChild(photos: CatalogPhoto[], child: Child): CatalogPhoto[] {
  return photos.filter((p) => photoTaggedForChild(p, child));
}

export function reportsForChild(reports: Report[], barnId: string): Report[] {
  return reports
    .filter((r) => r.barnId === barnId)
    .slice()
    .sort((a, b) => b.dato.localeCompare(a.dato) || b.id.localeCompare(a.id));
}
