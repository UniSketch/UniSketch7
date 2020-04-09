import { Vertex } from './vertex.model';
import { LineMathHelper } from '../line-math-helper';
import { SketchElement } from './sketch-element.model';

/**
 * Model describing a line of multiple vertices.
 */
export class Line extends SketchElement {

    /**
     * List of vertices in this line.
     */
    public vertices: Vertex[] = [];

    /**
     * Cached bounds rectangle of this line in order minX, minY, maxX, maxY.
     */
    private bounds: number[];

    /**
     * Calculates the bounds of this line and caches it for future use.
     */
    private calculateBounds() {
        if (!this.bounds) {
            let minX = Number.MAX_SAFE_INTEGER;
            let minY = Number.MAX_SAFE_INTEGER;
            let maxX = 0;
            let maxY = 0;
            for (const vertex of this.vertices) {
                if (vertex.x < minX) {
                    minX = vertex.x;
                }
                if (vertex.x > maxX) {
                    maxX = vertex.x;
                }
                if (vertex.y < minY) {
                    minY = vertex.y;
                }
                if (vertex.y > maxY) {
                    maxY = vertex.y;
                }
            }
            this.bounds = [minX, minY, maxX, maxY];
        }
    }

    /**
     * Not yet implemented: Tests if a line intersects with this line's bounding box.
     */
    private intersectsBoundingBox(start: any, end: any) {
        this.calculateBounds();

        // TODO not yet implemented, might need it for better mobile performance (not tested yet), browser works fine as is

        return true;
    }

    /**
     * Tests whether this line intersects with another straight line.
     */
    public intersectsLine(start: any, end: any): boolean {
        // If this line is actually a point, check the distance instead
        if (this.isPoint()) {
            if (LineMathHelper.distToSegmentSquared(this.vertices[0], start, end) < 4) {
                return true;
            }
        }

        // The bounding box check requires at least four intersection tests anyways, so there's no point to do them for small lines.
        if (this.vertices.length > 5 && !this.intersectsBoundingBox(start, end)) {
            return false;
        }

        for (let i = 1; i < this.vertices.length; i++) {
            const prevVertex = this.vertices[i - 1];
            const vertex = this.vertices[i];

            if (LineMathHelper.lineSegmentsIntersect(start.x, start.y, end.x, end.y, prevVertex.x, prevVertex.y, vertex.x, vertex.y)) {
                return true;
            }
        }

        return false;
    }

    /** Checks if the given line is a point or a line */
    public isPoint(): boolean {
        if (this.vertices.length <= 1) {
            return true;
        } else {
            return false;
        }

        // let isPoint = true;

        // let prev: Vertex = this.vertices[0];
        // for (let i = 1; i < this.vertices.length; i++) {
        //     if (!this.vertices[i].equals(prev)) {
        //         isPoint = false;
        //         break;
        //     }
        //     prev = this.vertices[i];
        // }

        // return isPoint;
    }

    /**
     * Checks if this line is within the selection frame from the Selector Tool
     * @param p1 Start point of frame
     * @param p2 End point of frame
     */
    public isWithinSelectionFrame(startPoint: any, endPoint: any): boolean {
        // The frame might be drawn in any direction, but we want p1 to be the
        // top left corner and p2 to be the bottom right corner of the frame
        // This will make it easier to iterate with a for loop
        const p1x: any = (startPoint.x < endPoint.x) ? startPoint.x : endPoint.x;
        const p1y: any = (startPoint.y < endPoint.y) ? startPoint.y : endPoint.y;
        const p2x: any = (startPoint.x > endPoint.x) ? startPoint.x : endPoint.x;
        const p2y: any = (startPoint.y > endPoint.y) ? startPoint.y : endPoint.y;

        let allVerticesWithin = true;

        for (let i = 0; i < this.vertices.length; i++) {
            if (!(this.vertices[i].x >= p1x &&
                this.vertices[i].x <= p2x &&
                this.vertices[i].y >= p1y &&
                this.vertices[i].y <= p2y)) {
                allVerticesWithin = false;
                break;
            }
        }

        return allVerticesWithin;
    }

