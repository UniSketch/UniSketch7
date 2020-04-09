import {SketchElement} from "./SketchElement";
import {ChildEntity, Column, Entity} from "typeorm";

@ChildEntity('positioned')
export abstract class PositionedSketchElement extends SketchElement {
    @Column("int")
    pos_x: number;

    @Column("int")
    pos_y: number;

}