import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {Injectable} from '@angular/core';


import {Subject} from 'rxjs';
import {Globals} from "../globals";
import {Sketch} from "../models/sketch.model";
import {GenericResponse} from "./participants.service";

interface SketchesResponse extends GenericResponse {
    sketches: Sketch[];
}

/**
 * Service providing functions for listing and managing sketches in a
 * library.
 * TODO: the service shouldn't return HTTP responses as that defeats
 * most of the point, it should read them right here and return the
 * data the caller actually needs (see ParticipantsService for example)
 */
@Injectable()
export class DashboardService {

    selectedFolderId?: number;

    selectedFolderChange: Subject<number> = new Subject<number>();

    sketches?: Sketch[];
    sketchesChange: Subject<Sketch[]> = new Subject<Sketch[]>();

    constructor(private http: HttpClient) {
        this.selectedFolderChange.subscribe((value) => {
            this.selectedFolderId = value;
        });

        this.sketchesChange.subscribe((value) => {
            this.sketches = value;
        })
    }


    /**
     * Retrieves a list of sketches the user is allowed to access.
     */
    public getAllSketches(orderBy: string = 'update') {
        return new Promise((resolve, reject) => {
            const folderId = this.selectedFolderId ? this.selectedFolderId : -1;

            this.http.get<SketchesResponse>(Globals.BASE_PATH + `/api/sketches/${folderId}/${orderBy}`)
                .subscribe(data => {
                    if (data.success) {
                        this.sketchesChange.next(data.sketches);
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

    /**
     * Retrieves a list of sketches the user is allowed to access and
     * that match the search keywords.
     * TODO: Add orderBy
     */
    public getFilteredSketches(input: string, orderBy: string = 'update') {
        if (!(input && input.trim())) {
            const folderId = this.selectedFolderId ? this.selectedFolderId : -1;
            return this.http.get(Globals.BASE_PATH + `/api/sketches/${folderId}/${orderBy}`);
        }

        return this.http.get(Globals.BASE_PATH + `/api/sketches/search/${orderBy}/${input}`);
    }

    /**
     * Retrieves a list of sketches the user is allowed to access and
     * that match the search keywords.
     * TODO: Implement
     */
    public getSortedSketches(orderBy: string) {
        return this.http.get(Globals.BASE_PATH + '/api/sketches/sort/' + orderBy);
    }

    /**
     * Deletes the sketch with the given id.
     * This will delete the sketch completely, from everyone's view.
     */
    public deleteSketchWithId(sketch_id) {
        return this.http
                   .delete(Globals.BASE_PATH + '/api/sketch/' + sketch_id);
        // .catch(this.handleError);
    }

    /**
     * Removes the sketch with the given id from the user's library.
     * Other users will still be able to access it.
     */
    public removeSketchWithId(sketch_id) {
        return this.http
                   .post(Globals.BASE_PATH + '/api/right/delete', {sketch_id: sketch_id});
        // .catch(this.handleError);
    }

    /**
     * Updates the title of a sketch.
     */
    public updateSketchTitle(sketch: any) {
        return this.http
                   .post(Globals.BASE_PATH + '/api/sketch/meta', {sketch_id: sketch.id, title: sketch.title});
        // .catch(this.handleError);
    }

    public moveSketch(sketch: Sketch, folderId: number) {
        return new Promise((resolve, reject) => {
            this.http.put<GenericResponse>(Globals.BASE_PATH + '/api/sketch/meta', {
                sketch_id: sketch.id,
                title: sketch.title,
                folder_id: folderId
            })
                .subscribe(data => {
                    if (data.success) {
                        resolve(sketch.id);
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

    /**
     * Lists all users with rights to the sketch with the given id.
     * TODO: This is never used and doesn't belong here. ParticipantsService already provides this function. Can be removed.
     */
    public getOwnersListWithSketchId(sketch_id) {
        return this.http.get(Globals.BASE_PATH + '/api/rights/' + sketch_id);
        // .catch(this.handleError);
    }

    /**
     * Creates a new sketch with the given title.
     */
    public createNewSketch(title: string) {
        const body = (this.selectedFolderId && this.selectedFolderId !== -1) ? {
            title: title,
            folder_id: this.selectedFolderId
        } : {title: title};
        return this.http.post(Globals.BASE_PATH + '/api/sketch', body);
    }

    /**
     * Returns the sketch's tags
     */
    public getAllTags(sketch_id): any {
        return this.http.get(Globals.BASE_PATH + '/api/tags/' + sketch_id);
    }

    /**
     * Adds a single tag to a sketch.
     */
    public setTag(sketch_id, name): any {
        console.log('Add tag ' + name);
        return this.http.post(Globals.BASE_PATH + '/api/tag/' + sketch_id, {name: name});
    }

    /**
     * Deletes a single tag by name from a sketch.
     */
    public deleteTag(sketch_id, name): any {
        console.log('Delete tag ' + name);
        return this.http.delete(Globals.BASE_PATH + '/api/tag/' + sketch_id + '/' + name);
    }

    /**
     * Deletes all tags from a sketch
     */
    public deleteAllTags(sketch_id): any {
        return this.http.delete(Globals.BASE_PATH + '/api/tags/' + sketch_id);
    }

    public setSelectedFolder(folderId: number) {
        this.selectedFolderChange.next(folderId);
    }
}
