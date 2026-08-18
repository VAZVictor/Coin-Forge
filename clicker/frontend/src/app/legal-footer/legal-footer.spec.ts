import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LegalFooter } from './legal-footer';

describe('LegalFooter', () => {
  let component: LegalFooter;
  let fixture: ComponentFixture<LegalFooter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LegalFooter],
    }).compileComponents();

    fixture = TestBed.createComponent(LegalFooter);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
