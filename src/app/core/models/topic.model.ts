import { MeetingMinutes } from './meeting-minutes.model';
import { Participant } from './participant.model';

export class Topic {
  id!: number;
  title!: String;
  timer!: number;
  orderIndex!: number;
  concluded!: boolean;
  meetingMinutes!: MeetingMinutes;
  participant!: Participant;
}
