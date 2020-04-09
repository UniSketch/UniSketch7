import {Sketch} from './sketch.model';
import {Vertex} from './vertex.model';

export abstract class SketchElement {
    id: number;

    color: string;

    width: number;

    dasharray: string;
    brushStyle: string;

    updated_at: Date;
    created_at: Date;

    sketch: Sketch;

    public abstract getPos(): any;

    public abstract setPos(pos: any);

    abstract isWithinSelectionFrame(startPoint: any, endPoint: any): boolean;

    abstract isWithinRadius(offset: number, clickPos: Vertex): boolean;

    abstract clone(): any;

    abstract move(x: number, y: number): void;

    abstract scale(xFactor: number, yFactor: number, fixedSide: any): void;

    abstract floorWidth(): void;

}
