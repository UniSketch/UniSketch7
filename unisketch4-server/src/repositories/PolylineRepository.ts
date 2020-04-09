import {EntityRepository, Repository} from "typeorm";
import {Polyline} from "../models/Polyline";

@EntityRepository(Polyline)
export class PolylineRepository extends Repository<Polyline> {

}