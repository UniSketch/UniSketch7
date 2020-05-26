import * as Express from 'express';
import * as FileUpload from 'express-fileupload';

import {BodyValidation} from "../helpers/body_validation";
import {RequiresAuth} from "../helpers/require_auth";
import {UniSketchApiError} from "../helpers/unisketch_api_error";
import {RightsHelper} from "../helpers/rights_helper";
import {handleApiError} from "../helpers/handle_api_error";
import {db} from "../database";
import {SketchRepository} from "../repositories/SketchRepository";
import {FolderRepository} from "../repositories/FolderRepository";
import {RightRepository} from "../repositories/RightRepository";
import {Polyline} from "../models/Polyline";
import {PolylineRepository} from "../repositories/PolylineRepository";
import {Sketch} from "../models/Sketch";
import {Right} from "../models/Right";
import * as path from "path";

export enum Order {
    Asc = 'ASC',
    Desc = 'DESC',
}

export interface IOrderBy {
    property: string;
    order: Order;
}

/**
 * This namespace contains endpoints regarding the management of sketches.
 * All of the endpoints run with the RequireAuth middleware (see routes.ts).
 */
export namespace SketchesController {

    export async function toggleVisibility(req: Express.Request & RequiresAuth, res: Express.Response) {
        if (!BodyValidation.validate(req.params, res, [
            {name: 'sketch_id', numeric: true}
        ])) {
            return;
        }

        const sketch = await db.Sketch.findOne({
            where: {id: req.params.sketch_id ,user: {id: req.user.id}},
            select: ['id', 'is_public'],
            relations: ['rights']
        });

        if (!sketch) {
            handleApiError(req, res, new UniSketchApiError(200, {success: false, error: 'sketch_not_found'}));
            return;
        }

        // Only proceed if the user is an owner of this sketch
        if (!RightsHelper.isOwner(sketch.rights[0])) { // the where: limits it to one entry, but we still have to grab the first of the size 1 array due to how the association is set up
            handleApiError(req, res, new UniSketchApiError(403, {success: false, error: 'no_permission'}));
            return;
        }
        sketch.is_public = !sketch.is_public;
        await db.Sketch.save(sketch);
        res.json({success: true});
    }

    export async function getPublicSketches(req: Express.Request & RequiresAuth, res: Express.Response) {
        const sketches = await db.Sketch.find({
            where: {is_public: true},
            select: ['id', 'title', 'title_small', 'updated_at'],
            take: 20,
            order: {
                updated_at: 'DESC',
            }
        });
        res.json({success: true, sketches: sketches});
    }

    /**
     * This endpoint will return a list of all sketches the currently logged in user is allowed to view.
     */
    export async function getSketches(req: Express.Request & RequiresAuth, res: Express.Response) {

        let orderBy: IOrderBy = {
            property: '',
            order: Order.Desc,
        };

        switch (req.params.orderBy) {
            case 'name' :
                orderBy = {property: 'sketch.title_small', order: Order.Asc};
                break;
            default:
                orderBy = {property: 'sketch.updated_at', order: Order.Desc};
        }

        const folderId = +req.params.folder_id !== -1 ? +req.params.folder_id : null;
        // Find all sketches the user is allowed to view
        const builder = db.Right.createQueryBuilder('right')
                          .innerJoinAndSelect('right.user', 'user', 'user.id = :id', {id: req.user.id})
                          .leftJoinAndSelect('right.sketch', 'sketch')
                          .leftJoinAndSelect('sketch.user', 'sketch_user');

        if (folderId !== null) {
            builder.innerJoin('sketch.folder', 'folder', 'folder.id = :folderId', {folderId});
        } else {
            builder.where('sketch.folder IS NULL OR user.id != sketch_user.id');
        }

        const rights = await builder.orderBy(orderBy.property, orderBy.order)
                                    .getMany();

        const result: any[] = [];
        rights.forEach(it => {
            result.push({
                id: it.sketch.id,
                title: it.sketch.title,
                title_small: it.sketch.title_small,
                is_creator: it.sketch.user.id === req.user.id,
                is_owner: RightsHelper.isOwner(it),
                is_editor: RightsHelper.isEditor(it),
                created_at: it.sketch.created_at,
                updated_at: it.sketch.updated_at
            });
        });
        res.json({success: true, sketches: result});
    }

