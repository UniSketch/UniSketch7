import {EntityRepository, Repository} from "typeorm";
import {Sketch} from "../models/Sketch";

@EntityRepository(Sketch)
export class SketchRepository extends Repository<Sketch> {

    getFilteredSketches(user_id: number, filter: string, sortBy: string = 'title_small', sortOrder: string = 'ASC'): Promise<Sketch[] | null> {
        return this.createQueryBuilder('sketch')
                   .leftJoinAndSelect('sketch.sketchTags', 'sketchTag')
                   .leftJoin('sketchTag.tag', 'tag')
                   .leftJoinAndSelect('sketch.rights', 'right')
                   .innerJoinAndSelect('sketch.user', 'user', 'user.id = :user_id', {user_id: user_id})
                   .where('sketch.title_small like :filter', {filter: `%${filter}%`})
                   .orWhere('tag.name like :filter', {filter: `%${filter}%`})
                   .orderBy(sortBy, sortOrder as 'ASC' | 'DESC')
                   .getMany();
    }
}