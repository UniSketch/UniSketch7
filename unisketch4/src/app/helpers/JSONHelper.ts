import {Line} from "../models/line.model";
import {Vertex} from "../models/vertex.model";
import {Text} from "../models/text.model";
import {SketchElement} from "../models/sketch-element.model";
import {Shape, ShapeType} from "../models/shape.model";
import {Image} from "../models/image.model";

export namespace JSONHelper {

    /**
     * Reads a line from a json object.
     */
    export function parseLineFromJson(data: object): Line {
        const line = new Line();
        line.id = data['id'];

        line.color = data['color'];
        if (!line.color) {
            line.color = 'black';
        }

        line.width = data['width'];
        if (!line.width) {
            line.width = 1;
        }
        line.dasharray = data['dasharray'];
        line.brushStyle = data['brushStyle'];

        const vertices = data['vertices'];
        for (let i = 0; i < vertices.length; i += 2) {
            line.vertices.push(new Vertex(Number(vertices[i]), Number(vertices[i + 1])));
        }

        return line;
    }

    /**
     * Reads a line from a json object.
     */
    export function parseTextFromJson(data: object): Text {
        const text = new Text();
        text.id = data['id'];

        text.color = data['color'];
        if (!text.color) {
            text.color = 'black';
        }

        text.width = data['width'];
        if (!text.width) {
            text.width = 8;
        }

        text.pos_x = data['pos_x'];
        if (!text.pos_x) {
            text.pos_x = 200;
        }

        text.pos_y = data['pos_y'];
        if (!text.pos_y) {
            text.pos_y = 200;
        }

        text.content = data['content'];
        if (!text.content) {
            text.content = '';
        }

        text.type = data['type'];
        if (!text.type) {
            text.type = 'Arial';
        }

        text.created_at = data['created_at'];

        text.updated_at = data['updated_at'];

        return text;
    }

    /**
     * Reads a line from a json object.
     */
    export function parseImageFromJson(data: object): Image {
        const image = new Image();
        image.id = data['id'];

        image.color = data['color'];

        image.width = data['width'];
        if (!image.width) {
            image.width = 200;
        }
        image.pos_x = data['pos_x'];
        if (!image.pos_x) {
            image.pos_x = 200;
        }

        image.pos_y = data['pos_y'];
        if (!image.pos_y) {
            image.pos_y = 200;
        }

        image.src = data['src'];
        if (!image.src) {
            image.src = '';
        }


        image.created_at = data['created_at'];

        image.updated_at = data['updated_at'];

        return image;
    }

    /**
     * Reads a line from a json object.
     */
    export function parseShapeFromJson(data: object): Shape {
        const shape = new Shape();
        shape.id = data['id'];

        shape.color = data['color'];
        if (!shape.color) {
            shape.color = 'black';
        }

        shape.fill = data['fill'];
        if(!shape.fill) {
            shape.fill = 'black';
        }

        shape.width = data['width'];
        if (!shape.width) {
            shape.width = 10;
        }

        shape.height = data['height'];
        if (!shape.height) {
            shape.height = 10;
        }

        shape.size = data['size'];
        if (!shape.size) {
            shape.size = 1;
        }

        shape.pos_x = data['pos_x'];
        if (!shape.pos_x) {
            shape.pos_x = 200;
        }

        shape.pos_y = data['pos_y'];
        if (!shape.pos_y) {
            shape.pos_y = 200;
        }

        shape.type = data['type'];
        if (!shape.type) {
            shape.type = ShapeType.Rectangle;
        }

        shape.mirrored_x = data['mirrored_x'];
        if (!shape.mirrored_x) {
            shape.mirrored_x = false;
        }

        shape.mirrored_y = data['mirrored_y'];
        if (!shape.mirrored_y) {
            shape.mirrored_y = false;
        }

        shape.created_at = data['created_at'];
        shape.updated_at = data['updated_at'];

        return shape;
    }


    export function parseSketchElementFromJson(data: object): SketchElement {
        if (data['vertices']) {
            return this.parseLineFromJson(data);
        } else if (data['height'] || data['height'] === 0) {
            return this.parseShapeFromJson(data);
        } else if (data['content'] || data['content'] === '') {
            return this.parseTextFromJson(data);
        } else if (data['src'] || data['src'] === '') {
            return this.parseImageFromJson(data);
        } else {
            console.error('ERROR, could not parse data to element!: ', data);
        }
    }
}
