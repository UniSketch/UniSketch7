import {BeforeInsert, Column, Entity, ManyToOne, PrimaryGeneratedColumn, TableInheritance} from "typeorm";
import {Sketch} from "./Sketch";
import {SketchElementType} from "../helpers/sketch_element_type";

@Entity()
@TableInheritance({column: {type: "varchar", name: "element_type"}})
export abstract class SketchElement {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    color: string;

    @Column("int")
    width: number;

    @Column()
    dasharray: string;

    @Column()
    brushStyle: string;

    @Column()
    updated_at: Date;

    @Column()
    created_at: Date;

    @ManyToOne(type => Sketch, sketch => sketch.sketchElements)
    sketch: Sketch;

    @Column()
    element_type: SketchElementType;

    @BeforeInsert()
    prepare() {
        this.created_at = new Date();
        this.updated_at = new Date();
    }

    public abstract getPos(): any;

    public abstract setPos(pos: any): void;

}