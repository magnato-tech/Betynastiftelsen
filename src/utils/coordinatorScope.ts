import type { Child, Coordinator, Inquiry, Report } from '../types';
export type CoordinatorRegisterSortKey =
  | 'internKode'
  | 'fornavn'
  | 'skoleNavn'
  | 'klassetrinn'
  | 'fadderstatus'
  | 'fodselsaar'
  | 'rapporter'
  | 'milepaler'
  | 'status';

export type CoordinatorRegisterSortDir = 'asc' | 'desc';

export function childrenForCoordinator(children: Child[], coordinatorId: string): Child[] {
  return children.filter((c) => c.koordinatorId === coordinatorId && c.status === 'aktiv');
}

function compareText(a: string, b: string): number {
  return a.localeCompare(b, 'nb', { numeric: true, sensitivity: 'base' });
}

export function sortChildrenForCoordinatorRegister(
  children: Child[],
  key: CoordinatorRegisterSortKey,
  direction: CoordinatorRegisterSortDir,
  counts: { reports: Record<string, number>; milestones: Record<string, number> }
): Child[] {
  const dir = direction === 'asc' ? 1 : -1;
  return [...children].sort((a, b) => {
    let cmp = 0;
    switch (key) {
      case 'internKode':
        cmp = compareText(a.internKode, b.internKode);
        break;
      case 'fornavn':
        cmp = compareText(a.fornavn, b.fornavn);
        break;
      case 'skoleNavn':
        cmp = compareText(a.skoleNavn, b.skoleNavn);
        break;
      case 'klassetrinn':
        cmp = compareText(a.klassetrinn, b.klassetrinn);
        break;
      case 'fadderstatus':
        cmp = Number(!!a.tildeltFadderId) - Number(!!b.tildeltFadderId);
        break;
      case 'fodselsaar':
        cmp = a.fodselsaar - b.fodselsaar;
        break;
      case 'rapporter':
        cmp = (counts.reports[a.id] ?? 0) - (counts.reports[b.id] ?? 0);
        break;
      case 'milepaler':
        cmp = (counts.milestones[a.id] ?? 0) - (counts.milestones[b.id] ?? 0);
        break;
      case 'status':
        cmp = compareText(a.status, b.status);
        break;
      default:
        cmp = 0;
    }
    if (cmp === 0) cmp = compareText(a.internKode, b.internKode);
    return cmp * dir;
  });
}

export function reportsForCoordinator(reports: Report[], coordinatorId: string): Report[] {
  return reports.filter((r) => r.koordinatorId === coordinatorId);
}

export function inquiriesForCoordinator(
  inquiries: Inquiry[],
  children: Child[],
  coordinatorId: string
): Inquiry[] {
  const childIds = new Set(children.filter((c) => c.koordinatorId === coordinatorId).map((c) => c.id));
  return inquiries.filter(
    (inq) =>
      childIds.has(inq.barnId) &&
      (inq.status === 'venter_koordinator' || inq.status === 'under_behandling' || inq.koordinatorId === coordinatorId)
  );
}

export function findCoordinator(coordinators: Coordinator[], id: string): Coordinator | undefined {
  return coordinators.find((c) => c.id === id);
}
