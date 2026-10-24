import type { UserId } from '@/domain/ids';
import type { Role } from '@/domain/roles';

/** The two built-in accounts. Choosing one is a local account switch, not authentication. */
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
    summary: 'Homeowner · Kothrud, Pune',
    tryThis: ['Post projects', 'Compare quotes', 'Track work'],
  },
  {
    id: CONTRACTOR_PERSONA_ID,
    role: 'contractor',
    name: 'Sahyadri Waterproofing & Civil Works',
    summary: 'Waterproofing & civil contractor · Pune',
    tryThis: ['Find leads', 'Send quotes', 'Run jobs'],
  },
];
