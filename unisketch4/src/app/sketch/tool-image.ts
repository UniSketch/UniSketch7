import {SketchService} from '../services/sketch.service';
import {SketchTool} from './tool';
import {SketchElementType} from '../helpers/SketchElementType';
import {Image} from '../models/image.model';

/**
 * Tool class for the image.
 */
export class ToolImage extends SketchTool {
    private image: Image;
    private color = '#000000ff'; // unused, every sketch-element needs a color-value

    constructor(sketchService: SketchService) {
        super(sketchService);
        this.subscription.add(this.sketchService.onConfirmElement.subscribe((data) => {
            console.log(data);
            if (data['element_id'] && data['type'] && data['type'] === SketchElementType.Image) {
                console.log(data);
                this.image.id = data['element_id'];
                this.sketchService.getSketch().sketchElements.push(this.image);
                this.sketchService.redrawSketch();

                if (this.sketchService.gridVisible){ //dirty fix 
                    this.sketchService.toggleGrid();
                    this.sketchService.toggleGrid();
                }
            }
        }));
    }

    startStroke(mousePos: any) {
        console.log('image paste')
        this.createImage(mousePos);
        this.sketchService.sendImage(this.image);

        
    }

    createImage(mousePos: any) {
        this.image = new Image();
        this.image.pos_x = mousePos.x;
        this.image.pos_y = mousePos.y + 1; // +1 to fit img draw point
        this.image.color = this.color;
        this.image.src = this.sketchService.imageSrc;
        this.image.width = this.sketchService.imageWidth;
    }

    enterCanvas(mousePos: any): void {
        this.disableCursor();
        this.enableImagePreviewDiv();
    }
    exitCanvas() {
        this.disableImagePreviewDiv();
        this.resetCursor();
    }

    resetCursor() {
        const sketchArea = document.getElementById('canvas');
        sketchArea.style.cursor = 'default';
    }

    enableImagePreviewDiv() {
        const imagePrevDiv = document.getElementById('imagePreviewDiv');
        imagePrevDiv.style.display = '';
    }

    disableCursor() {
        const sketchArea = document.getElementById('canvas');
        sketchArea.style.cursor = 'none';
    }

    disableImagePreviewDiv() {
        const imagePrevDiv = document.getElementById('imagePreviewDiv');
        imagePrevDiv.style.display = 'none';
    }

    deselect() {
        this.disableImagePreviewDiv();
        this.resetCursor();
    }
}
