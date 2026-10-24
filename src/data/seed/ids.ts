import type { ConversationId, ProjectId, QuoteId, UserId, WorkspaceId } from '@/domain/ids';
import { CONTRACTOR_PERSONA_ID, OWNER_PERSONA_ID } from '../personas';

/** Fixed seed IDs. Stable across resets so relationships (and tests) never drift. */
export const U = {
  meera: OWNER_PERSONA_ID,
  arjun: 'usr_owner_arjun' as UserId,
  farah: 'usr_owner_farah' as UserId,
  vikram: 'usr_owner_vikram' as UserId,
  sahyadri: CONTRACTOR_PERSONA_ID,
  deccan: 'usr_ctr_deccanseal' as UserId,
  ganesh: 'usr_ctr_shreeganesh' as UserId,
  jal: 'usr_ctr_jal' as UserId,
  konkan: 'usr_ctr_konkan' as UserId,
  tilecraft: 'usr_ctr_tilecraft' as UserId,
  voltline: 'usr_ctr_voltline' as UserId,
  godavari: 'usr_ctr_godavari' as UserId,
  kaveri: 'usr_ctr_kaveri' as UserId,
} as const;

export const P = {
  terrace: 'prj_seed_terrace' as ProjectId,
  bathroom: 'prj_seed_bathroom' as ProjectId,
  compound: 'prj_seed_compound' as ProjectId,
  plumbing: 'prj_seed_plumbing' as ProjectId,
  paver: 'prj_seed_paver' as ProjectId,
  basement: 'prj_seed_basement' as ProjectId,
  staircase: 'prj_seed_staircase' as ProjectId,
  garden: 'prj_seed_terrace_garden' as ProjectId,
  watertank: 'prj_seed_watertank' as ProjectId,
  leak: 'prj_seed_leak' as ProjectId,
  officeTiles: 'prj_seed_office_tiles' as ProjectId,
  peb: 'prj_seed_peb' as ProjectId,
  trimix: 'prj_seed_trimix' as ProjectId,
  electrical: 'prj_seed_electrical' as ProjectId,
} as const;

export const Q = {
  terraceSahyadri: 'qt_seed_terrace_sahyadri' as QuoteId,
  terraceDeccan: 'qt_seed_terrace_deccan' as QuoteId,
  terraceGanesh: 'qt_seed_terrace_ganesh' as QuoteId,
  bathSahyadri: 'qt_seed_bath_sahyadri' as QuoteId,
  bathGanesh: 'qt_seed_bath_ganesh' as QuoteId,
  plumbingJal: 'qt_seed_plumbing_jal' as QuoteId,
  basementSahyadri: 'qt_seed_basement_sahyadri' as QuoteId,
  staircaseSahyadri: 'qt_seed_staircase_sahyadri' as QuoteId,
  staircaseGanesh: 'qt_seed_staircase_ganesh' as QuoteId,
  leakSahyadri: 'qt_seed_leak_sahyadri' as QuoteId,
  officeSahyadri: 'qt_seed_office_sahyadri' as QuoteId,
  officeTilecraft: 'qt_seed_office_tilecraft' as QuoteId,
  pebKonkan: 'qt_seed_peb_konkan' as QuoteId,
} as const;

export const W = {
  bathroom: 'ws_seed_bathroom' as WorkspaceId,
  plumbing: 'ws_seed_plumbing' as WorkspaceId,
} as const;

export const C = {
  terraceSahyadri: 'cnv_seed_terrace_sahyadri' as ConversationId,
  terraceGanesh: 'cnv_seed_terrace_ganesh' as ConversationId,
  bathroom: 'cnv_seed_bathroom' as ConversationId,
  plumbing: 'cnv_seed_plumbing' as ConversationId,
  staircase: 'cnv_seed_staircase_sahyadri' as ConversationId,
  garden: 'cnv_seed_garden_sahyadri' as ConversationId,
} as const;
