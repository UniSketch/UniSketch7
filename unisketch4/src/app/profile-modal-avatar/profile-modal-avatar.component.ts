import {Component, ViewChild, Output, EventEmitter} from '@angular/core';

import { Router} from '@angular/router';

import {AuthenticationService} from '../services/authentication.service';
import {DashboardService} from '../services/dashboard.service';
import {ModalComponent} from '../modal/modal.component';
import {Sketch} from '../models/sketch.model';
import {Globals} from "../globals";

/**
 * Modal dialog for selecting an avatar.
 */
@Component({
    selector: 'app-profile-modal-avatar',
    templateUrl: './profile-modal-avatar.component.html',
    styleUrls: ['./profile-modal-avatar.component.scss']
})
export class ProfileModalAvatarComponent {

    /**
     * Reference to the modal component in the html template.
     */
    @ViewChild(ModalComponent)
    private modal: ModalComponent;

    /**
     * EventEmitter for when an avatar has been selected.
     */
    @Output()
    onAvatarChanged: EventEmitter<Sketch> = new EventEmitter<Sketch>();

    /**
     * List of sketches available for use as an avatar.
     */
    sketches: Sketch[];

    constructor(private dashboardService: DashboardService, private authenticationService: AuthenticationService,
        private router: Router, public globals: Globals) {
}

    /**
     * Opens this modal dialog.
     */
    show() {
        this.updateSketchList();

        this.modal.show();
    }

    /**
     * Updates the list of available sketches to use as an avatar from the server.
     */
    private updateSketchList() {
        this.dashboardService.getAllSketches()
            .then(data => {

                // @ts-ignore
                this.sketches =  data.filter(function(sketch) {
                    return sketch.is_owner;
                });
            });
    }

    /**
     * Updates the user's avatar to the selected sketch and closes the modal dialog.
     */
    selectAvatar(sketch: Sketch): void {
        this.authenticationService.updateAvatar(sketch)
            .subscribe(response => {
                // TODO error handling
            });

        // Immediately update the avatar client-side and close the window for a smoother experience.
        this.onAvatarChanged.emit(sketch);
        this.modal.hide();

        this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
            this.router.navigate(['/dashboard/profile']);
        });
    }

}
