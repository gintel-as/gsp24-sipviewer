import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  Renderer2,
} from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterOutlet,
} from '@angular/router';
// Import components
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
    MessageDetailComponent,
    SessionTableComponent,
    FileUploadComponent,
    MatToolbarModule,
    MatIconModule,
    HomeComponent,
    MatButtonModule,
  ],
})
export class AppComponent implements OnInit {
  isExtractor = false;
  buttonText = ['Extract Logfiles', 'Sip Viewer'];

  constructor(
    private router: Router,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document,
    private rerouteService: RerouteService,
    private elementRef: ElementRef
  ) {
    this.rerouteService.rerouteEvent.subscribe(() => {
      this.navigateToRoute();
    });
  }

  ngOnInit(): void {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        // Check if the current route is the specific route
        this.updateRoute();
      }
    });
  }

  updateRoute() {
    const currentRoute = this.router.url;
    const element = this.elementRef.nativeElement.querySelector('.app-content');
    if (currentRoute == '/upload') {
      this.isExtractor = true;
      this.renderer.setStyle(document.body, 'overflow', 'auto');
      this.renderer.setStyle(element, 'position', 'relative');
    }
    if (currentRoute == '/') {
      this.isExtractor = false;
      this.renderer.setStyle(document.body, 'overflow', 'hidden');
      this.renderer.setStyle(element, 'position', 'fixed');
    }
  }

  navigateToRoute() {
    const currentRoute = this.router.url;
    if (currentRoute == '/upload') {
      this.router.navigate(['']);
    }
    if (currentRoute == '/') {
      this.router.navigate(['/upload']);
    }
    this.scrollToTop();
  }

  scrollToTop() {
    this.renderer.setProperty(this.document.documentElement, 'scrollTop', 0);
    this.renderer.setProperty(this.document.body, 'scrollTop', 0);
  }
}
