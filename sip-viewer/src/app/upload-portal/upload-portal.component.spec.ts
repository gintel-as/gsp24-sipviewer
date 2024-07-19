import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadPortalComponent } from './upload-portal.component';

describe('UploadPortalComponent', () => {
  let component: UploadPortalComponent;
  let fixture: ComponentFixture<UploadPortalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadPortalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadPortalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
