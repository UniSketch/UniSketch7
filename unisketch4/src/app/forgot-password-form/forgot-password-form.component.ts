import {Component} from '@angular/core';

import {NotificationService} from "../services/notification.service";
import {AuthenticationService} from '../services/authentication.service';
import {User} from '../models/user.model';

import {Router} from "@angular/router";


/**
 * WIP component for the password reset function.
 */
@Component({
    selector: 'app-forgot-password-form',
    templateUrl: './forgot-password-form.component.html',
    styleUrls: ['./forgot-password-form.component.scss']
})
export class ForgotPasswordFormComponent {
    constructor(
        private router: Router,
        private authenticationService: AuthenticationService,
        private notificationService: NotificationService) {
    }

    /**
     * Model for the input form.
     * TODO: this could probably just be a string for the email
     * address since that's all we need here
     */
    private user = {} as User;

    /**
     * Text displayed in the form's submit button.
     */
    private buttonTextDefault = 'Reset Password';
    private buttonText = this.buttonTextDefault;

    /**
     * Error message that occurred during the password reset request.
     */
    private forgotPasswordErrors: string;

    /**
     * Success message when the password confirmation e-mail has been
     * sent successfully.
     */
    private forgotPasswordMessage: string;


    /**
     * Submits the password reset request.
     */
    private forgotPassword() {
        this.authenticationService.forgotPassword(this.user)
            .toPromise()
            .then((response) => {
                console.log(response);
                this.buttonText = this.buttonTextDefault;
                //this.forgotPasswordMessage = 'Request was processed';
                this.notificationService.create('Request was processed', 'success');
                setTimeout(() => {
                    this.router.navigate(['/login']);
                }, 1000);
            });
    }

}
