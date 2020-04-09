import {Component, OnInit, ViewChild, ElementRef, HostListener} from '@angular/core';
import {Router} from '@angular/router';

import {AuthenticationService} from './../services/authentication.service';
import {User} from '../models/user.model';
import {NotificationService} from '../services/notification.service';
import {Globals} from "../globals";


/**
 * Component for basic user info and quick actions.
 */
@Component({
    selector: 'app-profile-summary',
    templateUrl: './profile-summary.component.html',
    styleUrls: ['./profile-summary.component.scss']
})

export class ProfileSummaryComponent implements OnInit {

    /**
     * Model used for the profile summary.
     */
    user = new User();

    /**
     * Menu element reference.
     */
    @ViewChild('profile')
    private profileElement: ElementRef;


    /**
     * Determines whether or not the profile menu should be visible.
     */
    private isProfileMenuVisible = false;

    constructor(
        private router: Router,
        private authenticationService: AuthenticationService,
        private notificationService: NotificationService,
        public globals: Globals,
    ) {}

    ngOnInit() {
        // Loads the current user's profile data from the server.

        this.authenticationService.getUser().toPromise().then(res => {
            if (res['success'] === true) {
                this.user.username = res['name'];
                this.user.email_address = res['email_address'];
                this.user.avatar_sketch_id = res['avatar_sketch_id'];
            }
        }).catch(error => {
            // error notification 
            this.notificationService.create(this.notificationService.getMessage(error.status), 'warning');
        });
    }


    /**
     * Handles click outside of the profile element in order to
     * close the profile menu.
     */
    @HostListener('click') closeOnClickOutside($event) {
        if (this.isProfileMenuVisible &&
            !this.profileElement.nativeElement.contains(event.target)) {
            this.toggleProfileMenu();
        }
    }


    /**
     * Handles click on the profile info. Opens or closes the menu
     * accordingly.
     */
    private toggleProfileMenu() {
        this.isProfileMenuVisible = !this.isProfileMenuVisible;
    }


    /**
     * Logs out the current user and navigates to the login view.
     */
    private logout() {
        this.authenticationService.logOut().subscribe(response => {
            this.router.navigate(['/login']);
        });
    }

}