    /**
     * Checks if line is with in certain radius of given point.
     * This method is only used temporarely until we figured out how to access
     * the svg elements from within the Selector class by using
     * 'elementsFromMouse()'.
     */
    public isWithinRadius(offset: number, clickPos: Vertex): boolean {
        if (this.width > 10) {
            offset = 0;
        }

        const v1: Vertex = new Vertex(clickPos.x - offset - this.width / 2, clickPos.y);
        const v2: Vertex = new Vertex(clickPos.x + offset + this.width / 2, clickPos.y);
        for (let i = 0; i < this.vertices.length; i++) {
            if (this.intersectsLine(v1, v2)) {
                return true;
            }
        }

        const v3: Vertex = new Vertex(clickPos.x, clickPos.y - offset - this.width / 2);
        const v4: Vertex = new Vertex(clickPos.x, clickPos.y + offset + this.width / 2);
        for (let i = 0; i < this.vertices.length; i++) {
            if (this.intersectsLine(v3, v4)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Moves the line by given offset.
     */
    public move(x: number, y: number) {
        for (let i = 0; i < this.vertices.length; i++) {
            this.vertices[i].x += x;
            this.vertices[i].y += y;
            this.vertices[i].x = Math.floor(this.vertices[i].x);
            this.vertices[i].y = Math.floor(this.vertices[i].y);
        }
    }

    /**
     * Clones this line and returns independent new Line instance.
     */
    public clone(): any {
        const line = new Line();
        line.width = this.width;
        line.color = this.color;
        console.log(this.color);
        const vertices: Vertex[] = [];
        for (let i = 0; i < this.vertices.length; i++) {
            const vert: Vertex = this.vertices[i].clone();
            vertices.push(vert);
        }
        line.vertices = vertices;

        return line;
    }

    /**
     * Scales this line in x and y regarding a fixed side of the selection frame
     * and given scaling factors.
     */
    public scale(xFactor: number, yFactor: number, fixedSide: any) {
        for (let i = 0; i < this.vertices.length; i++) {
            if (fixedSide.x >= this.vertices[i].x) {
                const xDiff = this.vertices[i].x - fixedSide.x;
                const xDiffScaled = xDiff * xFactor;
                this.vertices[i].x = fixedSide.x + xDiffScaled;
            } else if (fixedSide.x <= this.vertices[i].x) {
                const xDiff = fixedSide.x - this.vertices[i].x;
                const xDiffScaled = xDiff * xFactor;
                this.vertices[i].x = fixedSide.x - xDiffScaled;
            }

            if (fixedSide.y <= this.vertices[i].y) {
                const yDiff = this.vertices[i].y - fixedSide.y;
                const yDiffScaled = yDiff * yFactor;
                this.vertices[i].y = fixedSide.y + yDiffScaled;
            } else if (fixedSide.y >= this.vertices[i].y) {
                const yDiff = fixedSide.y - this.vertices[i].y;
                const yDiffScaled = yDiff * yFactor;
                this.vertices[i].y = fixedSide.y - yDiffScaled;
            }
        }

        this.width = this.width * xFactor * yFactor;
    }

    public floorWidth() {
        this.width = Math.floor(this.width);
        if (this.width < 1) {
            this.width = 1;
        }
        for (let i = 0; i < this.vertices.length; i++) {
            this.vertices[i].x = Math.floor(this.vertices[i].x);
            this.vertices[i].y = Math.floor(this.vertices[i].y);
        }
    }

    /**
     * Returns the vertices of this line.
     */
    public getPos(): any {
        return this.vertices;
    }

    /**
     * Updates the vertices of this line.
     */
    public setPos(pos: any) {
        this.vertices = pos;
    }
}
