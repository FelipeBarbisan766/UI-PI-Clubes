import { ComponentFixture, TestBed } from '@angular/core/testing';

import {UserConfig } from './user-config';

describe('UserConfig', () => {
  let component: UserConfig;
  let fixture: ComponentFixture<UserConfig>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserConfig],
    }).compileComponents();

    fixture = TestBed.createComponent(UserConfig);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
