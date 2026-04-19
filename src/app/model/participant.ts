import { Meeting } from "./meeting";
import { Topic } from "./topic";
import { User } from "./user";

export class Participant{

    id !: number;
    user !: User;
    meeting !: Meeting;
    topics = new Array<Topic>();

}