export type MeetingStatus = 'NAO_INICIADO' | 'EM_ANDAMENTO' | 'CONCLUIDO';

export interface Meeting {
  id?: number;
  title: string;
  description: string;
  location: string;
  meetingDate: string;
  duration: number;
  status?: MeetingStatus;
  organizer?: { id: number; name?: string; email?: string };
  createdAt?: string;
  updatedAt?: string;
}
