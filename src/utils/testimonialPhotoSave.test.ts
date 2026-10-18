import { describe, expect, it } from 'vitest';
import { buildTestimonialPhotoFields } from './testimonialPhotoSave';

describe('buildTestimonialPhotoFields', () => {
  it('bruker hovedbilde for barn/fadder uten gammelt voksenbilde', () => {
    const fields = buildTestimonialPhotoFields({
      category: 'child',
      formImageUrl: 'data:image/png;base64,NEW',
      formBarneBildeUrl: '',
      formVoksenBildeUrl: '/testimonial-demo/group.svg',
    });
    expect(fields.bildeUrl).toBe('data:image/png;base64,NEW');
    expect(fields.voksenBildeUrl).toBeUndefined();
  });

  it('graduate: voksenbilde-felt har prioritet over hovedbilde', () => {
    const fields = buildTestimonialPhotoFields({
      category: 'graduate',
      formImageUrl: 'fallback.jpg',
      formBarneBildeUrl: 'child.jpg',
      formVoksenBildeUrl: 'adult.jpg',
    });
    expect(fields.bildeUrl).toBe('adult.jpg');
    expect(fields.barneBildeUrl).toBe('child.jpg');
  });
});
