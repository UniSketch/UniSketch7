import {Line} from '../models/line.model';
import {Text} from '../models/text.model';
import {ElementRef} from '@angular/core';
import {SketchService} from '../services/sketch.service';
import {Vertex} from '../models/vertex.model';
import {ISVGOptions, SVGElementFactory} from './svg-element-factory';
import { element } from 'protractor';
import {Image} from '../models/image.model';
import {Shape} from '../models/shape.model';
import {SketchElement} from '../models/sketch-element.model';

export interface IRenderer {

    redraw();

    setZoom(zoom: number);

    setActive(svgRef: ElementRef);

    clear();

    updateBackground(color: string);

    makeBackground(color: string): SVGElement;

    renderElement(element: SketchElement);

    createSketchElement(element: SketchElement): SVGElement;

    reRenderElement(element: SketchElement);

    highlightElement(element: SketchElement, color: string, width?: number);

    createSelectionFrames(color: string, fillColor: string, width: number);

    createSelectionHandles(color: string, fillColor: string, width: number, cursors: string[]);

    updateSelectionFrame(vertices: Vertex[], id: number);

    updateSelectionHandles(vertices: Vertex[][]);

    hideSelectionFrame(id: number);

    hideSelectionHandles();
}


/**
 * This renderer builds SVG-elements out of the given data.
 * In order to have a better performance, all render-actions in redraw are batched and committed in a single push.
 * (At some point redraw might not even be necessary?)
 */
export class SVGRenderer implements IRenderer {
    private sketchService;
    private currentSvg;
    private readonly defaultLayer: SVGElement;
    private frame;
    private handle;

    constructor(sketchService: SketchService) {
        this.sketchService = sketchService;
        this.defaultLayer = SVGElementFactory.createElement('g', {} as ISVGOptions);
        this.defaultLayer.setAttribute('id', 'def-layer');  //temp 
    }

    public redraw() {
        this.clear();
        let elements = '';

        const grid = this.makeGrid();

        if (!this.sketchService.gridVisible) {
            grid.setAttribute('visibility', 'hidden');
        }

        elements += this.makeBackground(this.sketchService.sketch.background_color).outerHTML;
        elements += grid.outerHTML;

        // append all sketch elements to the defaultlayer
        if (this.sketchService.sketch.sketchElements) {
            console.log(this.sketchService.sketch.sketchElements);
            for (const element of this.sketchService.sketch.sketchElements) {
                const elemInstance = this.createSketchElement(element);
                if (elemInstance) {
                    elements += elemInstance.outerHTML;
                }
            }
        }

        this.defaultLayer.innerHTML = elements;

        // append the selection frames back on to the defaultLayer
        if (this.frame !== undefined && this.frame !== null) {
            this.defaultLayer.appendChild(this.frame[0]);
            this.defaultLayer.appendChild(this.frame[1]);
        }
        if (this.handle !== undefined && this.handle !== null) {
            for (let i = 0; i < 8; i++) {
                this.defaultLayer.appendChild(this.handle[i]);
            }
        }
    }

    public setZoom(zoom: number) {
        this.defaultLayer.setAttribute('transform', `scale(${zoom})`);
    }

    public setActive(svgRef: ElementRef) {
        this.currentSvg = svgRef.nativeElement;
        this.currentSvg.appendChild(this.defaultLayer);
    }

    public updateBackground(color: string) {

        const bg = document.getElementById('element0');
        bg.style.fill = color;
    }

    public updateGrid(visible:boolean) {
        
        let grid =  document.getElementById('gridback');
        let backcolor = document.getElementById('element0');
        if(visible) {
            grid.setAttribute('visibility', 'visible');
            console.log(grid);
            backcolor.setAttribute('visibility', 'hidden');
        }else {
            grid.setAttribute('visibility', 'hidden');
            console.log(grid);
            backcolor.setAttribute('visibility', 'visible');
        }   
    }

    public hexToRGBA(hex, opacity) {
        return 'rgba(' + (hex = hex.replace('#', '')).match(new RegExp('(.{' + hex.length/3 + '})', 'g')).map(function(l) { return parseInt(hex.length%2 ? l+l : l, 16) }).concat(opacity||1).join(',') + ')';
    }

    public makeBackground(color: string): SVGElement {
        return SVGElementFactory.createElement('rect', {
            x: 0,
            y: 0,
            width: this.sketchService.originalCanvasSize.width,
            height: this.sketchService.originalCanvasSize.height,
            fill: color,
            id: 'element0'
        } as ISVGOptions);
    }

    public makeGrid(): SVGElement {
        return SVGElementFactory.createElement('rect', {
            x: 0,
            y: 0,
            width: this.sketchService.originalCanvasSize.width,
            height: this.sketchService.originalCanvasSize.height,
            fill: "url(#grid)",
            id: 'gridback'
        } as ISVGOptions);
    }

