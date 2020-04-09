import { Injectable } from '@angular/core';

/**
 * Service providing access to the native window object.
 */
@Injectable()
export class WindowRefService {

    constructor() { }

    /**
     * Returns the native window object.
     */
    getNativeWindow() {
        return window;
    }

}
