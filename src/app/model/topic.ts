import { MeetingMinutes } from "./meeting-minutes";
import { Participant } from "./participant";

export class Topic{

    id !: number;
    title !: String;
    timer !: number;
    orderIndex !: number;
    concluded !: boolean;
    meetingMinutes !: MeetingMinutes;
    participant !: Participant;
    
}