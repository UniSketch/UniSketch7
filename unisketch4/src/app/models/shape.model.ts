/**
 * Model describing a line of multiple vertices.
 */
import { PositionedSketchElement } from './positioned-sketch-element.model';

export enum ShapeType {
    Rectangle = 'rect',
    Circle = 'circle',
    Ellipse = 'ellipse',
    Triangle = 'polygon',
}

export class Shape extends PositionedSketchElement {
    public type: ShapeType;
    public height: number;
    public size: number;
    public fill: string;
    public mirrored_x: boolean;
    public mirrored_y: boolean;

    public isWithinSelectionFrame(startPoint: any, endPoint: any): boolean {
        // The frame might be drawn in any direction, but we want p1 to be the
        // top left corner and p2 to be the bottom right corner of the frame
        // This will make it easier to iterate with a for loop
        const p1x: any = (startPoint.x < endPoint.x) ? startPoint.x : endPoint.x;
        const p1y: any = (startPoint.y < endPoint.y) ? startPoint.y : endPoint.y;
        // const p1z: any = (startPoint.z < endPoint.z) ? startPoint.z : endPoint.z;
        const p2x: any = (startPoint.x > endPoint.x) ? startPoint.x : endPoint.x;
        const p2y: any = (startPoint.y > endPoint.y) ? startPoint.y : endPoint.y;
       // const p2z: any = (startPoint.z > endPoint.z) ? startPoint.z : endPoint.z;


        const elem = document.getElementById('element' + this.id);
        const width = elem.getClientRects()[0].width;
        const height = elem.getClientRects()[0].height;

        if (this.type === 'rect') {
            if (this.pos_x >= p1x
                && this.pos_x + width <= p2x
                && this.pos_y >= p1y
                && this.pos_y + height <= p2y) {
                return true;
            } else {
                return false;
            }
        } else {
            if (this.pos_x - (width / 2) >= p1x
                && this.pos_x + (width / 2) <= p2x
                && this.pos_y - (height / 2) >= p1y
                && this.pos_y + (height / 2) <= p2y) {
                return true;
            } else {
                return false;
            }
        }
    }

    public isWithinRadius(offset: number, clickPos: any): boolean {
        const elem = document.getElementById('element' + this.id);
        const width = elem.getClientRects()[0].width;
        const height = elem.getClientRects()[0].height;

        if (this.type === 'rect') {
            if (this.pos_x - offset <= clickPos.x
                && this.pos_x + width + offset >= clickPos.x
                && this.pos_y + height + offset >= clickPos.y
                && this.pos_y - offset <= clickPos.y) {
                return true;
            } else {
                return false;
            }
        } else {
            if (this.pos_x - offset - (width / 2) <= clickPos.x
                && this.pos_x + (width / 2) + offset >= clickPos.x
                && this.pos_y + (height / 2) + offset >= clickPos.y
                && this.pos_y - offset - (height / 2) <= clickPos.y) {
                return true;
            } else {
                return false;
            }
        }
    }

    /**
     * Moves the shape by given offset.
     */
    public move(x: number, y: number) {
        this.pos_x += x;
        this.pos_y += y;
    }

    /**
     * Scales the shape
     */
    public scale(xFactor, yFactor, fixedSide: any) {
        if (fixedSide.x <= this.pos_x) {
            const xDiff = this.pos_x - fixedSide.x;
            const xDiffScaled = xDiff * xFactor;
            this.pos_x = fixedSide.x + xDiffScaled;
            this.width *= xFactor;
        } else if (fixedSide.x >= this.pos_x) {
            const xDiff =  fixedSide.x - (this.pos_x);
            const xDiffScaled = xDiff * xFactor;
            this.pos_x = fixedSide.x - xDiffScaled;
            this.width *= xFactor;
        }

        if (fixedSide.y <= this.pos_y) {
            const yDiff =  fixedSide.y - (this.pos_y);
            const yDiffScaled = yDiff * yFactor;
            this.pos_y = fixedSide.y - yDiffScaled;
            this.height *= yFactor;
        } else if (fixedSide.y >= this.pos_y) {
            const yDiff = this.pos_y - fixedSide.y;
            const yDiffScaled = yDiff * yFactor;
            this.pos_y = fixedSide.y + yDiffScaled;
            this.height *= yFactor;
        }
    }

    public floorWidth() {
        this.width = Math.floor(this.width);
        this.height = Math.floor(this.height);
        this.pos_x = Math.floor(this.pos_x);
        this.pos_y = Math.floor(this.pos_y);

    }

    /**
     * Clones this shape
     */
    public clone(): Shape {
        const shape = new Shape;
        for (const prop in this) {
            if (this.hasOwnProperty(prop)) {
                shape[prop.toString()] = this[prop];
            }
        }
        return shape;
    }

    /**
     * Returns postion of this shape.
     */
    public getPos(): any {
        return { x: this.pos_x, y: this.pos_y};
    }

    /**
     * Update the position of this shape.
     */
    public setPos(pos: any) {
        this.pos_x = pos.x;
        this.pos_y = pos.y;
    }
}
