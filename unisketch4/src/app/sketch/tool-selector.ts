import { SketchService } from '../services/sketch.service';

import { SketchElement } from '../models/sketch-element.model';
import { PositionedSketchElement } from '../models/positioned-sketch-element.model';
import { Line } from '../models/line.model';
import { Vertex } from '../models/vertex.model';
import { Text } from '../models/text.model';
import { SketchTool } from './tool';
import { Shape } from '../models/shape.model';
import { Image } from '../models/image.model';

/**
 * Tool class for the selector.
 */
export class ToolSelector extends SketchTool {

    /**
     * We draw a selection frame in form of a rectangle from one corner to the
     * opposite corner. This is the corner in which we start drawing.
     */
    private startPoint: any;

    /**
     * This is the corner of the selection frame in which we stop drawing.
     */
    private endPoint: any;

    /**
     * Current position of the mouse within the canvas
     */
    private currentMousePos: any;

    /**
     * Stores all selected elements.
     */
    public selectedElements: Set<SketchElement> = new Set();

    /**
     * Stores the mouse position when copy() was called. This is needed to
     * reckon the offset for new elements from calling paste().
     */
    private copyOriginPos: any;

    /**
     * Color of selection frame's line
     */

    public lineColor = '#000000ff';

    /**
     * Fill color of the selection frame
     */
    public fillColor = '#98e3ff55';

    /**
     * Color of the selected elements
     */
    private selectColor = '#26de81';

    /**
     * Width of lines of selection frame
     */
    private width = 1.0;

    /**
     * Value by which the selected lines will be increased in width
     */
    private lineIncrease = 2.0;

    /**
     * State of the control key (for additional selection)
     */
    public isCtrlDown = false;

    /**
     * State when startStroke() was called
     */
    private wasCtrlDown = false;

    /**
     * State of the shift key
     */
    private isShiftDown = false;

    /**
     * State when startStroke() was called
     */
    private wasShiftDown = false;

    /**
     * State of the selection frames: will be initialized when using selector
     * for the first time. If initialized in the constructor then it will
     * disappear from the defaultLayer in the svg-renderer (likely because it
     * initializes before the svg-renderer is initialized). So it is
     * initialized in startStroke().
     */
    private initialized = false;

    /**
     * Stores the start position (top left) of the currently drawn selection frame
     */
    private frameStart = new Vertex(0, 0);

    /**
     * Stores the end position (bottom right) of the currently drawn selection frame
     */
    private frameEnd = new Vertex(0, 0);

    /**
     * Size of the handles of the selection frame
     */
    private handleSize = 9;

    /**
     * Currently active handle. Handle 0 = top center, add 1 going clockwise.
     */
    private activeHandle = -1;

    /**
     * Minimum size of an selection frame
     */
    private minimumSize = 10;

    /**
     * Constructor.
     */
    constructor(sketchService: SketchService) {
        super(sketchService);
    }

    startStroke(mousePos: any): void {
        // We need to initialize the selection frames and handles. This happens
        // only once.
        if (!this.initialized) {
            const cursors: string[] =
                ['ns-resize', 'nesw-resize', 'ew-resize', 'nwse-resize', 'ns-resize', 'nesw-resize', 'ew-resize', 'nwse-resize'];
            this.sketchService.initSelectionFrames(this.lineColor, this.fillColor, this.width);
            this.sketchService.initSelectionHandles(this.lineColor, this.fillColor, this.width, cursors);
            this.initialized = true;
        }

        // store the starting position
        this.startPoint = mousePos;
        this.endPoint = mousePos;

        // set the status from before to false
        this.wasCtrlDown = false;
        this.wasShiftDown = false;

        this.activeHandle = this.isOverHandle(mousePos);
        if (this.activeHandle >= 0) {
            // When we click a handle we want to start scaling
            // Doing nothing though...

        } else if (this.selectedElements.size === 0) {
            // When there are no selected elements we want to start selecting.
            // Therefore we update frame 0 by giving it the start position.
            // IMPORTANT: We dont wannt start a selection when SHIFT is actually
            // down because that is super weird
            if (!this.isShiftDown) {
                this.sketchService.updateSelectionFrame(this.createFrame(this.startPoint, this.endPoint), 0);
            }

        } else {
            // When there already are selected elements lets handle all possible
            // SHIFT and CTRL combinations

            if (!this.isShiftDown && !this.isCtrlDown) {
                // Lets deselect previously selected items when we hold no
                // modifier button down.
                this.deselect();

            } else if (this.isShiftDown && !this.isCtrlDown) {
                // If only SHIFT is down we want to move the current selection.
                // Though we only want to start moving when the cursor is over the
                // selection frame.
                if (this.mouseWithinSelectionFrame(this.startPoint)) {
                    this.wasShiftDown = true;
                }

            } else if (this.isCtrlDown && !this.isShiftDown) {
                // If only CTRL is down we want to add additional elements to the selection.
                // So we update frame 1 by giving it the start position of the frame.
                this.sketchService.updateSelectionFrame(this.createFrame(this.startPoint, this.endPoint), 1);
                this.wasCtrlDown = true;

            } else if (this.isCtrlDown && this.isShiftDown) {
                // When both CTRL and SHIFT are down we don't wanna do something as
                // of now. This might change later.
                this.wasCtrlDown = true;
                this.wasShiftDown = true;
            }
        }
    }

