import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CopyrightNotice } from '../copyright-notice/copyright-notice';
import { Location } from '@angular/common' 

@Component({
  selector: 'app-terms-of-service',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CopyrightNotice],
  templateUrl: './terms-of-service.html',
  styleUrl: './terms-of-service.css'
})
export class TermsOfService {
  private readonly location = inject(Location);

  protected readonly lastUpdated = 'August 17, 2026';

  protected goBack(): void {
    this.location.back();
  }
}