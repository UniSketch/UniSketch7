import {ChildEntity, Column, Entity} from "typeorm";
import { SketchElement } from "./SketchElement";

@ChildEntity('polyline')
export class Polyline extends SketchElement {
    @Column("simple-array")
    vertices: number[] = [];

    getPos(): any {
        return this.vertices;
    }

    setPos(pos: any) {
        this.vertices = pos;
    }
}
