import {EntityRepository, Repository} from "typeorm";
import {SketchTag} from "../models/SketchTag";

@EntityRepository(SketchTag)
export class SketchTagRepository extends Repository<SketchTag> {

}