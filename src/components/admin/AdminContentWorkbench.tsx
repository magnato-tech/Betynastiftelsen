import React from 'react';
import { CheckCircle, X } from 'lucide-react';
import type { Child, FieldFact, Report } from '../../types';
import { SponsorFacingPreview } from './SponsorFacingPreview';

type StoryDraft = {
  fornavn: string;
  skoleNavn: string;
  klassetrinn: string;
  trivsel: string;
  historie: string;
};

interface StoryProps {
  mode: 'historie';
  fact: FieldFact;
  child: Child;
  latestApproved?: Report;
  draft: StoryDraft;
  onChange: (draft: StoryDraft) => void;
  onClose: () => void;
  onPublish: () => void;
}

interface ReportProps {
  mode: 'rapport';
  report: Report;
  child: Child;
  titleNo: string;
  bodyNo: string;
  onTitle: (v: string) => void;
  onBody: (v: string) => void;
  onClose: () => void;
  onPublish: () => void;
}

export type AdminContentWorkbenchProps = StoryProps | ReportProps;

export const AdminContentWorkbench: React.FC<AdminContentWorkbenchProps> = (props) => {
  const canPublish =
    props.mode === 'historie'
      ? props.draft.historie.trim().length >= 40 &&
        props.draft.fornavn.trim().length > 0 &&
        props.draft.skoleNavn.trim().length > 0 &&
        props.draft.klassetrinn.trim().length > 0
      : props.titleNo.trim().length >= 3 && props.bodyNo.trim().length >= 20;
  // Forklarer hvorfor «Publiser til fadder» er sperret.
  const publishHint =
    props.mode === 'historie'
      ? 'Fyll inn fornavn, skole og klassetrinn, og skriv minst 40 tegn i historien.'
      : 'Skriv en norsk tittel (minst 3 tegn) og norsk tekst (minst 20 tegn).';

  const childForPreview =
    props.mode === 'historie'
      ? {
          ...props.child,
          fornavn: props.draft.fornavn,
          skoleNavn: props.draft.skoleNavn,
          klassetrinn: props.draft.klassetrinn,
        }
      : props.child;

  const storyText = props.mode === 'historie' ? props.draft.historie : props.child.bakgrunnskontekst;

  return (
    <div className="bg-white border-2 border-[#4D6B3E]/50 rounded-2xl p-5 md:p-7 shadow-md space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-[#4D6B3E] font-semibold">
            {props.mode === 'historie' ? 'Historie til faddersiden' : 'Rapport til fadder'}
          </span>
          <h3 className="text-lg font-serif font-bold text-stone-900 mt-0.5">
            {props.mode === 'historie' ? props.draft.fornavn : props.report.barnNavn}
          </h3>
          <p className="text-xs text-stone-500 mt-1">
            {props.mode === 'historie'
              ? 'Fakta til venstre. Teksten fadderen leser til høyre. Publiser når det er rolig og verdig.'
              : 'Fransk original til venstre. Juster norsk tekst. Du retter selv — saken sendes ikke tilbake til Kongo.'}
          </p>
        </div>
        <button
          type="button"
          onClick={props.onClose}
          className="p-1.5 text-stone-400 hover:text-stone-800 cursor-pointer rounded-lg"
          aria-label="Lukk skriveflate"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {props.mode === 'historie' ? (
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
            <p className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold">
              Fakta fra koordinator · du kan rette og legge til
            </p>
            <label className="block text-xs font-semibold text-stone-700">
              Fornavn
              <input
                value={props.draft.fornavn}
                onChange={(e) => props.onChange({ ...props.draft, fornavn: e.target.value })}
                className="mt-1 w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-sm"
              />
            </label>
            <label className="block text-xs font-semibold text-stone-700">
              Skole
              <input
                value={props.draft.skoleNavn}
                onChange={(e) => props.onChange({ ...props.draft, skoleNavn: e.target.value })}
                className="mt-1 w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-sm"
              />
            </label>
            <label className="block text-xs font-semibold text-stone-700">
              Klassetrinn
              <input
                value={props.draft.klassetrinn}
                onChange={(e) => props.onChange({ ...props.draft, klassetrinn: e.target.value })}
                className="mt-1 w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-sm"
              />
            </label>
            <label className="block text-xs font-semibold text-stone-700">
              Koordinatorens linjer
              <textarea
                rows={5}
                value={props.draft.trivsel}
                onChange={(e) => props.onChange({ ...props.draft, trivsel: e.target.value })}
                className="mt-1 w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-sm leading-relaxed"
              />
            </label>
            <p className="text-[11px] text-stone-500">Ikke helseopplysninger. Ikke etternavn. Ikke intern kode.</p>
          </div>
        ) : (
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
            <p className="text-[10px] uppercase tracking-wider text-[#4D6B3E] font-semibold">Original fra Kongo (fransk)</p>
            <p className="text-sm font-semibold text-stone-900">{props.report.tittelFransk}</p>
            <p className="text-xs sm:text-sm text-stone-800 leading-relaxed whitespace-pre-line">
              {props.report.innholdFransk}
            </p>
            {props.report.skoleprestasjon && (
              <p className="text-xs text-stone-500 pt-2 border-t border-stone-200">
                Feltnotat: {props.report.skoleprestasjon}
              </p>
            )}
          </div>
        )}

        <div className="p-4 bg-[#A3B18A]/10 rounded-xl border border-[#A3B18A]/40 space-y-3">
          <p className="text-[10px] uppercase tracking-wider text-[#4D6B3E] font-semibold">
            {props.mode === 'historie' ? 'Historien fadderen leser' : 'Norsk rapport fadderen leser'}
          </p>
          {props.mode === 'historie' ? (
            <textarea
              rows={14}
              value={props.draft.historie}
              onChange={(e) => props.onChange({ ...props.draft, historie: e.target.value })}
              placeholder="Skriv en rolig, verdig tekst. Koordinatorens linjer er utgangspunkt, ikke ferdig historie."
              className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-sm leading-relaxed min-h-[220px]"
            />
          ) : (
            <>
              <label className="block text-xs font-semibold text-stone-700">
                Tittel
                <input
                  value={props.titleNo}
                  onChange={(e) => props.onTitle(e.target.value)}
                  className="mt-1 w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-sm"
                />
              </label>
              <label className="block text-xs font-semibold text-stone-700">
                Tekst
                <textarea
                  rows={10}
                  value={props.bodyNo}
                  onChange={(e) => props.onBody(e.target.value)}
                  className="mt-1 w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-sm leading-relaxed"
                />
              </label>
            </>
          )}
        </div>
      </div>

      <SponsorFacingPreview
        child={childForPreview}
        story={storyText}
        latestApproved={props.mode === 'historie' ? props.latestApproved : undefined}
        reportTitle={props.mode === 'rapport' ? props.titleNo : undefined}
        reportBody={props.mode === 'rapport' ? props.bodyNo : undefined}
        reportDate={props.mode === 'rapport' ? props.report.dato : undefined}
      />

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={props.onClose}
          className="px-4 py-2.5 text-xs text-stone-600 hover:text-stone-900 cursor-pointer"
        >
          Behold i kø
        </button>
        <button
          type="button"
          disabled={!canPublish}
          onClick={props.onPublish}
          className="px-5 py-2.5 bg-[#4D6B3E] hover:bg-[#3B522F] disabled:opacity-50 text-white text-xs font-medium rounded-lg cursor-pointer inline-flex items-center justify-center gap-1.5"
        >
          <CheckCircle className="w-4 h-4" />
          Publiser til fadder
        </button>
      </div>
      {!canPublish && <p className="text-[11px] text-amber-800 text-right">{publishHint}</p>}
    </div>
  );
};
