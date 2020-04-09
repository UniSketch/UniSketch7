import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';

import {Sketch} from '../models/sketch.model';
import {Participant} from '../models/participant.model';
import {Globals} from "../globals";

/**
 * Interface for a generic API response.
 * TODO: this should be moved out of this file and used for all services
 */
export interface GenericResponse {
    success: boolean;
    error: String;
}

/**
 * Interface describing the response expected from the server.
 */
interface RightsResponse extends GenericResponse {
    user_roles: Participant[];
}

/**
 * Service providing functions for listing and managing participants of a sketch.
 */
@Injectable()
export class ParticipantsService {

    constructor(private http: HttpClient) {
    }

    /**
     * Retrieves the list of participants for the given sketch.
     * @return Promise that resolves into an array of participants.
     */
    getParticipants(sketch: Sketch): Promise<Participant[]> {
        return new Promise((resolve, reject) => {
            this.http.get<RightsResponse>(Globals.BASE_PATH + '/api/rights/' + sketch.id).subscribe(data => {
                if (data.success) {
                    resolve(data.user_roles);
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
     * Updates the role of a participant of a sketch to the given value.
     * @return Promise that resolves if the update was successful.
     */
    updateRole(sketch: Sketch, participant: Participant, role: number): Promise<any> {
        return new Promise((resolve, reject) => {
            this.http.post<GenericResponse>(Globals.BASE_PATH + '/api/right', {
                sketch_id: sketch.id,
                email_address: participant.email_address, role_id: role
            }).subscribe(data => {
                if (data.success) {
                    resolve();
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
     * Removes a participant from the given sketch.
     * @return Promise that resolves if the removal was successful.
     */
    removeParticipant(sketch: Sketch, participant: Participant): Promise<any> {
        return new Promise((resolve, reject) => {
            this.http.post<GenericResponse>(Globals.BASE_PATH + '/api/right/delete', {
                sketch_id: sketch.id,
                user_id: participant.user_id
            }).subscribe(data => {
                if (data.success) {
                    resolve();
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
