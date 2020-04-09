import { Component, OnInit, EventEmitter, Input, Output } from '@angular/core';

/**
 * Custom SelectBox.
 * Passes the current selection upwards.
 */
@Component({
  selector: 'app-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss']
})
export class SelectComponent implements OnInit {

    /**
     * Determines whether or not the selection menu should be open.
     */
    private isExpanded = false;


    /**
     * Current selection
     */
    private current: any;


    /**
     * Option list
     */
    @Input() options: any[];


    /**
     * EventEmitter for the updated selection
     */
    @Output()
    select: EventEmitter<object> = new EventEmitter();


    constructor() { }


    ngOnInit() {
        if (!this.options[0].value || !this.options[0].label) {
            const tempOptions = this.options;

            for (let i = 0; i < tempOptions.length; i++) {
                this.options[i] = {
                    label: tempOptions[i],
                    value: tempOptions[i]
                };
            }
        }

        if (!this.current) {
            this.current = this.options[0];
        }
    }


    /**
     * Open or close the selection menu depending on the current
     * state.
     */
    private toggleMenu(): void {
        this.isExpanded = !this.isExpanded;
    }


    /**
     * Handles click on an option.
     * If it's not the currently selected one, update current.
     */
    private selectOption(option: object): void {
        if (!this.isSelected(option)) {
            this.current = option;
        }

        this.select.emit(option);
    }


    /**
     * Determines if the given option is the currently selected one.
     */
    private isSelected(option: object): boolean {
        return this.current === option;
    }

}
