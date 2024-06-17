import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HttpJsonComponent } from './http-json.component';

describe('HttpJsonComponent', () => {
  let component: HttpJsonComponent;
  let fixture: ComponentFixture<HttpJsonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpJsonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HttpJsonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
