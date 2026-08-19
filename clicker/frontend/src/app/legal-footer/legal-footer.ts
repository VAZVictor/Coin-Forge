import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CopyrightNotice } from '../copyright-notice/copyright-notice';

@Component({
  selector: 'app-legal-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CopyrightNotice],
  templateUrl: './legal-footer.html',
  styleUrl: './legal-footer.scss'
})
export class LegalFooter {}