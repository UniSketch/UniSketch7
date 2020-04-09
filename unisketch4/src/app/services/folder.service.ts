import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Globals} from '../globals'
import {GenericResponse} from "./participants.service";
import {Folder} from "../models/folder.model";

interface FoldersResponse extends GenericResponse {
    folders: Folder[];
}

interface FolderResponse extends GenericResponse {
    folder: Folder;
}

/**
 * Service providing functions for listing and managing sketches in a
 * library.
 * TODO: the service shouldn't return HTTP responses as that defeats
 * most of the point, it should read them right here and return the
 * data the caller actually needs (see ParticipantsService for example)
 */
@Injectable()
export class FolderService {

    constructor(private http: HttpClient) {
    }

    public getAllFolders() {
        return new Promise((resolve, reject) => {
            this.http.get<FoldersResponse>(Globals.BASE_PATH + '/api/folders')
                .subscribe(data => {
                    if (data.success) {
                        resolve(data.folders);
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

    public createFolder(name: string, parent?: Folder) {
        return new Promise((resolve, reject) => {
            let body = {name: name, parent_id: undefined};
            if (parent) {
                body.parent_id = parent.id;
            }
            this.http.post<FolderResponse>(Globals.BASE_PATH + '/api/folders', body)
                .subscribe(data => {
                    if (data.success) {
                        resolve(data.folder);
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

    public deleteFolder(folder: Folder) {
        const id = folder.id;
        return new Promise((resolve, reject) => {
            this.http.delete<GenericResponse>(Globals.BASE_PATH + `/api/folder/${id}`)
                .subscribe(data => {
                    if (data.success) {
                        resolve(id);
                    } else {
                        reject(data['error']);
                    }
                }, (err: HttpErrorResponse) => {
                    if (err.error instanceof Error) {
                        reject(err.error.message);
                    } else {
                        reject(err.status + ': ' + err.error);
                    }
                })
        });

    }

    public moveFolder(folder: Folder, newParent: Folder) {
        return new Promise((resolve, reject) => {
            this.http.put<FolderResponse>(Globals.BASE_PATH + `/api/folder/${folder.id}`, {folder_id: newParent.id})
                .subscribe(data => {
                    if (data.success) {
                        resolve(data.folder);
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

    

    public renameFolder(folder: Folder, name: string) {
        return new Promise((resolve, reject) => {
            this.http.put<FolderResponse>(Globals.BASE_PATH + `/api/folder/${folder.id}`, {name: name})
                .subscribe(data => {
                    console.log(data);
                    if (data.success) {
                        resolve(data.folder);
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

    public setCookie(name: string, val: number) {
        const date = new Date();
        const value = val;    
        // Set it
        document.cookie = name+"="+value;
    }

    public getCookie(name: string) {
        const value = "; " + document.cookie;
        const parts = value.split("; " + name + "=");
        
        if (parts.length == 2) {
            return parts.pop().split(";").shift();
        }
    }
    
}
