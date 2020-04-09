import {Component, ElementRef, HostListener, OnDestroy, OnInit, Renderer2, ViewChild} from '@angular/core';
import {Router} from '@angular/router';
import {SketchService} from '../services/sketch.service';
import {Sketch} from '../models/sketch.model';
import {DashboardService} from '../services/dashboard.service';
import {Image as ImageType} from '../models/image.model';
import {AuthenticationService} from "../services/authentication.service";
import {ShapeType} from "../models/shape.model";
import {DownloadType} from "../models/download_types.model";
import { resolve } from 'url';

/**
 * Toolbar component for the sketching view. Provides functionality for all the toolbar buttons.
 */
@Component({
    selector: 'app-sketch-toolbar',
    templateUrl: './sketch-toolbar.component.html',
    styleUrls: ['./sketch-toolbar.component.scss'],
    providers: [DashboardService]
})

export class SketchToolbarComponent implements OnInit, OnDestroy {

    /**
     * Reference to the download button in the html template.
     */
    @ViewChild('downloadButton')
    private downloadButtonRef: ElementRef;

    /**
     * Reference to the preview canvas in the html template.
     */
    @ViewChild('previewCanvas')
    private previewCanvasRef: ElementRef;

    /**
     * Reference to the brush settings menu.
     * Used for detecting a click outside in order to close this menu.
     */
    @ViewChild('brushMenu')
    private brushMenuRef: ElementRef;

    /**
     * Reference to the background menu.
     * Used for detecting a click outside in order to close this menu.
     */
    @ViewChild('backgroundMenu')
    private backgroundMenuRef: ElementRef;

    /**
     * Reference to the text menu.
     * Used for detecting a click outside in order to close this menu.
     */
    @ViewChild('textMenu')
    private textMenuRef: ElementRef;

    /**
     * Reference to the preview canvas in the html template.
     */
    @ViewChild('title')
    private titleRef: ElementRef;

    /**
     * Reference to the chat overlay.
     */
    @ViewChild('chat')
    private chatRef: ElementRef;

    /**
     * Reference to the brush size input.
     */
    @ViewChild('brushsize')
    private brushSizeRef: ElementRef;

    /**
     * Reference to the opacity input.
     */
    @ViewChild('opacity')
    private opacityRef: ElementRef;

    /**
     * The colors available via the background, brush, text color button.
     */
    private colorPalette = ['#ffffff', '#cccccc', '#999999', '#666666',
        '#333333', '#000000', '#9f541d', '#ff0045', '#ff9a16', '#ffda16',
        '#ecff16', '#adff16', '#3aec14', '#06ffcc', '#07dcf9', '#00b2ff',
        '#0047ff', '#7f00ff', '#d400ff', '#ff63e2'];

    /**
     * The font families for the text menu selection.
     */
    private fontFamilies = ['Arial', 'Segoe UI', 'Roboto', 'Helvetica', 'Sans-Serif'];

    private shapeTypes = [ShapeType.Circle, ShapeType.Ellipse, ShapeType.Rectangle, ShapeType.Triangle];

    private shapeNames = ['Circle', 'Ellipse', 'Rectangle', 'Triangle'];



    /**
     * Saves the current brush color, additionally to the service
     */
    private currentBrushColor = '#000000';

    /**
     * Saves current brush style
     */
    private currentBrushStyleIcons = 'assets/img/icons/brush.svg'

    /**
     * Saves the currentBrushStyle
     */
    private currentBrushStyle = '';

    /**
     * Saves the current background color, additionally to the service
     */
    private currentBackgroundColor = '#FFFFFF';

    /**
     * Saves the current text color, additionally to the service
     */
    private currentTextColor = '#000000';

    /**
     * Saves the current border color for shapes, additionally to the service
     */
    private currentShapeColor = '#000000';

    /**
     * Saves the current fill color for shapes, additionally to the service
     */
    private currentShapeFill = '#000000';

    /**
     * Saves the current fill color for shapes, additionally to the service
     */
    private currentShapeFillColor = '#000000FF';

    /**
     * Saves the current line brush size, additionally to the service
     */
    private currentBrushLineSize = 1;

    /**
     * Saves the current brush transparency, additionally to the service
     */
    private currentBrushOpacity = 100;

    /**
     * Saves the current text size, additionally to the service
     */
    private currentTextSize = 10;

    /**
     * Saves the current font family, additionally to the service.
     */
    private currentFontFamily = 'Arial';

    /**
     * Saves the current text input, additionally to the service.
     */
    private currentTextInput = '';

    private currentShapeType = ShapeType.Rectangle;
    private currentShapeWidth = 10;
    private currentShapeHeight = 10;
    private currentShapeSize = 1;
    private currentShapeOpacity = 100;

    /**
     * Saves the current text opacity, additionally to the service.
     */
    private currentTextOpacity = 100;

    /**
     * Determines the current DownloadFormat
     */
    private currentDownloadType = DownloadType.SVG;
    private downloadTypes = [DownloadType.SVG, DownloadType.PNG, DownloadType.PDF];
    private isDownloadOptionsVisible = false;

