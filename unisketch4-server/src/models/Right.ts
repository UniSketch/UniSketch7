import {User} from "./User";
import {Sketch} from "./Sketch";
import {BeforeInsert, Column, Entity, ManyToOne, PrimaryGeneratedColumn} from "typeorm";

@Entity()
export class Right {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(type => User, user => user.rights)
    user: User;

    @ManyToOne(type => Sketch, sketch => sketch.rights)
    sketch: Sketch;

    @Column("int")
    role_id: number;

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