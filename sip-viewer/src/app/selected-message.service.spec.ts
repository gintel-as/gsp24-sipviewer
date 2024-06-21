import { TestBed } from '@angular/core/testing';

import { SelectedMessageService } from './selected-message.service';

describe('SelectedMessageService', () => {
  let service: SelectedMessageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SelectedMessageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
