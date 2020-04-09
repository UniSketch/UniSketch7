/**
 * Defines possible attributes an SVGElement can have.
 */
import {Line} from '../models/line.model';
import {Vertex} from '../models/vertex.model';
import {Text} from '../models/text.model';
import {Shape, ShapeType} from '../models/shape.model';
import {Image} from '../models/image.model';

export interface ISVGOptions {
    type: string;

    id?: string;
    class?:string;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
    brushStyle?: string;

    x?: number;
    y?: number;




    cx?: number;
    cy?: number;

    r?: number;

    rx?: number;
    ry?: number;

    width?: number | string;
    height?: number | string;

    points?: string;

    fontFamily?: string;
    fontSize?: string;
    color?: string;
    text?: string;
    cursor?: string;

    transform?: string;
    src?: string;

}

// This constant is only used to check if the IBuilderOptions has the property; the value does not matter and is never used.
const EMPTY_OPTIONS = {
    type: '',
    id: '',
    fill: '',
    stroke: '',
    strokeWidth: 0,
    x: 0,
    y: 0,
    cx: 0,
    cy: 0,
    r: 0,
    rx: 0,
    ry: 0,
    width: 0,
    height: 0,
    points: '',
    fontFamily: '',
    fontSize: 0 + 'px',
    color: '',
    text: '',
    cursor: '',
    transform: '',
} as ISVGOptions;


export namespace SVGElementFactory {
    export function createElement(type: string, options: ISVGOptions): SVGElement {
        return makeElement(type, options);
    }

    export function createLine(vertices: Vertex[], color: string, width: number, id?: number): SVGElement {
        const options = {
            points: SVGElementFactory.verticesToSVGPoints(vertices),
            fill: 'none',
            stroke: color,
            strokeWidth: width,
        } as ISVGOptions;
        if (id) {
            options.id = `element${id}`;
        }
        return makeElement('polyline', options);
    }

    export function createLineFromLine(line: Line): SVGElement {
        return makeElement('polyline', {
            points: SVGElementFactory.verticesToSVGPoints(line.vertices),
            fill: 'none',
            stroke: line.color,
            strokeWidth: line.width,
            strokeDasharray: line.dasharray,
            brushStyle: line.brushStyle,
            id: `element${line.id}`,
        } as ISVGOptions);
    }

    export function createGraffitiFromLine(line: Line): SVGElement {
        const length = line.vertices.length;
        let group : SVGElement = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        for (let i = 0; i < length; i++) {
            for (let j = 0; j < 100; j++) {
                let xCoord: number = line.vertices[i].x + Math.sin(Math.floor(Math.random() * (360 - 0 + 1) + 0))*10;
                let yCoord: number = line.vertices[i].y + Math.cos(Math.floor(Math.random() * (360 - 0 + 1) + 0))*10;

                if (Math.pow((xCoord - line.vertices[i].x),2) + Math.pow((yCoord - line.vertices[i].y), 2) < Math.pow(10, 2)) {
                    group.appendChild(SVGElementFactory.createCircle(xCoord, yCoord, line.color, 1));
                }
                
            }
        }
        return group;
    }

    export function createCircle(x: number, y: number, color: string, radius: number, id?: number): SVGElement {
        const options = {
            r: radius / 2,
            cx: x,
            cy: y,
            fill: color
        } as ISVGOptions;
        if (id) {
            options.id = `element${id}`;
        }
        return makeElement('circle', options);
    }

    export function createCircleFromLine(line: Line): SVGElement {
        return makeElement('circle', {
            r: line.width / 2,
            cx: line.vertices[0].x,
            cy: line.vertices[0].y,
            fill: line.color,
            id: `element${line.id}`,
        } as ISVGOptions);
    }

   /* export function createTriangleFromLine(line: Line): SVGElement {
        console.log('triangle');
        return makeElement('polygon', {
            x: line.vertices[0].x,
            y: line.vertices[0].y,
         //   z: polygon.points[2],

            fill: line.color,
            id: `element${line.id}`,

        }as ISVGOptions);
    }*/


    export function createImage(image: Image): SVGElement {
        const options = {
            x: image.pos_x,
            y: image.pos_y,
            width: image.width,
            src: image.src,
            id: `element${image.id}`,
        } as ISVGOptions;
        return makeElement('image', options);
    }

    export function createText(text: Text): SVGElement {
        const lines = text.content.split('\n');
        let content = '';
        const lineHeight = 1;
        for (let i = 0; i < lines.length; i++) {
            if (!lines[i]) {
                lines[i] = ' ';
            }
            content += '<tspan x=\'' + text.pos_x + '\' dy=\'' + lineHeight + 'em\'>' + lines[i] + '</tspan>';
        }
        const options = {
            x: text.pos_x,
            y: text.pos_y,
            fontFamily: text.type,
            color: text.color,
            fontSize: text.width + 'px',
            text: content,
            cursor: 'default',
        } as ISVGOptions;
        if (text.id) {
            options.id = `element${text.id}`;
        }
        return makeElement('text', options);
    }

