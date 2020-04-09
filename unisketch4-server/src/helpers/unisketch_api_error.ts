/**
 * Represents an expected error in the API - should be thrown when a user lacks permissions or tried to access data that doesn't exist.
 * This error is meant to result in an error on the frontend when it's handled.
 */
export class UniSketchApiError { 

	/**
	 * @param {number} code the http code to send to the client when this error occurs
	 * @param {any} message the message to send to the client when this error occurs - can be a string or object. If it's an object, it should follow the {success:"", message:"", ...} format.
	 */
    constructor(public code: number, public message: any) {}
	
}