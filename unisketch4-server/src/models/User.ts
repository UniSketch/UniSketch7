import {BeforeInsert, Column, Entity, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {Folder} from "./Folder";
import {Right} from "./Right";
import {Sketch} from "./Sketch";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    created_at: Date;
    @Column()
    updated_at: Date;

    @Column()
    email_address: string;
    @Column()
    password_digest: string;
    @Column()
    name: string;

    @Column({nullable: true})
    password_reset_token: string;
    @Column({nullable: true})
    password_reset_sent_at: Date;

    @OneToMany(type => Folder, folder => folder.user)
    folders: Folder[];

    @OneToMany(type => Right, right => right.user)
    rights: Right[];

    @OneToMany(type => Sketch, sketch => sketch.user)
    sketches: Sketch[];

    @Column({nullable: true})
    avatar_sketch_id: number;

    @BeforeInsert()
    prepare() {
        this.created_at = new Date();
        this.updated_at = new Date();
    }
}