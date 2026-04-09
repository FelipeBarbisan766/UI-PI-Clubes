import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectRole } from './select-role';

describe('SelectRole', () => {
  let component: SelectRole;
  let fixture: ComponentFixture<SelectRole>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectRole],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectRole);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
