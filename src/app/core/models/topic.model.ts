export type TopicPriority = 'ALTA' | 'MEDIA' | 'BAIXA';

export interface Topic {
  id?: number;
  title: string;
  timer?: number;
  orderIndex: number;
  concluded: boolean;
  priority: TopicPriority;
  responsible?: { id: number };
  meetingMinutes: { id: number };
}
