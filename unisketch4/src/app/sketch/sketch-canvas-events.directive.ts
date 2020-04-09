import { Directive, ElementRef, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { SketchService } from '../services/sketch.service';
import { Sketch } from '../models/sketch.model';
import { Line } from '../models/line.model';
import { Vertex } from '../models/vertex.model';
import { LineMathHelper } from '../line-math-helper';
import { SVGElementFactory } from "./svg-element-factory";
import { JSONHelper } from "../helpers/JSONHelper";

/**
 * Events directive for the sketch canvas. Handles strokes and delegates them to active tools.
 */
@Directive({
    selector: '[appSketchCanvasEvents]'
})
export class SketchCanvasEventsDirective implements OnInit, OnDestroy {

    /**
     * The canvas of the sketch view.
     */
    private canvas;

    /**
     * The previous mouse or touch position of a stroke.
     */
    private prevMousePos;

    /**
     * Whether the mouse or touch is being held down.
     */
    private isMouseDown: boolean;

    private isInsideCanvas: boolean;

    /**
     * The active sketch the user is in.
     */
    private sketch: Sketch;

    /**
     * Keeps track of the event subscriptions for unsubscribing later.
     */
    private subscription: Subscription;

    /**
     * If the user can scroll by dragging the canvas
     */
    private isDragScrollActive = false;

    /**
     * Determines if the user can input values. Serves for disabling
     * drag scroll
     */
    private isInputActive = false;

    // private isStraightLineActive = false;

    constructor(
        private router: Router,
        private elementRef: ElementRef,
        private sketchService: SketchService
    ) {
    }


    ngOnInit() {
        this.canvas = this.elementRef.nativeElement;

        this.sketchService.setActiveCanvas(this.elementRef);

        // Invoked when the server sends the full sketch. Fills the sketch model and redraws the canvas.


        this.subscription = this.sketchService.onFullSketch.subscribe((data) => {
            this.sketch = this.sketchService.getSketch();
            this.sketch.sketchElements = [];
            this.sketch.background_color = data['background_color'];

            this.sketchService.redrawSketch();
        });

        // Invoked when the server sends a part of the full sketch. Fills the sketch model and redraws the canvas.
        this.subscription.add(this.sketchService.onFullSketchPart.subscribe((data) => {
            for (const elementData of data['elements']) {
                const element = JSONHelper.parseSketchElementFromJson(elementData);
                this.sketch.sketchElements.push(element);
            }

            this.sketchService.redrawSketch();
        }));

        // Invoked when the background color is changed. Changes sketch model and redraws the canvas.
        this.subscription.add(this.sketchService.onBackgroundColor.subscribe((data) => {
            this.sketch.background_color = data['color'];
            this.sketchService.getRenderer()
                .updateBackground(data['color']);
        }));

        // Invoked when a new line is drawn. Adds it to the sketch model and draws it on the canvas.
        this.subscription.add(this.sketchService.onDrawLine.subscribe((data) => {
            const line = JSONHelper.parseLineFromJson(data);
            this.sketch.sketchElements.push(line);
            this.sketchService.renderElement(line);
        }));

        // Invoked when a new element is drawn. Adds it to the sketch model and renders it onto the canvas.
        this.subscription.add(this.sketchService.onDrawElement.subscribe((data) => {
            const element = JSONHelper.parseSketchElementFromJson(data);
            this.sketch.sketchElements.push(element);
            this.sketchService.renderElement(element);
            if (element['src']){
                this.sketchService.redrawSketch();
            }
        }));

        // Invoked when a line receives new vertices. Adds them to the sketch model and draws it on the canvas.
        this.subscription.add(this.sketchService.onContinueLine.subscribe((data) => {
            const line = this.sketch.sketchElements.find(it => it.id === data['line_id']);
            if (line === null || !(line instanceof Line)) {
                console.error('Received continue_line for unknown line id ' + data['line_id']);
                return;
            }

            // get the vertices from the api
            const vertices = data['vertices'];

            //add them to the line
            for (let i = 0; i < vertices.length; i += 2) {
                const vertex = new Vertex(vertices[i], vertices[i + 1]);
                line.vertices.push(vertex);
            }

            //get the element in the 'canvas'
            const elem = document.getElementById('element' + line.id);
            //if it exists and it is a circle, make it a line, otherwise update the points
            if (elem) {
                if (elem.tagName === 'circle') {
                    const lineElem = SVGElementFactory.createLineFromLine(line);
                    elem.parentNode.replaceChild(lineElem, elem);
                } else {
                    elem.setAttribute('points', SVGElementFactory.verticesToSVGPoints(line.vertices));
                }
                //if it does not exist make a new one.
            } else {
                const elem = SVGElementFactory.createLine(vertices, line.color, line.width, line.id);
                this.sketchService.getActiveCanvas()
                    .nativeElement
                    .appendChild(elem);
            }
        }));

        // Invoked when a line is deleted. Removes the line from the model and redraws the sketch.
        this.subscription.add(this.sketchService.onDeleteElement.subscribe((data) => {
            this.sketch.deleteElement(data['element_id']);
            this.sketchService.redrawSketch();
        }));

        // Invoked when this client loses rights to view this sketch. Will redirect to the dashboard.
        this.subscription.add(this.sketchService.onKicked.subscribe((data) => {
            this.router.navigate(['/dashboard']);
        }));

        this.subscription.add(this.sketchService.isInputActive.subscribe(value => {
            this.isInputActive = value;
        }));

        this.subscription.add(this.sketchService.onDeleteElements.subscribe((data) => {
            const ids = [];
            for (const id of data['ids']) {
                this.sketch.deleteElement(id);
                ids.push(id);
            }
            this.sketchService.redrawSketch();
            if (this.sketchService.currentTool === this.sketchService.toolSelector) {
                this.sketchService.toolSelector.onExternalUpdate();
            } else if (this.sketchService.currentTool === this.sketchService.toolText) {
                this.sketchService.toolText.onDeletetText(ids);
            }
        }));

        this.subscription.add(this.sketchService.onCopyElements.subscribe((data) => {
            for (const elementData of data['elements']) {
                const element = JSONHelper.parseSketchElementFromJson(elementData);
                this.sketch.sketchElements.push(element);
            }
            this.sketchService.redrawSketch();
        }));

        this.subscription.add(this.sketchService.onMoveElements.subscribe((data) => {
            const ids = [];
            for (const elementData of data['elements']) {
                const element = JSONHelper.parseSketchElementFromJson(elementData);
                const elementToMove = this.sketch.getElementById(element.id);
                elementToMove.setPos(element.getPos());
                ids.push(element.id);
            }
            this.sketchService.redrawSketch();
            if (this.sketchService.currentTool === this.sketchService.toolSelector) {
                this.sketchService.toolSelector.onExternalUpdate();
            } else if (this.sketchService.currentTool === this.sketchService.toolText) {
                this.sketchService.toolText.onExternalUpdate(ids);
            }
        }));

        this.subscription.add(this.sketchService.onScaleElements.subscribe((data) => {
            const ids = [];
            for (const elementData of data['elements']) {
                const element = JSONHelper.parseSketchElementFromJson(elementData);
                const elementToScale = this.sketch.getElementById(element.id);
                elementToScale.setPos(element.getPos());
                elementToScale.width = element.width;
                elementToScale['height'] = element['height'];
                ids.push(element.id);
            }
            this.sketchService.redrawSketch();
            if (this.sketchService.currentTool === this.sketchService.toolSelector) {
                this.sketchService.toolSelector.onExternalUpdate();
            } else if (this.sketchService.currentTool === this.sketchService.toolText) {
                this.sketchService.toolText.onExternalUpdate(ids);
            }
        }));

        this.subscription.add(this.sketchService.onCopiedElements.subscribe((data) => {
            if (this.sketchService.currentTool === this.sketchService.toolSelector) {
                this.sketchService.toolSelector.onCopiedElements(data['ids']);
            }
        }));

        this.subscription.add(this.sketchService.onEditText.subscribe((data) => {
            const text = JSONHelper.parseSketchElementFromJson(data['text']);
            let contains = false;
            if (this.sketchService.currentTool === this.sketchService.toolSelector) {
                if (this.sketchService.toolSelector.selectionContains(text.id)) {
                    this.sketchService.toolSelector.removeItem(text.id);
                    contains = true;
                }
            }
            this.sketch.deleteElement(text.id);
            this.sketch.sketchElements.push(text);
            this.sketchService.reRenderElement(text);
            if (this.sketchService.currentTool === this.sketchService.toolSelector) {
                if (contains) {
                    this.sketchService.toolSelector.addItem(text.id);
                }
            }
        }));
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    /**
     * Called when the user starts touching the canvas.
     */
    @HostListener('touchstart', ['$event'])
    touchstart(event) {
        this.startMouseTouch(event.touches[0].clientX, event.touches[0].clientY);
    }

    /**
     * Called when the user starts holding the mouse button on the canvas.
     */
    @HostListener('mousedown', ['$event'])
    mousedown(event) {
        if (event.button === 0) {
            this.startMouseTouch(event.clientX, event.clientY);
        }
    }

    /**
     * Starts a new stroke at the given position.
     * @param {boolean} force Whether the stroke had left the canvas and is re-entering it now.
     */
    private startMouseTouch(x: number, y: number, force: boolean = false): void {
        // Refuse if the user is not allowed to draw.
        if (!this.sketchService.isAllowedToDraw()) {
            return;
        }

        // refuse if the user is trying to drag scroll with space
        if (this.isDragScrollActive) {
            return;
        }

        let mousePos = this.getCanvasMousePosition(x, y);

        // If the canvas re-enters the canvas, find the intersection point to properly align the line with the border.
        if (force) {
            const line = { startX: this.prevMousePos.x, startY: this.prevMousePos.y, endX: mousePos.x, endY: mousePos.y };
            const rect = {
                x: 0,
                y: 0,
                width: this.canvas.width,
                height: this.canvas.height
            };
            const point = LineMathHelper.getLineRectIntersectionPoint(line, rect);
            if (point != null) {
                mousePos = point;
            }
        }

        // Only start the stroke if there isn't one already in progress - unless the canvas is being re-entered.
        if (!this.isMouseDown || force) {
            if (this.sketchService.brushStyle === "normal") {
                this.sketchService.currentTool.startStroke(mousePos);
            } else if (this.sketchService.brushStyle === "graffiti") {
                this.sketchService.currentTool.startGraffiti(mousePos);
            }

            // Enable drawing via isMouseDown and store the current mouse position to use when creating a line later.
            this.isMouseDown = true;
            this.prevMousePos = mousePos;
        }
    }

    /**
     * Called when the user moves their finger while touching.
     */
    @HostListener('window:touchmove', ['$event'])
    @HostListener('touchmove', ['$event'])
    touchmove(event) {
        if (this.isInsideCanvas) {
            let posTmp = this.getCanvasMousePosition(event.touches[0].clientX, event.touches[0].clientY);
            this.sketchService.sendMousePos(posTmp.x, posTmp.y);
        }

        if (this.continueMouseTouch(event.touches[0].clientX, event.touches[0].clientY)) {
            // Prevent mobile browsers from scrolling while drawing
            event.preventDefault();
            event.stopPropagation();
        }
    }

    /**
     * Called when the user moves the mouse.
     */
    @HostListener('window:mousemove', ['$event'])
    @HostListener('mousemove', ['$event'])
    mousemove(event) {
        if (this.isInsideCanvas) {
            let posTmp = this.getCanvasMousePosition(event.clientX, event.clientY);
            this.sketchService.sendMousePos(posTmp.x, posTmp.y);
        }

        if (this.continueMouseTouch(event.clientX, event.clientY)) {
            // Prevent mobile browsers from scrolling while drawing
            event.preventDefault();
            event.stopPropagation();
        }
    }

    /**
     * Attempts to continue the stroke towards the given coordinates.
     */
    private continueMouseTouch(x: number, y: number): boolean {
        const mousePos = this.getCanvasMousePosition(x, y);
        const prevMousePos = this.prevMousePos;

        // Store the current mouse position to use when creating the next line later
        this.prevMousePos = mousePos;

        // If the stroke has been cancelled, stop.
        if (this.sketchService.currentTool.consumeCanceled()) {

            this.isMouseDown = false;
            return false;
        }

        // Only actually continue the stroke if the user is clicking or touching.
        if (this.isMouseDown) {
            //this.sketchService.currentTool.continueStroke(mousePos, prevMousePos);
            //this.sketchService.currentTool.continueGraffitiLine(mousePos, prevMousePos);
            if (this.sketchService.brushStyle === "normal") {
                this.sketchService.currentTool.continueStroke(mousePos, prevMousePos);
            } else if (this.sketchService.brushStyle === "graffiti") {
                this.sketchService.currentTool.continueGraffitiLine(mousePos, prevMousePos);
            }
            return true;
        }

        if (this.isMouseDown) {
            this.sketchService.currentTool.moveOverCanvas(mousePos);
            return true;
        }

        return false;
    }


    /**
     * Called when the user lets go off the touch.
     */
    @HostListener('window:touchend')
    @HostListener('touchend')
    touchstop() {
        this.stopMouseTouch();
    }

    /**
     * Called when the user lets go off the mouse button.
     */
    @HostListener('window:mouseup')
    @HostListener('mouseup')
    mouseup() {
        this.stopMouseTouch();
        if (this.isInsideCanvas) {
            if (this.sketchService.currentTool === this.sketchService.toolImage) {
                this.sketchService.toolBrush.deselect();
                this.sketchService.toolImage.enableImagePreviewDiv();
                this.sketchService.toolImage.disableCursor();
            }
        }
    }

    @HostListener('dragstart', ['$event'])
    dragStart(event) {
        event.preventDefault();
    }

    /**
     * Called when the mouse cursor enters the canvas.
     */
    @HostListener('mouseenter', ['$event'])
    mouseenter(event) {
        const mousePos = this.getCanvasMousePosition(event.clientX, event.clientY);

        this.sketchService.currentTool.enterCanvas(mousePos);

        this.isInsideCanvas = true;
        // If the mouse is still being held down, restart the previous stroke.
        if (this.isMouseDown) {
            // this.startMouseTouch(event.clientX, event.clientY, true);
            this.continueMouseTouch(event.clientX, event.clientY);
        }
    }

    @HostListener('mousemove', ['$event'])
    mouse(event) {
        this.isInsideCanvas = true;

        const mousePos = this.getCanvasMousePosition(event.clientX, event.clientY);
        this.sketchService.currentTool.moveOverCanvas(mousePos);


    }

    /**
     * Called when the mouse cursor leaves the canvas.
     */
    @HostListener('mouseleave', ['$event'])
    mouseleave(event) {
        this.isInsideCanvas = false;

        // If the mouse is still down, complete the final stroke.
        if (this.isMouseDown) {
            const mousePos = this.getCanvasMousePosition(event.clientX, event.clientY);

            this.sketchService.currentTool.continueStroke(mousePos, this.prevMousePos);
        }

        // Stop the stroke until the mouse enters the canvas again.
        this.stopMouseTouch(true);
    }


    @HostListener('document:keydown', ['$event'])
    private handleKeyDown(event) {
        if (!this.isInputActive) {
            if (event.code === 'Space') {
                if (this.sketchService.currentTool !== this.sketchService.toolText) {
                    event.preventDefault();

                    if (!this.isDragScrollActive) {
                        this.isDragScrollActive = true;
                        this.sketchService.toggleDragScroll(this.isDragScrollActive);
                    }
                }
            }

            // TODO
            // if (event.key === 'Shift') {
            //     event.preventDefault();
            //     this.isStraightLineActive = true;
            // }
        }
    }


    @HostListener('document:keyup', ['$event'])
    private handleKeyUp(event) {
        if (!this.isInputActive) {
            if (event.code === 'Space') {
                event.preventDefault();

                if (this.isDragScrollActive) {
                    this.isDragScrollActive = false;
                    this.sketchService.toggleDragScroll(this.isDragScrollActive);
                }
            }

            // TODO
            // if (event.key === 'Shift') {
            //     event.preventDefault();
            //     this.isStraightLineActive = false;
            // }
        }
    }

    /**
     * Stops the current stroke.
     * @param {boolean} stayDown Whether the stroke left the canvas and should be able to re-enter.
     */
    private stopMouseTouch(stayDown: boolean = false): void {
        // If the stroke has been cancelled, stop.
        if (this.sketchService.currentTool.consumeCanceled()) {
            this.isMouseDown = false;
            return;
        }

        // If there's an active stroke, stop it.
        if (this.isMouseDown) {
            this.sketchService.currentTool.stopStroke();

            // When leaving the canvas, don't reset the value to allow re-entering the canvas to continue drawing.
            if (!stayDown) {
                this.isMouseDown = false;
            }
        }

        if (!this.isMouseDown) {
            this.sketchService.currentTool.exitCanvas();
        }
    }


    /**
     * Maps the absolute browser positions to relative positions on the canvas.
     */
    private getCanvasMousePosition(x: number, y: number) {
        const width = this.sketchService.originalCanvasSize.width;
        const height = this.sketchService.originalCanvasSize.height;
        const rect = this.canvas.getBoundingClientRect();
        const tx = Math.floor((x - rect.left) / (rect.right - rect.left) * width);
        const ty = Math.floor((y - rect.top) / (rect.bottom - rect.top) * height);

        return { x: tx, y: ty };
    }
}
