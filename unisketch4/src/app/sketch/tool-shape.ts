import {SketchService} from '../services/sketch.service';

import {SketchTool} from './tool';
import {SketchElementType} from '../helpers/SketchElementType';
import {Shape, ShapeType} from "../models/shape.model";
import {Vertex} from "../models/vertex.model";


export class ToolShape extends SketchTool {

    private activeShape: Shape;

    private activeSvgElement: SVGElement;

    private isConfirmed = true;

    private color = '#000000ff';
    private fill = '#000000ff';

    private startPos: Vertex;
    private endPos: Vertex;

    private type = ShapeType.Rectangle;

    private width = 10;

    private height = 10;

    private size = 1;

    private isModKeyDown = false;

    /**
     *
     */
    constructor(protected sketchService: SketchService) {
        super(sketchService);

        this.subscription.add(this.sketchService.onConfirmElement.subscribe((data) => {
            if (data['element_id'] && data['type'] && data['type'] === SketchElementType.Shape) {
                this.activeShape.id = data['element_id'];
                this.activeSvgElement.parentNode.removeChild(this.activeSvgElement);
                this.activeSvgElement = this.sketchService.renderElement(this.activeShape);
                this.sketchService.getSketch()
                    .sketchElements
                    .push(this.activeShape);
                this.isConfirmed = true;

                this.endPos = null;
            }
        }));
    }

    /**
     * Called when the user clicks into the canvas.
     * If a shape exists, Edit-Mode is entered
     */
    startStroke(mousePos: any): void {
        this.startPos = new Vertex(mousePos.x, mousePos.y);

        if (!this.isConfirmed) {
            console.log('not confirmed');
            return;
        }

        this.newShape();
    }


    continueStroke(mousePos: any, prevMousePos: any): void {
        this.endPos = new Vertex(mousePos.x, mousePos.y);
        this.activeShape.width = this.getWidthFromDifference();
        this.activeShape.height = this.getHeightFromDifference();
        this.activeShape.mirrored_x = (mousePos.x < this.startPos.x);
        this.activeShape.mirrored_y = (mousePos.y < this.startPos.y);

        this.updateShape();
    }

    stopStroke(): void {
        this.sketchService.sendShape(this.activeShape);
    }

    findShape(position: any): any {
        const allElements = this.sketchService.getSketch()
                                .getAllElements();
        for (let i = 0; i < allElements.length; i++) {
            if (!(allElements[i] instanceof Shape)) {
                continue;
            }

            if (allElements[i].isWithinRadius(0, position)) {
                return allElements[i];
            }
        }
    }

    newShape() {
        this.activeShape = new Shape();
        this.activeShape.color = this.color;
        this.activeShape.fill = this.fill;
        this.activeShape.pos_x = this.startPos.x;
        this.activeShape.pos_y = this.startPos.y;
        this.activeShape.width = 1;
        this.activeShape.height = 1;
        this.activeShape.size = this.size;
        this.activeShape.type = this.type;
        this.activeShape.mirrored_x = false;
        this.activeShape.mirrored_y = false;

        this.activeSvgElement = this.sketchService.renderElement(this.activeShape);
    }

    endInput(force: boolean) {
        // This is called when
        // - hitting enter in text mode (force is false then: this way hitting
        //   enter without shift or control will make line break in text)
        // - hitting escape (false is true then)
        // - left mouse click in canvas (false is true then)
        if (force || this.isModKeyDown) {
            if (this.isConfirmed) {
                // this.sketchService.editElements([this.activeShape], true);
            }
        }
    }

    /**
     * Rerenders the svg shape element
     */
    updateShape() {
        this.activeSvgElement.parentNode.removeChild(this.activeSvgElement);
        this.activeSvgElement = this.sketchService.renderElement(this.activeShape);
    }

    setModKey(status: boolean) {
        this.isModKeyDown = status;
    }

    setColor(color: string) {
        this.color = color;
    }

    setFill(color: string) {
        this.fill = color;
    }

    setSize(size: number) {
        this.size = size;
    }

    setType(type: ShapeType) {
        this.type = type;
    }

    setWidth(width: number) {
        this.width = width;
    }

    setHeight(height: number) {
        this.height = height;
    }

    setCursor() {
        const sketchArea = document.getElementById('canvas');
        sketchArea.style.cursor = 'crosshair';
    }

    /**
     * Call this when selecting different tool or leaving sketch.
     */
    deactivateShapeTool() {
    }

    private getWidthFromDifference(): number {
        if (!this.endPos || this.endPos === null) {
            return 0;
        }
        return Math.abs(this.startPos.x - this.endPos.x);
    }

    private getHeightFromDifference(): number {
        if (!this.endPos || this.endPos === null) {
            return 0;
        }
        return Math.abs(this.startPos.y - this.endPos.y);
    }
}
