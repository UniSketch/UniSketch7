import {Router} from '@angular/router';
import {Component, OnInit} from '@angular/core';
import {PublicSketchesService} from "../services/public-sketches.service";
import {Sketch} from "../models/sketch.model";


/**
 * Component for the sketch library.
 */
@Component({
    selector: 'public-sketches',
    templateUrl: './public-sketches.component.html',
    styleUrls: ['./public-sketches.component.scss'],
    providers: [PublicSketchesService]
})
export class PublicSketchesComponent implements OnInit {

    /**
     * List of up to 20 public sketches.
     */
    private sketches: any[];


    constructor(private publicSketchesService: PublicSketchesService) {
    }

    ngOnInit() {
        // Loads all sketches from the user's library.
        this.publicSketchesService.getAllPublicSketches()
            .then(sketches => {
                this.sketches = <Sketch[]>sketches;
            })
            .catch(err => {
                //TODO handle error
                console.error(err);
            });
    }
}
