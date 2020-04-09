import {Component} from '@angular/core';

import {NotificationService} from "../services/notification.service";
import {AuthenticationService} from '../services/authentication.service';
import {ActivatedRoute, Router} from "@angular/router";


/**
 * WIP component for the password reset function.
 */
@Component({
    selector: 'app-reset-password-form',
    templateUrl: './reset-password-form.component.html',
    styleUrls: ['./reset-password-form.component.scss']
})

export class ResetPasswordFormComponent {
    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private authenticationService: AuthenticationService,
        private notificationService: NotificationService) {
    }

    /**
     * Model for the login form.
     */
    private password: string;
    private passwordRepeat: string;

    private buttonText;

    /**
     * Success message when the password has been
     * reset successfully.
     */
    private resetPasswordMessage: string;

    /**
     * The token that is requested via the url
     */
    private requestedToken: string;

    /**
     * Determines whether the sent token is valid
     */
    private validToken = false;

    private token;

    /**
     * Message shown when invalid Token
     */
    private invalidTokenMessage : string;

    ngOnInit() {
        // Get the token from the url
        this.route.params.subscribe(params => {
            this.requestedToken = params['token'];
            this.checkToken(this.requestedToken);
        });

    }

    private checkToken(token) {
        this.authenticationService.checkValidToken(token)
            .toPromise()
            .then((response) => {
                //enables reset-password-form
                if (response['success']) {
                    this.validToken = true;
                    this.buttonText = 'Reset Password';
                    this.token = token;
                }
                else if (response['error'] === 'token_expired') {
                    this.invalidTokenMessage = 'The token is expired. Please request a new one.';
                }
            });

    }

    /**
     * Checks the token and if is valid changes the password.
     */
    private resetPassword() {
        if (this.password === this.passwordRepeat) {

            this.authenticationService.resetPassword(this.token, this.password)
                .toPromise()
                .then((response) => {
                    //enables reset-password-form
                    if (response['success']) {
                        //if password successfully set
                        //this.resetPasswordMessage = 'Password has been reset';
                        this.notificationService.create('Password has been reset', 'success');
                        //set timeout of 1 second before redirecting --> should redirect to main formular!
                        setTimeout(() => {this.router.navigate(['/login']);
                        }, 1000);
                    }
                });
        } else {
            this.resetPasswordMessage = 'The passwords do not match.';
        }

    }


}
