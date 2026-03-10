import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchHome } from './search-home';

describe('SearchHome', () => {
  let component: SearchHome;
  let fixture: ComponentFixture<SearchHome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchHome],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchHome);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
