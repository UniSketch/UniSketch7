import * as SocketIO from 'socket.io';

import {Sketch} from "../models/Sketch";
import {UniSketchSocket} from "./ws_handler";

import {db} from "../database";
import {SketchElement} from "../models/SketchElement";
import {User} from "../models/User";
import {Polyline} from "../models/Polyline";
import {Text} from "../models/Text";
import {SketchRepository} from "../repositories/SketchRepository";
import {SketchElementType} from "../helpers/sketch_element_type";
import {Shape} from "../models/Shape";
import {Image} from "../models/Image";

/**
 * Represents a sketching session, on a given sketch, with one or more users.
 */
export class SketchSession {

    /**
     * Temporary element id counter. Should be increased whenever its used as an id.
     */
    private elementIdCounter = 0;

    private elements: Map<number, SketchElement> = new Map<number, SketchElement>();

    private deletedElements: SketchElement[] = [];


    private isPublic: boolean = false;

    /**
     * Will be set to true while an async saving process is running, to prevent two concurrent saves running at the same time.
     */
    private isSaving: boolean;

    // TODO: Datentyp anpassen, notwendig? Größe ein Problem? Typisierung etc
    private tempChatMessages: any[];

    private connectedClients: User[] = [];

    /**
     * Copies the database representation of the given sketch into memory, assigning each line a temporary id.
     */
    constructor(private io: SocketIO.Server, public sketch: Sketch) {
        for (let element of sketch.sketchElements) {
            let elementId = ++this.elementIdCounter;
            this.elements.set(elementId, element);
        }

        this.isPublic = sketch.is_public;

        this.tempChatMessages = [];
        this.deletedElements = [];

        console.log("New session for sketch " + sketch.id);
        console.log("chat history space for this sketch session is setup and ready");
    }

    /**
     * Adds a client to this session. The client will be sent the full sketch, and other clients will be notified about the new participant.
     */
    public addClient(socket: SocketIO.Socket & UniSketchSocket): void {
        socket.join('sketch_' + this.sketch.id);
        this.connectedClients.push(socket.user);
        this.sendFullSketchTo(socket);
        this.broadcastExcept('user_join', {name: socket.user.name}, socket);
    }

    get clients(): User[] {
        return this.connectedClients;
    }

    /**
     * Forcefully removes a client from a session, notifying it about the removal with a reason.
     */
    public kickClient(socket: SocketIO.Socket, reason: string): void {
        socket.emit('kicked', {message: reason});
        this.removeClient(socket);
    }

    /**
     * Removes a client from this session. Other clients will be notified about the leaving participant.
     */
    public removeClient(socket: SocketIO.Socket & UniSketchSocket): void {
        socket.leave('sketch_' + this.sketch.id);

        //!!!NEW!!! cursor - send message to all other users of the sketch to delete the cursorData of the disconnected user
        this.broadcastExcept('delete_cursor', {id: socket.user.id}, socket);

        this.broadcastExcept('user_leave', {name: socket.user.name}, socket);
    }

    /**
     * Sends the given message to all clients.
     */
    public broadcast(message: string, data: any): void {
        this.io.to('sketch_' + this.sketch.id)
            .emit(message, data);
    }

    /**
     * Sends the given message to all clients, except one.
     */
    public broadcastExcept(message: string, data: any, except: SocketIO.Socket): void {
        except.broadcast.to('sketch_' + this.sketch.id)
            .emit(message, data);
    }

    /**
     * Sends the entire sketch to the client, including all properties and lines.
     * This happens across multiple messages in order to not overload the browser (some will fail to load if the packet is too large).
     */
    public sendFullSketchTo(socket: SocketIO.Socket & UniSketchSocket): void {
        // Send sketch metadata only first
        let data: any = {};
        data.title = this.sketch.title;
        data.is_public = this.sketch.is_public;
        if (this.sketch.background_color) {
            data.background_color = this.sketch.background_color;
        } else {
            data.background_color = '#FFFFFF';
        }
        data.role = socket.activeSketchRole;
        socket.emit('sketch', data);

        const elements: SketchElement[] = Array.from(this.elements.values());
        const elementsPerPacket: number = 100;
        let i: number = 0;
        const interval = setInterval(() => {
            socket.emit('sketch_part', {
                elements: elements.slice(i, i + elementsPerPacket)
            });
            i += elementsPerPacket;
            if (i >= elements.length) {
                clearInterval(interval);
            }
        }, 50);
    }

