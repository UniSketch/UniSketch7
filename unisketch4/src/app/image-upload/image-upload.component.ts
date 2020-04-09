import {Component, OnInit, ElementRef, ViewChild, Renderer2} from '@angular/core';
import {AuthenticationService} from '../services/authentication.service';
import {SketchService} from '../services/sketch.service';
import {SketchToolbarComponent} from "../sketch-toolbar/sketch-toolbar.component";

@Component({
    selector: 'app-image-upload',
    templateUrl: './image-upload.component.html',
    styleUrls: ['../sketch-toolbar/sketch-toolbar.component.scss']
})
export class ImageUploadComponent implements OnInit {

    @ViewChild('imagePreview')
    private imagePreviewSrc: ElementRef;
    @ViewChild('imagePreviewDiv')
    private imagePreviewEle: ElementRef;
    private isSelected = false;
    private validFileExtensions = ['.jpg', '.jpeg', '.bmp', '.gif', '.png', '.svg'];


    /**
     * Determines the state of the picture upload modal.
     */
    private isPictureModalVisible = false;

    constructor(private sketchService: SketchService, private sketchToolbarComponent: SketchToolbarComponent, private authService: AuthenticationService, private renderer: Renderer2) {
    }

    ngOnInit() {
    }

    private get isImageSelected(): boolean {
        return this.sketchService.currentTool === this.sketchService.toolImage;
    }

    onMouseMove(e) {
        if (this.isSelected) {
            this.renderer.setStyle(this.imagePreviewEle.nativeElement, 'position', 'absolute');
            this.renderer.setStyle(this.imagePreviewEle.nativeElement, 'float', 'left');
            this.renderer.setStyle(this.imagePreviewEle.nativeElement, 'left', e.pageX + 'px');
            this.renderer.setStyle(this.imagePreviewEle.nativeElement, 'top', (e.pageY - 64) + 'px');
        }
    }

    private uploadImage(imageBase64) {
        this.calculateImageSize(imageBase64);
        this.selectImageTool(imageBase64);
    }

    private selectImageTool(imageBase64) {
        this.sketchService.toolSelector.deselect();
        this.sketchService.toolText.deactivateTextTool();
        this.sketchService.currentTool = this.sketchService.toolImage;
        this.sketchService.imageSrc = imageBase64;
        this.renderer.setAttribute(this.imagePreviewSrc.nativeElement, 'src', imageBase64);
        this.isSelected = true;
    }

    private calculateImageSize(imageBase64) {
        const img = new Image();
        img.src = imageBase64;
        img.addEventListener('load', (event) => {
            const sketchArea = document.getElementById('canvas');
            const maxWidth = Math.round(sketchArea.clientWidth * 0.8);
            const maxHeight = Math.round(sketchArea.clientHeight * 0.8);
            this.sketchService.imageWidth = img.width;
            if (img.width > maxWidth) {
                this.sketchService.imageWidth = maxWidth;
            }
            if (img.height > maxHeight) {
                this.sketchService.imageWidth = maxHeight;
            }
            this.renderer.setAttribute(this.imagePreviewSrc.nativeElement, 'width', this.sketchService.imageWidth * this.sketchToolbarComponent.zoomLevel + 'px');
        });
    }

    /**
     * Toggles visibility of the picture upload modal.
     */
    private togglePictureModal() {
        this.isPictureModalVisible = !this.isPictureModalVisible;
    }

    private getBase64(event) {
        const fileValid = this.validateFileExtension(event.target.files[0].name);
        if (fileValid) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onload = e => this.uploadImage('data:' + file.type + ';base64,' + reader.result.toString().split(',')[1]);
            reader.readAsDataURL(file);
            reader.onerror = function (error) {
                console.log('Error: ', error);
            };
        }
    }

    private validateFileExtension(filename) {
        if (filename.length > 0) {
            let isValid = false;
            for (let j = 0; j < this.validFileExtensions.length; j++) {
                const sCurExtension = this.validFileExtensions[j];
                // tslint:disable-next-line:max-line-length
                if (filename.substr(filename.length - sCurExtension.length, sCurExtension.length).toLowerCase() === sCurExtension.toLowerCase()) {
                    isValid = true;
                    break;
                }
            }
            if (!isValid) {
                alert('Sorry, ' + filename + ' is invalid, allowed extensions are: ' + this.validFileExtensions.join(', '));
                return false;
            }
        }
        return true;
    }
}