    export function createShape(shape: Shape): SVGElement {
        const options = {
            stroke: shape.color,
            strokeWidth: shape.size,
            fill: shape.fill,
        } as ISVGOptions;

        if (shape.id) {
            options.id = `element${shape.id}`;
        }


        switch (shape.type) {
            case ShapeType.Circle:
                options.r = shape.width / 2;
                options.cx = shape.pos_x;
                options.cy = shape.pos_y;
                break;
            case ShapeType.Ellipse:
                options.rx = shape.width / 2;
                options.ry = shape.height / 2;
                options.cx = shape.pos_x;
                options.cy = shape.pos_y;
                break;
            case ShapeType.Triangle:
                // points is represented as string so we concatenate
                options.points = shape.pos_x.toString() + ',' + shape.pos_y.toString() + ' ';
                if (shape.mirrored_x && shape.mirrored_y) {
                    options.points += (shape.pos_x - shape.width).toString() + ',' + shape.pos_y.toString() + ' ';
                    options.points += (shape.pos_x - shape.width / 2).toString() + ',' + (shape.pos_y - shape.height).toString();
                }else if (shape.mirrored_y) {
                    options.points += (shape.pos_x + shape.width).toString() + ',' + shape.pos_y.toString() + ' ';
                    options.points += (shape.pos_x + shape.width / 2).toString() + ',' + (shape.pos_y - shape.height).toString();
                
                }else if (shape.mirrored_x) {
                    options.points += (shape.pos_x - shape.width).toString() + ',' + shape.pos_y.toString() + ' ';
                    options.points += (shape.pos_x - shape.width / 2).toString() + ',' + (shape.pos_y + shape.height).toString();
                }else {
                    options.points += (shape.pos_x + shape.width).toString() + ',' + shape.pos_y.toString() + ' ';
                    options.points += (shape.pos_x + shape.width / 2).toString() + ',' + (shape.pos_y + shape.height).toString(); 
                }
                break;
            default:
                if (shape.mirrored_x && shape.mirrored_y) {
                    options.x = shape.pos_x - shape.width;
                    options.y = shape.pos_y - shape.height;
                    options.width = shape.width;
                    options.height = shape.height;
                } else if (shape.mirrored_x) {
                    options.x = shape.pos_x - shape.width;
                    options.y = shape.pos_y;
                    options.width = shape.width;
                    options.height = shape.height;
                } else if (shape.mirrored_y) {
                    options.x = shape.pos_x;
                    options.y = shape.pos_y - shape.height;
                    options.width = shape.width;
                    options.height = shape.height;
                } else {
                    options.x = shape.pos_x;
                    options.y = shape.pos_y;
                    options.width = shape.width;
                    options.height = shape.height;
                }
                break;
        }


        return makeElement(shape.type.toString(), options);
    }

    export function createSelectionFrameInstance
    (vertices: Vertex[], lineColor: string, fillColor: string, witdh: number, id: number): SVGElement {
        return makeElement('polyline', {
            points: SVGElementFactory.verticesToSVGPoints(vertices),
            fill: fillColor,
            stroke: lineColor,
            strokeWidth: witdh,
            id: `selection${id}`,
        } as ISVGOptions);
    }

    export function createSelectionHandleInstance
    (vertices: Vertex[], lineColor: string, fillColor: string, witdh: number, id: number): SVGElement {
        return makeElement('polyline', {
            points: SVGElementFactory.verticesToSVGPoints(vertices),
            fill: fillColor,
            stroke: lineColor,
            strokeWidth: witdh,
            id: `handle${id}`,
        } as ISVGOptions);
    }

    /**
     * Makes a `points` attribute from given vertices. This is needed for rendering polylines.
     * @param vertices
     */
    export function verticesToSVGPoints(vertices: Vertex[]): string {
        const length = vertices.length;
        let pointsString = '';
        for (let i = 0; i < length; i++) {
            pointsString += vertices[i].x + ',' + vertices[i].y;
            if (i !== length - 1) {
                pointsString += ' ';
            }
        }
        return pointsString;
    }

    export function verticesToGraffiti(vertices: Vertex[]): string {
        const length = vertices.length;
        let pointsString = '';
        for (let i = 0; i < length; i++) {
            for (let j = 0; j < 100; j++) {
               // SVGElementFactory.createCircle()
                pointsString += (vertices[i].x+ Math.sin(Math.floor(Math.random() * (360 - 0 + 1) + 0))*10) + ',' + (vertices[i].y + Math.sin(Math.floor(Math.random() * (360 - 0 + 1) + 0))*10);
            }
        }
        return pointsString;
    }

    function makeElement(type: string, options: ISVGOptions): SVGElement {
        const elem = document.createElementNS('http://www.w3.org/2000/svg', type);
        for (const prop in options) {
            if (prop) {
                switch (prop) {
                    case 'type':
                        break;
                    case 'strokeWidth':
                        elem.style.setProperty('stroke-width', String(options[prop]));
                        break;
                    case 'strokeDasharray':
                        elem.style.setProperty('stroke-dasharray', String(options[prop]));
                        break;
                    case 'brushStyle' :
                        elem.style.setProperty('brushStyle', String(options[prop]));
                        break;
                    case 'fontFamily':
                        elem.style.setProperty('font-family', String(options[prop]));
                        break;
                    case 'fontSize':
                        elem.style.setProperty('font-size', String(options[prop]));
                        break;
                    case 'text':
                        elem.innerHTML = options[prop];
                        break;
                    case 'stroke':
                    case 'fill':
                    case 'color':
                        elem.style.setProperty(prop, String(options[prop]));
                        break;
                    case'points':
                        elem.setAttribute('points', options.points);
                        break;
                    case 'src':
                        elem.setAttribute('xlink:href', String(options[prop]));
                        break;
                    case 'width':
                        elem.setAttribute('width', String(options[prop]));
                        break;
                    default:
                        elem.setAttribute(prop, String(options[prop]));
                        break;
                }

            }
        }

        elem.style.strokeLinecap = 'round';
        elem.style.strokeLinejoin = 'round';
        return elem;
    }
}