    /* #################### START VISIBILITY: brush #################### */
    /**
     * Determines the state of the brush settings menu.
     */
    private isBrushSettingsVisible = false;

    /**
     * Determines the state of the color settings menu.
     */
    private isColorSettingsVisible = false;

    /**
     * Determines the state of the brush size modal.
     */
    private isBrushSizeModalVisible = false;

    /**
     * Determines the state of the brush style modal.
     */
    private isBrushStyleModalVisible = false;

    /**
     * Determines the state of the picture upload modal.
     */
    private isPictureModalVisible = false;

    /**
     * Determines the state of the brush opacity modal.
     */
    private isBrushOpacityModalVisible = false;

    /* #################### END VISIBILITY: brush #################### */

    /* #################### START VISIBILITY: background #################### */
    /**
     * Determines the state of the background settings menu.
     */
    private isBackgroundSettingsVisible = false;

    /**
     * Determines the state of the background color settings menu.
     */
    private isBackgroundColorSettingsVisible = false;

    /* #################### END VISIBILITY: background #################### */

    /* #################### START VISIBILITY: text #################### */
    /**
     * Determines the states of the text settings menu.
     */
    private isTextSettingsVisible = false;

    /**
     * Determines the state of the background color settings menu.
     */
    private isTextColorSettingsVisible = false;

    /**
     * Determines the states of the text settings menu.
     */
    private isTextSizeModalVisible = false;

    /**
     * Determines the states of the text settings menu.
     */
    private isTextInputModalVisible = false;

    /**
     * Determines the states of the text settings menu.
     */
    private isTextOpacityModalVisible = false;

    /**
     * Determines the states of the text settings menu.
     */
    private isTextFontModalVisible = false;

    /* #################### END VISIBILITY: text #################### */

    private isShapeSettingsVisible = false;
    private isShapeColorSettingsVisible = false;
    private isShapeTypeModalVisible = false;
    private isShapeWidthModalVisible = false;
    private isShapeHeightModalVisible = false;
    private isShapeSizeModalVisible = false;
    private isShapeOpacityModalVisible = false;

    /**
     * The current title of the sketch.
     * TODO: cleanup potential, updateTitle could receive a string
     * parameter and make both sketchTitle and oldSketchTitle obsolete
     * by directly working on the sketch object
     */
    private sketchTitle = '';

    /**
     * The title of the sketch before any changes were applied.
     */
    private oldSketchTitle = '';

    /**
     * The current sketch object.
     */
    private sketch: Sketch = new Sketch();

