import * as Express from 'express';

import {UniSketchApiError} from './unisketch_api_error';

/**
 * Helper function to handle errors thrown by controllers and send an appropriate response to the client.
 */
export function handleApiError(req: Express.Request, res: Express.Response, err: UniSketchApiError | Error) {
	// Since the websocket handler wraps around the middleware we use for normal HTTP requests,
	// this might be called with a response object that doesn't support .status() - do nothing in that case.
    if (!res.status) {    
        return;
    }

	// UniSketchApiErrors are expected to be thrown - for example when a client lacks permission for an action.
    if (err instanceof UniSketchApiError) {
        res.status(err.code);
        
        // If the error message comes as a string, wrap it in our JSON format - else it's expected to already be in such format.
        if (typeof err.message === 'string') {
            res.json({success: false, error: err.message});
        } else {
            res.json(err.message);
        }
    } else {
		// All other errors are unexpected and should be fixed as they come up, since they could result in unwanted behaviour!
        console.error(err);
        res.status(500).send({success: false, error: 'internal_server_error'});
    }
}