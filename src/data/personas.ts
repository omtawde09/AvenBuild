import type { UserId } from '@/domain/ids';
import type { Role } from '@/domain/roles';

/** The two demo personas. Both are fictional; selecting one is not authentication. */
export const OWNER_PERSONA_ID = 'usr_owner_meera' as UserId;
export const CONTRACTOR_PERSONA_ID = 'usr_ctr_sahyadri' as UserId;

export const PERSONA_IDS = [OWNER_PERSONA_ID, CONTRACTOR_PERSONA_ID] as const;

export interface PersonaCard {
  id: UserId;
  role: Role;
  name: string;
  summary: string;
  tryThis: ReadonlyArray<string>;
}

export const personaCards: ReadonlyArray<PersonaCard> = [
  {
    id: OWNER_PERSONA_ID,
    role: 'owner',
    name: 'Meera Kulkarni',
    summary: 'Fictional homeowner in Kothrud, Pune, with a terrace leak, a bathroom refit and a compound wall to build.',
    tryThis: ['Post a project brief', 'Compare itemised quotes', 'Approve milestones on an active job'],
  },
  {
    id: CONTRACTOR_PERSONA_ID,
    role: 'contractor',
    name: 'Sahyadri Waterproofing & Civil Works',
    summary: 'Fictional Pune contractor for waterproofing, RCC and tile work, serving Pune and Pimpri-Chinchwad.',
    tryThis: ['Find matching leads', 'Build an itemised quote', 'Post site updates on an active job'],
  },
];
