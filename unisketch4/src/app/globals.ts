import {Injectable} from "@angular/core";

@Injectable()
export class Globals {
    static readonly BASE_PATH: string = '/unisketch7';

    get basePath() {
        return Globals.BASE_PATH;
    }
}