    /**
     * Pattern of characters that are not allowed in a file name, used to create safe image export file names.
     */
    private illegalFilePattern = /[|&;$%@"<>()+,]/g;

    /**
     * Determines whether the title input field is active or not.
     */
    private isTitleInputActive = false;

    /**
     * Determines the current zoom level (1 is minimum)
     */
    public zoomLevel = 1;

    /**
     * Determines the maximum allowed zoom level.
     * Note: Zooming scales the canvas element up and it becomes harder
     * to handle due to immense pixel sizes; so limit it.
     */
    private maxZoomLevel = 7;

    private minZoomLevel = 1;

    /**
     * For number input, saves mouse x pos when drag is started.
     */
    private mousePosXOnDragStart = 0;

    /**
     * For number input, saves the value that input had when drag started.
     */
    private startDragToolValue = 0;

    /**
     * Determines the hand button active state
     */
    private isDragScrollActive = false;

    /**
     * Determines if the chat is open or closed
     */
    private isChatVisible = false;

    /**
     * Determines if the brush size is being changed with drag
     */
    private changeBrushSize = false;

    /**
     * Determines if the opacity is being changed with drag
     */
    private changeOpacity = false;



    constructor(private sketchService: SketchService, private router: Router, private dashboardService: DashboardService, private authService: AuthenticationService, private renderer: Renderer2) {
    }


    ngOnInit() {
        // Store the sketch metadata once its sent
        this.sketchService.onFullSketch.subscribe(data => {
            this.sketch = this.sketchService.getSketch();
            this.oldSketchTitle = this.sketchTitle = this.sketch.title;
        });

        this.sketchService.isDragScrollActive.subscribe(value => {
            this.isDragScrollActive = value;
        });
    }

    ngOnDestroy() {
        // Update the sketch preview before destroying the component.
        this.convertImagesToBase64().then(() => {
            this.updateSketchPreview();
        });
    }

    /*
    @HostListener('mousedown', ['$event'])
    mousedown(event) {
        if (event.target === this.brushSizeRef.nativeElement) {
            this.mousePosXOnDragStart = event.clientX;
            this.changeBrushSize = true;
            this.startDragToolValue = this.currentBrushLineSize;
        } else if (event.target === this.opacityRef.nativeElement) {
            this.mousePosXOnDragStart = event.clientX;
            this.changeOpacity = true;
            this.startDragToolValue = this.currentBrushOpacity;
        }
    }
    */

    @HostListener('window:mousemove', ['$event'])
    @HostListener('mousemove', ['$event'])
    mousemove(event) {
        if (this.changeBrushSize) {
            let diff = event.clientX - this.mousePosXOnDragStart;
            diff = Math.floor(diff / 2);
            diff = this.startDragToolValue + diff;
            diff = diff > 50 ? 50 : diff;
            diff = diff < 0 ? 0 : diff;
            this.currentBrushLineSize = diff;
            this.sketchService.setBrushSize(diff)
        } else if (this.changeOpacity) {
            let diff = (event.clientX - this.mousePosXOnDragStart) * 2;
            diff = this.startDragToolValue + diff;
            diff = diff > 255 ? 255 : diff;
            diff = diff < 0 ? 0 : diff;
            this.currentBrushOpacity = diff;
            this.sketchService.setBrushTransparency(diff);
        }
    }

    @HostListener('mouseup', ['$event'])
    mouseup(event) {
        this.changeOpacity = false;
        this.changeBrushSize = false;
    }

    @HostListener('document:click', ['$event'])
    closeMenuOnClickOutside(event: KeyboardEvent) {
        if (this.isBrushSettingsVisible) {
            if (!this.brushMenuRef.nativeElement.contains(event.target)) {
                this.toggleBrushSettings();
            }
        }

        if (this.isBackgroundSettingsVisible) {
            if (!this.backgroundMenuRef.nativeElement.contains(event.target)) {
                this.toggleBackgroundSettings();
            }
        }

        if (this.isTextSettingsVisible) {
            if (!this.textMenuRef.nativeElement.contains(event.target)) {
                this.toggleTextSettings();
            }
        }

        if (this.isChatVisible) {
            if (!this.chatRef.nativeElement.contains(event.target)) {
                this.toggleChat();
            }
        }
    }


    @HostListener('document:keypress', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        if (this.isTitleInputActive) {
            if (event.key === 'Enter') {
                event.preventDefault();
                this.titleRef.nativeElement.blur();
                this.handleTitleBlur(this.titleRef.nativeElement.innerText);
            }

            // Keyboard shortcuts
        } else if (!this.isChatVisible
            && !this.isTextInputModalVisible
            && !(this.sketchService.currentTool === this.sketchService.toolText)
            && !this.sketchService.toolText.isEditing) {
            switch (event.key) {
                case 'b':
                    this.selectBrush();
                    break;
                case 'e':
                    this.selectEraser();
                    break;
                case 'h':
                    this.selectHand();
                    break;
                case 'z':
                    this.undo();
                    break;
                case 'y':
                    this.redo();
                    break;
                case 'g':
                    this.selectBackground();
                    break;
                case 'x':
                    this.toggleGridVisibility();
                    break;
                case 't':
                    this.selectText();
                    break;
                case 's':
                    this.selectSelector();
                    break;
            }
        }
    }

    @HostListener('document:keydown', ['$event'])
    handleControlDown(event: KeyboardEvent) {
        if (this.sketchService.currentTool === this.sketchService.toolSelector) {
            if (event.key === 'Control') {
                this.sketchService.toolSelector.setCtrlDown(true);
            }
            if (event.key === 'Shift') {
                this.sketchService.toolSelector.setShiftDown(true);
            }
            if (event.key === 'Delete') {
                this.sketchService.toolSelector.delete();
            }
            if (event.key === 'c') {
                this.sketchService.toolSelector.copy();
            }
            if (event.key === 'v') {
                this.sketchService.toolSelector.paste();
            }

            this.sketchService.toolSelector.setCursor();
        } else if (this.sketchService.currentTool === this.sketchService.toolText) {
            if (event.key === 'Shift' || event.key === 'Control') {
                this.sketchService.toolText.setModKey(true);
            }
            if (event.key === 'Enter') {
                this.sketchService.toolText.endInput(false);
            }
            if (event.key === 'Escape') {
                this.sketchService.toolText.endInput(true);
            }
        }
    }

    @HostListener('document:keyup', ['$event'])
    handleControl(event: KeyboardEvent) {
        if (this.sketchService.currentTool === this.sketchService.toolSelector) {
            if (event.key === 'Control') {
                this.sketchService.toolSelector.setCtrlDown(false);
            }
            if (event.key === 'Shift') {
                this.sketchService.toolSelector.setShiftDown(false);
            }

            this.sketchService.toolSelector.setCursor();
        } else if (this.sketchService.currentTool === this.sketchService.toolText) {
            if (event.key === 'Shift' || event.key === 'Control') {
                this.sketchService.toolText.setModKey(false);
            }
        }
    }

    /**
     * Returns the name of the image export file.
     */
    private get exportFileName(): string {
        return this.sketch.title.replace(this.illegalFilePattern, '') + '.png';
    }

    /**
     * Changes the background color of the sketch to the given color.
     * @param {string} color The color as a hex string
     */
    private selectBackgroundColor(color: string) {
        this.currentBackgroundColor = color;
        this.sketchService.setBackgroundColor(color);
    }

    /**
     * Changes the current text color to the given color.
     * @param {string} color The color as a hex string
     */
    private selectTextColor(color: string) {
        this.currentTextColor = color;
        this.sketchService.textColor = color;
        this.sketchService.toolText.setColor(color);
    }

    private selectShapeColor(color: string) {
        this.currentShapeColor = color;
        this.sketchService.shapeColor = color;
        this.sketchService.toolShape.setColor(color);
    }

    private selectShapeFill(color: string) {
        this.currentShapeFill = color;
        this.updateShapeFillColor();
    }


    /**
     * Changes the current brush color to the given color.
     * @param {string} color The color as a hex string
     */
    private selectBrushColor(color: string) {
        this.currentBrushColor = color;
        this.sketchService.setBrushColor(color);
    }

    private selectBrushStyle(event: MouseEvent) {
        this.currentBrushStyle = (event.target as HTMLInputElement).id;
        this.sketchService.setBrushStyle((event.target as HTMLInputElement).id);
        if (this.currentBrushStyle === 'normal') {
            // this.sketchService.currentTool = this.sketchService.toolBrush;
            // this.sketchService.setBrushSize(this.currentBrushLineSize);
            this.sketchService.setBrushSize(this.currentBrushLineSize);
            document.getElementById('brushSizeSettings').style.display = 'block';
            this.selectBrush();
            this.currentBrushStyleIcons = "assets/img/icons/brush.svg"
        } else if (this.currentBrushStyle === 'graffiti') {
            document.getElementById('brushSizeSettings').style.display = 'none';
            this.sketchService.setBrushSize(1);
            this.currentBrushStyleIcons = "assets/img/icons/hair-spray-bottle-svgrepo-com.svg"
        }
    }

    /**
     * Changes the current brush size to the current range input value.
     */
    private selectBrushSize() {
        if (this.currentBrushLineSize < 1) {
            this.currentBrushLineSize = 1;
        }
        if (this.currentBrushLineSize > 50) {
            this.currentBrushLineSize = 50;
        }
        this.sketchService.setBrushSize(this.currentBrushLineSize);
    }

    /**
     * Method to change brush
     */

    private changeDashArray(event: MouseEvent) {
        let dasharray = (event.target as HTMLInputElement).id;
        switch (dasharray) {
            case "noDash":
                this.sketchService.dasharray = "";
                break;
            case "smallDash":
                this.sketchService.dasharray = "5,5";
                break;
            case "bigDash":
                this.sketchService.dasharray = "10,10";
                break;
            case "randomDash":
                this.sketchService.dasharray = "20,10,5,5,5,10";
                break;

        }
    }

    /**
     * Changes the current text size to the current range input value.
     */
    private selectTextSize() {
        if (this.currentTextSize < 1) {
            this.currentTextSize = 1;
        }
        if (this.currentTextSize > 100) {
            this.currentTextSize = 100;
        }
        this.sketchService.setTextSize(this.currentTextSize);
        this.sketchService.toolText.setSize(this.currentTextSize);
    }

    private selectShapeWidth() {
        if (this.currentShapeWidth < 1) {
            this.currentShapeWidth = 1;
        }
        if (this.currentShapeWidth > 100) {
            this.currentShapeWidth = 100;
        }
        this.sketchService.setShapeWidth(this.currentShapeWidth);
        this.sketchService.toolShape.setWidth(this.currentShapeWidth);
    }

    private selectShapeHeight() {
        if (this.currentShapeHeight < 1) {
            this.currentShapeHeight = 1;
        }
        if (this.currentShapeHeight > 100) {
            this.currentShapeHeight = 100;
        }
        this.sketchService.setShapeHeight(this.currentShapeHeight);
        this.sketchService.toolShape.setHeight(this.currentShapeHeight);
    }

    private selectShapeSize() {
        if (this.currentShapeSize < 1) {
            this.currentShapeSize = 1;
        }
        if (this.currentShapeSize > 100) {
            this.currentShapeSize = 100;
        }
        this.sketchService.setShapeSize(this.currentShapeSize);
        this.sketchService.toolShape.setSize(this.currentShapeSize);
    }

    private selectShapeOpacity() {
        if (this.currentShapeOpacity < 0) {
            this.currentShapeOpacity = 0;
        }
        if (this.currentShapeOpacity > 100) {
            this.currentShapeOpacity = 100;
        }
        this.updateShapeFillColor();
    }

    private updateShapeFillColor() {
        const opa = Math.round(this.currentShapeOpacity * 2.55);
        var hex = opa.toString(16);
        if (hex.length % 2) {
            hex = '0' + hex;
        }
        this.currentShapeFillColor = this.currentShapeFill.concat(hex);
        this.sketchService.shapeFill = this.currentShapeFillColor;
        this.sketchService.toolShape.setFill(this.currentShapeFillColor);
    }

    /**
     * Changes the current font to the current select input option.
     */
    private selectFontFamily() {
        this.sketchService.setTextFontFamily(this.currentFontFamily);
        this.sketchService.toolText.setFont(this.currentFontFamily);
    }

    private selectShapeType() {
        this.sketchService.setShapeType(this.currentShapeType);
        this.sketchService.toolShape.setType(this.currentShapeType);
    }

    /**
     * Returns true if the given color is the currently selected one.
     */
    private isCurrentBrushColor(color: string): boolean {
        return color === this.currentBrushColor;
    }

    /**
     * Returns true if the given color is the currently selected one.
     */
    private isCurrentBackgroundColor(color: string): boolean {
        return color === this.currentBackgroundColor;
    }

    /**
     * Returns true if the given color is the currently selected one.
     */
    private isCurrentTextColor(color: string): boolean {
        return color === this.currentTextColor;
    }

    private isCurrentShapeColor(color: string): boolean {
        return color === this.currentShapeColor;
    }

    private isCurrentShapeFill(color: string): boolean {
        return color === this.currentShapeFill;
    }

    /**
     * Changes the active tool to the brush.
     */
    private selectBrush() {
        if (this.isBrushSelected) {
            this.toggleBrushSettings();
        } else {
            this.deselectHand(this.sketchService.toolBrush);
            this.deselectSelector();
            this.deselectTextTool();
            this.deselectImageTool();
            this.sketchService.currentTool = this.sketchService.toolBrush;
            this.sketchService.toolBrush.setCursor();
        }
    }

    /**
     * Changes the active tool to the background.
     */
    private selectBackground() {

        if(this.sketchService.gridVisible) {
            this.sketchService.toggleGrid();
        }
        if (this.isBackgroundSelected) {
            this.toggleBackgroundSettings();
        } else {
            this.deselectHand(this.sketchService.toolBackground);
            this.deselectSelector();
            this.deselectTextTool();
            this.deselectImageTool();
            this.sketchService.toolBrush.deselect();
            this.sketchService.currentTool = this.sketchService.toolBackground;
            this.sketchService.toolBackground.setCursor();
        }
    }

    /**
     * Changes the opacity of the brush.
     */
    private selectBrushOpacity() {
        if (this.currentBrushOpacity < 1) {
            this.currentBrushOpacity = 1;
        }
        if (this.currentBrushOpacity > 100) {
            this.currentBrushOpacity = 100;
        }
        var tempOpa = Math.round(this.currentBrushOpacity * 2.55);
        this.sketchService.setBrushTransparency(tempOpa);
    }

    /**
     * Changes the opacity of the text.
     */
    private selectTextOpacity() {
        if (this.currentTextOpacity < 1) {
            this.currentTextOpacity = 1;
        }
        if (this.currentTextOpacity > 100) {
            this.currentTextOpacity = 100;
        }
        const opa = Math.round(this.currentTextOpacity * 2.55);
        var hex = opa.toString(16);
        if (hex.length % 2) {
            hex = '0' + hex;
        }
        this.sketchService.toolText.setOpacity(hex);
    }

    /**
     * Changes the active tool to the text.
     */
    private selectText() {
        if (this.isTextSelected) {
            this.toggleTextSettings();
        } else {
            this.deselectHand(this.sketchService.toolText);
            this.deselectSelector();
            this.deselectImageTool();
            this.sketchService.toolBrush.deselect();
            this.sketchService.currentTool = this.sketchService.toolText;
            this.sketchService.toolText.setCursor();
        }
    }

    private selectShape() {
        if (this.isShapeSelected) {
            this.toggleShapeSettings();
        } else {
            this.deselectHand(this.sketchService.toolShape);
            this.deselectSelector();
            this.deselectImageTool();
            this.sketchService.toolBrush.deselect();
            this.sketchService.currentTool = this.sketchService.toolShape;
            this.sketchService.toolShape.setCursor();
        }
    }

    /* #################### START TOGGLE: brush #################### */
    /**
     * Toggles visibility of the brush settings menu.
     */
    private toggleBrushSettings() {
        this.isBrushSettingsVisible = !this.isBrushSettingsVisible;
    }

    /**
     * Toggles visibility of the color settings menu.
     */
    private toggleColorSettings() {
        this.isColorSettingsVisible = !this.isColorSettingsVisible;
    }

    /**
     * Toggles visibility of the brush size slider modal.
     */
    private toggleBrushSizeModal() {
        this.isBrushSizeModalVisible = !this.isBrushSizeModalVisible;
    }

    /**
     * Toggles visibility of the brush style modal
     */
    private toggleBrushStyleModal() {
        this.isBrushStyleModalVisible = !this.isBrushStyleModalVisible;
    }

    /**
     * Toggles visibility of the brush opacity slider modal.
     */
    private toggleBrushOpacityModal() {
        this.isBrushOpacityModalVisible = !this.isBrushOpacityModalVisible;
    }

    /* #################### END TOGGLE: brush #################### */

    /* #################### START TOGGLE: background #################### */
    /**
     * Toggles visibility of the background settings menu.
     */
    private toggleBackgroundSettings() {
        this.isBackgroundSettingsVisible = !this.isBackgroundSettingsVisible;
    }

    /**
     * Toggles visibility of the background color settings menu.
     */
    private toggleBackgroundColorSettings() {
        this.isBackgroundColorSettingsVisible = !this.isBackgroundColorSettingsVisible;
    }

    /* #################### END TOGGLE: background #################### */

    private toggleShapeSettings() {
        this.isShapeSettingsVisible = !this.isShapeSettingsVisible;
    }

    private toggleShapeColorSettings() {
        this.isShapeColorSettingsVisible = !this.isShapeColorSettingsVisible;
    }

    private toggleShapeTypeModal() {
        this.isShapeTypeModalVisible = !this.isShapeTypeModalVisible;
    }

    private toggleShapeWidthModal() {
        this.isShapeWidthModalVisible = !this.isShapeWidthModalVisible;
    }

    private toggleShapeHeightModal() {
        this.isShapeHeightModalVisible = !this.isShapeHeightModalVisible;
    }

    private toggleShapeSizeModal() {
        this.isShapeSizeModalVisible = !this.isShapeSizeModalVisible;
    }

    private toggleShapeOpacityModal(){
        this.isShapeOpacityModalVisible = !this.isShapeOpacityModalVisible;
    }

    /* #################### START TOGGLE: text #################### */
    /**
     * Toggles visibility of the text settings menu.
     */
    private toggleTextSettings() {
        this.isTextSettingsVisible = !this.isTextSettingsVisible;
    }

    /**
     * Toggles visibility of the text color settings menu.
     */
    private toggleTextColorSettings() {
        this.isTextColorSettingsVisible = !this.isTextColorSettingsVisible;
    }

    /**
     * Toggles visibility of the text size settings modal.
     */
    private toggleTextSizeModal() {
        this.isTextSizeModalVisible = !this.isTextSizeModalVisible;
    }

    /**
     * Toggles visibility of the text input settings modal.
     */
    private toggleTextInputModal() {
        this.isTextInputModalVisible = !this.isTextInputModalVisible;
    }

    /**
     * Toggles visibility of the text input settings modal.
     */
    private toggleTextOpacityModal() {
        this.isTextOpacityModalVisible = !this.isTextOpacityModalVisible;
    }

    /**
     * Toggles visibility of the text input settings modal.
     */
    private toggleTextFontModal() {
        this.isTextFontModalVisible = !this.isTextFontModalVisible;
    }

    private toggleGridVisibility() {
        this.sketchService.toggleGrid();
    }

    /**
     * Toggles the visibility of the download modal
     */
    private toggleDownloadOptionsModal() {
        this.isDownloadOptionsVisible = !this.isDownloadOptionsVisible;
    }

    /* #################### END TOGGLE: text #################### */

    /**
     * Changes the active tool to the eraser.
     */
    private selectEraser() {
        this.deselectHand(this.sketchService.toolEraser);
        this.deselectSelector();
        this.deselectTextTool();
        this.deselectImageTool();
        this.sketchService.toolBrush.deselect();
        this.sketchService.currentTool = this.sketchService.toolEraser;
        this.sketchService.toolEraser.setCursor();
    }

    /**
     * Changes the active tool to the Selector
     */
    private selectSelector() {
        this.deselectHand(this.sketchService.toolEraser);
        this.deselectTextTool();
        this.sketchService.toolBrush.deselect();
        this.sketchService.currentTool = this.sketchService.toolSelector;
        this.sketchService.toolSelector.setCursor();
    }

    /**
     * Removes selector tool as active tool and deselects lines
     */
    private deselectSelector() {
        this.sketchService.toolSelector.deselect();
    }

    private deselectImageTool() {
        this.sketchService.toolImage.deselect();
    }

    private deselectBrushTool() {
        this.sketchService.toolBrush.deselect();
    }

    private deselectTextTool() {
        this.sketchService.toolText.deactivateTextTool();
    }

    /**
     * Changes the active tool to default (which serves as the hand tool)
     */
    private selectHand() {
        this.isDragScrollActive = true;
        this.sketchService.toggleDragScroll(this.isDragScrollActive);
    }

    /**
     * Removes hand tool as active tool
     */
    private deselectHand(tool: any) {
        this.isDragScrollActive = false;
        this.sketchService.toggleDragScroll(this.isDragScrollActive, tool);
    }

    /**
     * Returns true if the brush is selected as active tool.
     */
    private get isBrushSelected(): boolean {
        return this.sketchService.currentTool === this.sketchService.toolBrush;
    }

    /**
     * Returns true if the background tool is selected as active tool.
     */
    private get isBackgroundSelected(): boolean {
        return this.sketchService.currentTool === this.sketchService.toolBackground;
    }

    /**
     * Returns true if the eraser is selected as active tool.
     */
    private get isEraserSelected(): boolean {
        return this.sketchService.currentTool === this.sketchService.toolEraser;
    }

    private get isGridSelected(): boolean {
        return this.sketchService.gridVisible;
    }

    /**
     * Returns true if the eraser is the active tool
     */
    private get isSelectorSelected(): boolean {
        return this.sketchService.currentTool === this.sketchService.toolSelector;
    }

    /*
     * Returns true if the text is selected as active tool.
     */
    private get isTextSelected(): boolean {
        return this.sketchService.currentTool === this.sketchService.toolText;
    }

    private get isShapeSelected(): boolean {
        return this.sketchService.currentTool === this.sketchService.toolShape;
    }

    /**
     * Returns true if an empty default tool is active.
     */
    private get isHandSelected(): boolean {
        return this.sketchService.currentTool === this.sketchService.toolDefault;
    }

    /**
     * Toggles visibility of the chat overlay.
     */
    private toggleChat(event?) {
        this.isChatVisible = !this.isChatVisible;
        this.sketchService.isInputActive.next(this.isChatVisible);
    }

    private selectDownloadType() {
        this.sketchService.setDownloadType(this.currentDownloadType);
    }
    /**
     *  Images doesnt display on local viewer without heights
     */
    private setImageHeights() {
        return new Promise((resolveAllConverted, reject) => {
            const sketchElements = this.sketch.getAllElements();
            const sketchService = this.sketchService;
            (async function loop() {
                for (let i = 0; i < sketchElements.length; i++) {
                    await new Promise(resolve => {
                        if (sketchElements[i] instanceof ImageType) {
                            const image = sketchElements[i] as ImageType;
                            const img = new Image();
                            img.src = image.src;
                            const actualImageWidth = image.width;
                            img.addEventListener('load', function(){
                                const basicImgWidth = img.width;
                                const basicImgHeight = img.height;
                                const actualImageHeight = basicImgHeight * (actualImageWidth / basicImgWidth);
                                document.getElementById('element' + image.id.toString())
                                    .setAttribute('height', actualImageHeight.toString());
                                resolve();
                            });
                        } else {
                            resolve();
                        }
                    });
                    if (i === sketchElements.length - 1) {
                        resolveAllConverted();
                    }
                }
            })();
        });
    }

    /**
     * Updates the href attribute of the download button to the sketch export url.
     *
     */
    private downloadSketch() {
        this.convertImagesToBase64().then(result => {
            this.setImageHeights().then(res => {
                const loadingEle: HTMLElement = document.getElementById('cssload-loader');
                this.renderer.setStyle(loadingEle, 'display', 'none');
                const loadingContainerEle: HTMLElement = document.getElementById('cssload-container');
                this.renderer.setStyle(loadingContainerEle, 'display', 'none');
                const name = this.sketchTitle.replace(/[^a-zA-Z0-9-_.]/g, '');
                this.sketchService.downloadSketchURL(name);

            });
        });
    }

    private setDownloadType() {
        this.sketchService.setDownloadType
    }

    //TODO Maybe find a method to make it sharper or maybe re-do the whole structure to use svg instead of png.
    /**
     * Updates the sketch preview by scaling down the current sketch image and sending it to the server.
     */
    private updateSketchPreview() {
        const previewCanvas = this.previewCanvasRef.nativeElement;
        const context = previewCanvas.getContext('2d');
        const svg = this.sketchService.getActiveCanvas().nativeElement;

        const width: number = +svg.getAttribute('width');
        const height: number = +svg.getAttribute('height');
        const cutoutSize: number = width - height;
        return new Promise((resolve, reject) => {
            this.svgToImage(svg)
                .then((image) => {
                    context.drawImage(image, cutoutSize / 2, 0, height, height, 0, 0, previewCanvas.width, previewCanvas.height);
                    previewCanvas.toBlob(blob => {
                        this.sketchService.updateSketchPreview(blob)
                            .then(result => {
                                resolve(result);
                            })
                            .catch(err => {
                                reject(err);
                            });
                    });
                });
        });
    }

    private convertImagesToBase64() {

        return new Promise((resolveAllConverted, reject) => {
            const sketchElements = this.sketch.getAllElements();
            if (sketchElements.length === 0) {
                resolveAllConverted();
            }else {
                const loadingEle: HTMLElement = document.getElementById('cssload-loader');
                this.renderer.setStyle(loadingEle, 'display', 'block');

                const loadingContainerEle: HTMLElement = document.getElementById('cssload-container');
                this.renderer.setStyle(loadingContainerEle, 'display', 'block');
            }

            const loadingEle: HTMLElement = document.getElementById('cssload-loader');
            this.renderer.setStyle(loadingEle, 'display', 'block');


            const loadingContainerEle: HTMLElement = document.getElementById('cssload-container');
            this.renderer.setStyle(loadingContainerEle, 'display', 'block');

            const toDataURL = url => fetch(url)
                .then(response => response.blob())
                .then(blob => new Promise((resolved, rejected) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolved(reader.result);
                    reader.onerror = rejected;
                    reader.readAsDataURL(blob);
                }));


            const sketchService = this.sketchService;

            (async function loop() {
                for (let i = 0; i < sketchElements.length; i++) {
                    await new Promise(resolve => {

                        if (sketchElements[i] instanceof ImageType) {
                            const image = sketchElements[i] as ImageType;
                            if (image.src.includes('/unisketch7/api/images/')) {
                                toDataURL(image.src).then(dataUrl => {
                                    image.src = dataUrl.toString();
                                    sketchElements[i] = image;
                                    resolve();
                                });
                            } else {
                                resolve();
                            }
                        } else {
                            resolve();
                        }
                    });
                    if (i === sketchElements.length - 1) {
                        sketchService.redrawSketch();
                        resolveAllConverted();
                    }
                }

            })();

        });

    }

