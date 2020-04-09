import { ElementRef, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import * as io from 'socket.io-client';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

import { Sketch } from '../models/sketch.model';
import { Vertex } from '../models/vertex.model';
import { Text } from '../models/text.model';

import { SketchTool } from '../sketch/tool';
import { ToolBrush } from '../sketch/tool-brush';
import { ToolBackground } from '../sketch/tool-background';
import { ToolEraser } from '../sketch/tool-eraser';
import { ToolSelector } from '../sketch/tool-selector';
import { ToolText } from '../sketch/tool-text';
import { IRenderer, SVGRenderer } from '../sketch/svg-renderer';
import { Globals } from '../globals';
import { SketchElement } from '../models/sketch-element.model';
import { ToolShape } from "../sketch/tool-shape";
import { Shape, ShapeType } from "../models/shape.model";
import { DownloadType } from "../models/download_types.model";
import {Image} from '../models/image.model';
import {ToolImage} from '../sketch/tool-image';

import * as canvg from 'canvg';
import * as jspdf from 'jspdf';


declare var dragscroll: any;

/**
 * Service providing functionality for drawing in a sketch and keeping it synchronized with the server.
 * Manages the websocket connection.
 */
@Injectable()
export class SketchService {

    /**
     * Socket.IO connection to the Websocket server.
     */
    private socket;

    /**
     * Reference to the active canvas element in the sketch view.
     */
    private activeCanvasRef: ElementRef;

    private svgRenderer: SVGRenderer = new SVGRenderer(this);

    /**
     * The current sketch or null if the user has not joined a sketching session yet.
     */
    private sketch: Sketch;

    /**
     * The role of the current user on the current sketch.
     */
    private currentRole: number;

    /**
     * Invoked when the service has received an active canvas element.
     */
    public onCanvasReady = new Subject();

    /**
     * Invoked when the service has connected to the Websocket server.
     */
    public onSessionStart = new Subject();

    /**
     * Invoked when the service has received sketch metadata from the server.
     */
    public onFullSketch = new Subject();

    /**
     * Invoked when the service has received lines of the sketch from the server.
     */
    public onFullSketchPart = new Subject();

    /**
     * Invoked when the service has received a newly drawn line from the server.
     */
    public onDrawLine = new Subject();

    /**
     * Invoked when the service has received a newly drawn element from the server.
     * This is not yet used for lines (for no real reasons).
     * TODO: use for line drawing and delete onDrawLine
     */
    public onDrawElement = new Subject();

    /**
     * Called when text content is edited.
     */
    public onEditText = new Subject();

    /**
     * Invoked when the service has received new vertices for a line from the server.
     */
    public onContinueLine = new Subject();

    /**
     * Invoked when server gives ID to element. Only received by creator of element.
     */
    public onConfirmElement = new Subject();

    /**
     * Invoked when the service has received a line deletion from the server.
     */
    public onDeleteElement = new Subject();

    public onUndo = new Subject();

    public onRedo = new Subject();

    /**
     * Invoked when the service has received a new background color for this sketch.
     */
    public onBackgroundColor = new Subject();

    /**
     * Invoked when the current user's role on this sketch has been updated.
     */
    public onRoleUpdated = new Subject();

    /**
     * Invoked when the current user has been kicked from this sketching session.
     */
    public onKicked = new Subject();

    /**
     * Invoked when a new user entered the sketching session.
     */
    public onUserJoin = new Subject();

    /**
     * Invoked when a user left the sketching session.
     */
    public onUserLeave = new Subject();

    /**
     * Invoked when selected elements get deletet.
     */
    public onDeleteElements = new Subject();

    /**
     * Invoked when selected elements get copied.
     */
    public onCopyElements = new Subject();

    /**
     * Invoked when selected elements get moved.
     */
    public onMoveElements = new Subject();

    /**
     * Invoked when selected elements get scaled.
     */
    public onScaleElements = new Subject();

    /**
     * Invoked when elements were copied. Invoker of copy methods receives ids
     * of copied elements for selection.
     */
    public onCopiedElements = new Subject();

    /**
     * Instance of the brush tool.
     */
    public toolBrush = new ToolBrush(this);

    /**
     * Instance of the background tool.
     */
    public toolBackground = new ToolBackground(this);

    /**
     * Instance of the eraser tool.
     */
    public toolEraser = new ToolEraser(this);

    /**
     * Instance of the selector tool
     */
    public toolSelector = new ToolSelector(this);

    /**
     * Instance of the text tool.
     */
    public toolText = new ToolText(this);

    /**
     * Instance of the shape tool.
     */
    public toolShape = new ToolShape(this);

    public toolImage = new ToolImage(this);

    /**
     * Empty default tool.
     */
    public toolDefault = new SketchTool(this);

    /**
     * The currently selected tool.
     */
    public currentTool: SketchTool = this.toolBrush;

    /**
     * The current color of the brush as a hex string.
     */
    public bColor = '#000000';

    /**
     * The current brushStyle of the brush as a string
     */
    public brushStyle = 'normal';

    /**
     * The current color of the brush as a hex string with transparency appended.
     */
    public brushColor = '#000000FF';

    /**
     * The current width of the brush.
     */
    public brushWidth: number;

    public dasharray = "";

    /**
     * The current transparency of the brush as a hex string.
     */
    public brushTransparency = 'FF';

    /**
     * The current size for text.
     */
    public textSize = 16;

    public textFontStyle = 'Arial';

    public textColor = '#000000ff';

    public shapeSize = 5;
    public shapeType = ShapeType.Rectangle;
    public shapeColor = '#000000ff';
    public shapeFill = '#000000ff';
    public shapeWidth = 10;
    public shapeHeight = 10;

    public imageSrc = '';
    public imageWidth = 200;


    /**
     * The current width and height of the canvas.
     */
    public canvasDimensions: Subject<any> = new Subject();

    /**
     * Saves the initial canvas size for reference.
     */
    public originalCanvasSize: any;

    /**
     * Saves the canvas width prior to fullscreen mode in order to
     * have a state to go back to.
     */
    private tempCanvasWidth: number;

    /**
     * Saves the canvas height prior to fullscreen mode in order to
     * have a state to go back to.
     */
    private tempCanvasHeight: number;

    /**
     * Determines the current fullscreen status.
     */
    public isFullscreenActive = false;

    /**
     * Determines if the user can undo at least one step.
     */
    public isUndoable = false;

    /**
     * Determines if the user can redo at least one step.
     */
    public isRedoable = false;

    /**
     * BehaviorSubject for updating the dragscroll activity
     */
    private _isDragScrollActive = new BehaviorSubject<boolean>(false);

    /**
     * Current value for dragscroll
     */
    private _isDragScrollActiveValue = false;

    /**
     * Temporary variable for saving the current tool for later reference
     */
    private previousTool: SketchTool;

    /**
     * Holds all elements which are copied into register. This works across
     * sketches now. On ctrl+v these elements will be pasted.
     */
    public copyRegister: Set<SketchElement> = new Set();

    /**
     * Determines if an input is active
     */
    public isInputActive = new Subject<boolean>();

    public chatMessages: Subject<any> = new Subject();

    private cursorData: any[] = new Array();
    private lastX = -999;
    private lastY = -999;

    public cursors = new Subject<any[]>();

    /**
     * current downloadtype
     */
    public downloadType = DownloadType.SVG;

    /**
     * true if the grid is visible
     */
   public gridVisible = false;


    constructor(private http: HttpClient) {
    }

    /**
     * Updates the canvasSize behaviorsubject as well as the dimensions
     */
    set canvasSize(size: object) {
        this.canvasDimensions.next(size);
        this.originalCanvasSize = size;
    }

    /**
     * Returns the observable of the dragscroll subject.
     */
    public get isDragScrollActive(): Observable<boolean> {
        return this._isDragScrollActive.asObservable();
    }

    // not needed
    //    public get getChatMessages(): Observable<any> {
    //        return this.chatMessages.asObservable();
    //    }

    /**
     * Initialises or tears down the dragscroll functionality.
     * Requires both the class `dragscroll` to be set on the container
     * as well as a call to the reset function after the class has
     * been set, hence the timeout
     */
    public toggleDragScroll(value: boolean, newTool?: SketchTool) {
        // Only update on change
        if (this._isDragScrollActiveValue !== value) {
            if (!newTool) {
                if (value) {
                    this.previousTool = this.currentTool;
                    this.currentTool = this.toolDefault;
                } else {
                    this.currentTool = this.previousTool;
                }
            }

            this._isDragScrollActiveValue = value;
            this._isDragScrollActive.next(value);
        }

        setTimeout(dragscroll.reset, 50);
    }

    /**
     * Connects to the websocket server and joins the given sketch id.
     */
    connect(sketchId): void {
        // Initialize default values
        this.sketch = new Sketch();
        this.sketch.id = sketchId;
        this.currentRole = 0;
        this.currentTool = this.toolBrush;
        this.brushWidth = 1;
        this.brushTransparency = 'FF';
        this.bColor = '#000000';
        this.brushColor = '#000000FF';

        this.textSize = 16;
        this.textFontStyle = 'Arial';
        this.textColor = '#00000000';

        // Connect to the websocket server
        this.socket = io(window.location.host, { path: Globals.BASE_PATH + '/api/socket.io' });

        // Register Socket.IO message handlers to delegate events to the Subjects
        this.socket.on('hello', (data) => {
            this.onSessionStart.next(data);
            this.socket.emit('join_sketch', { sketch_id: this.sketch.id });
        });

        this.socket.on('fail', (data) => {
            console.error(data);
            this.onKicked.next({ reason: data['message'] });
        });

        this.socket.on('sketch', (data) => {
            this.sketch.title = data['title'];
            this.sketch.is_public = data['is_public'];
            this.currentRole = data['role'];
            this.onFullSketch.next(data);
        });

        this.socket.on('sketch_part', (data) => {
            this.onFullSketchPart.next(data);
        });

        this.socket.on('draw_element', (data) => {
            this.onDrawElement.next(data);
        });

        this.socket.on('edit_text', (data) => {
            this.onEditText.next(data);
        });

        this.socket.on('draw_line', (data) => {
            this.onDrawLine.next(data);
        });

        this.socket.on('continue_line', (data) => {
            this.onContinueLine.next(data);
        });

        this.socket.on('confirm_element', (data) => {
            this.onConfirmElement.next(data);
        });

        this.socket.on('delete_element', (data) => {
            this.onDeleteElement.next(data);
        });

        this.socket.on('delete_elements', (data) => {
            this.onDeleteElements.next(data);
        });

        this.socket.on('copy_elements', (data) => {
            this.onCopyElements.next(data);
        });

        this.socket.on('scale_elements', (data) => {
            this.onScaleElements.next(data);
        });

        this.socket.on('move_elements', (data) => {
            this.onMoveElements.next(data);
        });

        this.socket.on('copied_elements', (data) => {
            this.onCopiedElements.next(data);
        });

        this.socket.on('undo', (data) => {
            this.onUndo.next(data);
        });

        this.socket.on('redo', (data) => {
            this.onRedo.next(data);
        });

        this.socket.on('background_color', (data) => {
            this.onBackgroundColor.next(data);
        });

        this.socket.on('kicked', (data) => {
            this.onKicked.next(data);
        });

        this.socket.on('role_updated', (data) => {
            this.currentRole = data['role'];
            this.onRoleUpdated.next(data);
        });

        this.socket.on('user_join', (data) => {
            this.onUserJoin.next(data);
        });

        this.socket.on('user_leave', (data) => {
            this.onUserLeave.next(data);
        });

        this.socket.on('redoable', (data) => {
            this.isRedoable = data['available'];
        });

        this.socket.on('undoable', (data) => {
            this.isUndoable = data['available'];
        });

        this.socket.on('chat', (data) => {
            this.chatMessages.next({ text: atob(data.message), username: data.username, owner: data.owner });
        });

        this.socket.on('draw_cursor', (data) => {
            this.updateCursorData(data.id, data.name, data.x, data.y);
            this.cursors.next(this.cursorData);
        });

        this.socket.on('delete_cursor', (data) => {
            this.cursorData.map((obj, i) => {
                if (this.cursorData[i].id === data.id) {
                    this.cursorData.splice(i, 1);
                }
            });
        });

        this.changeCanvasZoomLevel(1);
    }

    /**
     * Sets the active sketch canvas element.
     */
    setActiveCanvas(canvasRef: ElementRef): void {
        this.activeCanvasRef = canvasRef;
        this.svgRenderer.setActive(canvasRef);
        this.onCanvasReady.next({ canvas: canvasRef });
    }

    /**
     * Returns a reference to the active canvas element.
     */
    getActiveCanvas(): ElementRef {
        return this.activeCanvasRef;
    }

    /**
     * Returns true if the current user is allowed to draw in this sketch.
     */
    isAllowedToDraw(): boolean {
        return this.currentRole >= 2;
    }

    /**
     * Returns true if the current user is an owner of this sketch.
     */
    isSketchOwner(): boolean {
        return this.currentRole === 3;
    }

    /**
     * Sends a request to the server for starting a new line.
     */
    startLine(x: number, y: number): void {
        this.socket.emit('start_line', {x: x, y: y, color: this.brushColor, width: this.brushWidth, dasharray: this.dasharray, brushStyle: this.brushStyle});
    }

    /**
     * Sends a request to the server for adding new vertices to the current line.
     */
    continueLine(vertices: number[]): void {
        this.socket.emit('continue_line', { vertices: vertices });
    }

    /**
     * Sends a request to the server for moving the last placed vertex to a new position.
     */
    moveLastVertex(x: number, y: number): void {
        this.socket.emit('move_last_vertex', { x: x, y: y });
    }

    eraseElement(element: SketchElement): void {
        this.socket.emit('delete_element', { element_id: element.id });
    }

    startText(text: Text): void {
        this.socket.emit('start_text', { text });
    }

    sendShape(shape: Shape) {
        this.socket.emit('send_shape', { shape });
    }

    sendImage(image: Image) {
        this.socket.emit('send_image', {image});
    }

    editText(text: Text, final: boolean): void {
        this.socket.emit('edit_text', { text, final });
    }

    undo(): void {
        this.socket.emit('undo', { data: 'undefined' });
    }

    redo(): void {
        this.socket.emit('redo', { data: 'undefined' });
    }

    sendMessage(message: string): void {
        this.socket.emit('chat', { message: btoa(message) });
    }

    sendMousePos(x: number, y: number): void {
        if (x > this.lastX + 2 || x < this.lastX - 2 ||
            y > this.lastY + 2 || y < this.lastY - 2) {
            this.socket.emit('draw_cursor', { x: x, y: y });
            this.lastX = x;
            this.lastY = y;
        }
    }

    /**
     * Renders a point on the canvas.
     */
    renderPoint(x: number, y: number, color: string, width: number): SVGElement {
        return this.svgRenderer.renderPoint(x, y, color, width);
    }

    deleteElements(elements: SketchElement[]): void {
        this.socket.emit('delete_elements', { elements: elements });
    }

    copyElements(elements: SketchElement[]): void {
        this.socket.emit('copy_elements', { elements: elements });
    }

    moveElements(elements: SketchElement[]): void {
        this.socket.emit('move_elements', { elements: elements });
    }

    scaleElements(elements: SketchElement[]): void {
        this.socket.emit('scale_elements', { elements: elements });
    }

    private updateCursorData(id: number, name: string, x: number, y: number): void {
        let found = false;
        this.cursorData.forEach(cursor => {
            if (cursor.id === id) {
                cursor.x = x.toString()
                    .concat('px');
                cursor.y = y.toString()
                    .concat('px');
                found = true;
            }
        });

        if (!found) {
            this.cursorData.push({
                id: id,
                name: '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'.concat(name),
                x: x.toString()
                    .concat('px'),
                y: y.toString()
                    .concat('px'),
                color: '#'.concat(Math.floor(Math.random() * 16777215)
                    .toString(16))
            });
        }
    }

    /**
     * Returns the model instance of the current sketch.
     */
    getSketch(): Sketch {
        return this.sketch;
    }

    getRenderer(): IRenderer {
        return this.svgRenderer;
    }

    /**
     * Returns a data url for the image export of a sketch.
     */
      
    downloadSketchURL(filename:string) {
       
        let toggled = false;
        if(this.gridVisible) {
            this.toggleGrid();
            toggled = true;
        }
        const svgData = this.activeCanvasRef.nativeElement.outerHTML;
        const svgPrefix = '<?xml version="1.0" standalone="no"?>\r\n';
        const svg = svgPrefix + svgData;
        
        if(!this.gridVisible && toggled) {
            this.toggleGrid();  //activate grid again so user does not notice
        }
        
        var download  = document.createElement('a');
        switch (this.downloadType) {

            case DownloadType.PNG:
            var canvas = document.createElement('canvas');
                canvg(canvas, svg, { renderCallback: function () {
                    download.setAttribute('href', canvas.toDataURL('image/png'));  
                    download.setAttribute('download', `${filename}.png`);
                    download.click();  //so the user does not need to click twice when the url is ready
                    
                    }});
                break;
            case DownloadType.SVG:
                const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
                download.setAttribute('href', URL.createObjectURL(svgBlob));
                download.setAttribute('download', `${filename}.svg`);
                download.click();
                break;
            case DownloadType.PDF: {

                var canvas = document.createElement('canvas');
                canvg(canvas, svg, { renderCallback: function () {
                    
                    var imgData = canvas.toDataURL('image/png');
                    var doc = new jspdf('landscape');   
                    const imgProps = doc.getImageProperties(imgData);
                    var width = doc.internal.pageSize.getWidth();
                    var height = (imgProps.height * width) / imgProps.width;   //so the image isn't stretched
                    doc.addImage(imgData, 'PNG', 0, 0, width, height);          //add png to pdf file
                    var blob = new Blob([doc.output('blob')], { type: 'application/pdf' });  //wrap pdf into blob to get the url
                    download.setAttribute('href', URL.createObjectURL(blob));
                    download.setAttribute('download', `${filename}.pdf`);
                    download.click();
                    }});

                    break;    
            }
           
        }
        
    }
    

    

    setDownloadType(type: DownloadType) {
        this.downloadType = type;
    }

    /**
     * Updates the sketch's background color to the given hex string.
     */
    setBackgroundColor(color: string) {
        this.sketch.background_color = color;
        this.svgRenderer.updateBackground(color);
        this.socket.emit('background_color', {
            color: this.sketch.background_color,
        });
    }

    toggleGrid() {
        this.gridVisible = !this.gridVisible;
        this.svgRenderer.updateGrid(this.gridVisible);
    }



    /**
     * Sets the current brush color to the given hex string.
     */
    setBrushColor(color: string) {
        this.bColor = color;
        this.updateColor();
    }

    /**
     * Sets the currentBrushStyle
     * @param brushStyle 
     */
    setBrushStyle(brushStyle: string) {
        this.brushStyle = brushStyle;
    }

    /**
     * Sets the current brush width to the given number in px.
     */
    setBrushSize(size: number) {
        this.brushWidth = size;
    }

    /**
     * Sets the current brush transparency to the given number.
     */
    setBrushTransparency(size: number) {
        this.brushTransparency = size.toString(16);
        if (this.brushTransparency.length % 2) {
            this.brushTransparency = '0' + this.brushTransparency;
        }
        this.updateColor();
    }

    /**
     * Updates the brush color by appending the transparency to the color.
     */
    private updateColor() {
        this.brushColor = this.bColor.concat(this.brushTransparency);
    }

    /**
     * Sets the current text size to the given number in px.
     */
    setTextSize(size: number) {
        this.textSize = size;
    }

    /**
     * Sets the current text style to the given font as string.
     */
    setTextFontFamily(fontstyle: string) {
        this.textFontStyle = fontstyle;
    }

    /**
     * Sets the current text color to the given hex string.
     */
    setTextColor(color: string) {
        this.textColor = color;
    }

    setShapeSize(size: number) {
        this.shapeSize = size;
    }

    setShapeType(type: ShapeType) {
        this.shapeType = type;
    }

    setShapeWidth(width: number) {
        this.shapeWidth = width;
    }

    setShapeHeight(height: number) {
        this.shapeHeight = height;
    }

    /**
     * Enters or exits fullscreen mode for the sketch view depending
     * on the current status.
     */
    toggleFullscreen() {
        const element: any = document.querySelector('.sketch-view');
        const doc: any = document;

        this.isFullscreenActive = !this.isFullscreenActive;

        if (this.isFullscreenActive) {
            this.tempCanvasHeight = this.originalCanvasSize.height;
            this.tempCanvasWidth = this.originalCanvasSize.width;
            this.originalCanvasSize = {
                width: window.innerWidth,
                height: window.screen.height - 56
            };
            this.canvasDimensions.next(this.originalCanvasSize);

            if (element.requestFullScreen) {
                element.requestFullScreen();
            } else if (element.mozRequestFullScreen) {
                element.mozRequestFullScreen();
            } else if (element.webkitRequestFullscreen) {
                element.webkitRequestFullscreen();
            } else if (element.msRequestFullscreen) {
                element.msRequestFullscreen();
            }
        } else {
            this.originalCanvasSize = {
                width: this.tempCanvasWidth,
                height: this.tempCanvasHeight
            };
            this.tempCanvasHeight = null;
            this.tempCanvasWidth = null;
            this.canvasDimensions.next(this.originalCanvasSize);

            if (doc.cancelFullScreen) {
                doc.cancelFullScreen();
            } else if (doc.mozCancelFullScreen) {
                doc.mozCancelFullScreen();
            } else if (doc.webkitExitFullscreen) {
                doc.webkitExitFullscreen();
            } else if (doc.msExitFullscreen) {
                doc.msExitFullscreen();
            }
        }

        this.changeCanvasZoomLevel(1);
    }

    /**
     * Multiplies the canvas dimensions by the scale factor and
     * forces a redraw of the sketch (because on scale, the context is
     * wiped).
     */
    changeCanvasZoomLevel(scale) {
        const scaledWidth = this.originalCanvasSize.width * scale;
        const scaledHeight = this.originalCanvasSize.height * scale;

        this.activeCanvasRef.nativeElement.setAttribute('width', scaledWidth);
        this.activeCanvasRef.nativeElement.setAttribute('height', scaledHeight);
        this.activeCanvasRef.nativeElement.setAttribute('viewBox', `0 0 ${scaledWidth} ${scaledHeight}`);
        this.svgRenderer.setZoom(scale);

        this.canvasDimensions.next({
            width: scaledWidth,
            height: scaledHeight
        });
    }

    /**
     * Uploads a new preview image for a sketch to the server.
     */
    updateSketchPreview(imageData: Blob): Promise<any> {
        const headers = new HttpHeaders();
        const formData = new FormData();

        headers.append('Content-Type', 'multipart/form-data');
        formData.append('preview', imageData, 'preview.png');

        return this.http.post(Globals.BASE_PATH + '/api/sketch/preview/' + this.sketch.id,
            formData, { headers })
            .toPromise();
    }

    /**
     * Rerenders the full sketch on the canvas.
     */
    redrawSketch() {
        this.svgRenderer.redraw();

    }

    /**
     * Renders given element
     */
    renderElement(element: SketchElement): SVGElement {
        return this.svgRenderer.renderElement(element);
    }

    /**
     * Rerenders the given element. Used when attributes of an element changed.
     */
    reRenderElement(element: SketchElement) {
        this.svgRenderer.reRenderElement(element);
    }

    /**
     * Hides all given svg elements
     */
    hideElements(elements: SketchElement[]) {
        this.svgRenderer.hideElements(elements);
    }

    /**
     * Highlights the selected elements.
     */
    highlightElement(element: SketchElement, color: string, width?: number) {
        this.svgRenderer.highlightElement(element, color, width);
    }

    /**
     * Creates the selection frames
     */
    initSelectionFrames(color: string, fillColor: string, width: number) {
        this.svgRenderer.createSelectionFrames(color, fillColor, width);
    }

    /**
     * Creates the handles of the selection frame (the corners which you can drag)
     */
    initSelectionHandles(color: string, fillColor: string, width: number, cursors: string[]) {
        this.svgRenderer.createSelectionHandles(color, fillColor, width, cursors);
    }

    /**
     * Updates the selection frame
     */
    updateSelectionFrame(frameCorners: Vertex[], id: number) {
        this.svgRenderer.updateSelectionFrame(frameCorners, id);
    }

    /**
     * Updates the handles of the selection frame
     */
    updateSelectionHandles(vertices: Vertex[][]) {
        this.svgRenderer.updateSelectionHandles(vertices);
    }

    /**
     * Hides the selection frame
     */
    hideSelectionFrame(id: number) {
        this.svgRenderer.hideSelectionFrame(id);
    }

    /**
     * Hides the handles of the selection frame
     */
    hideSelectionHandles() {
        this.svgRenderer.hideSelectionHandles();
    }

    /**
     * Disconnects the websocket connection.
     */
    disconnect(): void {
        if (this.socket) {
            this.cursorData = [];
            delete this.cursorData;
            this.cursorData = new Array();
            this.socket.disconnect();
        }
    }

    toggleVisibility() {
        return this.http.put(`${Globals.BASE_PATH}/api/sketch/${this.sketch.id}/toggle-visibility`, {})
            .toPromise();
    }
}
