import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanCalculatorModal } from './plan-calculator-modal';

describe('PlanCalculatorModal', () => {
  let component: PlanCalculatorModal;
  let fixture: ComponentFixture<PlanCalculatorModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlanCalculatorModal],
    }).compileComponents();

    fixture = TestBed.createComponent(PlanCalculatorModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
