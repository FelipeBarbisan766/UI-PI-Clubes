import { TestBed } from '@angular/core/testing';

import { ServiceSignUp } from './service-sign-up';

describe('ServiceSignUp', () => {
  let service: ServiceSignUp;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServiceSignUp);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
