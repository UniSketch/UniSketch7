import { Component, OnInit, HostListener, ViewChild, ElementRef} from '@angular/core';

import { SketchService } from '../services/sketch.service';

@Component({
    selector: 'app-chat-overlay',
    templateUrl: './chat-overlay.component.html',
    styleUrls: ['./chat-overlay.component.scss']
})
export class ChatOverlayComponent implements OnInit {
    @ViewChild('messageRef')
    private messageRef: ElementRef;

    @ViewChild('messageBar')
    private messageBar: ElementRef;

    private messages: any[] = [];

    constructor(private sketchService: SketchService) { }

    ngOnInit() {
        this.sketchService.chatMessages.subscribe(message => {
            this.messages.push(message);
            setTimeout(() => {
                this.messageBar.nativeElement.scrollTop=this.messageBar.nativeElement.scrollHeight;
            }, 10);
        });
    }

    private handleKeydown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'enter') {
          e.preventDefault();
          this.sendMessage();
      }
    }

    private sendMessage() {
        if (this.messageRef.nativeElement.value && this.messageRef.nativeElement.value.trim().length > 0) {
            this.sketchService.sendMessage(this.messageRef.nativeElement.value);
            this.messageRef.nativeElement.value = '';
        }
    }
}
