import { Participant } from "./participant";
import { User } from "./user";

export class Meeting{

    id !: number;
    createdAt !: Date;
    updateAt !: Date;
    meetingDate !: Date;
    title !: String;
    description !: String;
    location !: String;
    duration !: number;
    user !: User;
    participants = new Array<Participant>();

}