import {Sketch} from "./Sketch";
import {Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {User} from "./User";

@Entity()
export class Folder {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToOne(type => User, user => user.folders)
    user: User;

    @ManyToOne(type => Folder, folder => folder.children)
    parent: Folder;

    @OneToMany(type => Folder, folder => folder.parent)
    children: Folder[];

    @OneToMany(type => Sketch, sketch => sketch.folder)
    sketches: Sketch[];


}