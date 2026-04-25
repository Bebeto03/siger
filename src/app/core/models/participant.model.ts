import { Meeting } from './meeting.model';
import { Topic } from './topic.model';
import { User } from './user.model';

export class Participant {
  id!: number;
  user!: User;
  meeting!: Meeting;
  topics = new Array<Topic>();
}
