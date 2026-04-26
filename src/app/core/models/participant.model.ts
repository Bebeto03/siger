export type ParticipantRole = 'ORGANIZADOR' | 'PARTICIPANTE' | 'PALESTRANTE';
export type ParticipantParticipation = 'NAO_PARTICIPOU' | 'PARTICIPOU' | 'SIM' | 'NAO' | 'TALVEZ';

export interface Participant {
  id?: number;
  role: ParticipantRole;
  participation?: ParticipantParticipation;
  user: { id: number; name?: string; email?: string };
  meeting: { id: number };
}