    /**
     * This function is invoked when a client starts drawing a line.
     * After assigning an id, the client will be sent confirmation, while all other clients will be sent the new line.
     */
    public startLine(socket: SocketIO.Socket, x: number, y: number, color: string, width: number, dasharray: string, brushStyle: string): number {
        const lineId = ++this.elementIdCounter;
        socket.emit('confirm_element', {element_id: lineId, type: SketchElementType.Polyline});
        const line = new Polyline();
        line.id = lineId;
        line.vertices = [x, y];
        line.color = color;
        line.width = width;
        line.dasharray = dasharray;
        line.brushStyle = brushStyle;

        this.broadcastExcept('draw_line', line, socket);
        this.elements.set(lineId, line);
        return lineId;
    }

    public drawUndoRedoLine(socket: SocketIO.Socket, lineId: number, color: string, width: number, vertices: any[], dasharray: string): void {
        const line = new Polyline();
        line.id = lineId;
        line.vertices = vertices;
        line.color = color;
        line.width = width;
        line.dasharray = dasharray;
        this.elements.set(lineId, line);
        socket.emit('confirm_line', {color: color, id: lineId, vertices: vertices, width: width, dasharray: dasharray});
        this.broadcastExcept('draw_line', line, socket);
    }

    public undoable(socket: SocketIO.Socket, available: boolean): void {
        socket.emit('undoable', {available: available});
    }

    public redoable(socket: SocketIO.Socket, available: boolean): void {
        socket.emit('redoable', {available: available});
    }

    /**
     * Appends further vertices to an existing line.
     * There is no confirmation sent to the client for this, other clients will be notified though.
     */
    public continueLine(socket: SocketIO.Socket, lineId: number, vertices: any[]): void {
        const line = this.elements.get(lineId);
        if (line && line instanceof Polyline) {
            line.vertices = line.vertices.concat(vertices);
            this.broadcastExcept('continue_line', {line_id: lineId, vertices: vertices}, socket);
        }
    }

    /**
     * Similar to continueLine this is used for appending further vertices to an existing line, however in this case, the last vertex is moved instead of adding a new one.
     * This is used to optimize lines from the client-side, which will skip adding a new vertex if the last three vertices are on the same line.
     */
    public moveLastVertex(socket: SocketIO.Socket, lineId: number, x: number, y: number): void {
        const line = this.elements.get(lineId);
        if (line && line instanceof Polyline) {
            line.vertices[line.vertices.length - 2] = x;
            line.vertices[line.vertices.length - 1] = y;
            this.broadcastExcept('continue_line', {line_id: lineId, vertices: [x, y]}, socket);
        }
    }

    /**
     * Starts a new Text. Basically just gives an id and broadcasts the text
     * to all clients.
     */
    public startText(socket: SocketIO.Socket, text: any): number {
        this.elementIdCounter++;
        text.id = this.elementIdCounter;
        const newText = this.convertText(text);
        this.elements.set(newText.id, newText);

        socket.emit('confirm_element', {element_id: newText.id, type: SketchElementType.Text});
        this.broadcastExcept('draw_element', newText, socket);
        return newText.id;
    }

