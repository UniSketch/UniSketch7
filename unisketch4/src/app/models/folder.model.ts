import {User} from "./user.model";
import {Sketch} from "./sketch.model";

export class Folder {
    id: number;

    name: string;

    user: User;

    parent: Folder;

    children: Folder[];

    sketches: Sketch[];
}
