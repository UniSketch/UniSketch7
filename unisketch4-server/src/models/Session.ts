import {ISession} from "connect-typeorm";
import {Column, Entity, Index, PrimaryColumn} from "typeorm";
import {Bigint} from "typeorm-static";

@Entity()
export class Session implements ISession {
    @Index()
    @Column("bigint", {transformer: Bigint})
    public expiredAt: number;

    @PrimaryColumn("varchar", {length: 255})
    public id: string;

    @Column()
    public json: string;
}