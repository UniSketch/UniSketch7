import { Component, DoCheck } from '@angular/core';
import { trigger, state, style,
         animate, transition } from '@angular/animations';

import { NotificationComponent } from '../notification/notification.component';
import { NotificationService } from '../services/notification.service';


@Component({
    selector: 'app-notification-center',
    templateUrl: './notification-center.component.html',
    styleUrls: ['./notification-center.component.scss']
})
export class NotificationCenterComponent {

    /**
     * Duplicate of the service notifications
     */
    private notifications: any[] = [];


    constructor(private notificationService: NotificationService) { }


    ngDoCheck() {
        this.notifications = this.notificationService.notifications;
    }
}
