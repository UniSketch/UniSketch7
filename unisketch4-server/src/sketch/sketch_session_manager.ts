import {SketchSession} from './sketch_session';
import {db} from "../database";

/**
 * Keeps track of all active sketching sessions.
 */
class SketchSessionManager {

    /**
     * Active sketching sessions mapped by their sketch id.
     */
    private sketchSessions: Map<number, SketchSession> = new Map<number, SketchSession>();

    /**
     * Attempts to lookup an existing session for a given sketch, and if none exists, will start a new one.
     * Returns a Promise resolving to the sketching session.
     */
    public getOrCreateSketchSession(io: SocketIO.Server, sketchId: number): Promise<SketchSession> {
        if (!this.sketchSessions.has(sketchId)) {
            return new Promise((resolve, reject) => {
                db.Sketch.findOne(
                    {
                        where: {id: sketchId},
                        select: ['id', 'title', 'is_public', 'background_color'],

                    })
                  .then(async sketch => {
                      sketch.sketchElements = await db.SketchElement.find({
                          where: {
                              sketch: {id: sketch.id},
                          },
                          order: {
                              created_at: "ASC",
                          }
                      });


                      let sketchSession = new SketchSession(io, sketch);
                      this.sketchSessions.set(sketch.id, sketchSession);
                      resolve(sketchSession);
                  })
                  .catch(err => {
                      reject(err);
                  });
            });
        }
        return Promise.resolve(this.sketchSessions.get(sketchId));
    }

    /**
     * Returns an active sketching session for a sketch id, or null if there is no active session for this sketch.
     */
    public getSketchSession(sketchId: number): SketchSession | null {
        return this.sketchSessions.get(sketchId);
    }

    /**
     * Closes an active sketching session, deleting it once its saved.
     */
    public closeSketchSession(sketchSession: SketchSession): void {
        sketchSession.closeSession()
                     .then(result => {
                         if (result) {
                             this.sketchSessions.delete(sketchSession.sketch.id);
                         }
                     });
    }

}

export let sketchSessionManager = new SketchSessionManager();