    /**
     * Starts a new Image. Basically just gives an id and broadcasts the text
     * to all clients.
     */
    public startImage(socket: SocketIO.Socket, image: any): number {
        if (!image) {
            return;
        }
        this.elementIdCounter++;
        image.id = this.elementIdCounter;
        const newImage = this.convertImage(image);
        this.elements.set(newImage.id, newImage);

        socket.emit('confirm_element', {element_id: newImage.id, type: SketchElementType.Image});
        this.broadcastExcept('draw_element', newImage, socket);

        const baseImage = newImage.src;
        let ext = baseImage.substring(baseImage.indexOf("/") + 1, baseImage.indexOf(";base64"));
        const fileType = baseImage.substring("data:".length, baseImage.indexOf("/"));
        const regex = new RegExp(`^data:${fileType}\/${ext};base64,`, 'gi');

        //Extract base64 data.
        let base64Data = baseImage.replace(regex, "");

        //Gen Filename
        if (ext.includes('svg')) {
            base64Data = base64Data.replace('data:image/svg+xml;base64,', '');
            ext = 'svg';
        }
        let imgname = new Date().getTime().toString();
        let filename = imgname + '.' + ext;


        //Check if Image already exists
        const fs = require('fs');
        const dir = fs.opendirSync('src/images/');
        let dirFile;
        let imageExists = false;
        while ((dirFile = dir.readSync()) !== null) {
            try {
                if (!dirFile.isDirectory()) {
                    const data = fs.readFileSync('src/images/' + dirFile.name, 'base64');
                    if (base64Data == data.toString()) {
                        filename = dirFile.name;
                        imageExists = true;
                        break;
                    }
                }
            } catch (e) {
                console.log('Error:', e.stack);
            }
        }
        dir.closeSync(dirFile);

        //save Image
        if (!imageExists) {
            const imageSavePath = 'src/images/' + filename;
            fs.writeFileSync(imageSavePath, base64Data, 'base64');
        }

        //set image path to server path
        newImage.src = '/unisketch7/api/images/' + filename;

        return newImage.id;
    }

    /**
     * Starts a new Shape. Basically just gives an id and broadcasts the text
     * to all clients.
     */
    public receiveShape(socket: SocketIO.Socket, shape: any): number {
        if (!shape) {
            return;
        }
        this.elementIdCounter++;
        shape.id = this.elementIdCounter;
        const newShape = this.convertShape(shape);
        this.elements.set(newShape.id, newShape);

        socket.emit('confirm_element', {element_id: newShape.id, type: SketchElementType.Shape});
        this.broadcastExcept('draw_element', newShape, socket);
        return newShape.id;
    }

    public editText(socket: SocketIO.Socket, text: any, broadCastAll: boolean = false): number {
        const editedText = this.convertText(text);
        const key = this.getKey(text.id);
        if (key) {
            this.elements.delete(key);
            this.elements.set(editedText.id, editedText);
            if (broadCastAll) {
                this.broadcast('edit_text', {text: editedText});
            } else {
                this.broadcastExcept('edit_text', {text: editedText}, socket);
            }
        }
        return editedText.id;
    }

    /**
     * Edits given elements. Basically just replacec their old instance with
     * a new one.
     */
    public editElements(socket: SocketIO.Socket, elements: any[]): SketchElement[] {
        // first lets get the elements before we edit them to enable undo
        const undoRedoElements = [];
        for (let i = 0; i < elements.length; i++) {
            let element = this.elements.get(elements[i].id);
            undoRedoElements.push(element);
        }

        const convertedElements: SketchElement[] = [];
        for (let i = 0; i < elements.length; i++) {
            let editedElement;
            if (elements[i].vertices) {
                editedElement = this.convertLine(elements[i]);
            } else if (elements[i].height || elements[i].height === 0) {
                editedElement = this.convertShape(elements[i]);
            } else if (elements[i].content || elements[i].content === '') {
                editedElement = this.convertText(elements[i]);
            } else if (elements[i].src) {
                editedElement = this.convertImage(elements[i]);
            }
            const key = this.getKey(elements[i].id);
            if (key) {
                this.elements.delete(key);
                this.elements.set(editedElement.id, editedElement);
                convertedElements.push(editedElement);
            }
        }

        this.broadcastExcept('edit_elements', {elements: convertedElements}, socket);
        return undoRedoElements;
    }

