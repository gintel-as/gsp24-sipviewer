import { TestBed } from '@angular/core/testing';

import { FetchJsonService } from './fetch-json.service';

describe('FetchJsonService', () => {
  let service: FetchJsonService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FetchJsonService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
