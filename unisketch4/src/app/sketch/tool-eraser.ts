import {SketchService} from '../services/sketch.service';

import {Line} from '../models/line.model';
import {Vertex} from '../models/vertex.model';
import {SketchTool} from './tool';

/**
 * Tool class for the eraser.
 */
export class ToolEraser extends SketchTool {

    constructor(sketchService: SketchService) {
        super(sketchService);
    }

    // TODO maybe allow different eraser sizes to make it easier. This would be done by checking a certain amount of 8-neighbors.
    continueStroke(mousePos: any, prevMousePos: any): void {
        // Find lines that intersect with the line of the mouse movement and erase the first found.
        const sketch = this.sketchService.getSketch();
        let hasChanged: boolean = false;

        for (let i = 0; i < sketch.sketchElements.length; i++) {
            if (sketch.sketchElements[i].isWithinRadius(3, mousePos)) {
                this.sketchService.eraseElement(sketch.sketchElements[i]);
                sketch.sketchElements.splice(i, 1);
                hasChanged = true;
                break;
            }
        }

        // Erasing requires a redraw of the sketch.
        if (hasChanged) {
            this.sketchService.redrawSketch();
        }
    }
}
