import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-copyright-notice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './copyright-notice.html',
  styleUrl: './copyright-notice.scss'
})
export class CopyrightNotice {
  /** Shows just the © line when true; adds the disclaimer line when false. */
  readonly compact = input<boolean>(false);

  protected readonly year = new Date().getFullYear();
}