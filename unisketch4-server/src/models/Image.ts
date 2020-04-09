import { ChildEntity, Column, Entity } from "typeorm";
import { PositionedSketchElement } from "./PositionedSketchElement";

@ChildEntity('image')
export class Image extends PositionedSketchElement {

    @Column()
    src: string;

    getPos(): any {
        return { x: this.pos_x, y: this.pos_y };
    }

    setPos(pos: any): void {
        this.pos_x = pos.x;
        this.pos_y = pos.y;
    }
}
