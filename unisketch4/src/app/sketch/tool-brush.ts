import { SketchService } from '../services/sketch.service';
import { Line } from '../models/line.model';
import { Vertex } from '../models/vertex.model';
import { SketchTool } from './tool';
import { LineMathHelper } from '../line-math-helper';
import { SVGElementFactory } from "./svg-element-factory";
import { JSONHelper } from "../helpers/JSONHelper";
import { SketchElementType } from "../helpers/SketchElementType";
import { single } from 'rxjs/operators';

/**
 * Tool class for the brush.
 */
export class ToolBrush extends SketchTool {

    /**
     * List of lines that were sent to the server but haven't been confirmed yet.
     */
    private unconfirmedLines: Line[] = [];

    /**
     * List of vertices (as sequential x and y numbers) to be added to the current line.
     */
    private vertexBatch: number[] = [];

    /**
     * The line the user is currently drawing.
     */
    private activeLine: Line;

    /**
     * The interval at which the vertex batch is sent to the server.
     */
    private batchInterval: number;

    /**
     * Timer handle for flushing the vertex batch.
     */
    private batchIntervalHandle;

    private activeLineElement: SVGElement;
    private activeGraffitiElement: SVGElement;

    constructor(sketchService: SketchService) {
        super(sketchService);

        // Invoked upon successful connection, sets up the interval at which vertices are sent based on the server configuration
        this.subscription.add(this.sketchService.onSessionStart.subscribe((data) => {
            this.setBatchInterval(data['batch_interval']);
        }));

        // Invoked when the server acknowledges a line this client has drawn. Used to map the line id to the local line model.
        this.subscription.add(this.sketchService.onConfirmElement.subscribe((data) => {
            // For lines only
            if (data['element_id'] && data['type'] && data['type'] === SketchElementType.Polyline) {
                const elem = this.unconfirmedLines.shift();
                if (!elem) {
                    console.error('Received an unexpected confirm line for id ' + data['line_id']);
                    return;
                }
                this.activeLineElement.parentNode.removeChild(this.activeLineElement);
                elem.id = data['element_id'];
                this.activeLineElement = this.sketchService.renderElement(elem);
                this.activeLine.id = elem.id;
                this.sketchService.getSketch()
                    .sketchElements
                    .push(elem);

                //any SketchElement
            } else if (typeof data['element'] !== 'undefined') { // our new case for undo / redo
                const elem = JSONHelper.parseSketchElementFromJson(data['element']);
                this.sketchService.getSketch()
                    .sketchElements
                    .push(elem);
                this.sketchService.renderElement(elem);
            }
        }));

        // Invoked when a line is deleted. Removes the line from the model and redraws the sketch.
        this.subscription.add(this.sketchService.onDeleteElement.subscribe((data) => {
            if (this.activeLine === this.sketchService.getSketch()
                .getElementById(data['element_id'])) {
                this.cancelStroke();
            }
        }));
    }

    /**
     * Sets the batch interval to the given value and reconfigures the flushing timer.
     */
    setBatchInterval(batchInterval: number) {
        this.batchInterval = batchInterval;

        if (this.batchIntervalHandle) {
            clearInterval(this.batchIntervalHandle);
        } 

        if (this.batchInterval > 0) {
            this.batchIntervalHandle = setInterval(() => this.flushVertexBatch(), this.batchInterval);
        }
    }

    startStroke(mousePos: any) {
        // Draw a single point on the canvas to show the user that they've started drawing
        this.activeLineElement = this.sketchService.renderPoint(mousePos.x, mousePos.y, this.sketchService.brushColor, this.sketchService.brushWidth);

        // Flush the vertex batch in case there are leftover vertices from the previous line
        this.flushVertexBatch();

        // Start a new line at the current position
        this.sketchService.startLine(mousePos.x, mousePos.y);

        // Add the new line to the confirmation queue (at which it will receive its id) and make it the currently active line.
        const line = new Line();
        line.vertices.push(new Vertex(mousePos.x, mousePos.y));
        line.dasharray = this.sketchService.dasharray;
        line.brushStyle = this.sketchService.brushStyle;
        line.color = this.sketchService.brushColor;
        line.width = this.sketchService.brushWidth;
        this.unconfirmedLines.push(line);
        this.activeLine = line;
    }

