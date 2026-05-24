export type MeetingStatus = 'NAO_INICIADO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';

export interface Meeting {
  id?: number;
  title: string;
  description: string;
  location: string;
  meetingDate: string;
  duration: number;
  status?: MeetingStatus;
  // resposta do GET (entidade bruta)
  user?: { id: number; name?: string; email?: string };
  // resposta do POST/PUT (MeetingResponseDTO)
  organizerId?: number;
  organizerName?: string;
  // campo normalizado — preenchido pelo service em ambos os casos
  organizer?: { id: number; name?: string; email?: string };
  createdAt?: string;
  updatedAt?: string;
}
