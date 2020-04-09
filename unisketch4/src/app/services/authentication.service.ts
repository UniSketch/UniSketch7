import {HttpClient} from '@angular/common/http';
import {User} from '../models/user.model';
import {Sketch} from './../models/sketch.model';
import {Injectable, OnInit} from '@angular/core';
import {map} from "rxjs/operators";
import {Globals} from "../globals";



/**
 * Service providing functions for login and logout, registering a new
 * user or managing a user profile.
 * TODO: the service shouldn't return HTTP responses as that defeats
 * most of the point, it should read them right here and return the
 * data the caller actually needs (see ParticipantsService for example)
 */
@Injectable()
export class AuthenticationService {

    /**
     * ID of the currently logged in user.
     */
    private loggedInAsUserId = 0;

    /**
     * URL to redirect to when a login is successful.
     * TODO: Only partially implemented right now, value is never read.
     */
    public redirectUrl = '/login';

    constructor(private http: HttpClient) {
        // TODO: this code seems to be useless? it doesn't do anything?
        // const loggedInAsUserId: any;
        // if (document.cookie.includes('UniSketchUserId')) {
        //     this.loggedInAsUserId = loggedInAsUserId;
        // }
    }

    /**
     * Logs the user in with the given password and username.
     */
    public login(user: User) {
        return this.http.post(Globals.BASE_PATH + '/api/auth',
    
            {email_address: user.email_address, password: user.password})
            .pipe(map(response => {
                if (response['success']) {
                    this.loggedInAsUserId = response['user_id'];

                    // TODO this doesn't seem like a good thing to do
                    // and shouldn't be necessary - the cookie is set
                    // by the server itself!
                    document.cookie = 'UniSketchUserId=' + response['user_id'] + '; path=/';
                    console.log('AuthenticationService login success');
                }
                return response;
            }));
            
    }

    /**
     * Logs the user out.
     */
    public logOut() {
        return this.http.post(Globals.BASE_PATH + '/api/auth/logout', {})
            .pipe(map(response => {
                if (response['success']) {
                    this.loggedInAsUserId = 0;
                    console.log('logOut success');
                }
                return response;
            }));
    }

    /**
     * Retrieves information on the currently logged in user.
     */
    public getUser() {
        return this.http.get(Globals.BASE_PATH + '/api/user/');
    }

    /**
     * Updates the currently logged in user's profile.
     */
    public updateUser(userprofile: User) {
        const post = {old_password: userprofile.old_password};
        if (userprofile.username !== '') {
            post['name'] = userprofile.username;
        }
        if (userprofile.email_address !== '') {
            post['email_address'] = userprofile.email_address;
        }
        if (userprofile.password !== '') {
            post['password'] = userprofile.password;
        }
        return this.http.post(Globals.BASE_PATH + '/api/user/', post);
    }

    /**
     * Updates the currently logged in user's avatar.
     */
    public updateAvatar(sketch: Sketch) {
        return this.http.post(Globals.BASE_PATH + '/api/user/', {avatar_sketch_id: sketch.id});
    }

    /**
     * Deletes the currently logged in user's account.
     */
    public deleteUser() {
        return this.http.post(Globals.BASE_PATH + '/api/user/delete', {})
            .pipe(map(response => {
                if (response['success']) {
                    this.loggedInAsUserId = 0;
                    return response;
                }
            }));
    }

    /**
     * Registers a new user with the given data.
     */
    public register(user: User) {
        return this.http.post(Globals.BASE_PATH + '/api/auth/register',
            {name: user.username, email_address: user.email_address, password: user.password})
            .pipe(map(response => {
                console.log(response);
                if (response['success']) {
                    this.loggedInAsUserId = response['user_id'];
                    console.log('Register success');
                }
                return response;
            }));
    }

    /**
     * Checks whether the user is logged in.
     */
    public isLoggedIn(): boolean {
        return this.loggedInAsUserId !== 0 && this.loginCookieExists();
    }

    public loginCookieExists() : boolean {
        return document.cookie.includes('UniSketchUserId');
    }

    /**
     * Retrieves the currently logged in user's id from the cookies.
     */
    public getLoggedInUserId(): number {
    
        if (this.loggedInAsUserId) {
            return this.loggedInAsUserId;
        }

        if (this.getCookie('UniSketchUserId') !== '') {
            return Number.parseInt(this.getCookie('UniSketchUserId'));
        }

        return 0;
    }

    /**
     * Sends a token for resetting the password to the given email-adress
     */
    public forgotPassword(user: User) {
        return this.http.post(Globals.BASE_PATH + '/api/auth/request_password_reset', {email_address: user.email_address});
    }

    /**
     * Checks whether the Password-Reset-Token is valid
     */
    public checkValidToken(password_reset_token: string) {
        return this.http.post(Globals.BASE_PATH + `/api/auth/check_password_reset`,{token: password_reset_token});
    }

    /**
     * Resets the Password of the user which has the reset token
     */
    public resetPassword(password_reset_token:string, password: string) {
        return this.http.post(Globals.BASE_PATH + `/api/auth/password_reset`, {token: password_reset_token, password: password});
    }

    /**
     * Get the value of a cookie.
     */
    private getCookie(cname) {
        const name = cname + '=';
        const decodedCookie = decodeURIComponent(document.cookie);
        const ca = decodedCookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) === 0) {
                return c.substring(name.length, c.length);
            }
        }
        return '';
    }

}
