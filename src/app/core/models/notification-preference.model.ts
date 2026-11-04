export type NotificationType =
  | 'MEETING_REMINDER'
  | 'MEETING_INVITE'
  | 'MEETING_CANCELLED'
  | 'TASK_ASSIGNED'
  | 'ORGANIZER_NO_CONFIRMATION';

/** Resposta de GET/PUT /notification/preferences. O toggle controla apenas o e-mail. */
export interface NotificationPreference {
  type: NotificationType;
  description: string;
  emailEnabled: boolean;
  editable: boolean;
}

export interface NotificationPreferenceItem {
  type: NotificationType;
  emailEnabled: boolean;
}
