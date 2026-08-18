import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CopyrightNotice } from '../copyright-notice/copyright-notice';

@Component({
  selector: 'app-terms-of-service',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CopyrightNotice],
  templateUrl: './terms-of-service.html',
  styleUrl: './terms-of-service.css'
})
export class TermsOfService {
  protected readonly lastUpdated = 'August 17, 2026';
}