    /**
     * Deletes given elements
     */
    public deleteElements(socket: SocketIO.Socket, elements: any[]): any {
        const ids: number[] = [];
        for (let i = 0; i < elements.length; i++) {
            ids.push(elements[i].id);
            const key = this.getKey(elements[i].id);
            const tmpElem = this.elements.get(key);
            this.deletedElements.push(tmpElem);
            this.elements.delete(key);
        }

        this.broadcast('delete_elements', {ids: ids});
    }

    /**
     * Copies given elements
     */
    public copyElements(socket: SocketIO.Socket, elements: any[]): any {
        const ids: number[] = [];
        const copiedElements: SketchElement[] = [];
        for (let i = 0; i < elements.length; i++) {
            this.elementIdCounter++;
            elements[i].id = this.elementIdCounter;
            ids.push(elements[i].id);
            let newElement;
            if (elements[i].vertices) {
                newElement = this.convertLine(elements[i]);
            } else if (elements[i].content) {
                newElement = this.convertText(elements[i]);
            } else if (elements[i].type) {
                newElement = this.convertShape(elements[i]);
            } else if (elements[i].src) {
                newElement = this.convertImage(elements[i]);
            }
            this.elements.set(newElement.id, newElement);
            copiedElements.push(newElement);
        }

        this.broadcast('copy_elements', {elements: copiedElements});

        // broadcast ids of new elements to invoker of copy method
        this.io.to(socket.id)
            .emit('copied_elements', {ids: ids});
    }

    /**
     * Moves given elements
     */
    public moveElements(socket: SocketIO.Socket, elements: any[]): any {
        const convertedElements: SketchElement[] = [];
        for (let i = 0; i < elements.length; i++) {
            let movedElement;
            if (elements[i].vertices) {
                movedElement = this.convertLine(elements[i]);
            } else if (elements[i].content) {
                movedElement = this.convertText(elements[i]);
            } else if (elements[i].type) {
                movedElement = this.convertShape(elements[i]);
            } else if (elements[i].src) {
                movedElement = this.convertImage(elements[i]);
            }
            convertedElements.push(movedElement);
            this.elements.get(this.getKey(movedElement.id))
                .setPos(movedElement.getPos());
        }

        this.broadcast('move_elements', {elements: convertedElements});
    }

    /**
     * Scales given elements
     */
    public scaleElements(socket: SocketIO.Socket, elements: any[]): any {
        const scaledElements: SketchElement[] = [];
        for (let i = 0; i < elements.length; i++) {
            let scaledElement;
            if (elements[i].vertices) {
                scaledElement = this.convertLine(elements[i]);
            } else if (elements[i].content) {
                scaledElement = this.convertText(elements[i]);
            } else if (elements[i].type) {
                scaledElement = this.convertShape(elements[i]);
            } else if (elements[i].src) {
                scaledElement = this.convertImage(elements[i]);
            }
            this.elements.get(this.getKey(scaledElement.id))
                .setPos(scaledElement.getPos());
            this.elements.get(this.getKey(scaledElement.id)).width = scaledElement.width;
            this.elements.get(this.getKey(scaledElement.id))['height'] = scaledElement.height;
            scaledElements.push(scaledElement);
        }


        this.broadcast('scale_elements', {elements: scaledElements});
    }

    public deleteElement(socket: SocketIO.Socket, elementId: number): SketchElement {
        //new: getting tmpLine for Undo-Redo
        const key = this.getKey(elementId);

        const tmpElem = this.elements.get(key);
        this.deletedElements.push(tmpElem);
        this.elements.delete(key);

        this.broadcast('delete_element', {element_id: elementId});
        //new: return tmpLine for Undo-Redo
        return tmpElem;
    }

    /**
     * Changes the background color of a sketch, and notifies all clients of the change.
     */
    public setBackgroundColor(socket: SocketIO.Socket, colorHexString: string): void {
        this.sketch.background_color = colorHexString;
        this.broadcast('background_color', {color: colorHexString});
    }

