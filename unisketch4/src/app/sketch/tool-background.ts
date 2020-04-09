import {SketchTool} from './tool';
import {SketchService} from "../services/sketch.service";

/**
 *
 */
export class ToolBackground extends SketchTool {

    constructor(sketchService: SketchService) {
        super(sketchService);
    }

    setCursor(): void {
        const sketchArea = document.getElementById('canvas');
        sketchArea.style.cursor = 'default';
    }

}
