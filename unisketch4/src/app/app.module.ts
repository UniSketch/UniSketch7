import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';

import {AngularSvgIconModule} from 'angular-svg-icon';

import {ColorPickerModule} from 'ngx-color-picker';

import {AppComponent} from './app.component';
import {routing} from './app.routing';

import {AuthenticationService} from './services/authentication.service';
import {SketchService} from './services/sketch.service';
import {DashboardService} from './services/dashboard.service';

import {FolderService} from './services/folder.service';

import {ParticipantsService} from './services/participants.service';
import {WindowRefService} from './services/window-ref.service';

import {AuthenticationComponent} from './authentication/authentication.component';
import {DashboardComponent} from "./dashboard/dashboard.component";
import {ProfileComponent} from './profile/profile.component';
import {HomeComponent} from './home/home.component';
import {SketchcardComponent} from './sketchcard/sketchcard.component';
import {SketchViewComponent} from './sketch-view/sketch-view.component';
import {SketchCanvasEventsDirective} from './sketch/sketch-canvas-events.directive';
import {SketchToolbarComponent} from './sketch-toolbar/sketch-toolbar.component';
import {SketchModalParticipantsComponent} from './sketch-modal-participants/sketch-modal-participants.component';
import {ProfileModalAvatarComponent} from './profile-modal-avatar/profile-modal-avatar.component';
import {ModalComponent} from './modal/modal.component';
import {AuthGuardService} from './services/auth-guard.service';
import {AuthenticationFormComponent} from './authentication-form/authentication-form.component';
import {AboutComponent} from './about/about.component';
import {ForgotPasswordFormComponent} from './forgot-password-form/forgot-password-form.component';
import {SelectComponent} from './select/select.component';
import {ProfileSummaryComponent} from './profile-summary/profile-summary.component';
import {SketchModalTagsComponent} from './sketch-modal-tags/sketch-modal-tags.component';
import {TagComponent} from './tag/tag.component';
import {NotificationCenterComponent} from './notification-center/notification-center.component';
import {NotificationComponent} from './notification/notification.component';
import {ChatOverlayComponent} from './chat-overlay/chat-overlay.component';

import {PublicSketchesComponent} from "./public-sketches/public-sketches.component";

import {Globals} from "./globals";

import {TreeModule} from 'angular-tree-component';
import {FolderTreeComponent} from './folder-tree/folder-tree.component';
import {FolderTreeModalComponent} from "./folder-tree-modal/folder-tree-modal.component";

import {ResetPasswordFormComponent} from './reset-password-form/reset-password-form.component';
import { ImageUploadComponent } from './image-upload/image-upload.component';

@NgModule({
    imports: [
        BrowserModule,
        AngularSvgIconModule,
        FormsModule,
        ReactiveFormsModule,
        HttpClientModule,
        ColorPickerModule,
        routing,
        TreeModule.forRoot(),
        ColorPickerModule,
        routing,
    ],
    declarations: [
        AppComponent,
        AuthenticationComponent,
        FolderTreeComponent,
        FolderTreeModalComponent,
        DashboardComponent,
        ProfileComponent,
        HomeComponent,
        SketchcardComponent,
        SketchViewComponent,
        SketchCanvasEventsDirective,
        SketchToolbarComponent,
        SketchModalParticipantsComponent,
        ProfileModalAvatarComponent,
        ModalComponent,
        AuthenticationFormComponent,
        AboutComponent,
        ForgotPasswordFormComponent,
        SelectComponent,
        ProfileSummaryComponent,
        SketchModalTagsComponent,
        TagComponent,
        NotificationCenterComponent,
        NotificationComponent,
        ResetPasswordFormComponent,

        ChatOverlayComponent,
        PublicSketchesComponent,
        ImageUploadComponent

    ],
    providers: [
        AuthenticationService,
        SketchService,
        ParticipantsService,
        AuthGuardService,
        WindowRefService,
        DashboardService,
        FolderService,
        Globals
    ],
    bootstrap: [AppComponent],
    entryComponents: [TagComponent]
})
export class AppModule {
}
