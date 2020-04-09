/**
 * Model describing a single vertex.
 */
export class Vertex {
    constructor(public x: number, public y: number) {
    }

    public equals(vertex: Vertex): boolean {
        return this.x === vertex.x && this.y === vertex.y;
    }

    /**
     * Returns a clone of this Vertex which is independent from this one.
     */
    public clone(): Vertex {
        return new Vertex(this.x, this.y);
    }
}
