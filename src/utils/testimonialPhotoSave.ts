import type { AdultGraduateStory, TestimonialCategory } from '../types';

export type TestimonialPhotoSaveInput = {
  category: TestimonialCategory;
  formImageUrl: string;
  formBarneBildeUrl: string;
  formVoksenBildeUrl: string;
};

/** Én kilde for hvordan hovedbilde lagres på vitnesbyrd (unngår at gammelt voksenbilde overstyrer nytt valg). */
export function buildTestimonialPhotoFields(
  input: TestimonialPhotoSaveInput
): Pick<AdultGraduateStory, 'bildeUrl' | 'barneBildeUrl' | 'voksenBildeUrl'> {
  const mainUrl = input.formImageUrl.trim();
  const barneUrl = input.category === 'graduate' ? input.formBarneBildeUrl.trim() || undefined : undefined;

  let voksenUrl: string | undefined;
  if (input.category === 'graduate') {
    voksenUrl = input.formVoksenBildeUrl.trim() || mainUrl || undefined;
  } else {
    voksenUrl = mainUrl || undefined;
  }

  const bildeUrl = voksenUrl || barneUrl;

  return {
    bildeUrl,
    barneBildeUrl: barneUrl,
    voksenBildeUrl: input.category === 'graduate' ? voksenUrl : undefined,
  };
}