    getGraffitiVertices(line: Line, mousePos: any) {
        //vertices: Vertex[] = [];
        for (let i = 0; i < 5; i++) {

            line.vertices.push(new Vertex(mousePos.x - this.randomiseCirclePos(), mousePos.y - this.randomiseCirclePos()))
        }
    }

    startGraffiti(mousePos: any) {
        //draw a single graffiti point
        /*for (let i = 0; i < 100
            ; i++){
            this.activeLineElement = this.sketchService.renderPoint(mousePos.x- this.randomiseCirclePos(), mousePos.y- this.randomiseCirclePos(), this.sketchService.brushColor, this.sketchService.brushWidth);
            console.log(mousePos.x-this.randomiseCirclePos());
        }*/

        this.flushVertexBatch();

        // Start a new line at the current position
        this.sketchService.startLine(mousePos.x, mousePos.y);

        // Add the new line to the confirmation queue (at which it will receive its id) and make it the currently active line.
        const line = new Line();
        this.randomiseGraffitiCircle(mousePos.x, mousePos.y);
        line.vertices.push(new Vertex(mousePos.x, mousePos.y));
        line.dasharray = this.sketchService.dasharray;
        line.brushStyle = this.sketchService.brushStyle;
        line.color = this.sketchService.brushColor;
        line.width = this.sketchService.brushWidth;
        this.unconfirmedLines.push(line);
        this.activeLine = line;
    }

    randomiseGraffitiCircle(mousePosX: any, mousePosY: any) {
        for (let i = 0; i < 100; i++) {
            let xCoord: number = mousePosX + Math.sin(Math.floor(Math.random() * (360 - 0 + 1) + 0)) * 10;
            let yCoord: number = mousePosY + Math.cos(Math.floor(Math.random() * (360 - 0 + 1) + 0)) * 10;

            if (Math.pow((xCoord - mousePosX), 2) + Math.pow((yCoord - mousePosY), 2) < Math.pow(10, 2)) {
                this.activeLineElement = this.sketchService.renderPoint(xCoord, yCoord, this.sketchService.brushColor, this.sketchService.brushWidth);
            }
        }
    }

    randomiseCirclePos() {
        return Math.floor(Math.random() * (10 - (-10) + 1) + (-10));
    }

    /**
     * Called from the sketch-canvas-events.directive
     * @param mousePos
     * @param prevMousePos
     */
    continueStroke(mousePos: any, prevMousePos: any): void {
        const vertex = new Vertex(mousePos.x, mousePos.y);

        //if the current element is a circle (has only one vertex), make it a line
        if (this.activeLineElement.tagName === 'circle') {
            let x = +this.activeLineElement.getAttribute('cx');
            let y = +this.activeLineElement.getAttribute('cy');

            let tmpVertices = [new Vertex(x, y), vertex];
            const lineElem = SVGElementFactory.createLine(tmpVertices, this.activeLine.color, this.activeLine.width, this.activeLine.id);
            this.activeLineElement.parentNode.replaceChild(lineElem, this.activeLineElement);
            this.activeLineElement = lineElem;

            // otherwise add the new vertex to the points of the current line
        } else {
            let tmpVertices = this.activeLine.vertices.concat([new Vertex(mousePos.x, mousePos.y)]);
            this.activeLineElement.setAttribute('points', SVGElementFactory.verticesToSVGPoints(tmpVertices));
        }

        // Add a new vertex to the active line, and the vertex batch
        const vertexCount = this.activeLine.vertices.length;
        if (vertexCount >= 2 &&
            LineMathHelper.areVerticesOnLine(this.activeLine.vertices[vertexCount - 2],
                this.activeLine.vertices[vertexCount - 1], vertex)) {

            // If the last three points are on the same line, move the
            // middle vertex to the last instead of creating a new one.
            if (this.vertexBatch.length === 0) {
                this.sketchService.moveLastVertex(vertex.x, vertex.y);

            } else {
                this.vertexBatch[this.vertexBatch.length - 2] = vertex.x;
                this.vertexBatch[this.vertexBatch.length - 1] = vertex.y;
            }

            this.activeLine.vertices[this.activeLine.vertices.length - 1] = vertex;

        } else {
            this.vertexBatch.push(vertex.x);
            this.vertexBatch.push(vertex.y);
            this.activeLine.vertices.push(vertex);
        }

        // If the batch interval is set to immediate mode, flush the batch right away
        if (this.batchInterval === 0) {
            this.flushVertexBatch();
        }
    }

