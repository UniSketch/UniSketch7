import * as Express from 'express';
import * as SocketIO from 'socket.io';

import {sketchSessionManager} from "./sketch_session_manager";
import {User} from "../models/User";
import {RightsHelper} from "../helpers/rights_helper";
import {requireSketchAuth} from "../helpers/require_auth";
import {UserAction} from "../helpers/user_action";
import {db} from "../database";
import {SketchHelper} from "../helpers/sketch_helper";
import {GuestHelper} from "../helpers/guest_helper";
import {SketchElement} from "../models/SketchElement";
import {Polyline} from "../models/Polyline";
import {Shape} from "../models/Shape";
import {Text} from "../models/Text";
import {Image} from "../models/Image";

/**
 * Interface describing additional data put on a SocketIO client connection object.
 */
export interface UniSketchSocket {
    user?: User;
    session?: any;
    activeSketchId?: number;
    activeSketchLastLineId?: number;
    activeSketchRole?: number;
    u_R_currentArrayIndex?: number;
    u_R_userActions?: UserAction<SketchElement>[];
}

/**
 * Handles new SocketIO connections and incoming messages.
 */
export class WebsocketHandler {

    public makeSpace(socket: SocketIO.Socket & UniSketchSocket): void {
        if (socket.u_R_currentArrayIndex < socket.u_R_userActions.length - 1) {
            socket.u_R_currentArrayIndex++; // new entry for new action by user
            // delete all entries in higher array indexes
            socket.u_R_userActions.map((obj, i) => {
                if (i >= socket.u_R_currentArrayIndex) {
                    socket.u_R_userActions[i] = undefined;
                }
            });
        } else {
            socket.u_R_userActions.shift();
            socket.u_R_userActions[socket.u_R_currentArrayIndex] = undefined;
        }
    }

