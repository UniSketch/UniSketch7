import {EntityRepository, Repository} from "typeorm";
import {SketchElement} from "../models/SketchElement";

@EntityRepository(SketchElement)
export class SketchElementRepository extends Repository<SketchElement> {

}