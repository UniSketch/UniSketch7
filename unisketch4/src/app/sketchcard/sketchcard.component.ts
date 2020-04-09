import {Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {DashboardService} from '../services/dashboard.service';
import {WindowRefService} from '../services/window-ref.service';
import {Router} from '@angular/router';

import {Globals} from "../globals";
import {SketchModalTagsComponent} from "../sketch-modal-tags/sketch-modal-tags.component";

/**
 * Component for a single sketch card in the library.
 */
@Component({
    selector: 'app-sketchcard',
    templateUrl: './sketchcard.component.html',
    styleUrls: ['./sketchcard.component.scss']
})
export class SketchcardComponent implements OnInit {

    /**
     * The sketch shown by this sketch card.
     */
    @Input()
    sketch: any;

    /** Should the controls for the sketch be shown? */
    @Input()
    showControls: boolean = false;

    /**
     * Event emitter for when the delete button is clicked.
     */
    @Output()
    onDelete = new EventEmitter<any>();

    @ViewChild(SketchModalTagsComponent)
    tagModal;

    /**
     * Reference to the native window. Used to open sketch in new tab.
     */
    public nativeWindow: any;

    /**
     * The title of the sketch before any changes were applied.
     * TODO: cleanup potential, updateTitle could receive a string
     * parameter and make both oldSketchTitle obsolete by only modifying
     * the sketch object in updateTitle itself
     */
    oldSketchTitle = '';

    constructor(
        private router: Router,
        private dashboardService: DashboardService,
        private windowRefService: WindowRefService,
        public globals: Globals,
    ) {
        this.nativeWindow = windowRefService.getNativeWindow();
    }

    ngOnInit() {
        this.oldSketchTitle = this.sketch.title;

    }

    /**
     * Called from the template when the delete button is clicked. Emits a delete event.
     */
    onDeleteClick(event: Event) {
        event.stopPropagation();
        this.onDelete.emit(this.sketch);

    }

    onClick(event: Event) {
        this.router.navigate(['sketch/', this.sketch.id]);
    }

    onTagsClick(event: Event) {
        event.stopPropagation();
        this.tagModal.show(this.sketch);
    }

    /**
     * Updates the sketch title to what the user entered in the text field.
     */
    updateTitle() {
        if (this.sketch.title && this.sketch.title !== '') {
            this.dashboardService.updateSketchTitle(this.sketch)
                .subscribe(
                    data => {
                    }, error => {
                        this.sketch.title = this.oldSketchTitle;
                    });
        }
    }

    get previewUrl() {
        if (this.showControls) {
            return `${Globals.BASE_PATH}/api/sketch/preview/${this.sketch.id}`;
        } else {
            return `${Globals.BASE_PATH}/api/public-sketch/preview/${this.sketch.id}`;
        }
    }
}
