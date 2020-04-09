import * as Express from 'express';
import * as BCrypt from 'bcryptjs';
import * as Crypto from 'crypto';

import {BodyValidation} from '../helpers/body_validation';
import {db} from '../database';
import {UniSketchApiError} from '../helpers/unisketch_api_error';
import {handleApiError} from '../helpers/handle_api_error';
import {SessionHelper} from '../helpers/session_helper';
import {UserHelper} from '../helpers/user_helper';
import {mailHelper} from "../helpers/mail_helper";
import {app} from "../app";

/**
 * This namespace contains endpoints regarding the authentication of users.
 */
export namespace AuthController {

    /**
     * This endpoint will attempt to login a user based on their email and password.
     */

    export async function login(req: Express.Request, res: Express.Response) {
        // Check the body to ensure we've been sent valid data
        if (!BodyValidation.validate(req.body, res, [
            'email_address',
            'password'
        ])) {

            return;
        }

        const user = await db.User.findOne({where: {email_address: req.body.email_address.toLowerCase()}});
        if (!user) {
            handleApiError(req, res, new UniSketchApiError(200, {success: false, error: 'user_not_found'}));
            return;
        }
        const result = await BCrypt.compare(req.body.password, user.password_digest);
        if (!result) {
            handleApiError(req, res, new UniSketchApiError(200, {success: false, error: 'incorrect_password'}));
            return;
        }
        req.session.user_id = user.id;

        res.json({
            success: true,
            user_id: user.id
        });
    }

    /**
     * This endpoint will log the current user out, destroying their session.
     */
    export async function logout(req: Express.Request, res: Express.Response) {
        // Unlike endpoints outside of the auth namespace, this endpoint does not use the RequireAuth middleware.
        // Therefore, we need to grab the current user manually
        const user = await SessionHelper.getCurrentUser(req);
        if (!user) {
            handleApiError(req, res, new UniSketchApiError(401, {success: false, error: 'not_logged_in'}));
            return;
        }
        req.session.destroy(() => {
            res.clearCookie('UniSketchUserId');
            res.json({success: true});
        });

    }

    /**
     * This endpoint will generate a password request token for a user and send it to them via email.
     * TODO this isn't fully implemented yet - see MailHelper
     */
    export async function requestPasswordReset(req: Express.Request, res: Express.Response) {
        // Check the body to ensure we've been sent valid data
        if (!BodyValidation.validate(req.body, res, [
            'email_address'
        ])) {
            return;
        }


        const user = await db.User.findOne({where: {email_address: req.body.email_address.toLowerCase()}});
        if (!user) {
            handleApiError(req, res, new UniSketchApiError(200, {success: false, error: "user_not_found"}));
            return;
        }
        user.password_reset_token = await generateUniqueResetToken();
        user.password_reset_sent_at = new Date();
        await db.User.save(user);
        await mailHelper.sendPasswordReset(req,user);
        res.json({success: true});
    }

    /**
     * This endpoint checks if a password reset token is valid and responds with an error, if necessary.
     * For the actual password reset, see completePasswordReset()
     */
    export async function checkPasswordReset(req: Express.Request, res: Express.Response) {
        // Check the body to ensure we've been sent valid data
        if (!BodyValidation.validate(req.body, res, [
            'token'
        ])) {
            return ;
        }


        const user = await db.User.findOne({where: {password_reset_token: urlsafeBase64(req.body.token)}});
        if (!user) {
            handleApiError(req, res, new UniSketchApiError(200, {success: false, error: "user_not_found"}));
            return;
        }
        // Ensure the password reset token is still valid - expiration time is based on the configuration file
        let then = user.password_reset_sent_at;
        let now = Date.now();
        if (now - then.getTime() >= app.config.password_reset_token_expiration_time) {
            handleApiError(req, res, new UniSketchApiError(200, {success: false, error: "token_expired"}));
            return;
        }

        // If the token was found and is still valid, confirm the success to the client.
        res.json({success: true});
    }

    /**
     * This endpoint completes a password reset. If the token is valid, the password for the user will be changed to the new one given by the client.
     */

    export async function completePasswordReset(req: Express.Request, res: Express.Response) {
        // Check the body to ensure we've been sent valid data
        if (!BodyValidation.validate(req.body, res, [
            'token',
            'password'
        ])) {
            return;
        }

        const user = await db.User.findOne({where: {password_reset_token: urlsafeBase64(req.body.token)}});
        if (!user) {
            handleApiError(req, res, new UniSketchApiError(200, {success: false, error: "token_expired"}));
            return;
        }
        user.password_digest = await UserHelper.hashPassword(req.body.password);
        user.password_reset_token = null;
        user.password_reset_sent_at = null;
        await db.User.save(user);
        res.json({success: true});
    }

    /**
     * This function removes illegal characters from a base64 encoded string to ensure it can be used as a URL parameter.
     */
    function urlsafeBase64(base64: string): string {
        return encodeURIComponent(base64);
    }

    /**
     * This function asynchronously generates a unique token to be used for a password reset.
     */
    function generateUniqueResetToken(): Promise<string> {
        return new Promise((resolve, reject) => {
            // Generate a random token of 128 bytes
            Crypto.randomBytes(128, (err, buf) => {
                if (err) {
                    reject(err);
                }

                // Encode the bytes in base64 and remove illegal characters for it to be used in an URL
                let hash = urlsafeBase64(buf.toString('base64'));

                // Ensure this token isn't already assigned to a different user
                db.User.count({where: {password_reset_token: hash}})
                  .then(count => {
                      // If the tiny chance of a collision occurs, try again with a new token
                      if (count > 0) {
                          return generateUniqueResetToken()
                              .then(token => {
                                  resolve(token);
                              });
                      }

                      // Resolve the promise with the unique token for the password reset
                      resolve(hash);
                  });
            })
        });
    }

}