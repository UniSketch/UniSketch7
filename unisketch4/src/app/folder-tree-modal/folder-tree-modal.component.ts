import {
    Component,
    ComponentFactoryResolver,
    ElementRef,
    EventEmitter,
    HostListener, Input,
    Output,
    ViewChild
} from '@angular/core';
import {ModalComponent} from '../modal/modal.component';
import {FolderService} from "../services/folder.service";
import {Folder} from "../models/folder.model";
import {NotificationService} from "../services/notification.service";


@Component({
    selector: 'app-folder-tree-modal',
    templateUrl: './folder-tree-modal.component.html',
    styleUrls: ['./folder-tree-modal.component.scss']
})
export class FolderTreeModalComponent {

    /**
     * Reference to the modal component in the template.
     */
    @ViewChild(ModalComponent)
    private modal: ModalComponent;

    /**
     * Reference to the name input field.
     */
    @ViewChild('nameInput')
    private nameRef: ElementRef;

    @Input()
    private folder?: Folder;

    private errorMessage: string = '';

    @Output()
    onCreateSuccess: EventEmitter<Folder> = new EventEmitter<Folder>();

    /**
     * Determines the current tag input state.
     */
    private isInputActive = false;

    /**
     * Determines if the input should be shown in error state.
     */
    private inputHasError = false;

    constructor(
        private folderService: FolderService,
    ) {
    }


    show() {
        this.modal.show();
    }

    hide() {
        this.nameRef.nativeElement.value = '';
        this.modal.hide();
    }

    private submit() {
        const name: string = this.nameRef.nativeElement.value;
        if(name.length < 3 || name.length > 16) {
            this.inputHasError = true;
            this.errorMessage = 'The name of the folder has to be consist of 3-16 characters';
            return;
        }

        this.folderService.createFolder(name, this.folder)
            .then((folder: Folder) => {
                this.onCreateSuccess.emit(folder);
                this.hide();
            })
            .catch(err => {
                // TODO better error handling
                console.log(err);
            });
    }


    @HostListener('document:keypress', ['$event'])
    private handleKeyboardEvents(e) {
        if (this.modal.visible && this.isInputActive) {
            if (e.key === 'Enter') {
                e.preventDefault();

                if (this.nameRef.nativeElement.value.trim().length > 0) {
                    this.submit();
                }
            }
        }
    }

    /**
     * Updates the current input focus state.
     */
    private toggleInput() {
        this.isInputActive = !this.isInputActive;
    }

    /**
     * Updates the current input state in terms of errors.
     */
    private updateInput() {
        const name: string = this.nameRef.nativeElement.value;
        if(name.length < 3 || name.length > 16) {
            this.inputHasError = true;
            this.errorMessage = 'The name of the folder has to be consist of 3-16 characters';
            return;
        }
        this.inputHasError = false;
    }

}
