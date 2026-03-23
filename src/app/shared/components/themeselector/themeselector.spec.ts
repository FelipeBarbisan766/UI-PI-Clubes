import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Themeselector } from './themeselector';

describe('Themeselector', () => {
  let component: Themeselector;
  let fixture: ComponentFixture<Themeselector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Themeselector],
    }).compileComponents();

    fixture = TestBed.createComponent(Themeselector);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
