import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CookieNotice } from './cookie-notice';

describe('CookieNotice', () => {
  let component: CookieNotice;
  let fixture: ComponentFixture<CookieNotice>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CookieNotice],
    }).compileComponents();

    fixture = TestBed.createComponent(CookieNotice);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
