import { Component } from '@angular/core';
import { CommonModule, NgIf, NgStyle } from '@angular/common';
import { SessionTableComponent } from '../session-table/session-table.component';
import { FlowChartComponent } from '../flow-chart/flow-chart.component';
import { MessageDetailComponent } from '../message-detail/message-detail.component';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  imports: [
    SessionTableComponent,
    FlowChartComponent,
    MessageDetailComponent,
    NgStyle,
    NgIf,
  ],
})
export class HomeComponent {
  resizing = false;
  horizontalResize = false;
  verticalResize = false;

  initialWidth = 0;
  initialX = 0;
  leftWidth = 0;

  initialHeight = 0;
  initialY = 0;
  topHeight = 0;

  ngOnInit() {
    this.topHeight = window.innerHeight * 0.5;
    this.leftWidth = window.innerWidth * 0.5;
  }

  onHorizontalResizeStart(event: MouseEvent) {
    this.resizing = true;
    this.horizontalResize = true;
    this.initialWidth = this.leftWidth;
    this.initialX = event.clientX;
  }

  onVerticalResizeStart(event: MouseEvent) {
    this.resizing = true;
    this.verticalResize = true;
    this.initialHeight = this.topHeight;
    this.initialY = event.clientY;
  }

  onResize(event: MouseEvent) {
    if (this.horizontalResize) {
      const deltaX = event.clientX - this.initialX;
      this.leftWidth = this.initialWidth + deltaX;
    }

    if (this.verticalResize) {
      const deltaY = event.clientY - this.initialY;
      this.topHeight = this.initialHeight + deltaY;
    }
  }

  onResizeEnd() {
    this.resizing = false;
    this.horizontalResize = false;
    this.verticalResize = false;
  }
}
