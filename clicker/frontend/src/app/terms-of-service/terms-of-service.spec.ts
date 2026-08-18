import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TermsOfService } from './terms-of-service';

describe('TermsOfService', () => {
  let component: TermsOfService;
  let fixture: ComponentFixture<TermsOfService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TermsOfService],
    }).compileComponents();

    fixture = TestBed.createComponent(TermsOfService);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
