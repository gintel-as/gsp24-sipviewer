import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SIPViewerComponent } from './sip-viewer.component';

describe('SIPViewerComponent', () => {
  let component: SIPViewerComponent;
  let fixture: ComponentFixture<SIPViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SIPViewerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SIPViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
