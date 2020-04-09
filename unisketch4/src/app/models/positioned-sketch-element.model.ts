import {SketchElement} from './sketch-element.model';

export abstract class PositionedSketchElement extends SketchElement {
    pos_x: number;
    pos_y: number;
}