    public clear() {
        while (this.defaultLayer.firstChild) {
            this.defaultLayer.removeChild(this.defaultLayer.firstChild);
        }
    }

    public renderElement(element: SketchElement): SVGElement {
        const elem = this.createSketchElement(element);
        this.defaultLayer.appendChild(elem);
        return elem;
    }

    public renderPoint(x: number, y: number, color: string, width: number): SVGElement {
        const elem: SVGElement = SVGElementFactory.createCircle(x, y, color, width);
        this.defaultLayer.appendChild(elem);
        return elem;
    }

    public createSketchElement(element: SketchElement): SVGElement {

        if (element instanceof Line) {

            if (element.isPoint()) {
                return SVGElementFactory.createCircleFromLine(element);
            } else {
                if (element.brushStyle === 'normal') {
                    return SVGElementFactory.createLineFromLine(element);
                } else if (element.brushStyle === 'graffiti') {
                    return SVGElementFactory.createGraffitiFromLine(element);
                }
                
            }
        } else if (element instanceof Text) {
            const svgElement = SVGElementFactory.createText(element);
            svgElement.style.whiteSpace = 'pre';
            svgElement.style.userSelect = 'none';
            return svgElement;
        } else if (element instanceof Shape) {
            return SVGElementFactory.createShape(element);
        } else if (element instanceof Image) {
            return SVGElementFactory.createImage(element);
        } else {
            console.error('SketchElement for the following element does not exist!', element);
        }
    }

    public reRenderElement(element: SketchElement) {

        this.updateGrid(this.sketchService.gridVisible);
        
        const elem = document.getElementById('element' + element.id);
        if (elem === undefined || elem === null) {
            console.log('element with id ' + element.id + ' not found');
        } else {
            elem.style.visibility = 'visible';
            if (element instanceof Line) {
                if (element.isPoint()) {
                    elem.setAttribute('r', (element.width / 2).toString());
                    elem.style.fill = element.color;
                    elem.setAttribute('cx', element.vertices[0].x.toString());
                    elem.setAttribute('cy', element.vertices[0].y.toString());
                    console.log(element.brushStyle);
                } else {
                    elem.style.strokeWidth = element.width.toString();
                    elem.style.strokeDasharray = element.dasharray.toString();                    
                    elem.style.stroke = element.color;
                    console.log(element.brushStyle);
                    if (element.brushStyle === 'normal') {
                        elem.setAttribute('points', SVGElementFactory.verticesToSVGPoints(element.getPos()));
                    } else if (element.brushStyle === 'graffiti') {
                        elem.setAttribute('points', SVGElementFactory.verticesToGraffiti(element.getPos()));
                    }
                    //elem.setAttribute('points', SVGElementFactory.verticesToSVGPoints(element.getPos()));
                }
            } else if (element instanceof Text) {
                const lines = element.content.split('\n');
                let content = '';
                const lineHeight = 1;
                for (let i = 0; i < lines.length; i++) {
                    if (!lines[i]) {
                        lines[i] = ' ';
                    }
                    content += '<tspan x=\'' + element.pos_x + '\' dy=\'' + lineHeight + 'em\'>' + lines[i] + '</tspan>';
                }
                elem.setAttribute('x', element.pos_x.toString());
                elem.setAttribute('y', element.pos_y.toString());
                elem.innerHTML = content;
                elem.style.color = element.color;
                elem.style.fontFamily = element.type;
                elem.style.fontSize = element.width.toString() + 'px';
            } else if (element instanceof Shape) {
                elem.style.fill = element.fill;
                elem.style.stroke = element.color;
                elem.style.strokeWidth = element.size + 'px';
                elem.setAttribute('width', element.width + 'px');
                elem.setAttribute('height', element.height + 'px');
                if (element.type === 'rect') {
                    elem.setAttribute('x', element.pos_x.toString());
                    elem.setAttribute('y', element.pos_y.toString());
                    
                }
                else if (element.type === 'polygon') {
                    let points = '';
                    points = element.pos_x.toString() + ',' + element.pos_y.toString() + ' ';
                    if (element.mirrored_x && element.mirrored_y) {
                        points += (element.pos_x - element.width).toString() + ',' + element.pos_y.toString() + ' ';
                        points += (element.pos_x - element.width / 2).toString() + ',' + (element.pos_y - element.height).toString();
                    }else if (element.mirrored_y) {
                        points += (element.pos_x + element.width).toString() + ',' + element.pos_y.toString() + ' ';
                        points += (element.pos_x + element.width / 2).toString() + ',' + (element.pos_y - element.height).toString();
                    }else if (element.mirrored_x) {
                        points += (element.pos_x - element.width).toString() + ',' + element.pos_y.toString() + ' ';
                        points += (element.pos_x - element.width / 2).toString() + ',' + (element.pos_y + element.height).toString();
                    }else {
                        points += (element.pos_x + element.width).toString() + ',' + element.pos_y.toString() + ' ';
                        points += (element.pos_x + element.width / 2).toString() + ',' + (element.pos_y + element.height).toString();
                    }
                    elem.setAttribute('points', points);
                }
                 else {
                    elem.setAttribute('cx', element.pos_x.toString());
                    elem.setAttribute('cy', element.pos_y.toString());
                    
                    if (element.type === 'circle') {
                        elem.setAttribute('r', (element.width / 2).toString());
                    } else if (element.type === 'ellipse') {
                        elem.setAttribute('rx', (element.width / 2).toString());
                        elem.setAttribute('ry', (element.height / 2).toString());
                    }
                }
            }
        }
    }

