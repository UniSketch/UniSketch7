import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatOverlayComponent } from './chat-overlay.component';

describe('ChatOverlayComponent', () => {
  let component: ChatOverlayComponent;
  let fixture: ComponentFixture<ChatOverlayComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChatOverlayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChatOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
