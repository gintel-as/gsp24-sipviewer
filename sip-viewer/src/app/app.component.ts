import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RedirectCommand, RouterOutlet } from '@angular/router';
// Import components
import { SIPViewerComponent } from './sip-viewer/sip-viewer.component';
import { FlowChartComponent } from './flow-chart/flow-chart.component';
import { MessageDetailComponent } from './message-detail/message-detail.component';
import { SessionTableComponent } from './session-table/session-table.component';
import { FileUploadComponent } from './file-upload/file-upload.component';
// Import material design
import { MatToolbarModule } from '@angular/material/toolbar';
import { DragDropModule } from '@angular/cdk/drag-drop';
// Imports for theme
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    SIPViewerComponent,
    FlowChartComponent,
    MessageDetailComponent,
    SessionTableComponent,
    FileUploadComponent,
    MatToolbarModule,
    DragDropModule,
    MatIconModule,
    MatDividerModule,
    MatButtonModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'SIP Graphical Viewer';

  resizing = false;
  horizontalResize = false;
  verticalResize = false;

  initialWidth = 0;
  initialX = 0;
  leftWidth = 0;

  initialHeight = 0;
  initialY = 0;
  topHeight = 0;

  isLightTheme = true;

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

  // Dette funker ikke:
  //   toggleTheme() {
  //     console.log(this.isDarkTheme);
  //     this.isLightTheme = !this.isLightTheme;
  //     const body = document.body;
  //     if (this.isDarkTheme) {
  //       body.classList.add('dark-theme');
  //     } else {
  //       body.classList.remove('dark-theme');
  //     }
  //     console.log(this.isDarkTheme);
  //   }
}
