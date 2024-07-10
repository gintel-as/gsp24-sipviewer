import { AfterViewInit, Component, OnInit, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterOutlet,
} from '@angular/router';
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
import { RerouteService } from './reroute.service';

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
export class AppComponent implements OnInit {
  //Meant as placeholder, would ideally dynamicall update text based on route
  //Using router on init does not work, as this always shows '/' route
  isExtractor = false;
  buttonText = ['Extract Logfiles', 'Sip Viewer'];

  constructor(
    private router: Router,
    private renderer: Renderer2,
    private rerouteService: RerouteService
  ) {
    this.rerouteService.rerouteEvent.subscribe(() => {
      window.scrollTo(0, 0);
      this.renderer.setStyle(document.body, 'overflow', 'hidden');
      this.navigate();
    });
  }

  ngOnInit(): void {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        // Check if the current route is the specific route
        console.log('now updating route');
        this.updateRoute();
      }
    });
  }

  updateRoute() {
    const currentRoute = this.router.url;
    console.log(currentRoute);
    if (currentRoute == '/upload') {
      this.isExtractor = true;
      this.renderer.setStyle(document.body, 'overflow', 'auto');
    }
    if (currentRoute == '/') {
      this.isExtractor = false;
      this.renderer.setStyle(document.body, 'overflow', 'hidden');
    }
    console.log('isextractor: ', this.isExtractor);
  }

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
