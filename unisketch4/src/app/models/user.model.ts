import {Folder} from "./folder.model";
import {Sketch} from "./sketch.model";

export class User {
    id: number;

    created_at: Date;
    updated_at: Date;

    email_address: string;
    password: string;
    username: string;

    password_reset_token: string;
    password_reset_sent_at: Date;

    folders: Folder[];

    sketches: Sketch[];
    avatar_sketch_id: number;


    old_password?: string;
}
