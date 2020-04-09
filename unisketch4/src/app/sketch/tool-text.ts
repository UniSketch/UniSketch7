import { SketchService } from '../services/sketch.service';
import { Text } from '../models/text.model';

import { SketchTool } from './tool';
import { SketchElementType } from '../helpers/SketchElementType';


export class ToolText extends SketchTool {

    private activeText: Text;

    private activeSvgTextElement: SVGElement;

    private isConfirmed = true;

    private color = '#000000ff';

    private opacity = 'ff';

    private xPos = 0;

    private yPos = 0;

    private font = 'Arial';

    private size = 16;

    private textarea: HTMLInputElement;

    private initialized = false;

    private isModKeyDown = false;

    public isEditing = false;

    /**
     *
     */
    constructor(protected sketchService: SketchService) {
        super(sketchService);

        this.subscription.add(this.sketchService.onConfirmElement.subscribe((data) => {
            if (data['element_id'] && data['type'] && data['type'] === SketchElementType.Text) {
                this.activeText.id = data['element_id'];

                this.activeSvgTextElement.parentNode.removeChild(this.activeSvgTextElement);
                this.activeSvgTextElement = this.sketchService.renderElement(this.activeText);

                if (this.isEditing) {
                    this.activeSvgTextElement.style.visibility = 'hidden';
                }
                this.sketchService.getSketch().sketchElements.push(this.activeText);
                this.isConfirmed = true;
            }
        }));
    }

    /**
     * Called when the user clicks into the canvas.
     */
    startStroke(mousePos: any): void {
        this.xPos = mousePos.x;
        this.yPos = mousePos.y;

        this.initTextArea();

        if (!this.isConfirmed) {
            console.log('previous text not yet confirmed');
            return;
        }

        if (this.isEditing) {
            this.endInput(true);
            this.isEditing = false;
        } else {
            const existingText = this.findText(mousePos);
            if (existingText) {
                this.beginEdit(existingText);
            } else {
                this.beginInput();
            }
            this.isEditing = true;
        }
    }

    findText(position: any): any {
        const allElements = this.sketchService.getSketch()
            .getAllElements();
        for (let i = 0; i < allElements.length; i++) {
            if (!(allElements[i] instanceof Text)) {
                continue;
            }

            if (allElements[i].isWithinRadius(0, position)) {
                return allElements[i];
            }
        }
    }

    initTextArea() {
        this.textarea = document.getElementById('textarea') as HTMLInputElement;
        const self = this;
        this.textarea.addEventListener('input', function () {
            self.adjustAreaSize();
            self.continueInput();
        });

        this.textarea.style.overflow = 'hidden';
        this.textarea.style.border = 'solid';
        this.textarea.style.borderWidth = '1px';
        this.textarea.style.borderColor = this.sketchService.toolSelector.lineColor;
        this.textarea.style.backgroundColor = this.sketchService.toolSelector.fillColor;
        this.textarea.style.padding = '0';
        this.textarea.style.margin = '0';
        this.textarea.style.lineHeight = '1em';
        this.textarea.style.paddingTop = '0.13em';
        this.textarea.style.paddingLeft = '2px';
        this.textarea.placeholder = 'Insert text...';
        this.initialized = true;
    }

    showTextArea(text: Text) {
        this.textarea.style.fontSize = text.width + 'px';
        this.textarea.style.fontFamily = text.type;
        this.textarea.style.color = text.color;
        this.textarea.style.whiteSpace = 'pre';
        this.textarea.value = text.content;
        this.textarea.style.display = 'initial';
        this.textarea.style.left = (text.pos_x - 3) + 'px';
        this.textarea.style.top = text.pos_y + 'px';
        // this.textarea.setAttribute('autofocus');
        setTimeout(function () {
            this.textarea.focus();
        }, 0);
    }

    hideTextArea() {
        if (this.textarea) {
            this.textarea.style.display = 'none';
            this.textarea.value = '';
        }
    }

    beginInput() {
        this.activeText = new Text();
        this.activeText.color = this.color;
        this.activeText.content = this.textarea.value;
        this.activeText.pos_x = this.xPos;
        this.activeText.pos_y = this.yPos;
        this.activeText.width = this.size;
        this.activeText.type = this.font;
        this.activeText.created_at = new Date();
        this.activeText.updated_at = new Date();

        this.showTextArea(this.activeText);
        this.adjustAreaSize();

        this.activeSvgTextElement = this.sketchService.renderElement(this.activeText);
        this.activeSvgTextElement.style.visibility = 'hidden';
        this.sketchService.startText(this.activeText);
    }

