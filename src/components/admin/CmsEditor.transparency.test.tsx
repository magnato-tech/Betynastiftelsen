// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { EMPTY_CMS_CONTENT } from '../../db/seedPolicy';
import type { CmsContent } from '../../types';

const updateCmsSection = vi.fn();
let currentCms: CmsContent = EMPTY_CMS_CONTENT;

vi.mock('../../context/AppContext', () => ({
  useApp: () => ({
    cmsContent: currentCms,
    updateCmsSection,
    stories: [],
    addStory: vi.fn(),
    updateStory: vi.fn(),
    deleteStory: vi.fn(),
    campaigns: [],
    addCampaign: vi.fn(),
    updateCampaign: vi.fn(),
    deleteCampaign: vi.fn(),
    childrenList: [],
    mediaLibrary: [],
    firestoreSave: undefined,
    firestoreBackendActive: false,
    firestoreSaveNow: vi.fn(),
  }),
}));

// Tunge underkomponenter er ikke del av denne testen.
vi.mock('./TestimonialEditor', () => ({ TestimonialEditor: () => null }));
vi.mock('./WaitingSponsorsEditor', () => ({ WaitingSponsorsEditor: () => null }));
vi.mock('./CmsLivePreview', () => ({ CmsLivePreview: () => null }));
vi.mock('./CmsMediaLibraryPanel', () => ({ CmsMediaLibraryPanel: () => null }));
vi.mock('./CmsSectionNav', () => ({ CmsSectionNav: () => null }));
vi.mock('./ImagePickerField', () => ({ ImagePickerField: () => null }));
vi.mock('./RichTextEditor', () => ({ RichTextEditor: () => null }));

const { CmsEditor } = await import('./CmsEditor');

describe('CMS-editor: fanen Økonomi og åpenhet', () => {
  beforeEach(() => {
    updateCmsSection.mockClear();
    currentCms = EMPTY_CMS_CONTENT;
  });

  afterEach(() => {
    cleanup();
  });

  it('viser redigerbare felt med dagens tekster når ingenting er lagret', () => {
    render(<CmsEditor initialSubTab="apenhet" />);
    expect(screen.getByDisplayValue('Slik pengene brukes')).toBeTruthy();
    expect(screen.getByDisplayValue('Liten reserve')).toBeTruthy();
    expect(screen.getByText('Franske tekster kommer fra oversettelsene og endres ikke her.')).toBeTruthy();
  });

  it('endring av overskrift kaller updateCmsSection("transparency", …)', () => {
    render(<CmsEditor initialSubTab="apenhet" />);
    fireEvent.change(screen.getByDisplayValue('Slik pengene brukes'), {
      target: { value: 'Ny overskrift' },
    });
    expect(updateCmsSection).toHaveBeenCalledTimes(1);
    const [key, value] = updateCmsSection.mock.calls[0];
    expect(key).toBe('transparency');
    expect(value.title).toBe('Ny overskrift');
    // Øvrige felt beholdes fra standard.
    expect(value.kicker).toBe('Økonomi & åpenhet');
    expect(value.cards).toHaveLength(3);
  });

  it('endring av tittel på et kort oppdaterer riktig kort', () => {
    render(<CmsEditor initialSubTab="apenhet" />);
    fireEvent.change(screen.getByDisplayValue('Liten reserve'), {
      target: { value: 'Reserve til nødsituasjoner' },
    });
    const [key, value] = updateCmsSection.mock.calls[0];
    expect(key).toBe('transparency');
    expect(value.cards[1].title).toBe('Reserve til nødsituasjoner');
    expect(value.cards[0].title).toBe('Månedlig fadderbidrag');
    expect(value.cards[2].title).toBe('Ingen barnehjem-modell');
  });

  it('kan legge til kort opp til fire, og fjerne kort ned til ett', () => {
    currentCms = {
      ...EMPTY_CMS_CONTENT,
      transparency: {
        kicker: 'K',
        title: 'T',
        intro: 'I',
        secondary: 'S',
        cards: [{ id: 'only', title: 'Eneste', description: 'D' }],
      },
    };
    render(<CmsEditor initialSubTab="apenhet" />);
    // Med ett kort finnes ingen «Fjern»-knapp.
    expect(screen.queryByText('Fjern')).toBeNull();
    fireEvent.click(screen.getByText('Nytt kort'));
    const [key, value] = updateCmsSection.mock.calls[0];
    expect(key).toBe('transparency');
    expect(value.cards).toHaveLength(2);
    expect(value.cards[1].title).toBe('');
  });
});
