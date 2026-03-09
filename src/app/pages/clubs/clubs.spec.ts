import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Clubs } from './clubs';

describe('Clubs', () => {
  let component: Clubs;
  let fixture: ComponentFixture<Clubs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Clubs],
    }).compileComponents();

    fixture = TestBed.createComponent(Clubs);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