    // NEU -  normales chat text senden - socket emits und broadcasts zum anzeigen
    // danach internes speichern in array - wird solange erhalten bis komplette session weg ist
    public propagateMessage(message: String, userName: String, userId: Number, socket: SocketIO.Socket & UniSketchSocket): void {
        // Fallunterscheidung zwischen eigener Nachricht und fremder Nachricht für Anzeige
        socket.emit('chat', {message: message, username: userName, owner: true});
        this.broadcastExcept('chat', {message: message, username: userName, owner: false}, socket);

        this.tempChatMessages.push({message: message, userId: userId, username: userName});
    }

    // NEU - restore wenn client dieser skizzensession joined und chat history restored werden soll
    public restoreSavedMessages(userId: Number, socket: SocketIO.Socket & UniSketchSocket): void {
        if (this.tempChatMessages) {
            this.tempChatMessages.forEach(elem => {
                if (elem.userId === userId) {
                    socket.emit('chat', {message: elem.message, username: elem.username, owner: true});
                } else {
                    socket.emit('chat', {message: elem.message, username: elem.username, owner: false});
                }
            });
        }
    }

    //!!!NEW!!! cursor
    public drawCursor(socket: SocketIO.Socket & UniSketchSocket, x: number, y: number): void {
        this.broadcastExcept('draw_cursor', {x: x, y: y, id: socket.user.id, name: socket.user.name}, socket);
    }

