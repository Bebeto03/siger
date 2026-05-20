import { Topic } from './topic.model';

export interface MeetingMinutes {
  id?: number;
  objectives: string;
  notes: string;
  decision: string;
  meeting: { id: number };
  topics?: Topic[];
}
