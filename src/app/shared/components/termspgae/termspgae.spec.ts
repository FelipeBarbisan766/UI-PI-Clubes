import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Termspgae } from './termspgae';

describe('Termspgae', () => {
  let component: Termspgae;
  let fixture: ComponentFixture<Termspgae>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Termspgae],
    }).compileComponents();

    fixture = TestBed.createComponent(Termspgae);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
