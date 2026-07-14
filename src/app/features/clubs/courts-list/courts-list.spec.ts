import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourtsList } from './courts-list';

describe('CourtsList', () => {
  let component: CourtsList;
  let fixture: ComponentFixture<CourtsList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourtsList],
    }).compileComponents();

    fixture = TestBed.createComponent(CourtsList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