    continueStroke(mousePos: any, prevMousePos: any): void {
        // set the new (temporarely) ent position
        this.endPoint = mousePos;

        if (this.activeHandle >= 0) {
            this.scale(mousePos, false);

        } else if (this.selectedElements.size === 0) {
            // There might be a change that the user was holding SHIFT when starting
            // the click even though there was was no selection to move. In this case
            // we don't want to do anything at all. Otherwise we will update
            // frame 0.
            if (!this.isShiftDown) {
                this.sketchService.updateSelectionFrame(this.createFrame(this.startPoint, this.endPoint), 0);
            }

        } else {
            if (!this.wasCtrlDown && !this.wasShiftDown) {
                // When neither SHIFT nor CTRL were down at start of click we
                // don't want to to anything. This case should be impossible to
                // invoke though.

            } else if (this.wasCtrlDown && !this.wasShiftDown) {
                // When only CTRL was down at start of click we want to add additional
                // elements to selection. Therefore we update frame 1. We don't care
                // if the user let loose on CTRL at this point.
                this.sketchService.updateSelectionFrame(this.createFrame(this.startPoint, this.endPoint), 1);

            } else if (this.wasShiftDown && !this.wasCtrlDown) {
                // When only SHIFT was down at start of click we want to move the
                // selected elements. So we call the method to do that and give it
                // the delta from previous and this mouse position.
                this.move(mousePos.x - prevMousePos.x, mousePos.y - prevMousePos.y, false);

            } else if (this.wasShiftDown && this.wasCtrlDown) {
                // When both SHIFT and CTRL were down at start of click we dont wanna
                // do something as of now. This might change later
            }
        }
    }

    stopStroke(): void {
        if (this.activeHandle >= 0) {
            // When we were scaling then lets reset the active handle
            this.scale(this.endPoint, true);
            this.activeHandle = -1;
            this.styleSelectedElements();

        } else if (this.isShiftDown || this.wasShiftDown) {
            // When SHIFT was down we want to submit the changed positions of
            // the moved elements.
            this.move(0, 0, true);
            this.styleSelectedElements();

        } else {
            // When not SHIFT was down we were drawing a frame. So let's hide
            // the selection frames. Also remove the select-style from the
            // elements, we will style them later on (back again).
            this.sketchService.hideSelectionFrame(0);
            this.sketchService.hideSelectionFrame(1);
            this.unstyleSelectedElements();

            if (this.wasCtrlDown && !this.isCtrlDown) {
                // When CTRL was down at the start of click but is not down
                // anymore we don't want no additional selection but a new
                // selection.
                this.selectedElements.clear();
            }

            // Lets find all elements.
            if (this.endPoint.x === this.startPoint.x && this.endPoint.y === this.startPoint.y) {
                this.addElementsWithinRadius();
            } else {
                this.addElementsWithinSelectionFrame();
            }

            if (this.selectedElements.size === 0) {
                // When there are no selected elements we will just hide the
                // selection frames.
                console.log('No lines or texts selected');
                this.sketchService.hideSelectionFrame(0);
                this.sketchService.hideSelectionHandles();

            } else {
                // When there are selected elements we want to style them and
                // draw a selection frame with handles around themn.
                this.styleSelectedElements();
                console.log('Selected elements: ' + this.selectedElements.size);
                const outerVerts: Vertex[] = this.getMaxOutVertices();
                this.frameStart = outerVerts[0];
                this.frameEnd = outerVerts[1];
                this.sketchService.updateSelectionFrame(this.createFrame(outerVerts[0], outerVerts[1]), 0);
                this.sketchService.updateSelectionHandles(this.createHandles(outerVerts[0], outerVerts[1]));
            }
        }
    }

    /**
     * Called when mouse is moving over canvas.
     * Only sets currentMousePos.
     * TODO: rename the method in parent Tool.ts
     */
    moveOverCanvas(mousePos: any) {
        this.currentMousePos = mousePos;
    }

