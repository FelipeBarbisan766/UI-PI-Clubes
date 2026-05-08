import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Schedules } from './schedules';

describe('Schedules', () => {
  let component: Schedules;
  let fixture: ComponentFixture<Schedules>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Schedules],
    }).compileComponents();

    fixture = TestBed.createComponent(Schedules);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