    private svgToImage(svg) {
        return new Promise((resolve, reject) => {
            const svgData = new XMLSerializer().serializeToString(svg);
            const image = document.createElement('img');
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = "data:image/svg+xml;base64," + btoa(svgData);
        });
    }

    /**
     * Navigates back to the dashboard after updating the sketch preview.
     */
    private backToDashboard() {
        if (!this.authService.loginCookieExists()) {
            this.router.navigate(['/']);
        }
        // Only update the preview if we're allowed to draw, because it'll be refused anyways otherwise
        else if (this.sketchService.isAllowedToDraw()) {
            this.convertImagesToBase64().then(() => {
                this.updateSketchPreview()
                    .then(data => {
                        this.router.navigate(['/dashboard']);
                    })
                    .catch(err => {
                        console.error('Failed to update preview: ' + err);
                        this.router.navigate(['/dashboard']);
                    });
            });
        } else {
            this.router.navigate(['/dashboard']);
        }

        if(this.sketchService.gridVisible) {
            this.sketchService.toggleGrid();
        }
    }


    private handleTitleClick() {
        this.isTitleInputActive = true;
        this.sketchService.isInputActive.next(this.isTitleInputActive);
    }

    /**
     * Handles click outside of the title input in order to save
     * the new value.
     */
    private handleTitleBlur(newTitle: string) {
        this.isTitleInputActive = false;
        this.sketchTitle = newTitle;
        this.updateTitle();
        this.sketchService.isInputActive.next(this.isTitleInputActive);
    }

