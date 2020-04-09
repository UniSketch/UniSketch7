import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {Globals} from "../globals";
import {GenericResponse} from "./participants.service";

interface IPublicSketch {
    id: number;
    title: string;
    title_small: string;
    updated_at: string;
}

interface PublicSketchesResponse extends GenericResponse {
    sketches: IPublicSketch[];
}

/**
 * Reads public sketches from the database and returns them.
 */
@Injectable()
export class PublicSketchesService {

    constructor(private http: HttpClient) {
    }

    /**
     * Retrieves the 20 last updated sketches that are public.
     */
    public getAllPublicSketches() {
        return new Promise((resolve, reject) => {
            
            this.http.get<PublicSketchesResponse>(Globals.BASE_PATH + '/api/public-sketches').subscribe(data => {
                if (data.success) {
                    resolve(data.sketches);
                } else {
                    reject(data['error']);
                }
            }, (err: HttpErrorResponse) => {
                if (err.error instanceof Error) {
                    reject(err.error.message);
                } else {
                    reject(err.status + ': ' + err.error);
                }
            });
        });
    }


}
