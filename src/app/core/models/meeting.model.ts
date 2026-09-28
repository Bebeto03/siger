import { Participant } from './participant.model';

export type MeetingStatus = 'NAO_INICIADO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';

export interface Meeting {
  id?: number;
  title: string;
  description: string;
  location: string;
  meetingDate: string;
  duration: number;
  status?: MeetingStatus;
  // MeetingResponseDTO (PATCH /cancel, GET /filter/*)
  organizerId?: number;
  organizerName?: string;
  createdAt?: string;
  updatedAt?: string;
  // Entidade direta (GET /findAll, GET /{id}) — o backend embute os participantes
  // (Participant.meeting é WRITE_ONLY, então não há loop de serialização)
  participants?: Omit<Participant, 'meeting'>[];
  user?: { id: number; name?: string; email?: string };
  participation?: Participant;
}
