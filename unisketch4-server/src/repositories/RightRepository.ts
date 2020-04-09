import {EntityRepository, Repository} from "typeorm";
import {Right} from "../models/Right";

@EntityRepository(Right)
export class RightRepository extends Repository<Right> {

}