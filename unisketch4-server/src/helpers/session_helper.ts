import * as Express from 'express';
import {db} from "../database";
import {User} from "../models/User";

/**
 * We use express-session for our session handling, which can be accessed via req.session.
 * After a successful login, req.session.user_id will contain the id of the current user.
 * Session data is stored on the server, and identified with its session id (which the client receives as "connect.sid" cookie after login).
 */
export namespace SessionHelper {

    /**
     * Returns a Promise that will be resolved with the currently logged in User instance (or null if not logged in).
     */
    export function getCurrentUser(req: Express.Request): Promise<User | null> {
        if (!req.session!.user_id) {
            return Promise.resolve(null);
        }

        return db.User.findOne(req.session!.user_id);
    }

}