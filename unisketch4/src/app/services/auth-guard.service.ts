import { Observable } from 'rxjs';
import { AuthenticationService } from './authentication.service';
import { Router, RouterStateSnapshot, ActivatedRouteSnapshot, CanActivate, CanActivateChild } from '@angular/router';
import { Injectable } from '@angular/core';

/**
 * Service providing functionality to prevent access to login-protected views while not logged in.
 */
@Injectable()
export class AuthGuardService implements CanActivate, CanActivateChild {

    constructor(private authService: AuthenticationService, private router: Router) {
    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        const url: string = state.url;
        return this.checkLogin(url);
    }

    canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        return this.canActivate(route, state);
    }

    /**
     * Checks whether the user is logged in and navigates them back to the login screen if not.
     */
    checkLogin(url: string): boolean {
        console.log('checkLogin', this.authService.isLoggedIn());
        if (this.authService.isLoggedIn()) { return true; }

        // Store the attempted URL for redirecting
        this.authService.redirectUrl = url;

        // Navigate to the login page with extras
        this.router.navigate(['/login']);
        return false;
    }

}
