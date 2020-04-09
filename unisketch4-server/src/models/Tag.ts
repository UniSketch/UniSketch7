import {Column, Entity, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {SketchTag} from "./SketchTag";

@Entity()
export class Tag {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany(type => SketchTag, sketchTag => sketchTag.tag)
    sketchTags: SketchTag[];
}