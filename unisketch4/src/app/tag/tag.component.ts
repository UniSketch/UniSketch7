import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'app-tag',
    templateUrl: './tag.component.html',
    styleUrls: ['./tag.component.scss']
})
export class TagComponent {

    /**
     * Tag name string.
     */
    @Input() name: string;

    /**
     * EventEmitter for when it should be deleted.
     */
    @Output() remove: EventEmitter<string> = new EventEmitter();

    /**
     * Handles click event on the delete button.
     */
    private handleRemoveClick(): void {
        this.remove.emit(this.name);
    }
}
