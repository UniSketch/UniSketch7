/**
 * Model describing a line of multiple vertices.
 */
import { PositionedSketchElement } from './positioned-sketch-element.model';

export class Image extends PositionedSketchElement {

    public src: string;

    public isWithinSelectionFrame(startPoint: any, endPoint: any): boolean {
        // The frame might be drawn in any direction, but we want p1 to be the
        // top left corner and p2 to be the bottom right corner of the frame
        // This will make it easier to iterate with a for loop
        const p1x: any = (startPoint.x < endPoint.x) ? startPoint.x : endPoint.x;
        const p1y: any = (startPoint.y < endPoint.y) ? startPoint.y : endPoint.y;
        const p2x: any = (startPoint.x > endPoint.x) ? startPoint.x : endPoint.x;
        const p2y: any = (startPoint.y > endPoint.y) ? startPoint.y : endPoint.y;

        const elem = document.getElementById('element' + this.id);
        const width = elem.getClientRects()[0].width;
        const height = elem.getClientRects()[0].height;
        const offset_fix = this.width * 0.0;

        if (this.pos_x >= p1x
            && this.pos_x + width <= p2x
            && this.pos_y + offset_fix >= p1y
            && this.pos_y + height + offset_fix <= p2y) {
            return true;
        } else {
            return false;
        }
    }

    public isWithinRadius(offset: number, clickPos: any): boolean {
        const elem = document.getElementById('element' + this.id);
        const width = elem.getClientRects()[0].width;
        const height = elem.getClientRects()[0].height;
        const offset_fix = this.width * 0.0;

        if (this.pos_x - offset <= clickPos.x
            && this.pos_x + width + offset >= clickPos.x
            && this.pos_y + height + offset + offset_fix >= clickPos.y
            && this.pos_y - offset + offset_fix <= clickPos.y) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Moves the text by given offset.
     */
    public move(x: number, y: number) {
        this.pos_x += x;
        this.pos_y += y;
    }

    /**
     * Scales the text
     */
    public scale(xFactor, yFactor, fixedSide: any) {
        if (fixedSide.x <= this.pos_x) {
            console.log('moving right side');
            const xDiff = this.pos_x - fixedSide.x;
            const xDiffScaled = xDiff * xFactor;
            this.pos_x = fixedSide.x + xDiffScaled;
            this.width *= xFactor;
        } else if (fixedSide.x >= this.pos_x) {
            console.log('moving left side');
            const xDiff =  fixedSide.x - (this.pos_x);
            const xDiffScaled = xDiff * xFactor;
            this.pos_x = fixedSide.x - xDiffScaled;
            this.width *= xFactor;
        }

        if (fixedSide.y <= this.pos_y) {
            console.log('moving bottom side');
            const yDiff =  fixedSide.y - (this.pos_y);
            const yDiffScaled = yDiff * yFactor;
            this.pos_y = fixedSide.y - yDiffScaled;
        } else if (fixedSide.y >= this.pos_y) {
            console.log('moving top side');
            const yDiff = this.pos_y - fixedSide.y;
            const yDiffScaled = yDiff * yFactor;
            this.pos_y = fixedSide.y + yDiffScaled;
        }
    }

    public floorWidth() {
        this.width = Math.floor(this.width);
        this.pos_x = Math.floor(this.pos_x);
        this.pos_y = Math.floor(this.pos_y);
        if (this.width < 1) {
            this.width = 1;
        }
    }

    /**
     * Clones this image
     */
    public clone(): Image {
        const image = new Image;
        for (const prop in this) {
            if (this.hasOwnProperty(prop)) {
                image[prop.toString()] = this[prop];
            }
        }
        return image;
    }

    /**
     * Returns postion of this image.
     */
    public getPos(): any {
        return { x: this.pos_x, y: this.pos_y };
    }

    /**
     * Update the position of this image.
     */
    public setPos(pos: any) {
        this.pos_x = pos.x;
        this.pos_y = pos.y;
    }
}
