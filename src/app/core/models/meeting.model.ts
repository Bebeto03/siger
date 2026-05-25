export type MeetingStatus = 'NAO_INICIADO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';

export interface Meeting {
  id?: number;
  title: string;
  description: string;
  location: string;
  meetingDate: string;
  duration: number;
  status?: MeetingStatus;
  // MeetingResponseDTO (POST/PUT/GET /findAll / GET /{id} via controller)
  organizerId?: number;
  organizerName?: string;
  createdAt?: string;
  updatedAt?: string;
}
