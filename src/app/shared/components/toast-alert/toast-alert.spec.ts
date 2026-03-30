import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToastAlert } from './toast-alert';

describe('ToastAlert', () => {
  let component: ToastAlert;
  let fixture: ComponentFixture<ToastAlert>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastAlert],
    }).compileComponents();

    fixture = TestBed.createComponent(ToastAlert);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
