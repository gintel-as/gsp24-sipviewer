import { AfterViewInit, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
// Import components
import { SIPViewerComponent } from './sip-viewer/sip-viewer.component';
import { FlowChartComponent } from './flow-chart/flow-chart.component';
import { MessageDetailComponent } from './message-detail/message-detail.component';
import { SessionTableComponent } from './session-table/session-table.component';
import { FileUploadComponent } from './file-upload/file-upload.component';
import { HomeComponent } from './home/home.component';
// Import material design
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatIconModule } from '@angular/material/icon';
// Import services
import { ApiService } from './api.service';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  imports: [
    CommonModule,
    RouterLink,
    RouterOutlet,
    SIPViewerComponent,
    FlowChartComponent,
    MessageDetailComponent,
    SessionTableComponent,
    FileUploadComponent,
    MatToolbarModule,
    DragDropModule,
    MatIconModule,
    HomeComponent,
    MatButtonModule,
  ],
})
export class AppComponent {
  //Meant as placeholder, would ideally dynamicall update text based on route
  //Using router on init does not work, as this always shows '/' route
  buttonText = 'Swap between upload and viewer';

  constructor(private router: Router) {}

  navigate() {
    const currentRoute = this.router.url;
    if (currentRoute == '/upload') {
      this.router.navigate(['']);
    }
    if (currentRoute == '/') {
      this.router.navigate(['/upload']);
    }
  }
}
