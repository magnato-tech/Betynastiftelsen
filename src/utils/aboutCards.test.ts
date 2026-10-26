import { describe, expect, it } from 'vitest';
import type { CmsPrincipleCard } from '../types';
import { aboutCardsColumns, aboutCardsGridClass, publishedAboutCards } from './aboutCards';

const card = (id: string, published?: boolean): CmsPrincipleCard => ({
  id,
  title: id,
  description: '',
  iconName: 'Scale',
  ...(published === undefined ? {} : { published }),
});

describe('aboutCards', () => {
  it('kort uten published-felt er publisert; published:false skjules', () => {
    const cards = [card('a'), card('b', false), card('c', true)];
    expect(publishedAboutCards(cards).map((c) => c.id)).toEqual(['a', 'c']);
  });

  it('kort per rad er 3 som standard, og 2 eller 4 når valgt', () => {
    expect(aboutCardsColumns({})).toBe(3);
    expect(aboutCardsColumns({ aboutCardsColumns: 2 })).toBe(2);
    expect(aboutCardsColumns({ aboutCardsColumns: 4 })).toBe(4);
  });

  it('rutenettet har riktig antall kolonner på store skjermer og én på mobil', () => {
    expect(aboutCardsGridClass(2)).toBe('grid-cols-1 sm:grid-cols-2');
    expect(aboutCardsGridClass(3)).toContain('lg:grid-cols-3');
    expect(aboutCardsGridClass(4)).toContain('lg:grid-cols-4');
  });
});
