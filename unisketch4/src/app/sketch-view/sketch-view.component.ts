import {Component, ViewChild, ElementRef, OnInit, OnDestroy, AfterViewInit, HostListener} from '@angular/core';
import {Router, ActivatedRoute, NavigationEnd} from '@angular/router';
import {Observable} from 'rxjs';

import {SketchService} from '../services/sketch.service';
import {NotificationService} from '../services/notification.service';
import {AuthenticationService} from '../services/authentication.service'


declare var dragscroll: any;

/**
 * Main component of the sketch view. Holds the sketching canvas and toolbar.
 */
@Component({
    selector: 'app-sketch-view',
    templateUrl: './sketch-view.component.html',
    styleUrls: ['./sketch-view.component.scss']
})
export class SketchViewComponent implements OnInit, AfterViewInit, OnDestroy {

    /**
     * Reference to the canvas object from the template.
     */
    @ViewChild('canvas')
    private canvasRef: ElementRef;

    /**
     * Reference to the canvas container object from the template.
     */
    @ViewChild('container')
    private containerRef: ElementRef;

    /**
     * The id of the sketch to be shown.
     */
    private requestedId: number;

    /**
     * Dynamic width of the canvas.
     */
    private canvasWidth = 1920;

    /**
     * Dynamic height of the canvas.
     */
    private canvasHeight = 1020;

    private canvasViewBox = `0 0 ${this.canvasWidth} ${this.canvasHeight}`;

    /**
     * Saves the initial size of the canvas for reference.
     */
    private originalCanvasSize: object;

    private isDragScrollActive = false;

    private cursors: any[] = [];

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private notificationService: NotificationService,
        private sketchService: SketchService,
        private authenticationService: AuthenticationService
    ) {
    }

    ngOnInit() {
        // On param change, reconnect for the new sketch
        this.route.params.subscribe(params => {
            this.requestedId = +params['id'];
        });

        // On route change, disconnect from the WebSocket
        this.router.events.subscribe(value => {
            if (value instanceof NavigationEnd) {
                this.sketchService.disconnect();
            }
        });

        this.sketchService.isDragScrollActive.subscribe(value => {
            this.isDragScrollActive = value;
        });

        this.originalCanvasSize = {
            width: this.containerRef.nativeElement.getBoundingClientRect().width,
            height: this.containerRef.nativeElement.getBoundingClientRect().height
        };

        // Hand the initial canvas size over to the sketch service
        // so it can be referenced where needed
        this.sketchService.canvasSize = this.originalCanvasSize;

        this.sketchService.cursors.subscribe(cursors => {
            this.cursors = cursors;
        });

        this.resizeCanvas();
        //this.monitorMouse();
    }

    ngAfterViewInit() {
        // Connect to the requested sketching session
        this.sketchService.disconnect();
        this.sketchService.connect(this.requestedId);
    }

    ngOnDestroy() {
        // Make sure to disconnect when the component is destroyed. 
       
        if(this.authenticationService.isLoggedIn()){
            this.notificationService.create(`${this.sketchService.getSketch().title} has been saved.`, 'success');
        }        
        this.sketchService.disconnect();
        this.sketchService.getRenderer().clear();
    }


    /**
     * Evaluates the dimensions of the canvas container and sets the
     * canvas width and height to fill it out entirely.
     */
    private resizeCanvas() {
        this.canvasWidth = this.containerRef.nativeElement
            .getBoundingClientRect().width;
        this.canvasHeight = this.containerRef.nativeElement
            .getBoundingClientRect().height;

        //TODO might rework 0 0 to work with moving internally!
        this.canvasViewBox = `0 0 ${this.canvasWidth} ${this.canvasHeight}`;
    }

    private monitorMouse() {
        let prevEvent, currentEvent;

        document.getElementById('canvas').onmousemove = function (event) {
            currentEvent = event;
        };

        let maxSpeed = 0,
            prevSpeed = 0,
            speed = 0;

        setInterval(function () {
            if (prevEvent && currentEvent) {
                const movementX = Math.abs(currentEvent.screenX - prevEvent.screenX);
                const movementY = Math.abs(currentEvent.screenY - prevEvent.screenY);

                const movement = Math.sqrt(movementX * movementX + movementY * movementY);

                // speed=movement/100ms= movement/0.1s= 10*movement/s
                speed = 10 * movement; // current speed

                console.log('speed ' + Math.round(speed));

                console.log('maxSpeed ' + Math.round(
                    speed > maxSpeed ? (maxSpeed = speed) : maxSpeed));

                const acceleration = 10 * (speed - prevSpeed);
                console.log('acceleration ' + Math.round(acceleration));
            }

            prevEvent = currentEvent;
            prevSpeed = speed;
        }, 100);
    }
}