    export async function getFilteredSketches(req: Express.Request & RequiresAuth, res: Express.Response) {

        let orderBy: IOrderBy = {
            property: '',
            order: Order.Desc,
        };

        switch (req.params.orderBy) {
            case 'name' :
                orderBy = {property: 'sketch.title_small', order: Order.Asc};
                break;
            default:
                orderBy = {property: 'sketch.updated_at', order: Order.Desc};
        }


        const sketches = await db.Sketch.getFilteredSketches(req.user.id, req.params.filter, orderBy.property, orderBy.order);
        let result: any[] = [];
        sketches.forEach(it => {
            result.push({
                id: it.id,
                title: it.title,
                is_creator: it.user.id === req.user.id,
                is_owner: RightsHelper.isOwner(it.rights[0]),
                is_editor: RightsHelper.isEditor(it.rights[0]),
                created_at: it.created_at,
                updated_at: it.updated_at
            });
        });

        res.json({success: true, sketches: result});
    }

    /**
     * This endpoint will create a new sketch with the given title.
     */
    export async function createSketch(req: Express.Request & RequiresAuth, res: Express.Response) {
        // Check the body to ensure we've been sent valid data
        if (!BodyValidation.validate(req.body, res, ['title'])) {
            return;
        }

        await db.Connection.transaction(async em => {
            const sketch = new Sketch();
            sketch.title = req.body.title;
            sketch.title_small = req.body.title.toLowerCase();
            sketch.is_public = false;
            sketch.background_color = '#ffffff';
            sketch.user = req.user;

            if (req.body.folder_id) {
                const folder = await em.getCustomRepository(FolderRepository)
                                       .findOne(req.body.folder_id);

                if (!folder) {
                    handleApiError(req, res, new UniSketchApiError(400, {success: false, error: 'folder_not_found'}));
                    return;
                }

                sketch.folder = folder;
            }

            await em.getCustomRepository(SketchRepository)
                    .save(sketch);

            const right = new Right();
            right.user = req.user;
            right.sketch = sketch;
            right.role_id = RightsHelper.ROLE_OWNER;

            await em.getCustomRepository(RightRepository)
                    .save(right);
            res.json({
                success: true,
                sketch_id: sketch.id,
            });
        });
    }

    /*
     * This endpoint will update the metadata of a sketch (currently title and folder (if exists) only).
     */
    export async function updateSketchMeta(req: Express.Request & RequiresAuth, res: Express.Response) {

        // Check the body to ensure we've been sent valid data
        if (!BodyValidation.validate(req.body, res, [
            {name: 'sketch_id', numeric: true},
        ])) {
            return;
        }

        const sketch = await db.Sketch.findOne({
            where: {
                id: req.body.sketch_id,
                rights:
                    {
                        user: {id: req.user.id}
                    }
            },
            relations: ['rights']
        });

        if (!sketch) {
            handleApiError(req, res, new UniSketchApiError(200, {success: false, error: 'sketch_not_found'}));
            return;
        }

        // User must at least be an editor on the sketch to change the name
        if (!RightsHelper.isEditor(sketch.rights[0])) {
            handleApiError(req, res, new UniSketchApiError(403, {success: false, error: 'no_permission'}));
            return;
        }


        if (req.body.folder_id) {
            const folderId = req.body.folder_id > 0 ? req.body.folder_id : null;
            if (folderId !== null) {
                const folder = await db.Folder.findOne(folderId);

                if (!folder) {
                    handleApiError(req, res, new UniSketchApiError(400, {success: false, error: 'folder_not_found'}));
                    return;
                }
                sketch.folder = folder;
                await db.Sketch.save(sketch);
            } else {
                sketch.folder = null;
                await db.Sketch.save(sketch);
            }
        } else if (req.body.title) {
            const title = req.body.title;
            sketch.title = title;
            sketch.title_small = title.toLowerCase();
            await db.Sketch.save(sketch);
        }


        res.json({success: true});
    }


