import { Participant } from "./participant";
import { Meeting } from "./meeting";

export class User{

    id !: number;
    createdAt !: Date;
    updateAt !: Date;
    lastLogin !: Date;
    name !: String;
    email !: String;
    password !: String;
    cpf !: String;
    phone !: String;
    createdBy !: String;
    updateBy !: String;
    participant !: Participant;
    meetings = new Array<Meeting>();

}