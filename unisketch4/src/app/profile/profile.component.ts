import {Router} from '@angular/router';
import {Component, OnInit, Inject, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, Validators, AbstractControl} from '@angular/forms';

import {AuthenticationService} from './../services/authentication.service';
import {ModalComponent} from './../modal/modal.component';
import {Globals} from "../globals";
import {User} from "../models/user.model";

/**
 * Component for the user profile view.
 */
@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

    /**
     * Model used for the profile form.
     */
    user = new User();

    /**
     * Whether an incorrect password has been entered.
     */
    errors = false;

    /**
     * Whether the profile update was successful.
     */
    success = false;

    /**
     * Whether the change password link has been clicked.
     */
    editPassword = false;

    /**
     * Main form for profile changes.
     */
    form: FormGroup;

    /**
     * Form for password changes.
     */
    form2: FormGroup;

    /**
     * Reference to the delete account confirmation modal.
     */
    @ViewChild(ModalComponent)
    private modal: ModalComponent;


    constructor(@Inject(FormBuilder) formBuilder: FormBuilder, private router: Router,
                private authenticationService: AuthenticationService, public globals: Globals) {

        // Configures the profile form with all its validators.
        this.form = formBuilder.group({
            nameAndEmail: formBuilder.group({
                name: [null, Validators.required],
                email: [null, Validators.compose([
                    Validators.required,
                    Validators.pattern(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)]
                )]
            }),
            oldPassword: [null, Validators.compose([Validators.required])]
        });

        // Configures the password change form with all its validators.
        this.form2 = formBuilder.group({
            passwordUpdate: formBuilder.group({
                newPassword: [null, Validators.compose([Validators.minLength(6)])],
                confirmPassword: [null, Validators.required]
            }, {validator: PasswordValidation.MatchPassword})
        });
    }

    ngOnInit() {
        // Loads the current user's profile data from the server. 
        this.authenticationService.getUser().toPromise().then(responce => {
            console.log(responce);
            if (responce['success'] === true) {
                this.user.username = responce['name'];
                this.user.email_address = responce['email_address'];
                this.user.avatar_sketch_id = responce['avatar_sketch_id'];
                console.log('avatar is ' + this.user.avatar_sketch_id);
            }
        });
    }

    /**
     * Updates the user's profile.
     */
    onSubmit() {
        if (this.form.valid) {
            this.authenticationService.updateUser(this.user)
                .toPromise().then(response => {
                console.log(response);
                if (response['error'] === 'incorrect_password') {
                    this.errors = true;
                    setTimeout(() => this.errors = false, 5000);
                } else if (response['success'] === true) {
                    this.success = true;
                    setTimeout(() => this.success = false, 5000);
                }

            });
        }
    }

    /**
     * Opens the delete account confirmation modal.
     */
    public deleteProfileButtonClick() {
        this.modal.show();
    }

    /**
     * Deletes the current user's account and navigates back to login screen.
     */
    public deleteProfile() {
        this.authenticationService.deleteUser()
            .subscribe(response => {
                if (response['success'] === true) {
                    this.router.navigate(['/login']);
                }
            });
    }

}

/**
 * Validation class for password confirmation.
 */
export class PasswordValidation {
    /**
     * Checks whether both password and password confirmation match.
     */
    static MatchPassword(AC: AbstractControl) {
        const password = AC.get('newPassword').value; // get value in input tag
        const confirmPassword = AC.get('confirmPassword').value; // get value in input tag
        if (password !== confirmPassword) {
            AC.get('confirmPassword').setErrors({MatchPassword: true});
        } else {
            return null;
        }
    }
}
