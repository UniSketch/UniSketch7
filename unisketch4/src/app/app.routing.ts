import {AuthGuardService} from './services/auth-guard.service';
import {ProfileComponent} from './profile/profile.component';
import {Routes, RouterModule} from '@angular/router';

import {AuthenticationComponent} from './authentication/authentication.component';
import {SketchViewComponent} from './sketch-view/sketch-view.component';
import {SketchToolbarComponent} from './sketch-toolbar/sketch-toolbar.component';
import {DashboardComponent} from "./dashboard/dashboard.component";
import {HomeComponent} from './home/home.component';
import {ResetPasswordFormComponent} from './reset-password-form/reset-password-form.component';

const appRoutes: Routes = [
    {path: 'login', component: AuthenticationComponent},
    {path: 'sketch/:id', component: SketchViewComponent},
    {path: 'password_reset/:token', component: ResetPasswordFormComponent},
    // { path: 'sketch/:id', component: SketchViewComponent, canActivate: [AuthGuardService] },
    {
        path: 'dashboard', component: DashboardComponent,
        children: [
            {path: '', redirectTo: 'home', pathMatch: 'full'},
            {path: 'home', component: HomeComponent},
            {path: 'profile', component: ProfileComponent},
        ] //,
        // children: [
        //   { path: '', redirectTo: 'home', pathMatch: 'full' },
        //   { path: 'home', component: HomeComponent, canActivate: [AuthGuardService] },
        //   { path: 'profile', component: ProfileComponent, canActivate: [AuthGuardService] },
        // ]
    },

    // otherwise redirect to login
    {path: '**', redirectTo: '/login'}
];

export const routing = RouterModule.forRoot(appRoutes);
