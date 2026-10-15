import type { Child, FieldFact } from '../types';

export function buildFieldFact(input: {
  child: Child;
  koordinatorId: string;
  trivsel: string;
  dato?: string;
}): FieldFact {
  return {
    id: 'fact-' + Date.now(),
    barnId: input.child.id,
    barnNavn: input.child.fornavn,
    koordinatorId: input.koordinatorId,
    dato: input.dato || new Date().toISOString().slice(0, 10),
    fornavn: input.child.fornavn,
    skoleNavn: input.child.skoleNavn,
    klassetrinn: input.child.klassetrinn,
    trivsel: input.trivsel.trim(),
    status: 'sendt',
  };
}

export function factsWaitingForStory(facts: FieldFact[]): FieldFact[] {
  return facts.filter((f) => f.status === 'sendt').sort((a, b) => a.dato.localeCompare(b.dato));
}
