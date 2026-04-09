import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClubsList } from './clubs-list';

describe('ClubsList', () => {
  let component: ClubsList;
  let fixture: ComponentFixture<ClubsList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClubsList],
    }).compileComponents();

    fixture = TestBed.createComponent(ClubsList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
