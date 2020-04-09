import {EntityRepository, Repository} from "typeorm";
import {Text} from "../models/Text";

@EntityRepository(Text)
export class TextRepository extends Repository<Text> {

}