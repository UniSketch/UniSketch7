import { Injectable } from '@angular/core';

/**
 * Service providing controls for push-style notifications.
 */
@Injectable({
    providedIn: 'root'
})
export class NotificationService {

    /**
     * Local object of current notifications.
     */
    notifications: any[] = [];


    /**
     * Duration in ms after which a notification disappears by default.
     */
    private timeout = 7500;


    constructor() { }


    /**
     * Pushes a notification to the center.
     * Type can be
     * - success
     * - warning
     * - loading
     */
    create(message: string, type: string = '', imageURL?: string) {
        const notification = {
            message: message,
            type: type,
            imageURL: imageURL
        };

        this.notifications.push(notification);

        window.setTimeout(() => {
            this.notifications = this.notifications.filter(obj => {
                return obj !== notification;
            })
        }, this.timeout)
    }

    getMessage(status: number) {

        switch(status) {

            case 400: return "Sorry, this page doesn't exist.";
            case 401: return "Sorry, you need permission to perform this action.";
            case 500: return "Sorry, there is no connection to the service! We cannot process your request.";
            case 502: return "Sorry, the server seems to be down! We cannot process your request.";
            case 504: return "Sorry, the server seems to be down! We cannot process your request.";   
            case 999: return "Sorry, something went wrong. We could not process this action!";        
            default: return "Sorry, an error occurred! We cannot process your request.";
        }
    }
}
