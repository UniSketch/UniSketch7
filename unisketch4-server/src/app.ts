import * as Express from 'express';
import * as FileUpload from 'express-fileupload';
import * as BodyParser from 'body-parser';
import * as ExpressSession from 'express-session';
import * as Http from 'http';
import * as SocketIO from 'socket.io';

import {Routes} from "./routes";
import {WebsocketHandler} from "./sketch/ws_handler";
import {Database, db} from './database';
import {TypeormStore} from "connect-typeorm";
import {Session} from "./models/Session";


/**
 * Main class for hte UniSketch backend. Sets up and configures the server.
 */
export class App {

    /*
     * Loaded from the config.json file. By default, the 'development' section will be loaded unless the NODE_ENV environment variable is set to something else.
     * See config.json.example for the expected structure.
     */
    public config: any;

    private express: any;
    private server: Http.Server;
    private io: SocketIO.Server;
    private sessionHandler: Express.RequestHandler;
    private websocketHandler: WebsocketHandler;

    private static instance: App = new App();

    /**
     * Set up the HTTP server and its submodules, and bind all routes.
     */
    constructor() {
        App.instance = this;
        this.config = require('./config/config.json')[process.env.NODE_ENV || 'development'];
    }

    private initialize(): void {
        this.express = Express();

        // We create our own http server instead of letting express create it in case we want to provide HTTPS in the future
        this.server = Http.createServer(this.express);

        // Have SocketIO listen on a custom path on our server. The /api/ is important to make requests not redirect to the Angular index.
        this.io = SocketIO(this.server, {path: this.config.base_path + 'api/socket.io'});

        // body-parser will parse request content and expose it as a JavaScript object in req.body
        this.express.use(BodyParser.urlencoded({extended: true}));
        this.express.use(BodyParser.json());

        // express-fileupload will parse submitted files and expose them in req.files
        this.express.use(FileUpload());

        // Serve the built Angular app
        this.express.use(this.config.base_path, Express.static(__dirname + '/dist'));

        // TODO
        // express-session will automatically keep track of client sessions
        const sessionStore = new TypeormStore({}).connect(db.Connection.getRepository(Session));
        this.sessionHandler = ExpressSession({
            secret: this.config.session_secret,
            resave: false,
            saveUninitialized: false,
            store: sessionStore
        });
        this.express.use(this.sessionHandler);
        // Bind all routes to the app (this executes ./routes/index.js which does the actual magic)
        Routes.apply(this.express, this.config.base_path);

        // Unknown routes always end up at the Angular frontend, unless their path contains /api/
        // This allows refreshing the Angular page without running into a 404
        this.express.use((req: Express.Request, res: Express.Response) => {
            if (req.url.indexOf("/api/") == -1) {
                res.sendFile(__dirname + '/dist/index.html');
            } else {
                res.status(404)
                   .send("Not found.");
            }
        });

        // Create the WebsocketHandler, which manages all SocketIO connections and handles messages.
        this.websocketHandler = new WebsocketHandler(this.io, this.sessionHandler);
    }

    /**
     * Starts listening for HTTP requests on the configured port.
     */
    public start() {
        Database.initInstance()
                .then((success: boolean) => {
                    if (success) {
                        this.initialize();
                        this.server.listen(this.config.port);
                        console.log('UniSketch is now running on port ' + app.config.port);
                    } else {
                        console.log('An error occurred while setting up the database.');
                    }
                })
                .catch(err => {
                    console.log('An error occurred while setting up the database.', err);
                });
    }

    public static getInstance(): App {
        return App.instance;
    }

}

export const app = App.getInstance();
