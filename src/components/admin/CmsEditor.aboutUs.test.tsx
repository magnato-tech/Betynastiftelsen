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

describe('CMS-editor: fanen Om oss', () => {
  beforeEach(() => {
    updateCmsSection.mockClear();
    currentCms = EMPTY_CMS_CONTENT;
  });

  afterEach(() => {
    cleanup();
  });

  it('viser standardtekster og hjelpeteksten når ingenting er lagret', () => {
    render(<CmsEditor initialSubTab="omOss" />);
    expect(screen.getByDisplayValue('Historien om Betyna')).toBeTruthy();
    expect(screen.getByDisplayValue('Om Betyna')).toBeTruthy();
    expect(
      screen.getByText(
        'Skriv historien om Betyna – hvordan det startet, hvem som var med og hva som er oppnådd. Modulen vises på forsiden når den er slått på i seksjonslisten og har tekst.',
        { exact: false }
      )
    ).toBeTruthy();
  });

  it('endring av overskrift kaller updateCmsSection("aboutUs", …)', () => {
    render(<CmsEditor initialSubTab="omOss" />);
    fireEvent.change(screen.getByDisplayValue('Historien om Betyna'), {
      target: { value: 'Ny overskrift' },
    });
    expect(updateCmsSection).toHaveBeenCalledTimes(1);
    const [key, value] = updateCmsSection.mock.calls[0];
    expect(key).toBe('aboutUs');
    expect(value.title).toBe('Ny overskrift');
    expect(value.kicker).toBe('Om Betyna');
  });

  it('endring av toppmerking beholder lagret historie', () => {
    currentCms = {
      ...EMPTY_CMS_CONTENT,
      aboutUs: { kicker: 'K', title: 'T', bodyHtml: '<p>Historien</p>' },
    };
    render(<CmsEditor initialSubTab="omOss" />);
    fireEvent.change(screen.getByDisplayValue('K'), { target: { value: 'Ny toppmerking' } });
    const [key, value] = updateCmsSection.mock.calls[0];
    expect(key).toBe('aboutUs');
    expect(value.kicker).toBe('Ny toppmerking');
    expect(value.bodyHtml).toBe('<p>Historien</p>');
  });
});
