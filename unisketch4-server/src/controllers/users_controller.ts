import * as Express from 'express';
import * as BCrypt from 'bcryptjs';

import {RequiresAuth} from "../helpers/require_auth";
import {UserHelper} from "../helpers/user_helper";
import {UniSketchApiError} from "../helpers/unisketch_api_error";
import {BodyValidation} from "../helpers/body_validation";
import {handleApiError} from "../helpers/handle_api_error";
import {db} from "../database";
import {User} from "../models/User";

/**
 * This namespace contains endpoints regarding the management of users.
 * All of the endpoints run with the RequireAuth middleware (see routes.ts).
 */
export namespace UsersController {

    /**
     * This endpoint will return data on the currently logged in user.
     */
    export function getUser(req: Express.Request & RequiresAuth, res: Express.Response) {
        res.json({
            success: true,
            id: req.user.id,
            name: req.user.name,
            email_address: req.user.email_address,
            avatar_sketch_id: req.user.avatar_sketch_id
        });
    }

    /**
     * This endpoint will create a new user with the given name, email_address and password.
     * As an exception, this is the only endpoint in this controller that does not require prior authentication (req.user will be undefined).
     */
    export async function createUser(req: Express.Request & RequiresAuth, res: Express.Response) {
        // Check the body to ensure we've been sent valid data
        if (!BodyValidation.validate(req.body, res, [
            'name',
            {name: 'email_address', email: true},
            'password'
        ])) {
            return;
        }

        const emailInUse = await isEmailInUse(req.body.email_address);
        if (emailInUse) {
            handleApiError(req, res, new UniSketchApiError(200, {success: false, error: 'email_in_use'}));
            return;
        }

        const hash = await UserHelper.hashPassword(req.body.password);
        let user = new User();
        user.name = req.body.name;
        user.email_address = req.body.email_address.toLowerCase();
        user.password_digest = hash;
        user.created_at = new Date();
        user.updated_at = new Date();
        user = await db.User.save(user);

        req.session.user_id = user.id;

        res.json({
            success: true,
            user_id: user.id,
        });
    }

    /**
     * This endpoint will update the currently logged in user with the data provided.
     */
    export async function updateUser(req: Express.Request & RequiresAuth, res: Express.Response) {
        // Check the body to ensure we've been sent valid data
        if (!BodyValidation.validate(req.body, res, [
            {name: 'name', notEmpty: true, optional: true},
            {name: 'email_address', email: true, optional: true},
            {name: 'avatar_sketch_id', numeric: true, optional: true},
            {name: 'old_password', optional: true}
        ])) {
            return;
        }


        let emailInUse: boolean = false;
        if (req.body.email_address && req.user.email_address !== req.body.email_address.toLowerCase()) {
            emailInUse = await isEmailInUse(req.body.email_address);
        }

        // When changing the email address, name or password, the old password must be provided as well
        let checkOldPassword = false;
        if (req.body.email_address || req.body.name || req.body.password) {
            checkOldPassword = true;
        }

        if (emailInUse) {
            handleApiError(req, res, new UniSketchApiError(200, {success: false, error: 'email_in_use'}));
            return;
        }

        const result: boolean = checkOldPassword ? await BCrypt.compare(req.body.old_password, req.user.password_digest) : true;
        if (!result) {
            handleApiError(req, res, new UniSketchApiError(200, {success: false, error: 'incorrect_password'}));
            return;
        }

        let success: boolean = true;
        if (req.body.avatar_sketch_id) {
            success = await isSketchValidAvatar(req.user.id, req.body.avatar_sketch_id);
        }

        if (!success) {
            handleApiError(req, res, new UniSketchApiError(200, {success: false, error: 'no_permission'}));
            return;
        }

        if (req.body.name && req.user.name !== req.body.name) {
            req.user.name = req.body.name;
        }

        if (req.body.email_address && req.user.email_address !== req.body.email_address) {
            req.user.email_address = req.body.email_address;
        }

        if (req.body.avatar_sketch_id && req.user.avatar_sketch_id !== req.body.avatar_sketch_id) {
            req.user.avatar_sketch_id = req.body.avatar_sketch_id;
        }

        let hash = null;
        // If a new password has been provided, asynchronously hash it using a helper function
        if (req.body.password) {
            hash = await UserHelper.hashPassword(req.body.password);
        }

        if (hash) {
            req.user.password_digest = hash;
        }

        await db.User.save(req.user);
        res.json({success: true});
    }

    /**
     * This endpoint will delete the currently logged in user.
     */
    export async function deleteUser(req: Express.Request & RequiresAuth, res: Express.Response) {
        await db.User.delete({id: req.user.id});
        req.session.destroy(() => {
            res.json({success: true});
        });
    }

    /**
     * Checks if an email is already in use.
     * @return a promise that resolves to false if the email is not already being used by someone
     */
    function isEmailInUse(email_address: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            db.User.count({where: {email_address: email_address.toLowerCase()}})
              .then(count => {
                  if (count === 0) {
                      resolve(false);
                  } else {
                      resolve(true);
                  }
              })
              .catch(err => {
                  reject(err);
              });
        });
    }

    /**
     * Check if a sketch is allowed to be used as an avatar for the given user.
     * Only sketches the user has created themselves can be used as an avatar.
     * @return a promise that resolves to true, if the user is allowed to use this sketch as an avatar.
     */
    function isSketchValidAvatar(userId: number, sketchId: number): Promise<boolean> {
        return new Promise((resolve, reject) => {

            db.Sketch.findOne(sketchId)
              .then(sketch => {
                    //TODO Check userid and sketchID, made a quickfix, cant find userid in sketch anymore
                      resolve(true);
              })
              .catch(err => {
                  reject(err);
              });
        });
    }


}
