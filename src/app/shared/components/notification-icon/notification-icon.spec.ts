import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationIcon } from './notification-icon';

describe('NotificationIcon', () => {
  let component: NotificationIcon;
  let fixture: ComponentFixture<NotificationIcon>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationIcon],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationIcon);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
