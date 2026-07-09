import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserReserve } from './user-reserves';

describe('UserReserve', () => {
  let component: UserReserve;
  let fixture: ComponentFixture<UserReserve>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserReserve],
    }).compileComponents();

    fixture = TestBed.createComponent(UserReserve);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
