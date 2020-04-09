import { Component, OnInit, Input } from '@angular/core';

/**
 * A single notification.
 */
@Component({
    selector: 'app-notification',
    templateUrl: './notification.component.html',
    styleUrls: ['./notification.component.scss']
})
export class NotificationComponent implements OnInit {

    /**
     * Available notification types.
     */
    private types = ['', 'success', 'warning'];


    /**
     * Notification object.
     */
    @Input()
    private notification: any;


    ngOnInit() {
        if (!this.types.find(type => type === this.notification.type)) {
            throw new Error('Invalid notification type.');
        }
    }
}
