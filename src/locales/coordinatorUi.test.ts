import { describe, expect, it } from 'vitest';
import { getCoordinatorUi } from './coordinatorUi';

describe('getCoordinatorUi', () => {
  it('uses Norwegian unless language is French', () => {
    expect(getCoordinatorUi('no').title).toMatch(/Koordinatorportal/);
    expect(getCoordinatorUi('fr').title).toMatch(/Portail de Coordination/);
  });

  it('exposes register column labels in both languages', () => {
    const no = getCoordinatorUi('no');
    const fr = getCoordinatorUi('fr');
    expect(no.colCode).toBe('Intern kode');
    expect(no.colName).toBe('Fornavn');
    expect(fr.colCode).toBe('Code interne');
    expect(fr.colName).toBe('Prénom');
    expect(no.emptyRegister).toMatch(/Ingen elever/);
    expect(fr.emptyRegister).toMatch(/Aucun élève/);
  });
});