    /**
     * This endpoint sends a preview image to the client in the form of an image file.
     */
    export async function getPublicSketchPreview(req: Express.Request & RequiresAuth, res: Express.Response) {
        // Check the body to ensure we've been sent valid data
        if (!BodyValidation.validate(req.params, res, [
            {name: 'sketch_id', numeric: true}
        ])) {
            return;
        }

        const sketch = await db.Sketch.findOne({
            where: {id: req.params.sketch_id},
            select: ['id', 'preview', 'is_public'],
        });

        if (!sketch) {
            handleApiError(req, res, new UniSketchApiError(200, {success: false, error: 'sketch_not_found'}));
            return;
        }

        // User must be allowed to view the sketch in order to receive the preview image
        if (!sketch.is_public) {
            handleApiError(req, res, new UniSketchApiError(403, {success: false, error: 'no_permission'}));
            return;
        }

        res.contentType('image/png');
        if (!sketch.preview) {
            res.sendFile(__dirname + '/no_preview.png');
        } else {
            //res.end(Buffer.from(sketch.preview, 'base64'));
            res.sendFile(path.resolve('previews/'+sketch.id+'.png'));
        }
    }

    /**
     * This endpoint sends a preview image to the client in the form of an image file.
     */
    export async function getSketchPreview(req: Express.Request & RequiresAuth, res: Express.Response) {
        // Check the body to ensure we've been sent valid data
        if (!BodyValidation.validate(req.params, res, [
            {name: 'sketch_id', numeric: true}
        ])) {
            return;
        }

        const sketch = await db.Sketch.findOne({
            where: {
                id: req.params.sketch_id, rights:
                    {
                        user: {id: req.user.id}
                    }
            },
            select: ['id', 'preview'],
            relations: ['rights']
        });

        if (!sketch) {
            handleApiError(req, res, new UniSketchApiError(200, {success: false, error: 'sketch_not_found'}));
            return;
        }

        // User must be allowed to view the sketch in order to receive the preview image
        if (!RightsHelper.canAccessSketch(sketch.rights[0])) {
            handleApiError(req, res, new UniSketchApiError(403, {success: false, error: 'no_permission'}));
            return;
        }

        // Send the preview stored for this sketch to the client, with appropriate content type
        res.contentType('image/png');
        if (!sketch.preview) {
            res.sendFile(__dirname + '/no_preview.png');
        } else {
            //res.end(Buffer.from(sketch.preview, 'base64'));
            res.sendFile(path.resolve('previews/'+sketch.id+'.png'));
        }
    }

    /**
     * This endpoint will update the image data for the preview of a given sketch.
     */
    export async function updateSketchPreview(req: Express.Request & RequiresAuth, res: Express.Response) {
        // Check the body to ensure we've been sent valid data
        if (!BodyValidation.validate(req.params, res, [
            {name: 'sketch_id', numeric: true}
        ])) {
            return;
        }

        // Ensure the endpoint has been called with a file upload in the request.
        if (!req.files) {
            res.status(400)
               .json({success: false, error: 'bad_request', error_message: 'No preview file provided.'});
            return;
        }

        // Ensure the type of the file uploaded is correct.
        let file: FileUpload.UploadedFile = <FileUpload.UploadedFile>req.files['preview'];
        if (file.mimetype !== 'image/png') {
            res.status(400)
               .json({success: false, error: 'bad_request', error_message: 'Invalid preview file provided.'});
            return;
        }

        const sketch = await db.Sketch.findOne({
            select: ['id', 'is_public'],
            where: {
                id: req.params.sketch_id,
                rights: {
                    user: {id: req.user.id},
                },
            },
            relations: ['rights']
        });

        if (!sketch) {
            handleApiError(req, res, new UniSketchApiError(200, {success: false, error: 'sketch_not_found'}));
            return;
        }

        // Only update the preview if the user is allowed to draw in the sketch
        if (!RightsHelper.isAllowedToDraw(sketch.rights[0])) {
            handleApiError(req, res, new UniSketchApiError(403, {success: false, error: 'no_permission'}));
            return;
        }

        const baseImage = file.data.toString('base64');
        const ext = baseImage.substring(baseImage.indexOf("/") + 1, baseImage.indexOf(";base64"));
        const fileType = baseImage.substring("data:".length, baseImage.indexOf("/"));
        const regex = new RegExp(`^data:${fileType}\/${ext};base64,`, 'gi');

        //Extract base64 data.
        const base64Data = baseImage.replace(regex, "");

        //Gen Filename
        let filename = sketch.id + '.png';

        var fs = require('fs');
        var dir = 'previews/';

        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }


