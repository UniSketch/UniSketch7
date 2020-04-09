import {EntityRepository, Repository} from "typeorm";
import {PositionedSketchElement} from "../models/PositionedSketchElement";

@EntityRepository(PositionedSketchElement)
export class PositionedSketchElementRepository extends Repository<PositionedSketchElement> {

}