import {Sketch} from "./Sketch";
import {Tag} from "./Tag";
import {Entity, ManyToOne, PrimaryGeneratedColumn} from "typeorm";

@Entity()
export class SketchTag {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(type => Sketch, sketch => sketch.sketchTags)
    sketch: Sketch;

    @ManyToOne(type => Tag, tag => tag.sketchTags)
    tag: Tag;
}