# UniSketch4

## Repository Structure
* `unisketch4` contains the source code for the Angular frontend
* `unisketch4-server` contains the source code for the NodeJS backend

## Prerequisites
1. Install NodeJS (including NPM)
2. Frontend: Run `npm install -g @angular/cli` in a command line
3. Frontend: Run `npm install` in `unisketch4` to download frontend dependencies
4. Backend: Run `npm install` in `unisketch4-server` to download backend dependencies
5. Backend: Copy `unisketch4-server/config/database.json.example` to `unisketch4-server/config/database.json` and configure `username`, `password`, `database` and `host`.
6. Backend: Copy `unisketch4-server/config/config.json.example` to `unisketch4-server/config/config.json` and configure the mail settings and `session_secret` (with just any secret string).

## Running UniSketch locally
Make sure to complete all prerequisited and then execute the `run_backend_dev` and `run_frontend_dev` scripts.
Assuming there were no errors, UniSketch will be accessible at http://localhost:4200

## Documentation
* [REST Endpoints](https://github.com/eduQu/unisketch7/blob/master/endpoints.md)
* [Websocket Protocol](https://github.com/eduQu/unisketch7/blob/master/websockets.md)
* [Code Documentation]()

To regenerate code documentation, run the following in a command line:
`npm run compodoc`
