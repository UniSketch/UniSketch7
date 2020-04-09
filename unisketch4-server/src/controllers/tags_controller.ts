import * as Express from 'express';
import {BodyValidation} from "../helpers/body_validation";
import {RequiresAuth} from "../helpers/require_auth";
import {UniSketchApiError} from "../helpers/unisketch_api_error";
import {RightsHelper} from "../helpers/rights_helper";
import {handleApiError} from "../helpers/handle_api_error";
import {db} from "../database";
import {TagRepository} from "../repositories/TagRepository";
import {SketchTagRepository} from "../repositories/SketchTagRepository";
import {Tag} from "../models/Tag";
import {SketchTag} from "../models/SketchTag";

export namespace TagsController {

    export async function debugGetAllTags(req: Express.Request & RequiresAuth, res: Express.Response) {
    }

    export async function debugDeleteAllTags(req: Express.Request & RequiresAuth, res: Express.Response) {
    }

    export async function deleteAllTagsFromOneSketch(req: Express.Request & RequiresAuth, res: Express.Response) {
    }

    export async function getAllTagsFromOneSketch(req: Express.Request & RequiresAuth, res: Express.Response) {

        if (!BodyValidation.validate(req.params, res, [
            {name: 'sketch_id', numeric: true}
        ])) {
            return;
        }

        // get current sketch and current user-rights
        const sketch = await db.Sketch.findOne({
            where: {id: req.params.sketch_id, user_id: req.user.id},
            relations: ['sketchTags', 'sketchTags.tag', 'rights']
        });

        if (!sketch) {
            handleApiError(req, res, new UniSketchApiError(200, {success: false, error: 'sketch_not_found'}));
            return;
        }

        // check if user is contributor of sketch
        if (!RightsHelper.canAccessSketch(sketch.rights[0])) {
            handleApiError(req, res, new UniSketchApiError(403, {success: false, error: 'no_permission'}));
            return;
        }

        let result: any[] = [];
        sketch.sketchTags.forEach(tag => {
            result.push({
                id: tag.tag.id,
                name: tag.tag.name,
            });
        });

        res.json({success: true, tags: result});
    }

    export async function getTagByName(req: Express.Request & RequiresAuth, res: Express.Response) {
        if (!BodyValidation.validate(req.params, res, [
            {name: 'sketch_id', numeric: true},
            {name: 'tag_name', numeric: false}
        ])) {
            return;
        }

        const sketch = await db.Sketch.findOne({
            where: {id: req.params.sketch_id, user: {id: req.user.id}},
            relations: ['sketchTags', 'sketchTags.tag', 'rights']
        });

        if (!sketch) {
            handleApiError(req, res, new UniSketchApiError(200, {success: false, error: 'sketch_not_found'}));
            return;
        }

        // check if user is contributor of sketch
        if (!RightsHelper.canAccessSketch(sketch.rights[0])) {
            handleApiError(req, res, new UniSketchApiError(403, {success: false, error: 'no_permission'}));
            return;
        }

        // setup result
        let result: any[] = [];

        const tags = await db.Tag.find({where: {name: req.params.tag_name}});

        if (!tags) {
            handleApiError(req, res, new UniSketchApiError(200, {success: false, error: 'tag_not_found'}));
            return;
        }

        tags.forEach(i => {
            if (sketch.sketchTags.some(someTag => someTag.id === i.id)) {
                result.push({
                    id: i.id,
                    name: i.name
                });
            }
        });

        if (result.length === 0) {
            handleApiError(req, res, new UniSketchApiError(403, {success: false, error: 'tag_not_belongs_to_sketch'}));
            return;
        }

        res.json({success: true, tag: result});
    }


    export async function deleteTagByName(req: Express.Request & RequiresAuth, res: Express.Response) {
        if (!BodyValidation.validate(req.params, res, [
            {name: 'sketch_id', numeric: true},
            {name: 'tag_name', numeric: false}
        ])) {
            return;
        }


        const sketch = await db.Sketch.findOne({
            where: {
                id: req.params.sketch_id,
                user: {
                    id: req.user.id,
                },
            },
            relations: ['sketchTags', 'sketchTags.tag', 'rights']
        });

        if (!sketch) {
            handleApiError(req, res, new UniSketchApiError(200, {success: false, error: 'sketch_not_found'}));
            return;
        }

        if (!RightsHelper.isOwner(sketch.rights[0])) {
            handleApiError(req, res, new UniSketchApiError(403, {success: false, error: 'no_permission'}));
            return;
        }

        const tags = await db.Tag.find({where: {name: req.params.tag_name}, relations: ['sketchTags']});

        if (!tags[0]) {
            handleApiError(req, res, new UniSketchApiError(200, {success: false, error: 'tag_not_found'}));
            return;
        }

        tags.forEach(async (tag: Tag) => {
            await db.SketchTag.remove(tag.sketchTags);
        });

        await db.Tag.remove(tags);

        res.json({success: true});
    }

    // TODO: ein Tag mit dem gleichen Namen darf auf der selben Skizze nicht nochmal erstellt werden
    export async function postTag(req: Express.Request & RequiresAuth, res: Express.Response) {
        if (!BodyValidation.validate(req.params, res, [
            {name: 'sketch_id', numeric: true}])) {
            return;
        }

        if (!BodyValidation.validate(req.body, res, ['name'])) {
            return;
        }


        const sketch = await db.Sketch.findOne({
            where: {
                id: req.params.sketch_id,
                user: {id: req.user.id}
            },
            relations: ['rights'],
        });

        if (!sketch) {
            handleApiError(req, res, new UniSketchApiError(200, {success: false, error: 'sketch_not_found'}));
            return;
        }

        // check if user is contributor of sketch
        if (!RightsHelper.canAccessSketch(sketch.rights[0])) {
            handleApiError(req, res, new UniSketchApiError(403, {success: false, error: 'no_permission'}));
            return;
        }

        // em stands for entity-manager
        await db.Connection.transaction(async em => {

            const tag = new Tag();
            tag.name = req.body.name;
            await em.getCustomRepository(TagRepository)
                    .save(tag);
            const sketchTag = new SketchTag();
            sketchTag.sketch = sketch;
            sketchTag.tag = tag;
            await em.getCustomRepository(SketchTagRepository)
                    .save(sketchTag);
            res.json({
                success: true,
                tag_id: tag.id,
            })
        });
    }
}
