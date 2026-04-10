import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerifyMail } from './verify-mail';

describe('VerifyMail', () => {
  let component: VerifyMail;
  let fixture: ComponentFixture<VerifyMail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerifyMail],
    }).compileComponents();

    fixture = TestBed.createComponent(VerifyMail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
