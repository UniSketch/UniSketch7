import { Component, EventEmitter, Output, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';

import { AuthenticationService } from '../services/authentication.service';
import { User } from '../models/user.model';
import { NotificationService } from '../services/notification.service';




/**
 * Login view shown on login screen when the login tab is selected.
 */
@Component({
    selector: 'app-authentication-form',
    templateUrl: './authentication-form.component.html',
    styleUrls: ['./authentication-form.component.scss']
})
export class AuthenticationFormComponent {
    constructor(
        private router: Router,
        private authenticationService: AuthenticationService,
        private notificationService: NotificationService
    ) { }

    /**
     * Model for the login form.
     */
    private user = {} as User;

    /**
     * Determines whether or not to show the additional username
     * input field required for signing up.
     */
    private isSignUpEnabled = false;

    /**
     * Reference to the additional input field for sign up form.
     */
    @ViewChild('username')
    private usernameInput: ElementRef;

    /**
     * Text displayed inside the buttons.
     */
    private loginButtonText = 'Sign In';
    private signUpButtonText = 'Sign Up';

    /**
     * Error message shown on failed login.
     */
    private errors;


    private authenticate() {
        if (this.isSignUpEnabled) {
            this.signUp();
        } else {
            this.login();
        }
    }


    /**
     * Attempts to log the user in and navigates to dashboard on success.
     */
    private login() {
        this.loginButtonText = 'Loading...';

        this.authenticationService.login(this.user)
            .toPromise().then((response) => {
                this.loginButtonText = 'Log in';
                if (response['success']) {
                   
                   
                    this.setCookie('FolderCookie', -1);
                    this.router.navigate(['/dashboard']);

                // Invalid credentials
                } else if (response['error'] === 'incorrect_password' ||
                        response['error'] === 'user_not_found') {
                    this.errors = 'Username or password incorrect.';
                }
        }).catch(error => {
            // error notification 
            this.notificationService.create(this.notificationService.getMessage(error.status), 'warning');
        });
    }


    private signUp() {
        // On first click, show additional required inputs for
        // signing up.
        if (!this.isSignUpEnabled) {
            this.isSignUpEnabled = true;

        // Perform Sign-Up
        } else {
            this.signUpButtonText = 'Loading...';
            this.authenticationService.register(this.user)
                .toPromise().then((response) => {
                    this.signUpButtonText = 'Sign up';
                    if (response['success']) {
                        this.router.navigate(['/dashboard']);
                    }
            });
        }
    }

    private setCookie(name: string, val: number) {
        const date = new Date();
        const value = val;    
        date.setTime(date.getTime() + (7 * 24 * 60 * 60 * 1000));
        document.cookie = name+"="+value+"; expires="+date.toUTCString()+"; path=/";
    }

    
    private handleSignInClick() {
        if (this.isSignUpEnabled) {
            this.isSignUpEnabled = false;
        }
    }

    private handleSignUpClick() {
        if (!this.isSignUpEnabled) {
            this.isSignUpEnabled = true;
        }
    }

}