    continueInput() {
        this.activeText.content = this.textarea.value;
        this.adjustAreaSize();
        if (this.isConfirmed) {
            this.sketchService.editText(this.activeText, false);
        }
    }

    endInput(force: boolean) {
        // This is called when
        // - hitting enter in text mode (force is false then: this way hitting
        //   enter without shift or control will make line break in text)
        // - hitting escape (force is true then)
        // - left mouse click in canvas (force is true then)
        if (force || this.isModKeyDown) {
            if (this.isConfirmed) {
                this.updateSketch();
                this.sketchService.editText(this.activeText, true);
            }
            this.hideTextArea();
            this.reRender();
            this.isEditing = false;
        }
    }

    beginEdit(existingText: Text) {
        this.sketchService.hideElements([existingText]);
        this.showTextArea(existingText);
        this.adjustAreaSize();
        this.activeText = existingText;
    }

    /**
     * Rerenders the svg text element and updates the text model in the sketch's
     * sketchElements.
     */
    reRender() {
        if (this.activeText.id) {
            this.sketchService.reRenderElement(this.activeText);
        } else {
            this.activeSvgTextElement.parentNode.removeChild(this.activeSvgTextElement);
            this.activeSvgTextElement = this.sketchService.renderElement(this.activeText);
        }

    }

    updateSketch() {
        const sketch = this.sketchService.getSketch();
        const index = sketch.sketchElements.indexOf(sketch.getElementById(this.activeText.id));
        sketch.sketchElements.splice(index, 1, this.activeText);
    }

    setModKey(status: boolean) {
        this.isModKeyDown = status;
    }

    adjustAreaSize() {
        this.textarea.style.height = '0px';
        this.textarea.style.height = (this.textarea.scrollHeight + 5) + 'px';
        if (!this.textarea.value) {
            this.textarea.style.width = '6em';
        } else {
            this.textarea.style.width = '0px';
            this.textarea.style.width = (this.textarea.scrollWidth + 5) + 'px';
        }
    }

    setColor(color: string) {
        this.color = color + this.opacity;
        if (this.isEditing) {
            this.activeText.color = this.color;
            if (this.initialized) {
                this.textarea.style.color = this.color;
            }
            this.sketchService.editText(this.activeText, true);
        }
    }

    setSize(size: number) {
        this.size = size;

        if (this.isEditing) {
            this.activeText.width = size;
            if (this.initialized) {
                this.textarea.style.fontSize = size + 'px';
                this.adjustAreaSize();
            }
            this.sketchService.editText(this.activeText, true);
        }
    }

    setOpacity(level: string) {
        this.opacity = level;
        this.color = this.color.substring(0, 7) + this.opacity;
        if (this.isEditing) {
            this.activeText.color = this.activeText.color.substring(0, 7) + this.opacity;
            if (this.initialized) {
                this.textarea.style.color = this.activeText.color;
            }
            this.sketchService.editText(this.activeText, true);
        }
    }

    setFont(font: string) {
        this.font = font;

        if (this.isEditing) {
            this.activeText.type = font;
            if (this.initialized) {
                this.textarea.style.fontFamily = font;
                this.adjustAreaSize();
            }
            this.sketchService.editText(this.activeText, true);
        }
    }

    /**
     * Sets the id of the active text. Called via canvas directive when server
     * sends Id.
     */
    setIdOfActiveText(id: number) {
        this.activeText.id = id;
    }

    /**
     * Call this when selecting different tool or leaving sketch.
     */
    deactivateTextTool() {
        if (this.isEditing) {
            this.endInput(true);
        }
        if (!this.initialized) {
            this.initTextArea();
        }
        this.hideTextArea();
    }

    onExternalUpdate(ids: number[]) {
        if (this.isEditing) {
            for (let i = 0; i < ids.length; i++) {
                if (this.activeText.id === ids[i]) {
                    this.sketchService.hideElements([this.activeText]);
                    this.showTextArea(this.activeText);
                    this.adjustAreaSize();
                }
            }
        }
    }

    onDeletetText(ids: number[]) {
        for (let i = 0; i < ids.length; i++) {
            if (this.activeText.id === ids[i]) {
                this.hideTextArea();
                this.isEditing = false;
                break;
            }
        }
    }
}
