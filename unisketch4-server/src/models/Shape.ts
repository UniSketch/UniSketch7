import {ChildEntity, Column, Entity} from "typeorm";
import {PositionedSketchElement} from "./PositionedSketchElement";

export enum ShapeType {
    Rectangle = 'rect',
    Circle = 'circle',
    Ellipse = 'ellipse',
    Triangle = 'triangle',
}

@ChildEntity('shape')
export class Shape extends PositionedSketchElement {

    @Column()
    type: ShapeType;

    @Column()
    height: number;

    @Column()
    size: number;

    @Column()
    fill: string;

    @Column()
    mirrored_x: boolean;

    @Column()
    mirrored_y: boolean;


    getPos(): any {
        return {x: this.pos_x, y: this.pos_y};
    }

    setPos(pos: any): void {
        this.pos_x = pos.x;
        this.pos_y = pos.y;

    }
}