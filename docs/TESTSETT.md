# Testsett per sprint

Hvert sett følger workflows og sjekker at rollen **kan utføre** handlingen. Automatikk: `npm test`. Manuelt: Visningsmodus + Nullstill data.

| Sprint | Fil | Status |
|--------|-----|--------|
| 0 | `src/workflows/sprint0.workflows.test.ts` | Kjører mot seed |
| 1 | `src/workflows/sprint1.workflows.test.ts` | `it.todo` til innholdskø finnes |
| 2 | `src/workflows/sprint2.workflows.test.ts` | `it.todo` |
| 3 | `src/workflows/sprint3.workflows.test.ts` | `it.todo` |
| 4 | `src/workflows/sprint4.workflows.test.ts` | `it.todo` |
| 5 | `src/workflows/sprint5.workflows.test.ts` | `it.todo` |
| ADM-10 | `src/newsletter/*.test.ts`, `src/email/*.test.ts` | Payload + kø; sending uten nøkkel = 503 |
| ADM-11 | `src/email/composeInquiryAnswered.test.ts` | Publisert svar → systemmelding med lenke |

Når en sprint kodes ferdig: gjør `it.todo` om til ekte tester. Ikke merk sprint ferdig uten at testsettet er grønt.
