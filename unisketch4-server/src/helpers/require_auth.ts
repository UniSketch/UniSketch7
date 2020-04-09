import * as Express from 'express';

import {SessionHelper} from './session_helper';
import {UniSketchApiError} from './unisketch_api_error';
import {handleApiError} from './handle_api_error';
import {db} from "../database";
import {SketchHelper} from "./sketch_helper";
import {User} from "../models/User";

/**
 * Interface describing the additional fields added to an authenticated request.
 */
export interface RequiresAuth {
    user?: User
}

/**
 * This function is an express middleware to require a valid session for an endpoint.
 * It will also expose the currently logged in user in req.user.
 * If the client is not logged in, requests will fail with status code 401.
 */
export function requireAuth(req: Express.Request & RequiresAuth, res: Express.Response, next: Express.NextFunction): any {
    // Retrieve the currently logged in user from the session helper
    SessionHelper.getCurrentUser(req).then(user => {
        if (!user) {
            throw new UniSketchApiError(401, {success: false, error: 'not_logged_in'});
        }

        req.user = user;

        // this middleware is used for both HTTP as well as Socket.IO, which doesn't have cookie() - so check first
        if (res.cookie) {
            // This cookie is used on the frontend to remember the current login across reloads, therefore it must be unsigned and not httpOnly.
            res.cookie('UniSketchUserId', String(user.id), {httpOnly: false, signed: false});
        }

        // Allow the request to proceed through further middleware
        next();
    }).catch(err => {
        handleApiError(req, res, err);
    });
}

/**
 * This function is an express middleware to require a valid session for a sketch.
 */
export function requireSketchAuth(req: Express.Request & RequiresAuth, res: Express.Response, next: Express.NextFunction): any {
    // Retrieve the currently logged in user from the session helper
    SessionHelper.getCurrentUser(req).then(user => {
        if (!user) {
            // Retrieve the currently visited sketches' id
            const id = SketchHelper.getIdFromRequest(req);

            // Query the db for the sketch to check if it is public or not.
            db.Sketch.findOne(id).then((sketch) => {

                if (sketch.is_public) {
                    //Allow the request to proceed
                    next();
                } else {
                    throw new UniSketchApiError(401, {success: false, error: 'not_logged_in'});
                }
            }).catch(err => {
                throw new UniSketchApiError(401, {success: false, error: 'not_logged_in'});
            });

        } else {

            req.user = user;

            // this middleware is used for both HTTP as well as Socket.IO, which doesn't have cookie() - so check first
            if (res.cookie) {
                // This cookie is used on the frontend to remember the current login across reloads, therefore it must be unsigned and not httpOnly.
                res.cookie('UniSketchUserId', String(user.id), {httpOnly: false, signed: false});
            }

            // Allow the request to proceed through further middleware
            next();
        }
    }).catch(err => {
        handleApiError(req, res, err);
    });
}