    /**
     * Checks if mouse cursor is over a handle
     * TODO replace all that math with a function like elementsFromPoint(x, y)
     */
    isOverHandle(pos: any): number {
        // We want to check if the given mouse position is within any of the handles.
        // So for each handle we get the top left point and add it to our array.
        const handlesTopLeftCorner = [];
        handlesTopLeftCorner.push({
            x: this.frameStart.x + ((this.frameEnd.x - this.frameStart.x) / 2) - this.handleSize / 2,
            y: this.frameStart.y - this.handleSize
        });
        handlesTopLeftCorner.push({
            x: this.frameEnd.x,
            y: this.frameStart.y - this.handleSize
        });
        handlesTopLeftCorner.push({
            x: this.frameEnd.x,
            y: this.frameStart.y + ((this.frameEnd.y - this.frameStart.y) / 2) - this.handleSize / 2
        });
        handlesTopLeftCorner.push({
            x: this.frameEnd.x,
            y: this.frameEnd.y
        });
        handlesTopLeftCorner.push({
            x: this.frameStart.x + ((this.frameEnd.x - this.frameStart.x) / 2) - this.handleSize / 2,
            y: this.frameEnd.y
        });
        handlesTopLeftCorner.push({
            x: this.frameStart.x - this.handleSize,
            y: this.frameEnd.y
        });
        handlesTopLeftCorner.push({
            x: this.frameStart.x - this.handleSize,
            y: this.frameStart.y + ((this.frameEnd.y - this.frameStart.y) / 2) - this.handleSize / 2
        });
        handlesTopLeftCorner.push({
            x: this.frameStart.x - this.handleSize,
            y: this.frameStart.y - this.handleSize
        });

        // And now for each handle we check if the mouse position is within this
        // handle. If yes, we return the handle number. (Handle 0 is the top
        // center handle and from there on we're going clockwise.)
        for (let i = 0; i < 8; i++) {
            if (handlesTopLeftCorner[i].x <= pos.x
                && handlesTopLeftCorner[i].y <= pos.y
                && handlesTopLeftCorner[i].x + this.handleSize >= pos.x
                && handlesTopLeftCorner[i].y + this.handleSize >= pos.y) {
                return i;
            }
        }

        // when mouse over no handle return -1
        return -1;
    }

    /**
     * Adds elements within selection frame to selection.
     * Called when a frame was drawn.
     */
    addElementsWithinSelectionFrame() {
        const sketch = this.sketchService.getSketch();
        const allElements: SketchElement[] = sketch.getAllElements();
        const alreadySelected: SketchElement[] = [];
        let newSelected = 0;

        for (let i = 0; i < allElements.length; i++) {
            if (allElements[i].isWithinSelectionFrame(this.startPoint, this.endPoint)) {
                if (!this.selectedElements.has(allElements[i])) {
                    this.selectedElements.add(allElements[i]);
                    newSelected++;
                } else {
                    alreadySelected.push(allElements[i]);
                }
            }
        }

        // when only elements were selected which already where selected before,
        // then remove them from selection
        if (newSelected === 0) {
            for (let i = 0; i < alreadySelected.length; i++) {
                this.selectedElements.delete(alreadySelected[i]);
            }
        }
    }

    /**
     * Adds elements within radius to selection.
     * Radius is not really a circle but a square.
     * Called when just a single click was made.
     */
    addElementsWithinRadius() {
        const sketch: any = this.sketchService.getSketch();
        const allElements: SketchElement[] = sketch.getAllElements();
        const alreadySelected: SketchElement[] = [];
        let newSelected = 0;
        const radius = 5;

        for (let i = 0; i < allElements.length; i++) {
            if (allElements[i].isWithinRadius(radius, this.startPoint)) {
                if (!this.selectedElements.has(allElements[i])) {
                    this.selectedElements.add(allElements[i]);
                    newSelected++;
                } else {
                    alreadySelected.push(allElements[i]);
                }
            }
        }

        // when only elements were selected which already where selected before,
        // then remove them from selection
        if (newSelected === 0) {
            for (let i = 0; i < alreadySelected.length; i++) {
                this.selectedElements.delete(alreadySelected[i]);
            }
        }
    }