    continueGraffitiLine(mousePos: any, prevMousePos: any): void {
        const vertex = new Vertex(mousePos.x, mousePos.y);
        /*for (let i = 0; i < 100; i++){
            this.activeLineElement = this.sketchService.renderPoint(mousePos.x- this.randomiseCirclePos(), mousePos.y- this.randomiseCirclePos(), this.sketchService.brushColor, this.sketchService.brushWidth);
            //console.log(mousePos.x-this.randomiseCirclePos());
        }*/
        this.randomiseGraffitiCircle(mousePos.x, mousePos.y);
        /*if (this.activeLineElement.tagName === 'circle') {
            let x = +this.activeLineElement.getAttribute('cx');
            let y = +this.activeLineElement.getAttribute('cy');

            let tmpVertices = [new Vertex(x-this.randomiseCirclePos(), y-this.randomiseCirclePos()), vertex];
            //const lineElem = SVGElementFactory.createLine(tmpVertices, this.activeLine.color, this.activeLine.width, this.activeLine.id);
            //this.activeLineElement.parentNode.replaceChild(lineElem, this.activeLineElement);
            //this.activeLineElement = lineElem;

            // otherwise add the new vertex to the points of the current line
        } else {
            //let tmpVertices = this.activeLine.vertices.concat([new Vertex(mousePos.x-this.randomiseCirclePos(), mousePos.y-this.randomiseCirclePos())]);
            //this.activeLineElement.setAttribute('points', SVGElementFactory.verticesToSVGPoints(tmpVertices));
        }*/

        // Add a new vertex to the active line, and the vertex batch
        const vertexCount = this.activeLine.vertices.length;
        if (vertexCount >= 2 &&
            LineMathHelper.areVerticesOnLine(this.activeLine.vertices[vertexCount - 2],
                this.activeLine.vertices[vertexCount - 1], vertex)) {

            // If the last three points are on the same line, move the
            // middle vertex to the last instead of creating a new one.
            if (this.vertexBatch.length === 0) {
                this.sketchService.moveLastVertex(vertex.x, vertex.y);

            } else {
                this.vertexBatch[this.vertexBatch.length - 2] = vertex.x;
                this.vertexBatch[this.vertexBatch.length - 1] = vertex.y;
            }

            this.activeLine.vertices[this.activeLine.vertices.length - 1] = vertex;

        } else {
            this.vertexBatch.push(vertex.x);
            this.vertexBatch.push(vertex.y);
            this.activeLine.vertices.push(vertex);
        }

        // If the batch interval is set to immediate mode, flush the batch right away
        if (this.batchInterval === 0) {
            this.flushVertexBatch();
        }
    }

    // TODO: set brushCursor "onInit"
    setCursor() {
        const sketchArea = document.getElementById('canvas');
        sketchArea.style.cursor = `url('/assets/img/brush_tool_cursor.png') 0 40, default`;
    }

    stopStroke(): void {
        // Send remaining vertices of this line to the server and stop drawing
        this.flushVertexBatch();
        this.flushGraffiti();
    }

    deselect() {
        this.sketchService.brushStyle = 'normal';
    }

    // stopGraffiti(): void {

    // }

    /**
     * Sends the vertices in the vertex batch to the server and clears it.
     */
    private flushVertexBatch() {
        if (this.vertexBatch.length > 0) {
            this.sketchService.continueLine(this.vertexBatch);
            this.vertexBatch = [];
        }
    }

    private flushGraffiti() {
        if (this.vertexBatch.length > 0) {
            this.sketchService.continueLine(this.vertexBatch);
            this.vertexBatch = [];
        }
    }

}