    /**
     * Sets up the SocketIO server and all of its event handlers.
     */
    constructor(io: SocketIO.Server, sessionHandler: Express.RequestHandler) {

        // Re-use the session handler by wrapping the express middleware in a socket io middleware
        io.use((socket, next) => {
            sessionHandler(socket.request, socket.request.res, next);
        });

        // Re-use the auth handler by wrapping the express middleware in a socket io middleware
        io.use((socket, next) => {
            requireSketchAuth(socket.request, socket.request.res, next);
        });

        // Handle incoming connections
        io.on('connection', async (socket: SocketIO.Socket & UniSketchSocket) => {
            // Refuse the connection if the client is not logged in
            if (!socket.request.session || !socket.request.user) {
                const id = SketchHelper.getIdFromRequest(socket.request);
                const sketch = await db.Sketch.findOne(id);

                if (sketch.is_public) {
                    socket.user = GuestHelper.generateUser(sketchSessionManager.getSketchSession(sketch.id));
                    socket.session = socket.request.session;

                    socket.emit('hello', {batch_interval: 0});

                    // Allows clients to join a sketch
                    socket.on('join_sketch', (data) => {
                        // Only if the sketch is public, it can be shown.
                        db.Sketch.findOne({where: {id: data.sketch_id, is_public: true}})
                          .then(sketch => {

                              // If the sketch does not have an active session already, one will be created
                              sketchSessionManager.getOrCreateSketchSession(io, sketch.id)
                                                  .then(sketchSession => {
                                                      // Cache active sketch id and role on the socket
                                                      socket.activeSketchId = sketch.id;
                                                      socket.activeSketchRole = 0;

                                                      //undo redo
                                                      socket.u_R_currentArrayIndex = -1;
                                                      socket.u_R_userActions = new Array(50);
                                                      //new - always reset on new session startup
                                                      sketchSession.undoable(socket, false);
                                                      sketchSession.redoable(socket, false);
                                                      console.log("UNDO_REDO: user joined sketch - Undo/Redo space is setup and ready.");

                                                      sketchSession.addClient(socket);
                                                      console.log(`Welcome to the sketch, ${socket.user.name}`);
                                                  });
                          });
                    });

                    // On disconnect, remove this client from its sketching session.
                    socket.on('disconnect', () => {
                        // Lookup the session the user is in
                        let sketchSession = sketchSessionManager.getSketchSession(socket.activeSketchId);
                        if (sketchSession) {

                            // Remove the user from the session
                            sketchSession.removeClient(socket);

                            // Close the session if there are no more users left
                            sketchSession.isEmpty()
                                         .then(empty => {
                                             if (empty) {
                                                 sketchSessionManager.closeSketchSession(sketchSession);
                                             }
                                         });
                        }

                        // Remove the cached fields from the SocketIO connection
                        delete socket.activeSketchId;
                        delete socket.activeSketchRole;
                        //NEW Undo-Redo
                        delete socket.u_R_currentArrayIndex;
                        socket.u_R_userActions = [];
                        delete socket.u_R_userActions;
                        console.log("UNDO_REDO: user left / was disconnected from sketch - Undo/Redo space is cleared and empty.");
                        // TODO this should probably delete the activeSketchLastLineId as well
                    });

                } else {
                    console.log(`Not logged in and sketch (${id}) is not public - killing websocket connection.`);
                    socket.disconnect();
                }

            } else {

                // Conveniently store user and session in the socket as well
                socket.user = socket.request.user;
                socket.session = socket.request.session;
                console.log("Hello " + socket.user.name + "!");

                // Send an initial hello to the client.
                // The batch_interval determines how often the client will send updates while drawing a line (in millisecond).
                // A batch interval of 0 means updates are instant (smoothest), -1 means lines will only be sent once the mouse is let go.
                // In the future, this could automatically scale based on the number of users in the sketch, or the general load of the application.
                socket.emit('hello', {batch_interval: 0});

                // Allows clients to join a sketch
                socket.on('join_sketch', async (data) => {
                    // Only users who've been granted a role on this sketch may join.
                    const right = await db.Right.findOne({
                        where: {
                            user: {id: socket.user.id},
                            sketch: {id: data.sketch_id},
                        },
                        relations: ['sketch'],
                    });

                    if (!right) {
                        const sketch = await db.Sketch.findOne({
                            where: {id: data.sketch_id, is_public: true},
                        });
                        if (sketch.is_public) {

                            // If the sketch does not have an active session already, one will be created
                            sketchSessionManager.getOrCreateSketchSession(io, sketch.id)
                                                .then(sketchSession => {
                                                    // Cache active sketch id and role on the socket
                                                    socket.activeSketchId = sketch.id;
                                                    socket.activeSketchRole = 0;

                                                    //undo redo
                                                    socket.u_R_currentArrayIndex = -1;
                                                    socket.u_R_userActions = new Array(50);
                                                    //new - always reset on new session startup
                                                    sketchSession.undoable(socket, false);
                                                    sketchSession.redoable(socket, false);
                                                    console.log("UNDO_REDO: user joined sketch - Undo/Redo space is setup and ready.");

                                                    sketchSession.addClient(socket);
                                                    console.log(`Welcome to the sketch, ${socket.user.name}`);
                                                });
                        } else {
                            socket.emit('fail', {message: 'no_permission'});
                        }
                        return;
                    }

                    sketchSessionManager.getOrCreateSketchSession(io, right.sketch.id)
                                        .then(sketchSession => {
                                            // Cache active sketch id and role on the socket
                                            socket.activeSketchId = right.sketch.id;
                                            socket.activeSketchRole = right.role_id;

                                            //undo redo
                                            socket.u_R_currentArrayIndex = -1;
                                            socket.u_R_userActions = new Array(50);
                                            //new - always reset on new session startup
                                            sketchSession.undoable(socket, false);
                                            sketchSession.redoable(socket, false);
                                            console.log("UNDO_REDO: user joined sketch - Undo/Redo space is setup and ready.");

                                            //chat
                                            console.log("chat history: user joined sketch - chat history of sketch session is restored to the client");
                                            //this should also send all history chat entries to a completly new joined client to this sketch - thats not bad - its a good addon :D
                                            //so all users connected to this sketch will get all chat history if they join sketch and want to work together
                                            //so a new joined client will also known about all written chat history and he will get all infos about previous discussions from the team
                                            sketchSession.restoreSavedMessages(socket.user.id, socket);

                                            sketchSession.addClient(socket);
                                            console.log("Welcome to the sketch, " + socket.user.name);
                                        });

                });

                // Allows clients to start drawing a new line at a specified point
                socket.on('start_line', (data) => {
                    // Lookup the session the user is in
                    let sketchSession = sketchSessionManager.getSketchSession(socket.activeSketchId);
                    if (!sketchSession) {
                        console.error('Received a start_line with no active sketch.');
                        return;
                    }

                    // Refuse to draw if the user's role doesn't allow changes to the sketch
                    if (!RightsHelper.isRoleAllowedToDraw(socket.activeSketchRole)) {
                        console.error('Received a start_line without permissions.');
                        return;
                    }

                    // Draw the line and store the id for further continue_line messages
                    let lineId = sketchSession.startLine(socket, data['x'], data['y'], data['color'], data['width'], data['dasharray'], data['brushStyle']);
                    socket.activeSketchLastLineId = lineId;

                    // NEU
                    sketchSession.undoable(socket, true);
                    sketchSession.redoable(socket, false);

                    const line = new Polyline();
                    line.id = lineId;
                    line.color = data['color'];
                    line.width = data['width'];
                    line.vertices = [data['x'], data['y']];
                    line.dasharray = data['dasharray'];
                    line.brushStyle = data['brushStyle'];

                    //NEW - Undo-Redo
                    this.makeSpace(socket);
                    socket.u_R_userActions[socket.u_R_currentArrayIndex] = new UserAction<Polyline>(true, line);
                });

                // Allows clients to add vertices to their last drawn line. Requires start_line to be sent first.
                socket.on('continue_line', (data) => {
                    // Lookup the session the user is in
                    let sketchSession = sketchSessionManager.getSketchSession(socket.activeSketchId);
                    if (!sketchSession) {
                        console.error('Received a continue_line with no active sketch.');
                        return;
                    }

                    // Refuse to draw if the user's role doesn't allow changes to the sketch
                    if (!RightsHelper.isRoleAllowedToDraw(socket.activeSketchRole)) {
                        console.error('Received a continue_line without permissions.');
                        return;
                    }

                    // Refuse to continue drawing if start_line has not been sent before
                    if (!socket.activeSketchLastLineId) {
                        console.error('Received a continue_line without prior start_line.');
                        return;
                    }

                    // Refuse to continue drawing if the vertex data appears to be corrupt
                    if (data['vertices'].length == 0 || data['vertices'].length % 2 != 0) {
                        console.error('Received incomplete vertex data: ' + data['vertices'].length);
                        return;
                    }

                    // Append the new vertices to the last drawn line
                    sketchSession.continueLine(socket, socket.activeSketchLastLineId, data['vertices']);

                    //NEW - Undo-Redo
                    if (typeof socket.u_R_userActions[socket.u_R_currentArrayIndex] !== 'undefined' && socket.u_R_userActions[socket.u_R_currentArrayIndex].getData() instanceof Polyline) { // currentIndex not empty
                        // append the new vertices in our new Undo-Redo dataSpace like in the global sketch data
                        socket.u_R_userActions[socket.u_R_currentArrayIndex].insertUpdateData(socket.activeSketchLastLineId, data['vertices']);
                    }
                });

                // Allows clients to move the last vertex of their last drawn line. Used for client-side line optimization. Requires start_line to be sent first.
                // Note that this is only going to be sent on immediate flushing (batchInterval of 0).
                socket.on('move_last_vertex', (data) => {
                    // Lookup the session the user is in
                    let sketchSession = sketchSessionManager.getSketchSession(socket.activeSketchId);
                    if (!sketchSession) {
                        console.error('Received a move_last_vertex with no active sketch.');
                        return;
                    }

                    // Refuse to draw if the user's role doesn't allow changes to the sketch
                    if (!RightsHelper.isRoleAllowedToDraw(socket.activeSketchRole)) {
                        console.error('Received a move_last_vertex without permissions.');
                        return;
                    }

                    // Refuse to continue drawing if start_line has not been sent before
                    if (!socket.activeSketchLastLineId) {
                        console.error('Received a move_last_vertex without prior start_line.');
                        return;
                    }

                    // Move the last vertex to the requested position
                    sketchSession.moveLastVertex(socket, socket.activeSketchLastLineId, data['x'], data['y']);

                    //NEW - Undo-Redo
                    if (typeof socket.u_R_userActions[socket.u_R_currentArrayIndex] !== 'undefined') { // currentIndex not empty
                        // change the last vertex in our new Undo-Redo dataSpace like in the global sketch data
                        socket.u_R_userActions[socket.u_R_currentArrayIndex].insertFinalData(socket.activeSketchLastLineId, data['x'], data['y']);
                    }
                });

                // Allows user to start new text. Basically just giving an id for the text and broadcasting
                // (still empty) Text-Element to all clients.
                socket.on('start_text', (data) => {
                    // Lookup the session the user is in
                    let sketchSession = sketchSessionManager.getSketchSession(socket.activeSketchId);
                    if (!sketchSession) {
                        console.error('Received a start_line with no active sketch.');
                        return;
                    }

                    // Refuse to draw if the user's role doesn't allow changes to the sketch
                    if (!RightsHelper.isRoleAllowedToDraw(socket.activeSketchRole)) {
                        console.error('Received a start_line without permissions.');
                        return;
                    }

                    const textId = sketchSession.startText(socket, data.text);

                    sketchSession.undoable(socket, true);
                    sketchSession.redoable(socket, false);

                    const text = new Text();
                    text.color = data.text['color'];
                    text.content = data.text['content'];
                    text.pos_x = data.text['pos_x'];
                    text.pos_y = data.text['pos_y'];
                    text.width = data.text['width'];
                    text.type = data.text['type'];
                    text.id = textId;

                    //NEW - Undo-Redo
                    this.makeSpace(socket);
                    socket.u_R_userActions[socket.u_R_currentArrayIndex] = new UserAction<Text>(true, text);
                });

                socket.on('send_image', (data) => {
                    // Lookup the session the user is in
                    let sketchSession = sketchSessionManager.getSketchSession(socket.activeSketchId);
                    if (!sketchSession) {
                        console.error('Received a send_image with no active sketch.');
                        return;
                    }

                    // Refuse to draw if the user's role doesn't allow changes to the sketch
                    if (!RightsHelper.isRoleAllowedToDraw(socket.activeSketchRole)) {
                        console.error('Received a send_image without permissions.');
                        return;
                    }

                    const imageId = sketchSession.startImage(socket, data.image);

                    sketchSession.undoable(socket, true);
                    sketchSession.redoable(socket, false);

                    const image = new Image();
                    image.color = data.image['color'];
                    image.pos_x = data.image['pos_x'];
                    image.pos_y = data.image['pos_y'];
                    image.width = data.image['width'];
                    image.src = data.image['src'];
                    image.id = imageId;

                    //NEW - Undo-Redo
                    this.makeSpace(socket);
                    socket.u_R_userActions[socket.u_R_currentArrayIndex] = new UserAction<Image>(true, image);
                });

                socket.on('send_shape', (data) => {
                    let sketchSession = sketchSessionManager.getSketchSession(socket.activeSketchId);
                    if (!sketchSession) {
                        console.error('Received a start_line with no active sketch.');
                        return;
                    }

                    // Refuse to draw if the user's role doesn't allow changes to the sketch
                    if (!RightsHelper.isRoleAllowedToDraw(socket.activeSketchRole)) {
                        console.error('Received a start_line without permissions.');
                        return;
                    }

                    const shapeId = sketchSession.receiveShape(socket, data.shape);

                    // NEU
                    sketchSession.undoable(socket, true);
                    sketchSession.redoable(socket, false);

                    const shape = new Shape();
                    shape.id = shapeId;
                    shape.color = data.shape['color'];
                    shape.fill = data.shape['fill'];
                    shape.pos_x = data.shape['pos_x'];
                    shape.pos_y = data.shape['pos_y'];
                    shape.width = data.shape['width'];
                    shape.height = data.shape['height'];
                    shape.type = data.shape['type'];
                    shape.size = data.shape['size'];
                    shape.mirrored_x = data.shape['mirrored_x'];
                    shape.mirrored_y = data.shape['mirrored_y'];

                    //NEW - Undo-Redo
                    this.makeSpace(socket);
                    socket.u_R_userActions[socket.u_R_currentArrayIndex] = new UserAction<Shape>(true, shape);

                });

                // Allows user to edit a text's content
                socket.on('edit_text', (data) => {
                    // Lookup the session the user is in
                    let sketchSession = sketchSessionManager.getSketchSession(socket.activeSketchId);
                    if (!sketchSession) {
                        console.error('Received a edit_text with no active sketch.');
                        return;
                    }

                    // Refuse to draw if the user's role doesn't allow changes to the sketch
                    if (!RightsHelper.isRoleAllowedToDraw(socket.activeSketchRole)) {
                        console.error('Received a edit_text without permissions.');
                        return;
                    }

                    const textId = sketchSession.editText(socket, data['text']);


                    if (data['final']) {
                        // NEU
                        sketchSession.undoable(socket, true);
                        sketchSession.redoable(socket, false);

                        const text = new Text();
                        text.color = data.text['color'];
                        text.content = data.text['content'];
                        text.pos_x = data.text['pos_x'];
                        text.pos_y = data.text['pos_y'];
                        text.width = data.text['width'];
                        text.type = data.text['type'];
                        text.id = textId;

                        //NEW - Undo-Redo
                        this.makeSpace(socket);
                        socket.u_R_userActions[socket.u_R_currentArrayIndex] = new UserAction<Text>(true, text, true);
                    }


                });

                // Allows user to edit sketchelements.
                socket.on('edit_elements', (data) => {
                    // Lookup the session the user is in
                    let sketchSession = sketchSessionManager.getSketchSession(socket.activeSketchId);
                    if (!sketchSession) {
                        console.error('Received a edit_elements with no active sketch.');
                        return;
                    }

                    // Refuse to draw if the user's role doesn't allow changes to the sketch
                    if (!RightsHelper.isRoleAllowedToDraw(socket.activeSketchRole)) {
                        console.error('Received a edit_elements without permissions.');
                        return;
                    }

                    sketchSession.editElements(socket, data.elements);
                });

                socket.on('delete_element', (data) => {
                    let sketchSession = sketchSessionManager.getSketchSession(socket.activeSketchId);
                    if (!sketchSession) {
                        console.error('Received a delete_element with no active sketch.');
                        return;
                    }

                    // Refuse to erase if the user's role doesn't allow changes to the sketch
                    if (!RightsHelper.isRoleAllowedToDraw(socket.activeSketchRole)) {
                        console.error('Received a delete_element without permissions.');
                        return;
                    }

                    let undoRedoElement = sketchSession.deleteElement(socket, data.element_id); // here is our Data
                    // NEU
                    sketchSession.undoable(socket, true);
                    sketchSession.redoable(socket, false);

                    // up from now similar to start_line logic
                    //NEW - Undo-Redo
                    this.makeSpace(socket);
                    socket.u_R_userActions[socket.u_R_currentArrayIndex] = new UserAction<SketchElement>(false, undoRedoElement);
                });

                // Allows clients to delete elements
                socket.on('delete_elements', (data) => {
                    // Lookup the session the user is in
                    let sketchSession = sketchSessionManager.getSketchSession(socket.activeSketchId);
                    if (!sketchSession) {
                        console.error('Received a delete_elements with no active sketch.');
                        return;
                    }

                    // Refuse to erase if the user's role doesn't allow changes to the sketch
                    if (!RightsHelper.isRoleAllowedToDraw(socket.activeSketchRole)) {
                        console.error('Received a delete_elements without permissions.');
                        return;
                    }

                    sketchSession.deleteElements(socket, data.elements);

                });

                // Allows clients to copy elements
                socket.on('copy_elements', (data) => {
                    // Lookup the session the user is in
                    let sketchSession = sketchSessionManager.getSketchSession(socket.activeSketchId);
                    if (!sketchSession) {
                        console.error('Received a copy_elements with no active sketch.');
                        return;
                    }

                    // Refuse to erase if the user's role doesn't allow changes to the sketch
                    if (!RightsHelper.isRoleAllowedToDraw(socket.activeSketchRole)) {
                        console.error('Received a copy_elements without permissions.');
                        return;
                    }

                    sketchSession.copyElements(socket, data.elements);

                });

                // Allows clients to move elements
                socket.on('move_elements', (data) => {
                    // Lookup the session the user is in
                    let sketchSession = sketchSessionManager.getSketchSession(socket.activeSketchId);
                    if (!sketchSession) {
                        console.error('Received a move_elements with no active sketch.');
                        return;
                    }

                    // Refuse to erase if the user's role doesn't allow changes to the sketch
                    if (!RightsHelper.isRoleAllowedToDraw(socket.activeSketchRole)) {
                        console.error('Received a move_elements without permissions.');
                        return;
                    }

                    sketchSession.moveElements(socket, data.elements);

                });

                // Allows clients to scale elements
                socket.on('scale_elements', (data) => {
                    // Lookup the session the user is in
                    let sketchSession = sketchSessionManager.getSketchSession(socket.activeSketchId);
                    if (!sketchSession) {
                        console.error('Received a scale_elements with no active sketch.');
                        return;
                    }

                    // Refuse to erase if the user's role doesn't allow changes to the sketch
                    if (!RightsHelper.isRoleAllowedToDraw(socket.activeSketchRole)) {
                        console.error('Received a scale_elements without permissions.');
                        return;
                    }

                    sketchSession.scaleElements(socket, data.elements);

                });

                socket.on('undo', (data) => {
                    // Lookup the session the user is in
                    let sketchSession = sketchSessionManager.getSketchSession(socket.activeSketchId);
                    if (!sketchSession) {
                        console.error('undo: no active sketch for this user found.');
                        return;
                    }
                    if (!RightsHelper.isRoleAllowedToDraw(socket.activeSketchRole)) {
                        console.error('undo: no permissions.');
                        return;
                    }

                    console.log('UNDO');
                    if (socket.u_R_currentArrayIndex > -1) {
                        if (socket.u_R_userActions[socket.u_R_currentArrayIndex].isFlagForward()) {
                            const element = socket.u_R_userActions[socket.u_R_currentArrayIndex];
                            if (element.isForUpdate() && element.getData() instanceof Text) {
                                const prevElement = socket.u_R_userActions[socket.u_R_currentArrayIndex - 1];
                                sketchSession.editText(socket, prevElement.getData(), true);
                            } else {
                                sketchSession.deleteElement(socket, element.getId());
                            }
                        } else {
                            let element = socket.u_R_userActions[socket.u_R_currentArrayIndex];
                            if (element.isForUpdate() && element.getData() instanceof Text) {
                                sketchSession.editText(socket, element.getData(), true);
                            } else {
                                sketchSession.drawUndoRedoElement(socket, element.getData());
                            }
                        }
                        socket.u_R_currentArrayIndex--;

                        // NEU
                        sketchSession.redoable(socket, true);
                        if (socket.u_R_currentArrayIndex == 0) {
                            sketchSession.undoable(socket, false);
                        }
                    }
                });

                socket.on('redo', (data) => {
                    // Lookup the session the user is in
                    let sketchSession = sketchSessionManager.getSketchSession(socket.activeSketchId);
                    if (!sketchSession) {
                        console.error('redo: no active sketch for this user found.');
                        return;
                    }
                    if (!RightsHelper.isRoleAllowedToDraw(socket.activeSketchRole)) {
                        console.error('redo: no permissions.');
                        return;
                    }

                    console.log("REDO");

                    if (socket.u_R_currentArrayIndex < (socket.u_R_userActions.length - 1) &&
                        typeof socket.u_R_userActions[socket.u_R_currentArrayIndex + 1] != 'undefined') {
                        socket.u_R_currentArrayIndex++;
                        if (socket.u_R_userActions[socket.u_R_currentArrayIndex].isFlagForward()) {
                            const element = socket.u_R_userActions[socket.u_R_currentArrayIndex];
                            if (element.isForUpdate() && element.getData() instanceof Text) {
                                sketchSession.editText(socket, element.getData(), true);
                            } else {
                                sketchSession.drawUndoRedoElement(socket, element.getData());
                            }

                        } else {
                            const element = socket.u_R_userActions[socket.u_R_currentArrayIndex];
                            if (element.isForUpdate() && element.getData() instanceof Text) {
                                sketchSession.editText(socket, element.getData(), true);
                            } else {
                                sketchSession.deleteElement(socket, element.getId());
                            }
                        }

                        // NEU
                        sketchSession.undoable(socket, true);
                        if (typeof socket.u_R_userActions[socket.u_R_currentArrayIndex + 1] == 'undefined') {
                            sketchSession.redoable(socket, false);
                        }
                    }
                });

                // Allows clients to change the background color
                socket.on('background_color', (data) => {
                    // Lookup the session the user is in
                    let sketchSession = sketchSessionManager.getSketchSession(socket.activeSketchId);
                    if (!sketchSession) {
                        console.error('Received a background_color with no active sketch.');
                        return;
                    }

                    // Refuse to change if the user's role doesn't allow changes to the sketch
                    if (!RightsHelper.isRoleAllowedToDraw(socket.activeSketchRole)) {
                        console.error('Received a background_color without permissions.');
                        return;
                    }

                    // Change the background to the new color
                    sketchSession.setBackgroundColor(socket, data.color);
                });

                // chat - NEW - socket emit from frontend - chat message send
                socket.on('chat', (data) => {
                    let sketchSession = sketchSessionManager.getSketchSession(socket.activeSketchId);
                    if (!sketchSession) {
                        console.error('Received a chat message with no active sketch.');
                        return;
                    }

                    if (!RightsHelper.canRoleIdAccessSketch(socket.activeSketchRole)) {
                        console.error('Received a chat message without permissions.');
                        return;
                    }

                    //other checks? - we think no because all users invited to the sketch are allowed to chat

                    sketchSession.propagateMessage(data.message, socket.user.name, socket.user.id, socket);
                });

                //NEW!!! - cursor
                socket.on('draw_cursor', (data) => {
                    // Lookup the session the user is in
                    let sketchSession = sketchSessionManager.getSketchSession(socket.activeSketchId);

                    if (!sketchSession) {
                        console.error('Received a draw_cursor with no active sketch.');
                        return;
                    }

                    if (!RightsHelper.isRoleAllowedToDraw(socket.activeSketchRole)) {
                        //                    console.error('Received a draw_cursor with no permissions.');
                        //delete this because this will be cause a lot of error logs on live system - several users dont have permissions to draw and move cursor over the canvas
                        //then this error would be in the backend log a lot of times
                        return;
                    }

                    sketchSession.drawCursor(socket, data.x, data.y);
                });

                // On disconnect, remove this client from its sketching session.
                socket.on('disconnect', () => {
                    // Lookup the session the user is in
                    let sketchSession = sketchSessionManager.getSketchSession(socket.activeSketchId);
                    if (sketchSession) {

                        // Remove the user from the session
                        sketchSession.removeClient(socket);

                        // Close the session if there are no more users left
                        sketchSession.isEmpty()
                                     .then(empty => {
                                         if (empty) {
                                             sketchSessionManager.closeSketchSession(sketchSession);
                                         }
                                     });
                    }

                    // Remove the cached fields from the SocketIO connection
                    delete socket.activeSketchId;
                    delete socket.activeSketchRole;
                    //NEW Undo-Redo
                    delete socket.u_R_currentArrayIndex;
                    socket.u_R_userActions = [];
                    delete socket.u_R_userActions;
                    console.log("UNDO_REDO: user left / was disconnected from sketch - Undo/Redo space is cleared and empty.");
                    // TODO this should probably delete the activeSketchLastLineId as well
                });
            }
        });
    }
}
