import { Component, Inject, ElementRef, Input, ComponentFactoryResolver,
         Output, EventEmitter, HostListener, ViewChild,
         ViewContainerRef } from '@angular/core';

import { SketchService } from '../services/sketch.service';
import { DashboardService } from '../services/dashboard.service';
import { ModalComponent } from '../modal/modal.component';
import { Sketch } from '../models/sketch.model';
import { TagComponent } from '../tag/tag.component';


@Component({
    selector: 'app-sketch-modal-tags',
    templateUrl: './sketch-modal-tags.component.html',
    styleUrls: ['./sketch-modal-tags.component.scss']
})
export class SketchModalTagsComponent {

    /**
     * Reference to the modal component in the template.
     */
    @ViewChild(ModalComponent)
    private modal: ModalComponent;

    /**
     * Reference to the tags input field.
     */
    @ViewChild('tagsInput')
    private tagsRef: ElementRef;

    /**
     * Reference to the tags mirror output.
     */
    @ViewChild('mirror', { read: ViewContainerRef })
    private mirrorRef: ViewContainerRef;

    /**
     * Emits the toggle event.
     */
    @Output()
    toggle: EventEmitter<any> = new EventEmitter();

    /**
     * Tags associated to the sketch.
     */
    private tags: string[];

    /**
     * Determines the current tag input state.
     */
    private isInputActive = false;

    /**
     * Determines if the input should be shown in error state.
     */
    private inputHasError = false;

    /**
     * Local copy of the current sketch.
     */
    @Input()
    sketch: Sketch;


    constructor(
        private dashboardService: DashboardService,
        private factoryResolver: ComponentFactoryResolver
    ) { }


    show(sketch: Sketch) {
        this.sketch = sketch;
        this.mirrorRef.clear();
        this.dashboardService.getAllTags(this.sketch.id).subscribe(data => {
            if (data['tags']) {
                this.tags = [];
                for (let i = 0; i < data['tags'].length; i++) {
                    const name = data['tags'][i].name.trim();
                    this.tags.push(name);
                    this.renderTag(name);
                }
            }
        });

        this.modal.show();

        setTimeout(() => {
            this.tagsRef.nativeElement.focus();
        }, 100);
    }

    hide() {
        this.sketch = null;
        this.modal.hide();
    }

    private handleToggle(event) {
        this.toggle.emit(event);
    }


    @HostListener('document:keypress', ['$event'])
    private handleKeyboardEvents(e) {
        if (this.modal.visible && this.isInputActive) {
            if (e.key === 'Enter') {
                e.preventDefault();

                if (this.tagsRef.nativeElement.value.trim().length > 0) {
                    this.transformInputToTag();
                }
            }
        }
    }

    private get title(): string {
        if (this.sketch) {
            return `to "${this.sketch.title}"`;
        } else {
            return '';
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
        this.inputHasError = false;
    }

    /**
     * Handles the current user input.
     * Sends it to the server and transforms it into a visible and
     * deletable tag in the overview.
     */
    private transformInputToTag() {
        const input = this.tagsRef.nativeElement.value;

        if (this.tags.findIndex(name => name === input) < 0) {
            this.dashboardService.setTag(this.sketch.id, input).subscribe(data => {
                if (data.success) {
                    this.tags.push(input);
                    this.renderTag(input);
                    this.tagsRef.nativeElement.value = '';
                }
            });
        } else {
            this.inputHasError = true;
        }
    }

    /**
     * Render a single tag in the given container.
     */
    private renderTag(name: string) {
        const tagsFactory = this.factoryResolver.resolveComponentFactory(TagComponent)
        const tagRef = this.mirrorRef.createComponent(tagsFactory);
        const instance = <TagComponent>tagRef.instance;

        instance.name = name;
        instance.remove.subscribe(tagname => {
            this.dashboardService.deleteTag(this.sketch.id, tagname).subscribe(data => {
                if (data.success) {
                    this.tags = this.tags.filter(name => name !== tagname);
                    tagRef.destroy();
                }
            });
        });
    }
}
