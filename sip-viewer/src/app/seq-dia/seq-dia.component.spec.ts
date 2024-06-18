import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeqDiaComponent } from './seq-dia.component';

describe('SeqDiaComponent', () => {
  let component: SeqDiaComponent;
  let fixture: ComponentFixture<SeqDiaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeqDiaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeqDiaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
