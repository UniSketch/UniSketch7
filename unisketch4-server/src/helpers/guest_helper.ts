
import {SketchSession} from "../sketch/sketch_session";
import {User} from "../models/User";

export namespace GuestHelper {

    export function generateUser(sketchSession: SketchSession): User {

        let user: User = {id: -1, name: `guest-${new Date().getTime()}`} as User;

        //TODO FINISH!

        if (sketchSession) {
            console.log('FOUND CLIENTS IN SKETCH-SESSION:');
            sketchSession.clients.forEach((instance: User) => {
                console.log(instance.name);
            });
        }

        return user;
    }

}