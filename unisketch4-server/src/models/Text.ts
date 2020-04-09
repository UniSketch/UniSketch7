import { ChildEntity, Column, Entity } from "typeorm";
import { PositionedSketchElement } from "./PositionedSketchElement";

@ChildEntity('text')
export class Text extends PositionedSketchElement {
    @Column()
    content: string;
    @Column()
    type: string;

    getPos(): any {
        return { x: this.pos_x, y: this.pos_y };
    }

    setPos(pos: any): void {
        this.pos_x = pos.x;
        this.pos_y = pos.y;
    }
}