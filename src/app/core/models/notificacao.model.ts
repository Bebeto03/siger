export type TipoNotificacao = 'MEETING_REMINDER' | 'ORGANIZER_NO_CONFIRMATION';

export interface Notificacao {
  id: number;
  meetingId: number | null;
  type: TipoNotificacao;
  title: string;
  message: string;
  read: boolean;
  createdAt: string; // ISO local (LocalDateTime do backend, sem fuso)
}

export interface ContagemNaoLidas {
  count: number;
}
