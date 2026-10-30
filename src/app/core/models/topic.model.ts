import { ParticipantRequestDTO } from "./participant.model";

export type TopicPriority = 'ALTA' | 'MEDIA' | 'BAIXA';

export interface Topic {
  id?: number;
  title: string;
  time ?: number;
  orderIndex: number;
  concluded: boolean;
  priority: TopicPriority;
  responsibleParticipant ?: ParticipantRequestDTO;
  meetingMinutes: { id: number };
}
