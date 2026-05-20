import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigClub } from './config-club';

describe('ConfigClub', () => {
  let component: ConfigClub;
  let fixture: ComponentFixture<ConfigClub>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfigClub],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfigClub);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