    /**
     * Updates the sketch title to what the user entered in the text field.
     */
    private updateTitle() {
        if (this.sketchTitle && this.sketchTitle !== '') {
            this.sketch.title = this.sketchTitle;
            this.dashboardService.updateSketchTitle(this.sketch)
                .subscribe(
                    data => {
                    }, error => {
                        this.sketch.title = this.sketchTitle = this.oldSketchTitle;
                    });
        }
    }

    /**
     * Checks if the user is allowed to zoom into the sketch.
     */
    private get canZoomIn(): boolean {
        return this.zoomLevel < this.maxZoomLevel;
    }

    /**
     * Checks if the user is allowed to zoom out of the sketch.
     */
    private get canZoomOut(): boolean {
        return this.zoomLevel > 1;
    }

    /**
     * Zooms into the sketch, if the user is allowed to.
     */
    private zoomIn() {
        if (this.canZoomIn) {
            if (this.zoomLevel + 1 > this.maxZoomLevel) {
                this.zoomLevel = this.maxZoomLevel;
                this.sketchService.changeCanvasZoomLevel(this.zoomLevel);
            } else {
                this.sketchService.changeCanvasZoomLevel(++this.zoomLevel);
            }
        }
    }

    /**
     * Zooms out of the sketch, if the user is allowed to.
     */
    private zoomOut() {
        if (this.canZoomOut) {
            if (this.zoomLevel - 1 < this.minZoomLevel) {
                this.zoomLevel = this.minZoomLevel;
                this.sketchService.changeCanvasZoomLevel(this.zoomLevel);
            } else {
                this.sketchService.changeCanvasZoomLevel(--this.zoomLevel);
            }
        }
    }

