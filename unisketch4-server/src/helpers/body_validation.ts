import * as Express from 'express';

/**
 * Helper class providing a function to validate user input.
 */
export class BodyValidation {

    static EMAIL_PATTERN = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

	/**
	 * Validates the given body based on the expected response and responds with an error status if necessary.
	 * Fields can be supplied either as a simple string (element with that name expected to exist and not be empty) or as an object for more control.
	 * When supplied as an object,
	 * - 'optional' can be set to true in order to allow null values.
	 * - 'type' can be set to ensure a field is of correct type
	 * - 'notEmpty' can be set to true to ensure a field is not empty
	 * - 'numeric' can be set to true to ensure a field is numeric
	 * - 'email' can be set to true to ensure a field is a valid email address
	 * - 'pattern' can be set to validate a value to a custom regex pattern
	 * @param {any[]} fields an array of field definitions expected in the body
	 * @return true if the body is valid, false if an error response has been sent
	 */
    static validate(body: any, res: Express.Response, fields: any[]): boolean {
        for (let field of fields) {
            if (typeof field === 'object') {
                let value = body[field.name];
                if (value == null) {
                    if (!field.optional) {
                        res.status(400).json({ success: false, error: 'bad_request', error_message: 'No ' + field.name + ' provided.' });
                        return false;
                    } else {
                        return true;
                    }
                }
                
                if (field.type && typeof value !== field.type) {
                    res.status(400).json({ success: false, error: 'bad_request', error_message: 'Incorrect type for ' + field.name + '.' });
                    return false;
                }
                
                if (value != null && field.notEmpty && !value) {
                    res.status(400).json({ success: false, error: 'bad_request', error_message: field.name + ' must not be empty.' });
                    return false;
                }
                
                if (field.numeric && (isNaN(parseFloat(value)) || !isFinite(value))) {
                    res.status(400).json({ success: false, error: 'bad_request', error_message: field.name + ' must be a numeric value.' });
                    return false;
                }
                
                if (value != null && field.email && !String(value).match(BodyValidation.EMAIL_PATTERN)) {
                    res.status(400).json({ success: false, error: 'bad_request', error_message: field.name + ' must be an email address.' });
                    return false;
                }

                if (field.pattern && !String(value).match(field.pattern)) {
                    res.status(400).json({ success: false, error: 'bad_request', error_message: 'Field ' + field.name + ' does not match expected pattern.' });
                    return false;
                }
            } else {
                if(!body[field] || !body[field].trim()) {
                    res.status(400).json({ success: false, error: 'bad_request', error_message: 'No ' + field + ' provided.' });
                    return false;
                }
            }
        }

        return true;
    }

}