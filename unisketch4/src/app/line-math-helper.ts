/**
 * Provides helper functions for math operations regarding to lines.
 */
export class LineMathHelper {

    /**
     * Tests if a line intersects with another.
     * @param {number} x1 X start coordinate of the first line
     * @param {number} y1 Y start coordinate of the first line
     * @param {number} x2 X end coordinate of the first line
     * @param {number} y2 Y end coordinate of the first line
     * @param {number} x3 X start coordinate of the second line
     * @param {number} y3 Y start coordinate of the second line
     * @param {number} x4 X end coordinate of the second line
     * @param {number} y4 Y end coordinate of the second line
     * @return {boolean} true if the lines intersect
     */
    public static lineSegmentsIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
        // https://stackoverflow.com/questions/9043805/test-if-two-lines-intersect-javascript-function
        // I tested the solutions offered there and funnily enough the one
        // they sell as most efficient actually took most time of them all
        // (~300ms for 200k intersections on 80 lines).
        // 1j01 won with ~160ms, though we'll have to test if it's missing
        // some cases.
        const a_dx = x2 - x1;
        const a_dy = y2 - y1;
        const b_dx = x4 - x3;
        const b_dy = y4 - y3;
        const s = (-a_dy * (x1 - x3) + a_dx * (y1 - y3)) / (-b_dx * a_dy + a_dx * b_dy);
        const t = (+b_dx * (y1 - y3) - b_dy * (x1 - x3)) / (-b_dx * a_dy + a_dx * b_dy);
        return (s >= 0 && s <= 1 && t >= 0 && t <= 1);
    }

    /**
     * Returns the squared distance between two points.
     * @param {any} p Point object with x and y field
     * @param {any} w Other point object with x and y field
     * @return {number} the squared distance between the two points
     */
    public static dist2(v: any, w: any): number {
        // https://jsfiddle.net/beentaken/9k1sf6p2/
        return Math.pow(v.x - w.x, 2) + Math.pow(v.y - w.y, 2);
    }

    /**
     * Returns the distance of a point to a line.
     * @param {any} p Point object with x and y field
     * @param {any} v Line start point object with x and y field
     * @param {any} w Line end point object with x and y field
     * @return {number} The shortest distance between a point and a line.
     */
    public static distToSegmentSquared(p: any, v: any, w: any): number {
        const l2 = this.dist2(v, w);

        if (l2 === 0) {
            return this.dist2(p, v);
        }

        const t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;

        if (t < 0) {
            return this.dist2(p, v);
        }

        if (t > 1) {
            return this.dist2(p, w);
        }

        return this.dist2(p, { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) });
    }

    /**
     * Tries to find the intersection point of two lines.
     * @param {any} first Line object with startX, startY, endX, endY fields
     * @param {any} second Second line object with startX, startY, endX, endY fields
     * @return {any} Result object with x, y, onLine1 and onLine2 fields. If onLine1 and onLine2 are both false, there is no intersection.
     */
    public static checkLineIntersection(first, second): any {
        // if the lines intersect, the result contains the x and y of
        // the intersection (treating the lines as infinite) and
        // booleans for whether line segment 1 or line segment 2
        // contain the point.
        let denominator, a, b, numerator1, numerator2;
        const result = {
            x: null,
            y: null,
            onLine1: false,
            onLine2: false
        };
        denominator = ((second.endY - second.startY) *
            (first.endX - first.startX)) - ((second.endX - second.startX) *
            (first.endY - first.startY));

        if (denominator === 0) {
            return result;
        }

        a = first.startY - second.startY;
        b = first.startX - second.startX;
        numerator1 = ((second.endX - second.startX) * a) - ((second.endY - second.startY) * b);
        numerator2 = ((first.endX - first.startX) * a) - ((first.endY - first.startY) * b);
        a = numerator1 / denominator;
        b = numerator2 / denominator;

        // if we cast these lines infinitely in both directions, they intersect here:
        result.x = first.startX + (a * (first.endX - first.startX));
        result.y = first.startY + (a * (first.endY - first.startY));

        // if line1 is a segment and line2 is infinite, they intersect if:
        result.onLine1 = a > 0 && a < 1;
        result.onLine2 = b > 0 && b < 1;

        // if line1 and line2 are segments, they intersect if both of the above are true
        return result;
    }

    /**
     * Finds the intersection point of two lines. Returns null if there is no intersection.
     * @param {any} first Line object with startX, startY, endX, endY fields
     * @param {any} second Second line object with startX, startY, endX, endY fields
     * @return {any} Point object with x and y field if lines intersect, null otherwise
     */
    public static getLineIntersectionPoint(first, second): any {
        const result = this.checkLineIntersection(first, second);

        if (result.onLine1 && result.onLine2) {
            return { x: result.x, y: result.y };
        }

        return null;
    }

    /**
     * Finds the intersection point between a line and a rectangle.
     * @param {any} line Line object with startX, startY, endX, endY fields
     * @param {any} rect Rectangle object with width and height fields
     * @return {any} Point object with x and y field if lines intersect, null otherwise
     */
    public static getLineRectIntersectionPoint(line, rect): any {
        let point = this.getLineIntersectionPoint(line, { startX: 0, startY: 0, endX: rect.width, endY: 0 });

        if (point != null) {
            return point;
        }

        point = this.getLineIntersectionPoint(line, { startX: 0, startY: rect.height, endX: rect.width, endY: rect.height });
        if (point != null) {
            return point;
        }

        point = this.getLineIntersectionPoint(line, { startX: 0, startY: 0, endX: 0, endY: rect.height });
        if (point != null) {
            return point;
        }

        point = this.getLineIntersectionPoint(line, { startX: rect.width, startY: 0, endX: rect.width, endY: rect.height });
        if (point != null) {
            return point;
        }

        return null;
    }

    /**
     * Tests whether three points are on one line.
     * @param {any} first Point object with x and y fields
     * @param {any} second Second point object with x and y fields
     * @param {any} third Third point object with x and y fields
     * @return {boolean} true when the points are all on one line
     */
    public static areVerticesOnLine(first, second, third): boolean {
        return this.distToSegmentSquared(second, first, third) === 0;
    }
}
