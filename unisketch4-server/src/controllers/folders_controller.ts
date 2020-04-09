import * as Express from 'express';
import {RequiresAuth} from "../helpers/require_auth";
import {UniSketchApiError} from "../helpers/unisketch_api_error";
import {handleApiError} from "../helpers/handle_api_error";
import {db} from "../database";
import {FolderRepository} from "../repositories/FolderRepository";
import {Folder} from "../models/Folder";

/**
 * This namespace contains endpoints regarding the management of folders.
 * All of the endpoints run with the RequireAuth middleware (see routes.ts).
 */
export namespace FoldersController {


    export async function getFolders(req: Express.Request & RequiresAuth, res: Express.Response) {
        const folders = await db.Folder.find(
            {
                where: {user: {id: req.user.id}, parent: null},
                relations: ['children'],
                order: {
                    name: 'ASC',
                },
            },
        );
        console.log(folders);
        res.json({success: true, folders: folders});
    }

    /**
     * This endpoint will create a new folder with the given name.
     */
    export async function createFolder(req: Express.Request & RequiresAuth, res: Express.Response) {
        const parentId = req.body.parent_id;
        if (parentId && parentId > 0) {
            const parent = await db.Folder.findOne(parentId);
            await db.Connection.transaction(async em => {

                const folder = new Folder();
                folder.name = req.body.name;
                folder.user = req.user;
                folder.parent = parent;

                await em.getCustomRepository(FolderRepository)
                        .save(folder);

                res.json({
                    success: true,
                    folder: folder,
                });
            });
        } else {
            await db.Connection.transaction(async em => {
                const folder = new Folder();
                folder.name = req.body.name;
                folder.user = req.user;


                await em.getCustomRepository(FolderRepository)
                        .save(folder);
                res.json({
                    success: true,
                    folder: folder,
                });
            });
        }
    }

    /**
     * This endpoint will delete folder with the given name.
     */
    export async function deleteFolder(req: Express.Request & RequiresAuth, res: Express.Response) {

        const folder = await db.Folder.findOne({
            where: {id: req.params.folder_id, user: {id: req.user.id}},
            relations: ['children','parent'],
        });
        if (!folder) {
            handleApiError(req, res, new UniSketchApiError(200, {success: false, error: 'folder_not_found'}));
            return;
        }

        const childrenForParent: Folder[] = [];
        const parent = folder.parent ? folder.parent :  null;
        if (folder.children.length > 0) {
            folder.children.forEach((child: Folder) => {
                child.parent = parent;
                childrenForParent.push(child);
            });
        }

        await db.Folder.save(childrenForParent);
        await db.Folder.remove(folder);
        res.json({success: true});
    }

    export async function updateFolder(req: Express.Request & RequiresAuth, res: Express.Response) {
        const folder = await db.Folder.findOne({id: req.params.folder_id, user: {id: req.user.id}});
        if (!folder) {
            handleApiError(req, res, new UniSketchApiError(200, {success: false, error: 'folder_not_found'}));
            return;
        }
        if (req.body.folder_id) {
            const folderId = req.body.folder_id > 0 ? req.body.folder_id : null;
            if (folderId !== null) {
                folder.parent = await db.Folder.findOne({id: req.params.folder_id, user: {id: req.user.id}});
            } else {
                folder.parent = null;
            }
            await db.Folder.save(folder);
        } else if (req.body.name) {
            folder.name = req.body.name;
            await db.Folder.save(folder);
        }
        res.json({success: true, folder: folder});
    }

}