    /**
     * Returns a promise resolving to true if there are no more clients in this sketch session.
     */
    public isEmpty(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.io.in('sketch_' + this.sketch.id)
                .clients((error: any, clients: any[]) => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    resolve(clients.length == 0);
                });
        });
    }

    /**
     * Saves the sketch from memory to the database. Will resolve to true if a save has been performed, to false if another save is already in progress.
     */
    public saveSketch(): Promise<any> {
        // Don't allow two concurrent saves at the same time.
        if (this.isSaving) {
            return Promise.resolve(false);
        }


        return new Promise(async (resolve, reject) => {
            this.isSaving = true;

            // Save sketch lines by first deleting all lines for a given sketch, and then re-inserting the lines from memory in bulk.
            // This must be run in a transaction or else you'll risk data loss.

            await db.Connection.transaction(async (em: any) => {
                try {

                    console.log('Delete ', this.deletedElements);
                    await em.remove(this.deletedElements);
                    this.deletedElements = [];

                    const elements: SketchElement[] = [];
                    for (const element of this.elements.values()) {
                        element.sketch = this.sketch;
                        elements.push(element);
                        await em.save(element);
                    }

                    this.sketch.sketchElements = elements;
                    const sketch = Object.assign({}, this.sketch);

                    delete sketch.title;
                    delete sketch.title_small;
                    sketch.updated_at = new Date();
                    delete sketch.created_at;

                    await em.getCustomRepository(SketchRepository)
                        .save(sketch);

                    this.isSaving = false;
                    resolve(true);
                } catch (err) {
                    reject(err);
                }
            });

        });

    }

    /**
     * Closes this sketching session and saves the sketch to the database.
     */
    public closeSession(): Promise<any> {
        console.log("chat history: all users left sketch and sketch session will be closed now");
        console.log("chat history: delete all chat history for this sketch session");
        this.tempChatMessages = [];
        delete this.tempChatMessages;
        return this.saveSketch();
    }

    /**
     * This method is called when a user has gotten its right to a sketch revoked via the REST API.
     */
    public onRightRevoked(userId: number): void {
        // Retrieve a list of all connected clients
        this.io.in('sketch_' + this.sketch.id)
            .clients((error: any, clients: any) => {
                if (error) {
                    return;
                }

                // Find the SocketIO counterpart of the client who's been kicked out
                for (let client of clients) {
                    let socket = <SocketIO.Socket & UniSketchSocket>this.io.sockets.connected[client];
                    if (socket.user.id == userId) {
                        this.kickClient(socket, "rights_revoked");
                        break;
                    }
                }
            });
    }

    /**
     * This method is called when a user has gotten its role to a sketch changed via the REST API.
     */
    public onRoleUpdated(userId: number, newRole: number): void {
        // Retrieve a list of all connected clients
        this.io.in('sketch_' + this.sketch.id)
            .clients((error: any, clients: any) => {
                if (error) {
                    return;
                }

                // Find the SocketIO counterpart of the client who's been kicked out
                for (let client of clients) {
                    let socket = <SocketIO.Socket & UniSketchSocket>this.io.sockets.connected[client];
                    if (socket.user.id == userId) {
                        // Update the cached role and notify the client of the change
                        socket.activeSketchRole = newRole;
                        socket.emit('role_updated', {role: newRole});

                        //!!!NEW!!! cursor - if role is no longer allowed to draw
                        //send message to all other users of the sketch to delete the cursorData of the user
                        if (newRole === 1) {
                            this.broadcastExcept('delete_cursor', {id: socket.user.id}, socket);
                        }

                        break;
                    }
                }
            });
    }

    public drawUndoRedoElement(socket: SocketIO.Socket & UniSketchSocket, elementData: SketchElement) {
        this.elements.set(elementData.id, elementData);
        socket.emit('confirm_element', {element: elementData});
        this.broadcastExcept('draw_element', elementData, socket);
    }

    private getKey(elementId: number) {
        return [...this.elements].find(([key, elem]) => elem['id'] === elementId)[0];
    }

    private convertLine(line: any): Polyline {
        if (!line.color) {
            line.color = 'black';
        }

        if (!line.width) {
            line.width = 1;
        }

        let tmpVertices = [];
        for (let vertex of line.vertices) {
            tmpVertices.push(vertex.x);
            tmpVertices.push(vertex.y);
        }

        const polyline: Polyline = new Polyline();
        polyline.id = line.id;
        polyline.color = line.color;
        polyline.width = line.width;
        polyline.updated_at = line.updated_at;
        polyline.created_at = line.created_at;
        polyline.sketch = this.sketch;
        polyline.vertices = tmpVertices;

        return polyline;
    }

    private convertText(f_text: any): Text {
        if (!f_text.color) {
            f_text.color = 'black';
        }

        if (!f_text.width) {
            f_text.width = 8;
        }

        if (!f_text.pos_x) {
            f_text.pos_x = 200;
        }

        if (!f_text.pos_y) {
            f_text.pos_y = 200;
        }

        if (!f_text.content) {
            f_text.content = "";
        }

        if (!f_text.type) {
            f_text.type = "Arial";
        }

        const text: Text = new Text();
        text.content = f_text.content;
        text.id = f_text.id;
        text.color = f_text.color;
        text.width = f_text.width;
        text.updated_at = f_text.updated_at;
        text.created_at = f_text.created_at;
        text.sketch = this.sketch;
        text.type = f_text.type;
        text.pos_x = f_text.pos_x;
        text.pos_y = f_text.pos_y;

        return text;
    }

    private convertImage(f_image: any): Image {

        const image: Image = new Image();
        image.id = f_image.id;
        image.color = f_image.color;
        image.width = f_image.width;
        image.updated_at = f_image.updated_at;
        image.created_at = f_image.created_at;
        image.sketch = this.sketch;
        image.src = f_image.src;
        image.pos_x = f_image.pos_x;
        image.pos_y = f_image.pos_y;

        return image;
    }

    private convertShape(shape: any): Shape {
        const elem: Shape = new Shape();
        elem.id = shape.id;
        elem.color = shape.color;
        elem.fill = shape.fill;
        elem.width = shape.width;
        elem.height = shape.height;
        elem.updated_at = shape.updated_at;
        elem.created_at = shape.created_at;
        elem.size = shape.size;
        elem.type = shape.type;
        elem.pos_x = shape.pos_x;
        elem.pos_y = shape.pos_y;
        elem.sketch = shape.sketch;
        elem.mirrored_x = shape.mirrored_x;
        elem.mirrored_y = shape.mirrored_y;
        return elem;
    }
}
