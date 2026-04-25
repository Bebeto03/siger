import { Participant } from './participant.model';
import { User } from './user.model';

export class Meeting {
  id!: number;
  createdAt!: Date;
  updateAt!: Date;
  meetingDate!: Date;
  title!: String;
  description!: String;
  location!: String;
  duration!: number;
  user!: User;
  participants = new Array<Participant>();
}
