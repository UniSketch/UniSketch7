import {EntityRepository, Repository} from "typeorm";
import {Folder} from "../models/Folder";

@EntityRepository(Folder)
export class FolderRepository extends Repository<Folder> {

}