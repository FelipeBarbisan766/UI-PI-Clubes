import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Plans } from './plans';

describe('Plans', () => {
  let component: Plans;
  let fixture: ComponentFixture<Plans>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Plans],
    }).compileComponents();

    fixture = TestBed.createComponent(Plans);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
