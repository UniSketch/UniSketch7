import { Folder } from "./folder.model";
import { User } from "./user.model";
import { SketchElement } from "./sketch-element.model";

export class Sketch {

    id: number;

    folder: Folder;

    sketchElements: SketchElement[];

    user: User;

    title: string = 'Loading...';

    title_small: string;

    preview: string;

    background_color: string;

    is_public: boolean = false;

    created_at: Date;

    updated_at: Date;

    public getElementById(id: number): SketchElement {
        return this.sketchElements.find(it => it.id === id);
    }

    public getAllElements(): SketchElement[] {
        return this.sketchElements;
    }

    public deleteElement(id: number): void {
        const element = this.getElementById(id);

        if (element) {
            this.sketchElements.splice(this.sketchElements.indexOf(element), 1);
        }
        for (let i = 0; i < this.sketchElements.length; i++) {
            if (this.sketchElements[i].id === id) {
                this.sketchElements.splice(i, 1);
                break;
            }
        }
    }
}
