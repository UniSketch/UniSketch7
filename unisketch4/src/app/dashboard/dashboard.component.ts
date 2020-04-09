import {Component} from '@angular/core';
import {Router} from '@angular/router';

import {DashboardService} from './../services/dashboard.service';
import {NotificationService} from '../services/notification.service';
import {Folder} from "../models/folder.model";

/**
 * Parent component for all logged in views (except sketch view).
 */
@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {

    /**
     * Current year
     */
    private year = new Date().getFullYear();

    constructor(
        private router: Router,
        private dashboardService: DashboardService,
        private notificationService: NotificationService,
    ) {
    }


    /**
     * Creates a new sketch and navigates to its sketch view.
     */
    private createSketch() {
        this.dashboardService.createNewSketch('New Sketch')
            .subscribe(response => {
                if (response['success'] && response['success'] === true) {
                    this.router.navigate(['sketch/', response['sketch_id']]);
                } else {
                    this.notificationService.create(this.notificationService.getMessage(999), 'warning');
                }
            })
    }
}