    /**
     * Checks if a given position is within the currently drawn selection frame.
     */
    mouseWithinSelectionFrame(pos: any): boolean {
        if (this.frameStart.x <= pos.x
            && this.frameStart.y <= pos.y
            && this.frameEnd.x >= pos.x
            && this.frameEnd.y >= pos.y) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Styles the selected elements
     */
    styleSelectedElements() {
        const elements: SketchElement[] = Array.from(this.selectedElements);
        for (let i = 0; i < elements.length; i++) {
            this.sketchService.highlightElement(elements[i], this.selectColor, this.lineIncrease);
        }
    }

    /**
     * Gives the elements it's previous style
     */
    unstyleSelectedElements() {
        const elements: SketchElement[] = Array.from(this.selectedElements);
        for (let i = 0; i < elements.length; i++) {
            this.sketchService.reRenderElement(elements[i]);
        }
    }

    /**
     * Creates the vertices for the selection frame from startPoint and endPoint
     */
    createFrame(startPoint: any, endPoint: any): Vertex[] {
        const vertices: Vertex[] = [];

        vertices.push(new Vertex(startPoint.x, startPoint.y));
        vertices.push(new Vertex(endPoint.x, startPoint.y));
        vertices.push(new Vertex(endPoint.x, endPoint.y));
        vertices.push(new Vertex(startPoint.x, endPoint.y));
        vertices.push(new Vertex(startPoint.x, startPoint.y));

        return vertices;
    }

    /**
     * Creates the vertices for the frame handles, the corners of the frame
     * which can be drag to resize selection
     */
    createHandles(startPoint: any, endPoint: any): Vertex[][] {
        // top center
        const topCenter: Vertex[] = [];
        topCenter.push(new Vertex(startPoint.x + ((endPoint.x - startPoint.x) / 2) + (this.handleSize / 2), startPoint.y));
        topCenter.push(new Vertex(startPoint.x + ((endPoint.x - startPoint.x) / 2) + (this.handleSize / 2), startPoint.y - this.handleSize));
        topCenter.push(new Vertex(startPoint.x + ((endPoint.x - startPoint.x) / 2) - (this.handleSize / 2), startPoint.y - this.handleSize));
        topCenter.push(new Vertex(startPoint.x + ((endPoint.x - startPoint.x) / 2) - (this.handleSize / 2), startPoint.y));
        topCenter.push(new Vertex(startPoint.x + ((endPoint.x - startPoint.x) / 2) + (this.handleSize / 2), startPoint.y));

        // top right corner
        const topRight: Vertex[] = [];
        topRight.push(new Vertex(endPoint.x, startPoint.y));
        topRight.push(new Vertex(endPoint.x + this.handleSize, startPoint.y));
        topRight.push(new Vertex(endPoint.x + this.handleSize, startPoint.y - this.handleSize));
        topRight.push(new Vertex(endPoint.x, startPoint.y - this.handleSize));
        topRight.push(new Vertex(endPoint.x, startPoint.y));

        // right center
        const rightCenter: Vertex[] = [];
        rightCenter.push(new Vertex(endPoint.x, startPoint.y + ((endPoint.y - startPoint.y) / 2) + (this.handleSize / 2)));
        rightCenter.push(new Vertex(endPoint.x + this.handleSize, startPoint.y + ((endPoint.y - startPoint.y) / 2) + (this.handleSize / 2)));
        rightCenter.push(new Vertex(endPoint.x + this.handleSize, startPoint.y + ((endPoint.y - startPoint.y) / 2) - (this.handleSize / 2)));
        rightCenter.push(new Vertex(endPoint.x, startPoint.y + ((endPoint.y - startPoint.y) / 2) - (this.handleSize / 2)));
        rightCenter.push(new Vertex(endPoint.x, startPoint.y + ((endPoint.y - startPoint.y) / 2) + (this.handleSize / 2)));

        // bottom right
        const bottomRight: Vertex[] = [];
        bottomRight.push(new Vertex(endPoint.x, endPoint.y));
        bottomRight.push(new Vertex(endPoint.x, endPoint.y + this.handleSize));
        bottomRight.push(new Vertex(endPoint.x + this.handleSize, endPoint.y + this.handleSize));
        bottomRight.push(new Vertex(endPoint.x + this.handleSize, endPoint.y));
        bottomRight.push(new Vertex(endPoint.x, endPoint.y));

        // bottom center
        const bottomCenter: Vertex[] = [];
        bottomCenter.push(new Vertex(startPoint.x + ((endPoint.x - startPoint.x) / 2) - (this.handleSize / 2), endPoint.y));
        bottomCenter.push(new Vertex(startPoint.x + ((endPoint.x - startPoint.x) / 2) - (this.handleSize / 2), endPoint.y + this.handleSize));
        bottomCenter.push(new Vertex(startPoint.x + ((endPoint.x - startPoint.x) / 2) + (this.handleSize / 2), endPoint.y + this.handleSize));
        bottomCenter.push(new Vertex(startPoint.x + ((endPoint.x - startPoint.x) / 2) + (this.handleSize / 2), endPoint.y));
        bottomCenter.push(new Vertex(startPoint.x + ((endPoint.x - startPoint.x) / 2) - (this.handleSize / 2), endPoint.y));

        // bottom left
        const bottomLeft: Vertex[] = [];
        bottomLeft.push(new Vertex(startPoint.x, endPoint.y));
        bottomLeft.push(new Vertex(startPoint.x - this.handleSize, endPoint.y));
        bottomLeft.push(new Vertex(startPoint.x - this.handleSize, endPoint.y + this.handleSize));
        bottomLeft.push(new Vertex(startPoint.x, endPoint.y + this.handleSize));
        bottomLeft.push(new Vertex(startPoint.x, endPoint.y));

        // left center
        const leftCenter: Vertex[] = [];
        leftCenter.push(new Vertex(startPoint.x, startPoint.y + ((endPoint.y - startPoint.y) / 2) - (this.handleSize / 2)));
        leftCenter.push(new Vertex(startPoint.x - this.handleSize, startPoint.y + ((endPoint.y - startPoint.y) / 2) - (this.handleSize / 2)));
        leftCenter.push(new Vertex(startPoint.x - this.handleSize, startPoint.y + ((endPoint.y - startPoint.y) / 2) + (this.handleSize / 2)));
        leftCenter.push(new Vertex(startPoint.x, startPoint.y + ((endPoint.y - startPoint.y) / 2) + (this.handleSize / 2)));
        leftCenter.push(new Vertex(startPoint.x, startPoint.y + ((endPoint.y - startPoint.y) / 2) - (this.handleSize / 2)));

        // top left
        const topLeft: Vertex[] = [];
        topLeft.push(new Vertex(startPoint.x, startPoint.y));
        topLeft.push(new Vertex(startPoint.x, startPoint.y - this.handleSize));
        topLeft.push(new Vertex(startPoint.x - this.handleSize, startPoint.y - this.handleSize));
        topLeft.push(new Vertex(startPoint.x - this.handleSize, startPoint.y));
        topLeft.push(new Vertex(startPoint.x, startPoint.y));

        return [topCenter, topRight, rightCenter, bottomRight, bottomCenter, bottomLeft, leftCenter, topLeft];
    }

    /**
     * Updates the selection frame. This is called when another user deletes,
     * moves or scales elements which are selected by the local user.
     */
    onExternalUpdate() {
        const sketch = this.sketchService.getSketch();
        const elements: SketchElement[] = Array.from(this.selectedElements);

        if (this.selectedElements.size > 0) {
            for (let i = 0; i < elements.length; i++) {
                if (sketch.getElementById(elements[i].id) === undefined) {
                    this.selectedElements.delete(elements[i]);
                }
            }

            if (this.selectedElements.size > 0) {
                this.unstyleSelectedElements();
                this.styleSelectedElements();
                console.log('Selected elements: ' + this.selectedElements.size);
                const outerVerts: Vertex[] = this.getMaxOutVertices();
                this.frameStart = outerVerts[0];
                this.frameEnd = outerVerts[1];
                this.sketchService.updateSelectionFrame(this.createFrame(outerVerts[0], outerVerts[1]), 0);
                this.sketchService.updateSelectionHandles(this.createHandles(outerVerts[0], outerVerts[1]));
            } else {
                this.deselect();
            }
        }
    }

    /**
     * Returns the vertice which of all selected lines' vertices is the
     * furthest top left and returns the vertice which of all selected lines'
     * vertices it the furthest bottom right.
     */
    getMaxOutVertices(): Vertex[] {
        let vertices: Vertex[] = [];
        const elements: SketchElement[] = Array.from(this.selectedElements);

        for (let i = 0; i < elements.length; i++) {
            if (elements[i] instanceof Line) {
                const outerVerts = this.getOuterVertices(elements[i].getPos(), elements[i].width);
                vertices.push(outerVerts[0]);
                vertices.push(outerVerts[1]);
            } else if (elements[i] instanceof Text) {
                const elem = document.getElementById('element' + elements[i].id);
                const width = elem.getClientRects()[0].width;
                const height = elem.getClientRects()[0].height;
                const offset_fix = elements[i].width * 0.0;

                vertices.push(new Vertex(elements[i].getPos().x, elements[i].getPos().y + height + offset_fix));
                vertices.push(new Vertex(elements[i].getPos().x + width, elements[i].getPos().y + offset_fix));
            } else if (elements[i] instanceof Shape) {
                const elem = document.getElementById('element' + elements[i].id);
                const width = elem.getClientRects()[0].width;
                const height = elem.getClientRects()[0].height;
                const strokeWidth = elements[i]['size'];
                const xFix = strokeWidth / 2; // strokewidth oh shape is not handled correctly for rect so we need ti fix it
                const yFix = strokeWidth / 2; // strokewidth oh shape is not handled correctly for rect so we need ti fix it

                if ((elements[i] as Shape).type === 'rect') {
                    vertices.push(new Vertex(elements[i].getPos().x - xFix, elements[i].getPos().y + height - yFix));
                    vertices.push(new Vertex(elements[i].getPos().x + width - xFix, elements[i].getPos().y - yFix));
                } else {
                    vertices.push(new Vertex(elements[i].getPos().x - (width / 2), elements[i].getPos().y + height - (height / 2)));
                    vertices.push(new Vertex(elements[i].getPos().x + width - (width / 2), elements[i].getPos().y - (height / 2)));
                }
            } else if (elements[i] instanceof Text) {
                const elem = document.getElementById('element' + elements[i].id);
                const width = elem.getClientRects()[0].width;
                const height = elem.getClientRects()[0].height;
                const offset_fix = elements[i].width * 0.0;

                vertices.push(new Vertex(elements[i].getPos().x, elements[i].getPos().y + height + offset_fix));
                vertices.push(new Vertex(elements[i].getPos().x + width, elements[i].getPos().y + offset_fix));
            } else if (elements[i] instanceof Image) {
                const elem = document.getElementById('element' + elements[i].id);
                const width = elem.getClientRects()[0].width;
                const height = elem.getClientRects()[0].height;
                const offset_fix = elements[i].width * 0.0;

                console.log(width)
                console.log(height)
                vertices.push(new Vertex(elements[i].getPos().x, elements[i].getPos().y + height + offset_fix));
                vertices.push(new Vertex(elements[i].getPos().x + width, elements[i].getPos().y + offset_fix));
            }
            }

        // lets filter the most outer vertices of all outer vertices
        vertices = this.getOuterVertices(vertices, this.lineIncrease);

        // we need to inccrease the size of the frame in case we select a single
        // point ore very small line - otherwise the handles will all be
        // on top each other
        const minSize = 4;
        if (Math.abs(vertices[0].x - vertices[1].x) < minSize) {
            vertices[0].x -= minSize;
            vertices[1].x += minSize;
        }
        if (Math.abs(vertices[0].y - vertices[1].y) < minSize) {
            vertices[0].y -= minSize;
            vertices[1].y += minSize;
        }

        return vertices;
    }

    /**
     * Returns the most outer vertices [from a line].
     * Explanation: draw the smallest possible rectangle around the line, then
     * startPoint will be the top left corner and endPoint will be the bottom
     * right corner of the rectangle.
     * Respects width (of line), so that not the actual max coordinates of the
     * vertices are returned but the max coordinates plus line width.
     */
    getOuterVertices(verts: Vertex[], width: number): Vertex[] {
        const startPoint: Vertex = new Vertex(5000, 5000);
        const endPoint: Vertex = new Vertex(-5000, -5000);

        for (let i = 0; i < verts.length; i++) {
            if (verts[i].x < startPoint.x) {
                startPoint.x = verts[i].x - (width / 2);
            }
            if (verts[i].x > endPoint.x) {
                endPoint.x = verts[i].x + (width / 2);
            }
            if (verts[i].y < startPoint.y) {
                startPoint.y = verts[i].y - (width / 2);
            }
            if (verts[i].y > endPoint.y) {
                endPoint.y = verts[i].y + (width / 2);
            }
        }

        return [startPoint, endPoint];
    }

    /**
     * Drops the selected elements
     */
    deselect() {
        this.unstyleSelectedElements();
        this.selectedElements.clear();
        if (this.initialized) {
            this.sketchService.hideSelectionFrame(0);
            this.sketchService.hideSelectionFrame(1);
            this.sketchService.hideSelectionHandles();
        }
        this.frameStart.x = 0;
        this.frameStart.y = 0;
        this.frameEnd.x = 0;
        this.frameEnd.y = 0;
    }

    /**
     * Method sets the state of isCrtlDown
     */
    setCtrlDown(state: boolean) {
        this.isCtrlDown = state;
    }

    /**
     * Method sets the state of isShiftDown
     */
    setShiftDown(state: boolean) {
        this.isShiftDown = state;
    }

    /**
     * Sets the cursor depending on input mode
     */
    setCursor() {
        const sketchArea = document.getElementById('canvas');

        if (this.isCtrlDown && !this.isShiftDown) {
            sketchArea.style.cursor = 'copy';
        } else if (!this.isCtrlDown && this.isShiftDown) {
            sketchArea.style.cursor = 'move';
        } else {
            sketchArea.style.cursor = 'default';
        }
    }

    /**
     * Deletes the selected elements
     */
    delete() {
        const elements: SketchElement[] = Array.from(this.selectedElements);
        this.sketchService.deleteElements(elements);
        this.deselect();
    }

    /**
     * Copies the selected elements into the copy registers
     */
    copy() {
        // Methods gets invoked when 'c' is pushed.
        if (this.isCtrlDown) {
            // Are there selected elements at all? If not, we don't want to alter
            // the existing copy registers
            if (this.selectedElements.size === 0) {
                return;
            }

            // store the position at which the frame was
            this.copyOriginPos = { x: this.frameStart.x, y: this.frameStart.y };

            // Add references of selected lines to copy register, but delete old
            // copy register prior to that.
            this.sketchService.copyRegister.clear();
            const elements: SketchElement[] = Array.from(this.selectedElements);
            for (let i = 0; i < elements.length; i++) {
                this.sketchService.copyRegister.add(elements[i]);
            }
        }
    }

    /**
     * Pastes the selected elements from the copy registers
     */
    paste() {
        // Methods gets invoked when 'v' is pushed.
        if (this.isCtrlDown) {

            // Are there elements in the copy registers at all?
            if (this.sketchService.copyRegister.size === 0) {
                return;
            }

            // We want the new elements to appear at current mouse position
            const xOffset = this.currentMousePos.x - this.copyOriginPos.x;
            const yOffset = this.currentMousePos.y - this.copyOriginPos.y;

            const elements: SketchElement[] = Array.from(this.sketchService.copyRegister);
            const newElements: SketchElement[] = [];

            for (let i = 0; i < elements.length; i++) {
                const elem: SketchElement = elements[i].clone();
                elem.move(xOffset, yOffset);
                elem.floorWidth();
                newElements.push(elem);
            }

            this.sketchService.copyElements(newElements);
        }
    }

    /**
     * Called from server/socket when elements where copied. Gets the ids of the
     * new copied elements and makes the elements with given ids the current
     * selection.
     */
    onCopiedElements(ids: any[]) {
        this.deselect();
        const sketch = this.sketchService.getSketch();

        for (let i = 0; i < ids.length; i++) {
            this.selectedElements.add(sketch.getElementById(ids[i]));
        }

        this.styleSelectedElements();
        console.log('Selected elements: ' + this.selectedElements.size);
        const outerVerts: Vertex[] = this.getMaxOutVertices();
        this.frameStart = outerVerts[0];
        this.frameEnd = outerVerts[1];
        this.sketchService.updateSelectionFrame(this.createFrame(outerVerts[0], outerVerts[1]), 0);
        this.sketchService.updateSelectionHandles(this.createHandles(outerVerts[0], outerVerts[1]));
    }

    /**
     * Moves all selected elements.
     */
    move(xOffset: number, yOffset: number, submit: boolean) {
        this.frameStart.x += xOffset;
        this.frameStart.y += yOffset;
        this.frameEnd.x += xOffset;
        this.frameEnd.y += yOffset;

        this.sketchService.updateSelectionFrame(this.createFrame(this.frameStart, this.frameEnd), 0);
        this.sketchService.updateSelectionHandles(this.createHandles(this.frameStart, this.frameEnd));

        const elements: SketchElement[] = Array.from(this.selectedElements);
        for (let i = 0; i < elements.length; i++) {
            elements[i].move(xOffset, yOffset);
            this.sketchService.reRenderElement(elements[i]);
        }

        if (submit) {
            for (let i = 0; i < elements.length; i++) {
                elements[i].floorWidth();
            }
            this.sketchService.moveElements(elements);
        }
    }

    scale(mouse: any, submit: boolean) {
        let xOffset;
        let yOffset;
        let xFactor;
        let yFactor;
        const elements: SketchElement[] = Array.from(this.selectedElements);

        switch (this.activeHandle) {
            case 0:
                yOffset = mouse.y - this.frameStart.y;
                yFactor = 1 - yOffset / (this.frameEnd.y - this.frameStart.y);

                if (mouse.y <= this.frameEnd.y - this.minimumSize) {
                    for (let i = 0; i < elements.length; i++) {
                        elements[i].scale(1, yFactor, this.frameEnd);
                        this.sketchService.reRenderElement(elements[i]);
                    }

                    this.frameStart.y += yOffset;
                }
                break;
            case 1:
                xOffset = mouse.x - this.frameEnd.x;
                xFactor = xOffset / (this.frameEnd.x - this.frameStart.x) + 1;
                yOffset = mouse.y - this.frameStart.y;
                yFactor = 1 - yOffset / (this.frameEnd.y - this.frameStart.y);

                if (mouse.y <= this.frameEnd.y - this.minimumSize
                    && mouse.x >= this.frameStart.x + this.minimumSize) {
                    for (let i = 0; i < elements.length; i++) {
                        elements[i].scale(xFactor, yFactor, { x: this.frameStart.x, y: this.frameEnd.y });
                        this.sketchService.reRenderElement(elements[i]);
                    }

                    this.frameEnd.x += xOffset;
                    this.frameStart.y += yOffset;
                }
                break;
            case 2:
                xOffset = mouse.x - this.frameEnd.x;
                xFactor = xOffset / (this.frameEnd.x - this.frameStart.x) + 1;

                if (mouse.x >= this.frameStart.x + this.minimumSize) {
                    for (let i = 0; i < elements.length; i++) {
                        elements[i].scale(xFactor, 1, this.frameStart);
                        this.sketchService.reRenderElement(elements[i]);
                    }

                    this.frameEnd.x += xOffset;
                }
                break;
            case 3:
                xOffset = mouse.x - this.frameEnd.x;
                xFactor = xOffset / (this.frameEnd.x - this.frameStart.x) + 1;
                yOffset = mouse.y - this.frameEnd.y;
                yFactor = yOffset / (this.frameEnd.y - this.frameStart.y) + 1;

                if (mouse.x >= this.frameStart.x + this.minimumSize
                    && mouse.y >= this.frameStart.y + this.minimumSize) {
                    for (let i = 0; i < elements.length; i++) {
                        elements[i].scale(xFactor, yFactor, { x: this.frameStart.x, y: this.frameStart.y });
                        this.sketchService.reRenderElement(elements[i]);
                    }

                    this.frameEnd.x += xOffset;
                    this.frameEnd.y += yOffset;
                }
                break;
            case 4:
                yOffset = mouse.y - this.frameEnd.y;
                yFactor = yOffset / (this.frameEnd.y - this.frameStart.y) + 1;

                if (mouse.y >= this.frameStart.y + this.minimumSize) {
                    for (let i = 0; i < elements.length; i++) {
                        elements[i].scale(1, yFactor, this.frameStart);
                        this.sketchService.reRenderElement(elements[i]);
                    }

                    this.frameEnd.y += yOffset;
                }
                break;
            case 5:
                xOffset = mouse.x - this.frameStart.x;
                xFactor = 1 - xOffset / (this.frameEnd.x - this.frameStart.x);
                yOffset = mouse.y - this.frameEnd.y;
                yFactor = yOffset / (this.frameEnd.y - this.frameStart.y) + 1;

                if (mouse.x <= this.frameEnd.x - this.minimumSize
                    && mouse.y >= this.frameStart.y + this.minimumSize) {
                    for (let i = 0; i < elements.length; i++) {
                        elements[i].scale(xFactor, yFactor, { x: this.frameEnd.x, y: this.frameStart.y });
                        this.sketchService.reRenderElement(elements[i]);
                    }

                    this.frameStart.x += xOffset;
                    this.frameEnd.y += yOffset;
                }
                break;
            case 6:
                xOffset = mouse.x - this.frameStart.x;
                xFactor = 1 - xOffset / (this.frameEnd.x - this.frameStart.x);

                if (mouse.x <= this.frameEnd.x - this.minimumSize) {
                    for (let i = 0; i < elements.length; i++) {
                        elements[i].scale(xFactor, 1, this.frameEnd);
                        this.sketchService.reRenderElement(elements[i]);
                    }

                    this.frameStart.x += xOffset;
                }
                break;
            case 7:
                xOffset = mouse.x - this.frameStart.x;
                xFactor = 1 - xOffset / (this.frameEnd.x - this.frameStart.x);
                yOffset = mouse.y - this.frameStart.y;
                yFactor = 1 - yOffset / (this.frameEnd.y - this.frameStart.y);

                if (mouse.x <= this.frameEnd.x - this.minimumSize
                    && mouse.y <= this.frameEnd.y - this.minimumSize) {
                    for (let i = 0; i < elements.length; i++) {
                        elements[i].scale(xFactor, yFactor, { x: this.frameEnd.x, y: this.frameEnd.y });
                        this.sketchService.reRenderElement(elements[i]);
                    }

                    this.frameStart.x += xOffset;
                    this.frameStart.y += yOffset;
                }
                break;
            default:
                break;
        }

        // sync with server
        if (submit) {
            for (let i = 0; i < elements.length; i++) {
                elements[i].floorWidth();
            }
            const outerVerts: Vertex[] = this.getMaxOutVertices();
            this.frameStart = outerVerts[0];
            this.frameEnd = outerVerts[1];
            this.sketchService.scaleElements(elements);
        }

        // redraw the selection frame
        this.sketchService.updateSelectionFrame(this.createFrame(this.frameStart, this.frameEnd), 0);
        this.sketchService.updateSelectionHandles(this.createHandles(this.frameStart, this.frameEnd));
    }

    /**
     * Checks if a given element is selected (via it's id)
     */
    public selectionContains(id: number) {
        const elements = Array.from(this.selectedElements);
        for (let i = 0; i < elements.length; i++) {
            if (elements[i].id === id) {
                return true;
            }
        }
        return false;
    }

    public removeItem(id: number) {
        const elements = Array.from(this.selectedElements);
        for (let i = 0; i < elements.length; i++) {
            if (elements[i].id === id) {
                this.selectedElements.delete(elements[i]);
            }
        }
    }

    public addItem(id: number) {
        const sketch = this.sketchService.getSketch();
        this.selectedElements.add(sketch.getElementById(id));
        this.onExternalUpdate();
    }
}
