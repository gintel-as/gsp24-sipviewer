import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FlowChartComponent } from './flow-chart/flow-chart.component';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, FlowChartComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'sip-viewer';
}
