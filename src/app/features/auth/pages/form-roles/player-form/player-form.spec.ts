import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerForm } from './player-form';

describe('PlayerForm', () => {
  let component: PlayerForm;
  let fixture: ComponentFixture<PlayerForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerForm],
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
