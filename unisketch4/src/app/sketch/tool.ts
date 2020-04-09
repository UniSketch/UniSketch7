import { SketchService } from '../services/sketch.service';
import { Subscription } from 'rxjs';

/**
 * Base class for a sketch tool like a brush or an eraser.
 */
export class SketchTool {

    /**
     * Whether the current stroke has been cancelled.
     */
    protected canceled = false;

    /**
     * The canvas element of the sketch view.
     */
    protected canvas;

    /**
     * The event subscription on onCanvasReady.
     */
    protected subscription: Subscription;

    /**
     *
     */
    constructor(protected sketchService: SketchService) {
        // Invoked once the canvas for this session is ready.
        this.subscription = this.sketchService.onCanvasReady.subscribe((data) => {
            this.canvas = data['canvas'].nativeElement;
        });
    }

    /**
     * Called when the user clicks into the canvas.
     */
    startStroke(mousePos: any): void {
    }

    startGraffiti(mousePos: any): void {
    }

    /**
     * Called when the user moves the mouse cursor within the canvas while
     * holding left mouse button down.
     */
    continueStroke(mousePos: any, prevMousePos: any): void {
    }

    continueGraffitiLine(mousePos: any, prevMousePos: any): void{
    }

    /**
     * Called when the user releases the left mouse button.
     */
    stopStroke(): void {
    }

    /**
     * Requests a stroke to be cancelled (e.g. because it left the canvas area).
     */
    cancelStroke(): void {
        this.canceled = true;
    }

    /**
     * Returns true if the stroke was cancelled and resets the value.
     */
    consumeCanceled(): boolean {
        if (this.canceled) {
            this.canceled = false;
            return true;
        }

        return false;
    }

    /**
     * Called when the mouse cursor enters the canvas.
     */
    enterCanvas(mousePos: any): void {
    }

    /**
     * Called each time when the mouse cursor moves within the canvas.
     */
    moveOverCanvas(mousePos: any): void {
    }

    /**
     * Called when mouse cursor exits the canvas.
     */
    exitCanvas() {
    }

    /**
     * Unsubscribe the event handler to avoid double events.
     */
    unsubscribe(): void {
        this.subscription.unsubscribe();
    }
}
