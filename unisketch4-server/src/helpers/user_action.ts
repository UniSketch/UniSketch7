import {SketchElement} from "../models/SketchElement";
import {Polyline} from "../models/Polyline";

export class UserAction<T extends SketchElement> {

    constructor(private flagForward: boolean, private data: T, private forUpdate: boolean = false) {

    }

    // called when vertices need to be appended to line
    public insertUpdateData(activeSketchLastLineId: number, vertices: any[]): void {
        if (activeSketchLastLineId === this.data.id && this.data instanceof Polyline) { // line ids need to be the same because its data from the same line
            this.data.vertices = this.data.vertices.concat(vertices);
        }
    }

    // called when last vertex need to be changed to new position
    public insertFinalData(activeSketchLastLineId: number, dataX: number, dataY: number): void {
        if (activeSketchLastLineId === this.data.id && this.data instanceof Polyline) { // line ids need to be the same because its data from the same line
            this.data.vertices[this.data.vertices.length - 2] = dataX;
            this.data.vertices[this.data.vertices.length - 1] = dataY;
        }
    }

    public isFlagForward(): boolean {
        return this.flagForward;
    }

    public getId(): number {
        return this.data.id;
    }

    public getData(): T {
        return this.data;
    }

    public isForUpdate(): boolean {
        return this.forUpdate;
    }


}