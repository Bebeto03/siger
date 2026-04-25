import { Meeting } from './meeting.model';
import { Topic } from './topic.model';

export class MeetingMinutes {
  id!: number;
  objectives!: String;
  notes!: String;
  decision!: String;
  meeting!: Meeting;
  topics = new Array<Topic>();
}
