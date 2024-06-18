import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MermaidComponent } from './mermaid.component';

describe('MermaidComponent', () => {
  let component: MermaidComponent;
  let fixture: ComponentFixture<MermaidComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MermaidComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MermaidComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
