import "reflect-metadata";
import {Connection, createConnection, Repository} from "typeorm";
import {UserRepository} from "./repositories/UserRepository";
import {SketchRepository} from "./repositories/SketchRepository";
import {RightRepository} from "./repositories/RightRepository";
import {PolylineRepository} from "./repositories/PolylineRepository";
import {FolderRepository} from "./repositories/FolderRepository";
import {TagRepository} from "./repositories/TagRepository";
import {SketchTagRepository} from "./repositories/SketchTagRepository";
import {TextRepository} from "./repositories/TextRepository";
import {SketchElementRepository} from "./repositories/SketchElementRepository";
import {PositionedSketchElementRepository} from "./repositories/PositionedSketchElementRepository";
import {Session} from "./models/Session";
import {Folder} from "./models/Folder";
import {Polyline} from "./models/Polyline";
import {PositionedSketchElement} from "./models/PositionedSketchElement";
import {Right} from "./models/Right";
import {Sketch} from "./models/Sketch";
import {SketchElement} from "./models/SketchElement";
import {SketchTag} from "./models/SketchTag";
import {Tag} from "./models/Tag";
import {Text} from "./models/Text";
import {User} from "./models/User";
import {Shape} from "./models/Shape";
import {ShapeRepository} from "./repositories/ShapeRepository";
import {Image} from "./models/Image";
import {ImageRepository} from "./repositories/ImageRepository";

/**
 * Keeps track of all database models and the associations between them.
 */
export class Database {

    /**
     * Database model for the users table.
     */
    public User: UserRepository;

    /**
     * Database model for the sketches table.
     */
    public Sketch: SketchRepository;

    /**
     * Database model for the rights table.
     */
    public Right: RightRepository;

    /**
     * Database model for the polylines table.
     */
    public Polyline: PolylineRepository;

    /**
     * Database model for the folders table.
     */
    public Folder: FolderRepository;

    public Shape: ShapeRepository;

    public Tag: TagRepository;
    public SketchTag: SketchTagRepository;
    public Text: TextRepository;

    public SketchElement: SketchElementRepository;

    public PositionedSketchElement: PositionedSketchElementRepository;

    public Session: Repository<Session>;

    public Connection: Connection;

    private static instance: Database = new Database();
    private Image: ImageRepository;

    /**
     * Sets up the database and its models, based on settings from the database.json configuration file.
     * By default, the 'development' section will be loaded unless the NODE_ENV environment variable is set to something else.
     * See database.json.example for the expected structure.
     */
    constructor() {
        Database.instance = this;
    }


    public static initInstance(): Promise<boolean> {
        const config = require('./config/database.json')[process.env.NODE_ENV || 'development'];

        config.entities = [
            Folder, Polyline, PositionedSketchElement, Right, Session, Sketch, SketchElement, SketchTag, Tag, Text, User, Shape, Image
        ];

        const db = Database.instance;

        return new Promise((resolve, reject) => {
            createConnection(config)
                .then(connection => {
                    db.Connection = connection;

                    db.Session = connection.getRepository(Session);

                    db.User = connection.getCustomRepository(UserRepository);

                    db.Sketch = connection.getCustomRepository(SketchRepository);
                    db.SketchElement = connection.getCustomRepository(SketchElementRepository);
                    db.SketchTag = connection.getCustomRepository(SketchTagRepository);

                    db.PositionedSketchElement = connection.getCustomRepository(PositionedSketchElementRepository);

                    db.Folder = connection.getCustomRepository(FolderRepository);
                    db.Right = connection.getCustomRepository(RightRepository);
                    db.Tag = connection.getCustomRepository(TagRepository);

                    db.Polyline = connection.getCustomRepository(PolylineRepository);
                    db.Text = connection.getCustomRepository(TextRepository);
                    db.Shape = connection.getCustomRepository(ShapeRepository);
                    db.Image = connection.getCustomRepository(ImageRepository);

                    console.log('Database setup successful.');
                    resolve(true);
                })
                .catch(err => {
                    console.log(err);
                    resolve(false);
                });
        });
    }

    public static getInstance(): Database {
        return Database.instance;
    }

}

export const db = Database.getInstance();
