import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClubsDetails } from './clubs-details';

describe('ClubsDetails', () => {
  let component: ClubsDetails;
  let fixture: ComponentFixture<ClubsDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClubsDetails],
    }).compileComponents();

    fixture = TestBed.createComponent(ClubsDetails);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
