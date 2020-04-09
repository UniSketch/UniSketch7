import { Component, Input } from '@angular/core';

/**
 * Base component for the login screen with a simple info text
 * about the application underneath.
 */
@Component({
    selector: 'app-authentication',
    templateUrl: './authentication.component.html',
    styleUrls: ['./authentication.component.scss']
})
export class AuthenticationComponent {
    constructor() { }


    /**
     * Determines whether or not the forgot password form should
     * replace the default login form.
     */
    private showForgotPassword = false;


   private toggleForgotPassword(): void {
        this.showForgotPassword = !this.showForgotPassword;
    }
}
