import {Router} from '@angular/router';
import {Component, OnInit, ViewChild} from '@angular/core';

import {DashboardService} from './../services/dashboard.service';
import {ModalComponent} from './../modal/modal.component';
import {FolderService} from "../services/folder.service";
import {WindowRefService} from "../services/window-ref.service";
import {FolderTreeComponent} from "../folder-tree/folder-tree.component";


/**
 * Component for the sketch library.
 */
@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    providers: [FolderService]
})
export class HomeComponent implements OnInit {


    /**
     * List of sketches the user has in their library.
     */
    private sketches: any[];

    /**
     * Reference to the sketch to be deleted. Needed for the delete
     * confirmation dialog.
     */
    private sketchToDelete: any = {};

    /**
     * Header for the delete confirmation dialog. Either 'Remove' or
     * 'Delete' based on whether the user owns the sketch to be deleted.
     */
    private deleteTermHeader: string;

    /**
     * Phrase for the delete confirmation dialog. Either 'Remove' or
     * 'Delete' based on whether the user owns the sketch to be deleted.
     */
    private deleteTerm: string;

    /**
     * TODO: Fetch this from a better place.
     * Available sketch sorting options for the select dropdown.
     */
    private sortOptions = [
        {value: 'update', label: 'Last Updated'},
        {value: 'name', label: 'Alphabet'}
    ];

    /**
     * Current selection for sketch order.
     */
    private sortBy: string = this.sortOptions[0].value;


    /**
     * Input timeout id to delete the previous one on input.
     */
    private timeoutId: number;

    private droppedFolderId?: number;

    /**
     * Reference to the delete confimration dialog in the template.
     */
    @ViewChild(ModalComponent) modal: ModalComponent;

    @ViewChild(FolderTreeComponent) tree: FolderTreeComponent;


    constructor(private dashboardService: DashboardService, private window: WindowRefService, private router: Router) {
        this.dashboardService.sketchesChange
            .subscribe(data => {
                this.sketches = data;
            });
    }

    ngOnInit() {
        // Loads all sketches from the user's library.
        this.dashboardService.getAllSketches()
            .catch(err => {
                console.log(err);
            });

    }


    /**
     * Reacts to filter option updates
     */
    private updateSort(event, input: string = '') {
        if (this.sortBy !== event.value) {
            this.sortBy = event.value;
            this.performFilterRequest(input, this.sortBy);
        }
    }


    /**
     * Handles input events on the search input field.
     */
    private searchBy(input: string) {
        window.clearTimeout(this.timeoutId);
        this.timeoutId = window.setTimeout(() => {
            this.performFilterRequest(input, this.sortBy);
        }, 300);
    }

    private performFilterRequest(input: string, sortBy: string) {
        if (input.length === 0) {
            this.dashboardService.getAllSketches(sortBy);
        } else {
            this.dashboardService.getFilteredSketches(input, sortBy)
                .subscribe(data => {
                    if (data['sketches']) {
                        this.sketches = data['sketches'];
                    }

                });
        }
    }

    allowDrop(element) {
        return true;
    }

    /**
     * Opens the delete confirmation dialog for the given sketch.
     */
    private sketchDeleteEmitter(sketch) {
        this.sketchToDelete = sketch;
        this.deleteTermHeader = sketch.is_owner ? 'Delete' : 'Remove';
        this.deleteTerm = sketch.is_owner ? 'delete this sketch' : 'remove this sketch from your library';
        this.modal.show();
    }

    /**
     * Deletes or removes a sketch from the library.
     */
    private deleteSketch() {
        let observable: any;
        if (this.sketchToDelete.is_owner) {
            observable = this.dashboardService
                             .deleteSketchWithId(this.sketchToDelete.id);
        } else {
            observable = this.dashboardService
                             .removeSketchWithId(this.sketchToDelete.id);
        }

        observable.subscribe(response => {
            if (response['success'] && response['success'] === true) {
                this.sketches = this.sketches.filter(item => item.id !== this.sketchToDelete.id);
                this.modal.hide();
            }
        });
    }

    /**
     * Getter for the result summary
     */
    private get resultMessage(): string {
        if (this.sketches) {
            if (this.sketches.length > 0) {
                return this.sketches.length + ' sketch' +
                    ((this.sketches.length > 1) ? 'es' : '');
            } else {
                return "No sketches";
            }

        } else {
            return 'Loading...'
        }
    }


}
