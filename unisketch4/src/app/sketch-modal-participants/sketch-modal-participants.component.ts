import {Component, ViewEncapsulation, ElementRef, Input, ViewChild} from '@angular/core';
import {NgForm} from '@angular/forms';

import {SketchService} from '../services/sketch.service';
import {ParticipantsService} from '../services/participants.service';
import {AuthenticationService} from '../services/authentication.service';
import {ModalComponent} from '../modal/modal.component';
import {Sketch} from '../models/sketch.model';
import {Participant} from '../models/participant.model';

/**
 * Enum to describe the state of changes made through the dialog.
 */
enum SaveMode {
    NoChanges,
    Saving,
    Saved,
    Errored
}

/**
 * Modal dialog for sketch participants management.
 */
@Component({
    selector: 'app-sketch-modal-participants',
    templateUrl: './sketch-modal-participants.component.html',
    styleUrls: ['./sketch-modal-participants.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class SketchModalParticipantsComponent {

    /**
     * Reference to the modal component in the html template.
     */
    @ViewChild(ModalComponent)
    private modal: ModalComponent;

    /**
     * Reference to the invite form in the html template.
     */
    @ViewChild('inviteForm')
    private inviteForm: NgForm;

    /**
     * Available roles in the participant role dropdown.
     */
    roles: String[] = ['Viewer', 'Editor', 'Owner'];

    /**
     * The sketch this modal is shown for.
     */
    sketch: Sketch = new Sketch();

    /**
     * Reference to the SaveMode enum to make it accessible in the template.
     */
    saveModeEnum = SaveMode;

    /**
     * Current state of saved changes.
     */
    saveMode: SaveMode = SaveMode.NoChanges;

    /**
     * The error to display in case the save mode is errored.
     */
    errorText: String;

    /**
     * List of participants in this sketch.
     */
    participants: Participant[];

    /**
     * Model for the invite participant form.
     */
    newParticipant: Participant = new Participant();

    constructor(
        private sketchService: SketchService,
        private participantsService: ParticipantsService,
        private authService: AuthenticationService
    ) {
    }

    /**
     * Shows the participants modal for the given sketch.
     */
    show(sketch: Sketch) {
        this.sketch = sketch;
        this.saveMode = SaveMode.NoChanges;

        this.updateParticipantsList();
        this.updatePublicCheckbox();
        this.modal.show();
    }

    /**
     * Updates the participants list from the server.
     */
    private updateParticipantsList() {
        this.participantsService.getParticipants(this.sketch)
            .then(participants => {
                this.participants = <Participant[]>participants;
            })
            .catch(err => {
                this.saveMode = SaveMode.Errored;
                this.errorText = 'An unexpected error has occurred during loading.';
                console.error(err);
            });
    }

    /**
     * Grants access to the user entered into the invitation form.
     */
    inviteParticipant() {
        this.saveMode = SaveMode.Saving;
        this.participantsService.updateRole(this.sketch, this.newParticipant, this.newParticipant.role)
            .then(() => {
                this.saveMode = SaveMode.Saved;
                this.updateParticipantsList();
                let tmpRole = this.newParticipant.role;
                this.newParticipant = new Participant();
                this.inviteForm.resetForm();
                this.newParticipant.role = tmpRole;
            })
            .catch(err => {
                this.saveMode = SaveMode.Errored;
                if (err === 'no_permission') {
                    this.errorText = 'You do not have sufficient permission.';
                } else if (err === 'user_not_found') {
                    this.errorText = 'Could not find a user with that email address.';
                } else if (err === 'cannot_grant_self') {
                    this.errorText = 'You cannot invite yourself.';
                } else {
                    this.errorText = 'An unexpected error has occurred during saving.';
                    console.error(err);
                }
            });
    }

    /**
     * Updates the role of a participant to the given value.
     */
    onRoleSelected(newValue, participant: Participant) {
        this.saveMode = SaveMode.Saving;
        this.participantsService.updateRole(this.sketch, participant, newValue)
            .then(() => {
                this.saveMode = SaveMode.Saved;
            })
            .catch(err => {
                this.saveMode = SaveMode.Errored;
                if (err === 'last_owner_left') {
                    this.errorText = 'You cannot remove the last remaining owner.';
                } else if (err === 'cannot_grant_self') {
                    this.errorText = 'You cannot change your own role.';
                } else {
                    this.errorText = 'An unexpected error has occurred during saving.';
                    console.error(err);
                }
            });
    }

    /**
     * Removes a user from the sketch participants.
     */
    removeParticipant(participant: Participant) {
        this.saveMode = SaveMode.Saving;
        this.participantsService.removeParticipant(this.sketch, participant)
            .then(() => {
                this.saveMode = SaveMode.Saved;
                this.updateParticipantsList();
            })
            .catch(err => {
                this.saveMode = SaveMode.Errored;
                if (err === 'last_owner_left') {
                    this.errorText = 'You cannot remove the last remaining owner.';
                } else {
                    this.errorText = 'An unexpected error has occurred during saving.';
                    console.error(err);
                }
            });
    }

    /**
     * Tests whether the given participant is the currently logged in user.
     */
    isParticipantYourself(participant: Participant) {
        return participant.user_id === this.authService.getLoggedInUserId();
    }

    getRoleId(role: string): number {
        switch (role) {
            case 'Viewer':
                return 1;
            case 'Editor':
                return 2;
            case 'Owner':
                return 3;
        }
    }

    getRole(id: number): string {
        switch (id) {
            case 1:
                return 'Viewer';
            case 2:
                return 'Editor';
            case 3:
                return 'Owner';
        }
    }

    toggleVisibility(e) {
        const state = !this.sketch.is_public ? 'public' : 'private';
        if (confirm(`Are you sure that you want to make your sketch ${state}?`)) {
            this.sketchService.toggleVisibility()
                .then((resp) => {
                    if (resp['success'] === true) {
                        this.sketch.is_public = !this.sketch.is_public;
                    }
                    this.updatePublicCheckbox();
                })
                .catch(err => {
                    this.saveMode = SaveMode.Errored;
                    this.errorText = 'An unexpected error has occurred during changing the visibility.';
                    console.error(err);
                });
        } else {
            e.preventDefault();
        }
    }

    /**
     * Checks if the sketch is set to public or private and adjusts public-checkbox accordingly
     */
    private updatePublicCheckbox() {
        const elem = <HTMLInputElement>document.getElementById("public-checkbox");
        if (elem) {
            elem.checked = this.sketch.is_public;
        }
    }
}
