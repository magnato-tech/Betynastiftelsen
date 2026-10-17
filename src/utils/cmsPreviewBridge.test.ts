import { describe, expect, it } from 'vitest';
import { CMS_SECTION_DOM_ID } from './cmsPreviewBridge';

describe('cmsPreviewBridge', () => {
  it('mapper CMS-fane til DOM-anker', () => {
    expect(CMS_SECTION_DOM_ID.stories).toBe('historier');
    expect(CMS_SECTION_DOM_ID.kpis).toBe('cms-kpi');
  });
});
