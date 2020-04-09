import * as Express from 'express';

import {UniSketchApiError} from '../helpers/unisketch_api_error';
import {BodyValidation} from '../helpers/body_validation';
import {RightsHelper} from '../helpers/rights_helper';
import {RequiresAuth} from '../helpers/require_auth';
import {handleApiError} from '../helpers/handle_api_error';
import {sketchSessionManager} from '../sketch/sketch_session_manager';
import {db} from '../database';
import {Right} from "../models/Right";

/**
 * This namespace contains endpoints regarding the permission management on sketches.
 * All of the endpoints run with the RequireAuth middleware (see routes.ts).
 */
export namespace RightsController {

    /**
     * This endpoint will return a list of all users that were granted rights to a sketch.
     */
    export async function getRights(req: Express.Request & RequiresAuth, res: Express.Response) {
        // Check the body to ensure we've been sent valid data
        if (!BodyValidation.validate(req.params, res, [
            {name: 'sketch_id', numeric: true}
        ])) {
            return;
        }

        let includeEmails = false;

        const right = await db.Right.findOne({where: {user: {id: req.user.id}, sketch: {id: req.params.sketch_id}}});
        if (!RightsHelper.canAccessSketch(right)) {
            handleApiError(req, res, new UniSketchApiError(403, {success: false, error: 'no_permission'}));
            return;
        }

        if (RightsHelper.canManageRights(right)) {
            includeEmails = true;
        }
        const rights = await db.Right.find({where: {sketch: {id: req.params.sketch_id}}, relations: ['user']});
        let result: any[] = [];
        // Iterate through the participants and build the response object
        rights.forEach(it => {
            let entry: any = {
                user_id: it.user.id,
                name: it.user.name,
                role: it.role_id
            };

            if (includeEmails) {
                entry.email_address = it.user.email_address;
            }

            result.push(entry);
        });
        res.json({success: true, user_roles: result});
    }

    /**
     * This endpoint will grant or update a user's right to a sketch.
     */
    export async function grantRight(req: Express.Request & RequiresAuth, res: Express.Response) {
        // Check the body to ensure we've been sent valid data
        if (!BodyValidation.validate(req.body, res, [
            {name: 'sketch_id', numeric: true},
            'email_address',
            {name: 'role_id', pattern: /^[1-3]$/},
        ])) {
            return;
        }

        const right = await db.Right.findOne({where: {user: {id: req.user.id}, sketch: {id: req.body.sketch_id}}});
        if (!RightsHelper.canManageRights(right)) {
            handleApiError(req, res, new UniSketchApiError(403, {success: false, error: 'no_permission'}));
            return;
        }

        const user = await db.User.findOne({where: {email_address: req.body.email_address.toLowerCase()}});
        const sketch = await db.Sketch.findOne(req.body.sketch_id);

        if (!user) {
            handleApiError(req, res, new UniSketchApiError(200, {success: false, error: 'user_not_found'}));
            return;
        }

        if (+user.id === +req.user.id) {
            handleApiError(req, res, new UniSketchApiError(200, {success: false, error: 'cannot_grant_self'}));
            return;
        }

        if (!sketch) {
            handleApiError(req, res, new UniSketchApiError(200, {success: false, error: 'sketch_not_found'}));
            return;
        }

        const targetRight = await db.Right.findOne({where: {sketch: {id: req.body.sketch_id}, user: {id: user.id}}});

        if (!targetRight) {
            const newRight = new Right();
            newRight.sketch = sketch;
            newRight.user = user;
            newRight.role_id = req.body.role_id;
            await db.Right.save(newRight);
        } else {
            targetRight.role_id = req.body.role_id;
            await db.Right.save(targetRight);
        }

        const sketchSession = sketchSessionManager.getSketchSession(req.body.sketch_id);
        if (sketchSession) {
            sketchSession.onRoleUpdated(user.id, req.body.role_id);
        }

        res.json({success: true});
    }

    /**
     * This endpoint will revoke a user's rights to a sketch.
     */
    export async function revokeRight(req: Express.Request & RequiresAuth, res: Express.Response) {
        // Check the body to ensure we've been sent valid data
        if (!BodyValidation.validate(req.body, res, [
            {name: 'sketch_id', numeric: true},
            {name: 'user_id', numeric: true, optional: true}
        ])) {
            return;
        }

        let reqUserId = req.body.user_id;
        // If no user_id has been provided, assume the user is revoking their own rights to a sketch (removing it from their library)
        if (!reqUserId) {
            reqUserId = req.user.id;
        }

        const right = await db.Right.findOne({where: {user: {id: req.user.id}, sketch: {id: req.body.sketch_id}}});
        if (!right) {
            handleApiError(req, res, new UniSketchApiError(403, {success: false, error: 'user_not_found'}));
            return;
        }

        if (+reqUserId === +req.user.id) {
            if (RightsHelper.isOwner(right)) {
                const count = await db.Right.count({where: {sketch: {id: req.body.sketch_id}, role_id: 3}});
                if (count === 1) {
                    handleApiError(req, res, new UniSketchApiError(200, {success: false, error: 'last_owner_left'}));
                    return;
                }
            }
        } else if (!RightsHelper.canManageRights(right)) {
            handleApiError(req, res, new UniSketchApiError(403, {success: false, error: 'no_permission'}));
            return;
        }

        await db.Right.delete({user: {id: reqUserId}, sketch: {id: req.body.sketch_id}});

        const sketchSession = sketchSessionManager.getSketchSession(req.body.sketch_id);
        if (sketchSession) {
            sketchSession.onRightRevoked(reqUserId);
        }

        res.json({success: true});
    }

}