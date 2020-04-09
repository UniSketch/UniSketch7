import * as Express from 'express';

import {AuthController} from './controllers/auth_controller'
import {RightsController} from './controllers/rights_controller'
import {SketchesController} from './controllers/sketches_controller'
import {UsersController} from './controllers/users_controller'
import {TagsController} from './controllers/tags_controller'
import {FoldersController} from './controllers/folders_controller'
import {ImagesController} from './controllers/images_controller'

import {requireAuth} from './helpers/require_auth'

/**
 * Provides methods to register API routes. Except for the routes in the auth namespace, all of them use the RequireAuth middleware.
 */
export class Routes {

    private static auth(): Express.Router {
        let router = Express.Router();

        router.route('/auth/')
              .post(AuthController.login)
              .delete(AuthController.logout); // TODO to be removed in favor of /auth/logout

        router.route('/auth/logout')
              .post(AuthController.logout);

        router.route('/auth/request_password_reset')
              .post(AuthController.requestPasswordReset);

        router.route('/auth/check_password_reset')
              .post(AuthController.checkPasswordReset);

        router.route('/auth/password_reset')
              .post(AuthController.completePasswordReset);

        router.route('/auth/register/')
              .post(UsersController.createUser); // this used to be in users but it's here now so we don't need the stupid require auth regex

        return router;
    }

    private static rights(): Express.Router {
        let router = Express.Router();

        router.use('/rights/', requireAuth);
        router.use('/right/', requireAuth);

        router.route('/rights/:sketch_id')
              .get(RightsController.getRights);

        router.route('/right/')
              .post(RightsController.grantRight)
              .delete(RightsController.revokeRight); // TODO to be removed in favor of /right/delete

        router.route('/right/delete')
              .post(RightsController.revokeRight);

        return router;
    }

    private static publicSketches(): Express.Router {
        let router = Express.Router();

        router.route('/public-sketches/')
              .get(SketchesController.getPublicSketches);

        router.route('/public-sketch/preview/:sketch_id')
              .get(SketchesController.getPublicSketchPreview);

        return router;

    }

    private static folders(): Express.Router {
        let router = Express.Router();

        router.use('/folders/', requireAuth);
        router.use('/folder/', requireAuth);

        router.route('/folders/')
              .get(FoldersController.getFolders)

        router.route('/folders/') // folder id die hier übergeben wird, wird parent_id für das neue.
              .post(FoldersController.createFolder);

        router.route('/folder/:folder_id')
              .delete(FoldersController.deleteFolder);

        router.route('/folder/:folder_id')
              .put(FoldersController.updateFolder);

        return router;
    }

    private static sketches(): Express.Router {
        let router = Express.Router();

        router.use('/sketches/', requireAuth);
        router.use('/sketch/', requireAuth);

        router.route('/sketches/')
        router.route('/sketches/:folder_id/:orderBy')
              .get(SketchesController.getSketches);

        router.route('/sketches/search/:orderBy/:filter')
              .get(SketchesController.getFilteredSketches);

        router.route('/sketch/')
              .post(SketchesController.createSketch);

        router.route('/sketch/meta/')
              .post(SketchesController.updateSketchMeta)
              .put(SketchesController.updateSketchMeta);


        router.route('/sketch/preview/:sketch_id')
              .get(SketchesController.getSketchPreview)
              .post(SketchesController.updateSketchPreview);

        router.route('/sketch/:sketch_id')
              .delete(SketchesController.deleteSketch); // TODO to be removed in favor of /sketch/delete/

        router.route('/sketch/:sketch_id/toggle-visibility/')
              .put(SketchesController.toggleVisibility);

        router.route('/sketch/delete/:sketch_id')
              .post(SketchesController.deleteSketch);

        router.route('/sketch/benchmark/:lines/:minvert/:maxvert') // TODO disable me when we're done testing
              .get(SketchesController.benchmarkSketch);

        return router;
    }

    private static users(): Express.Router {
        let router = Express.Router();

        router.use('/user/', requireAuth);

        router.route('/user/')
              .get(UsersController.getUser)
              .post(UsersController.updateUser)
              .delete(UsersController.deleteUser); // TODO remove in favor of /user/delete

        router.route('/user/delete/')
              .post(UsersController.deleteUser);

        return router;
    }

    private static tags(): Express.Router {
        let router = Express.Router();

        router.use('/tags/', requireAuth);
        router.use('/tag/', requireAuth);

        // for Debugging
        router.route('/tags/')
              // TODO: implementieren
              .get(TagsController.debugGetAllTags)

              // TODO: implementieren
              .delete(TagsController.debugDeleteAllTags);

        router.route('/tags/:sketch_id')
              .get(TagsController.getAllTagsFromOneSketch)

              // TODO: implementieren
              .delete(TagsController.deleteAllTagsFromOneSketch);

        router.route('/tag/:sketch_id/:tag_name')
              .get(TagsController.getTagByName)
              .delete(TagsController.deleteTagByName);

        // TODO: klaeren ob benoetigt
        // router.route('/tag/:sketch_id/:tag_id')
        //     .get(TagsController.getTagById)

        router.route('/tag/:sketch_id')
              // post OneTagForOneSketch given in sketch_id
              .post(TagsController.postTag);

        return router;
    }
    private static images(): Express.Router {
        let router = Express.Router();

        router.route('/images/:image_id')
            .get(ImagesController.getImage);

        return router;
    }

    /**
     * Registers all API routes to the express server with the given base path.
     */
    static apply(express: Express.Application, basePath: string): void {
        express.use(basePath + 'api/', this.auth());
        express.use(basePath + 'api/', this.rights());
        express.use(basePath + 'api/', this.sketches());
        express.use(basePath + 'api/', this.publicSketches());
        express.use(basePath + 'api/', this.users());
        express.use(basePath + 'api/', this.tags());
        express.use(basePath + 'api/', this.folders());
        express.use(basePath + 'api/', this.images());
    }
}
