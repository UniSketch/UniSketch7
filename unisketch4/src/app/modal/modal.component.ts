import { Component, ViewEncapsulation, Output, EventEmitter } from '@angular/core';

/**
 * Reusable component for modal dialogs.
 */
@Component({
    selector: 'app-modal',
    templateUrl: './modal.component.html',
    styleUrls: ['./modal.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ModalComponent {

    /**
     * Whether the dialog is currently visible.
     */
    visible = false;

    /**
     * Emits the toggle event.
     */
    @Output()
    toggle: EventEmitter<any> = new EventEmitter();


    /**
     * Fades in the modal dialog.
     */
    show(): void {
        this.visible = true;
        this.toggle.emit(this.visible);
    }

    /**
     * Fades out the modal dialog.
     */
    hide(): void {
        this.visible = false;
        this.toggle.emit(this.visible);
    }

    /**
     * Called from the template when the user clicks outside of the modal dialog.
     */
    public onContainerClicked(): void {
        this.hide();
        this.toggle.emit(this.visible);
    }

}
