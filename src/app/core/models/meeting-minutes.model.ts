import { Topic } from './topic.model';

export interface MeetingMinutes {
  id?: number;
  objectives: string;
  notes: string;
  decision: string;
  version?: number;
  isCurrent?: boolean;
  createdAt?: string;
  meeting?: { id: number };
  topics?: Topic[];
}

export interface MinutesSummaryRequest {
  objectives: string;
  notes: string;
  decision: string;
}

export interface MinutesSummaryResponse {
  summary: string;
  // outros campos que sua API realmente retorna
}
