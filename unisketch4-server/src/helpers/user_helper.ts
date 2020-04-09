import * as BCrypt from 'bcryptjs';

/**
 * This namespace contains helper functions used when dealing with users.
 */
export namespace UserHelper {

	/**
	 * Hashes the given password asynchronously by first generating a salt and then a hash based on both.
	 * Returns a promise that resolves in the completed hash.
	 */
    export function hashPassword(password: string): Promise<string> {
        return new Promise((resolve, reject) => {
            BCrypt.genSalt(10).then(salt => {
                return BCrypt.hash(password, salt);
            }).then(hash => {
                resolve(hash);
            }).catch(err => {
                reject(err);
            });
        });
    }

}