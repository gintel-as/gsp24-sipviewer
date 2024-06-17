import { NgFor } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-flow-chart',
  standalone: true,
  imports: [NgFor],
  templateUrl: './flow-chart.component.html',
  styleUrl: './flow-chart.component.css'
})
export class FlowChartComponent {

}