    /**
     * Zooms in/out of the sketch, with a range input.
     */
    private zoomWithSlider(event) {
        let sliderValue = this.castStringInputToNumber(event);
        this.zoomLevel = sliderValue;
        this.sketchService.changeCanvasZoomLevel(this.zoomLevel);
    }

    private castStringInputToNumber(toCast) {
        return Number((toCast.target as HTMLInputElement).value);
    }

    /**
     * Getter for protocol steps.
     * TODO
     */
    private get isUndoable(): boolean {
        return this.sketchService.isUndoable;
    }


    /**
     * Getter for protocol steps.
     * TODO
     */
    private get isRedoable(): boolean {
        return this.sketchService.isRedoable;
    }

    /**
     * Undo the last step if undo is available.
     */
    private undo() {
        if (this.isUndoable) {
            this.sketchService.undo();
        }
    }

    /**
     * Redo the last step, if available.
     */
    private redo() {
        if (this.isRedoable) {
            this.sketchService.redo();
        }
    }

    /**
     * Enter or leave fullscreen mode according to current state.
     */
    private toggleFullscreen() {
        this.sketchService.toggleFullscreen();
    }

    /**
     * Getter for the current fullscreen state.
     */
    private get isFullscreenActive() {
        return this.sketchService.isFullscreenActive;
    }

}
