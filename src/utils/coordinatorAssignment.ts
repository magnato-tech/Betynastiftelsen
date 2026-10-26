import type { CatalogPhoto, Child, Coordinator, FieldFact, Inquiry, PaymentAllocation, Report, SponsorAssignment } from '../types';
import { childrenForCoordinator } from './coordinatorScope';

export type ChildCoordinatorState = 'ok' | 'mangler' | 'arkivert';

export interface ChildCoordinatorInfo {
  state: ChildCoordinatorState;
  /** Koordinatoren, når den finnes (også når den er arkivert). */
  coordinator?: Coordinator;
}

/** Om eleven har en gyldig, aktiv koordinator. Tom eller ukjent id gir 'mangler'. */
export function childCoordinatorState(
  child: Pick<Child, 'koordinatorId'>,
  coordinators: Coordinator[]
): ChildCoordinatorInfo {
  if (!child.koordinatorId) return { state: 'mangler' };
  const coordinator = coordinators.find((c) => c.id === child.koordinatorId);
  if (!coordinator) return { state: 'mangler' };
  if (coordinator.aktiv === false) return { state: 'arkivert', coordinator };
  return { state: 'ok', coordinator };
}

/** Aktive elever som ikke har en gyldig, aktiv koordinator. */
export function childrenNeedingCoordinator(children: Child[], coordinators: Coordinator[]): Child[] {
  return children.filter((c) => c.status === 'aktiv' && childCoordinatorState(c, coordinators).state !== 'ok');
}

/** Aktive elever til en koordinator (samme regel som koordinatorens egen liste). */
export function activeChildrenOfCoordinator(children: Child[], coordinatorId: string): Child[] {
  return childrenForCoordinator(children, coordinatorId);
}

/** Data som flyttes med eleven. Milepæler har ikke koordinatorId og er ikke med her. */
export interface ChildMoveSnapshot {
  children: Child[];
  reports: Report[];
  facts: FieldFact[];
  catalogPhotos: CatalogPhoto[];
  inquiries: Inquiry[];
  sponsorAssignments: SponsorAssignment[];
  paymentAllocations: PaymentAllocation[];
}

/** Hvilke poster som må få ny koordinatorId når eleven flyttes (bare poster som faktisk endres). */
export interface ChildMovePlan {
  childId: string;
  fromCoordinatorId: string;
  toCoordinatorId: string;
  reportIds: string[];
  factIds: string[];
  catalogPhotoIds: string[];
  inquiryIds: string[];
  sponsorAssignmentIds: string[];
  paymentAllocationIds: string[];
}

/**
 * Planlegger flyttingen av én elev: finner alle poster om eleven som har koordinatorId
 * og som ikke allerede peker på målkoordinatoren. Ren funksjon, ingen endringer.
 * Feltene som matches: Report/FieldFact/Inquiry på barnId, SponsorAssignment/PaymentAllocation på childId,
 * og CatalogPhoto på barnIds (id eller internKode, ikke fornavn, fordi fornavn ikke er unikt).
 */
export function planChildMove(snapshot: ChildMoveSnapshot, childId: string, toCoordinatorId: string): ChildMovePlan {
  const child = snapshot.children.find((c) => c.id === childId);
  if (!child) throw new Error('Fant ikke eleven.');
  const endres = (koordinatorId: string | undefined) => koordinatorId !== toCoordinatorId;

  return {
    childId,
    fromCoordinatorId: child.koordinatorId,
    toCoordinatorId,
    reportIds: snapshot.reports.filter((r) => r.barnId === childId && endres(r.koordinatorId)).map((r) => r.id),
    factIds: snapshot.facts.filter((f) => f.barnId === childId && endres(f.koordinatorId)).map((f) => f.id),
    catalogPhotoIds: snapshot.catalogPhotos
      .filter((p) => (p.barnIds.includes(child.id) || p.barnIds.includes(child.internKode)) && endres(p.koordinatorId))
      .map((p) => p.id),
    inquiryIds: snapshot.inquiries.filter((i) => i.barnId === childId && endres(i.koordinatorId)).map((i) => i.id),
    sponsorAssignmentIds: snapshot.sponsorAssignments
      .filter((a) => a.childId === childId && endres(a.koordinatorId))
      .map((a) => a.id),
    paymentAllocationIds: snapshot.paymentAllocations
      .filter((a) => a.childId === childId && endres(a.koordinatorId))
      .map((a) => a.id),
  };
}

/** Kan barnet kobles til en fadder? Bare hvis barnet har en gyldig, aktiv koordinator. */
export function canAssignSponsor(child: Pick<Child, 'koordinatorId'>, coordinators: Coordinator[]): boolean {
  return childCoordinatorState(child, coordinators).state === 'ok';
}
