import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Courts } from './courts';

describe('Courts', () => {
  let component: Courts;
  let fixture: ComponentFixture<Courts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Courts],
    }).compileComponents();

    fixture = TestBed.createComponent(Courts);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
