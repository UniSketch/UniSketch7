import {SketchTool} from './tool';
import {SketchService} from "../services/sketch.service";

/**
 *
 */
export class ToolBackground extends SketchTool {

    constructor(sketchService: SketchService) {
        super(sketchService);
    }

}
