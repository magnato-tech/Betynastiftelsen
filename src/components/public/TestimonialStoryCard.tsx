import React from 'react';
import type { AdultGraduateStory } from '../../types';
import { getStoryDisplayPhotos } from '../../utils/testimonials';
import { isTestimonialIllustrationImageUrl } from '../../utils/testimonialPhotoPresets';

import { SafeHtml } from '../common/SafeHtml';

interface TestimonialStoryCardProps {
  story: AdultGraduateStory;
}

export const TestimonialStoryCard: React.FC<TestimonialStoryCardProps> = ({ story }) => {
  const photos = getStoryDisplayPhotos(story);
  const showIllustrationLabel =
    story.illustrasjonsbilde ||
    isTestimonialIllustrationImageUrl(story.bildeUrl) ||
    isTestimonialIllustrationImageUrl(story.voksenBildeUrl);
  const caption = [story.rolle || story.naavaerendeYrke, story.sted].filter(Boolean).join(' · ');
  const context = story.utdanningslop?.trim();

  return (
    <article className="bg-[#EBE7DC]/70 rounded-xl border border-[#DFD9CB] overflow-hidden flex flex-col h-full">
      {photos.child && photos.adult ? (
        <div className="grid grid-cols-2 gap-0.5 bg-stone-200">
          <figure className="relative aspect-[3/4]">
            <img
              src={photos.child}
              alt={`${story.navn} som barn`}
              referrerPolicy="no-referrer"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <span className="absolute bottom-2 left-2 text-[10px] font-semibold uppercase tracking-wide bg-stone-900/70 text-white px-2 py-0.5 rounded">
              Da
            </span>
          </figure>
          <figure className="relative aspect-[3/4]">
            <img
              src={photos.adult}
              alt={`${story.navn} i dag`}
              referrerPolicy="no-referrer"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <span className="absolute bottom-2 left-2 text-[10px] font-semibold uppercase tracking-wide bg-[#4D6B3E]/90 text-white px-2 py-0.5 rounded">
              Nå
            </span>
          </figure>
        </div>
      ) : photos.single ? (
        <figure>
          <img
            src={photos.single}
            alt={story.navn}
            referrerPolicy="no-referrer"
            className="w-full aspect-[4/3] object-cover"
          />
          {showIllustrationLabel && (
            <figcaption className="text-center text-[11px] text-stone-500 py-1.5 bg-[#F6F4ED] border-t border-[#DFD9CB]">
              Illustrasjonsbilde
            </figcaption>
          )}
        </figure>
      ) : null}

      <div className="p-4 space-y-2 flex-1 flex flex-col">
        <h3 className="text-base font-serif font-bold text-stone-900">{story.navn}</h3>
        {story.historie && (
          <SafeHtml
            html={
              story.historie.trim().startsWith('<')
                ? story.historie
                : `«${story.historie}»`
            }
            className="text-sm text-stone-700 leading-relaxed line-clamp-6 flex-1 rich-html"
          />
        )}
        {context && <p className="text-xs text-stone-600 leading-relaxed">{context}</p>}
        {caption && <p className="text-xs text-stone-500 pt-1">{caption}</p>}
      </div>
    </article>
  );
};