    public hideElements(elements: SketchElement[]) {
        for (let i = 0; i < elements.length; i++) {
            const elem = document.getElementById('element' + elements[i].id);
            if (elem === undefined || elem === null) {
                console.log('nothing to hide - element with id ' + elements[i].id + ' not found');
            } else {
                elem.style.visibility = 'hidden';
            }
        }
    }

    public highlightElement(element: SketchElement, color: string, width?: number) {
        const elem = document.getElementById('element' + element.id);
        if (elem === undefined || elem === null) {
            console.log('element with id ' + element.id + ' not found');
        } else {
            if (element instanceof Line) {
                if (element.isPoint()) {
                    elem.setAttribute('r', (element.width / 2 + width).toString());
                    elem.style.fill = color;
                } else {
                    elem.style.strokeWidth = (element.width + width).toString();
                    elem.style.stroke = color;
                }
            } else if (element instanceof Text) {
                elem.style.color = color;
            } else if (element instanceof Shape) {
                elem.style.stroke = color;
                elem.style.fill = color + '99';
            }
        }
    }

    public createSelectionFrames(color: string, fillColor: string, width: number) {
        this.frame = [];
        for (let i = 0; i < 2; i++) {
            const verts: Vertex[] = [new Vertex(-10, -10), new Vertex(-10, -10)];
            const selectionFrame = SVGElementFactory.createSelectionFrameInstance(verts, color, fillColor, width, i);
            this.frame.push(selectionFrame);
            this.defaultLayer.appendChild(selectionFrame);
        }
    }

    public createSelectionHandles(color: string, fillColor: string, width: number, cursors: string[]) {
        this.handle = [];
        for (let i = 0; i < 8; i++) {
            const verts: Vertex[] = [new Vertex(-10, -10), new Vertex(-10, -10)];
            const handle = SVGElementFactory.createSelectionHandleInstance(verts, color, fillColor, width, i);
            handle.style.cursor = cursors[i];
            this.handle.push(handle);
            this.defaultLayer.appendChild(handle);
        }
    }

    public updateSelectionFrame(vertices: Vertex[], id: number) {
        const frame = document.getElementById('selection' + id);
        if (frame === undefined || frame === null) {
            console.log('frame not found');
        } else {
            frame.setAttribute('points', SVGElementFactory.verticesToSVGPoints(vertices));
        }
    }

    public updateSelectionHandles(vertices: Vertex[][]) {
        for (let i = 0; i < 8; i++) {
            const handle = document.getElementById('handle' + i);
            if (handle === undefined || handle === null) {
                console.log('handle not found');
            } else {
                handle.setAttribute('points', SVGElementFactory.verticesToSVGPoints(vertices[i]));
            }
        }
    }

    public hideSelectionFrame(id: number) {
        const verts: Vertex[] = [new Vertex(-10, -10), new Vertex(-10, -10)];
        const frame = document.getElementById('selection' + id);
        if (frame === undefined || frame === null) {
            console.log('frame not found');
        } else {
            frame.setAttribute('points', SVGElementFactory.verticesToSVGPoints(verts));
        }
    }

    public hideSelectionHandles() {
        for (let i = 0; i < 8; i++) {
            const verts: Vertex[] = [new Vertex(-10, -10), new Vertex(-10, -10)];
            const handle = document.getElementById('handle' + i);
            if (handle === undefined || handle === null) {
                console.log('handle not found');
            } else {
                handle.setAttribute('points', SVGElementFactory.verticesToSVGPoints(verts));
            }
        }
    }

    public createInputField() {
        console.log('@createInputField');
        const form = document.createElement('form');
        const input = document.createElement('input');
        input.name = 'test';
        input.textContent = 'blaaaaaaaa';
        form.appendChild(input);
        this.defaultLayer.appendChild(form);
    }

}
