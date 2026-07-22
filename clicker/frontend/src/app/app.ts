import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Clicker } from './clicker/clicker';
import { UpgradeList } from './upgradeList/upgradeList';
import { RebirthPanel } from './rebirthPanel/rebirthPanel';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Clicker, UpgradeList, RebirthPanel],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
}
