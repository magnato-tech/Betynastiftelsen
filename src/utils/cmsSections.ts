import type { CmsSectionToggle } from '../types';

export function cmsSectionEnabled(section?: CmsSectionToggle): boolean {
  return section?.enabled !== false;
}
