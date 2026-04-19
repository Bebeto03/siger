import { Meeting } from "./meeting"
import { Topic } from "./topic"

export class MeetingMinutes{

    id !: number;
    objectives !: String;
    notes !: String;
    decision !: String;
    meeting !: Meeting;
    topics = new Array<Topic>();

}