        const imageSavePath = 'previews/' + filename;

        fs.writeFileSync(imageSavePath, base64Data, 'base64');

        sketch.preview = new Date().getTime().toString();

        await db.Sketch.save(sketch);

        res.json({success: true});
    }



    /**
     * This generates a random sketch with the given amount of lines and vertices per line.
     * TODO should disable this in the future or lock it behind admin permissions since it's not something just any user should be able to call
     */
    export async function benchmarkSketch(req: Express.Request & RequiresAuth, res: Express.Response) {
        // Check the body to ensure we've been sent valid data
        if (!BodyValidation.validate(req.params, res, [
            {name: 'lines', numeric: true},
            {name: 'minvert', numeric: true},
            {name: 'maxvert', numeric: true},
        ])) {
            return;
        }

        await db.Connection.transaction(async em => {
            const sketch = await em.getCustomRepository(SketchRepository)
                                   .create({
                                       title: req.params.lines + ' Lines, ' + req.params.minvert + '-' + req.params.maxvert + ' Vertices',
                                       user: req.user,
                                   });

            await em.getCustomRepository(RightRepository)
                    .create({
                        user: req.user,
                        sketch: sketch,
                        role_id: RightsHelper.ROLE_OWNER,
                    });

            let polylines: Polyline[] = [];
            for (let i = 0; i < req.params.lines; i++) {
                let vertices: any[] = [];
                let vertexCount = Math.floor(Math.random() * (req.params.maxvert - req.params.minvert)) + req.params.minvert;
                for (let j = 0; j < vertexCount; j++) {
                    vertices.push(Math.floor(Math.random() * 1024));
                    vertices.push(Math.floor(Math.random() * 1024));
                }

                let polyline = new Polyline();
                polyline.width = Math.floor(Math.random() * (5 - 1)) + 1;
                polyline.color = '#' + Math.floor(Math.random() * 16777215)
                                           .toString(16);
                polyline.vertices = vertices;
                polyline.sketch = sketch;

                polylines.push(polyline);
            }
            await em.getCustomRepository(PolylineRepository)
                    .save(polylines);

            res.json({
                success: true,
                sketch_id: sketch.id
            });

        })
    }

    /**
     * This endpoint will delete the sketch with the given id, but only if the current user has the owner role.
     */
    export async function deleteSketch(req: Express.Request & RequiresAuth, res: Express.Response) {
        // Check the body to ensure we've been sent valid data
        if (!BodyValidation.validate(req.params, res, [
            {name: 'sketch_id', numeric: true}
        ])) {
            return;
        }

        const sketch = await db.Sketch.findOne({
            where: {
                id: req.params.sketch_id, rights: {
                    user: {id: req.user.id},
                },
            },
            select: ['id'],
            relations: ['rights', 'sketchElements', 'sketchTags'],
        });

        if (!sketch) {
            handleApiError(req, res, new UniSketchApiError(200, {success: false, error: 'sketch_not_found'}));
            return;
        }

        // Only proceed if the user is an owner of this sketch
        if (!RightsHelper.isOwner(sketch.rights[0])) { // the where: limits it to one entry, but we still have to grab the first of the size 1 array due to how the association is set up
            handleApiError(req, res, new UniSketchApiError(403, {success: false, error: 'no_permission'}));
            return;
        }

        await db.Connection.transaction(async em => {
            await em.remove(sketch.sketchElements);
            await em.remove(sketch.sketchTags);
            await em.remove(sketch.rights);

            await em.remove(sketch);
        });

        res.json({success: true});
    }

}
