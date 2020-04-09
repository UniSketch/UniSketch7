import {IncomingMessage} from "http";

export namespace SketchHelper {
    export function getIdFromRequest(req: IncomingMessage): number {
        const refUrl: string = req.headers.referer as string;
        const index = refUrl.lastIndexOf('/');

        if (index) {
            return +refUrl.substr(index + 1);
        }
        return 0;
    }
}