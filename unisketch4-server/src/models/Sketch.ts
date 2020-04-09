import {BeforeInsert, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {SketchElement} from "./SketchElement";
import {SketchTag} from "./SketchTag";
import {Folder} from "./Folder";
import {Right} from "./Right";
import {User} from "./User";

@Entity()
export class Sketch {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(type => Folder, folder => folder.sketches, {
        cascade: true,
    })
    folder: Folder;

    @OneToMany(type => Right, right => right.sketch, {
        cascade: true,
    })
    rights: Right[];

    @OneToMany(type => SketchElement, sketchElement => sketchElement.sketch)
    sketchElements: SketchElement[];

    @OneToMany(type => SketchTag, sketchTag => sketchTag.sketch, {
        cascade: true,
    })
    sketchTags: SketchTag[];

    @ManyToOne(type => User, user => user.sketches)
    user: User;

    @Column()
    title: string;
    @Column()
    title_small: string;
    @Column({type: "text", nullable: true})
    preview: string;

    @Column()
    background_color: string;

    @Column("bool")
    is_public: boolean = false;

    @Column()
    created_at: Date;
    @Column()
    updated_at: Date;


    @BeforeInsert()
    prepare() {
        this.created_at = new Date();
        this.updated_at = new Date();
    }
}