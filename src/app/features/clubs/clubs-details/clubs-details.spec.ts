import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClubsDetail } from './clubs-details';

describe('ClubsDetail', () => {
  let component: ClubsDetail;
  let fixture: ComponentFixture<ClubsDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClubsDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(ClubsDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
