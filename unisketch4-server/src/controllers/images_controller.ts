import * as Express from 'express';
import {RequiresAuth} from "../helpers/require_auth";
import * as path from "path";
import {BodyValidation} from "../helpers/body_validation";

/**
 * This namespace contains endpoints regarding the management of sketches.
 * All of the endpoints run with the RequireAuth middleware (see routes.ts).
 */
export namespace ImagesController {

    /**
     * This endpoint sends a image to the client in the form of an image file.
     */
    export async function getImage(req: Express.Request & RequiresAuth, res: Express.Response) {
        res.sendFile(path.resolve('src/images/'+req.params.image_id));
    }
}
