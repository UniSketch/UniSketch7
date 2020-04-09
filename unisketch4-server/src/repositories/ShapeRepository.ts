import {EntityRepository, Repository} from "typeorm";
import {Shape} from "../models/Shape";

@EntityRepository(Shape)
export class ShapeRepository extends Repository<Shape> {

}
