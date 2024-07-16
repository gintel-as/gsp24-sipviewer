import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgFor } from '@angular/common';
import { SequenceDiagramComponent } from '../sequence-diagram/sequence-diagram.component';

@Component({
  selector: 'app-flow-chart',
  standalone: true,
  templateUrl: './flow-chart.component.html',
  styleUrl: './flow-chart.component.css',
  imports: [CommonModule, NgFor, SequenceDiagramComponent],
})
export class FlowChartComponent {}
