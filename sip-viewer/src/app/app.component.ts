import {
  AfterViewInit,
  Component,
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
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NgFor } from '@angular/common';
import { interval, Subscription } from 'rxjs';
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
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule,
    NgFor,
    FileUploadComponent,
  ],
})
export class AppComponent implements OnInit {
  isExtractor = false;
  buttonText = ['Extract Logfiles', 'Sip Viewer'];

  constructor(
    private router: Router,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document,
    private rerouteService: RerouteService
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
    if (currentRoute == '/upload') {
      this.isExtractor = true;
      this.renderer.setStyle(document.body, 'overflow', 'auto');
    }
    if (currentRoute == '/') {
      this.isExtractor = false;
      this.renderer.setStyle(document.body, 'overflow', 'hidden');
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

  //                      Remove later when done with flask API
  // -------------------------------------------------------------------------------

  // simpleForm: FormGroup;
  // files: File[] = [];

  // constructor(
  //   private router: Router,
  //   private apiService: ApiService,
  //   private fb: FormBuilder
  // ) {
  //   this.simpleForm = this.fb.group({
  //     sessionID: [''],
  //     to: [''],
  //     from: [''],
  //     startTime: [''],
  //     endTime: [''],
  //   });
  // }

  // onSubmit(): void {
  //   if (this.simpleForm.valid) {
  //     console.log(this.simpleForm.value);
  //     console.log(this.simpleForm.value.sessionID);
  //     this.sessionID = this.simpleForm.value.sessionID;
  //     this.uploadAndProcessFile();
  //   } else {
  //     console.log('Form is not valid');
  //   }
  // }

  // uploadedFile: File | null = null;
  // downloadFilename: string = '';
  // sessionID: string = '';
  // statusCheckInterval: Subscription | null = null;

  // onFileSelected(event: any): void {
  //   this.uploadedFile = event.target.files[0];
  // }

  // uploadAndProcessFile(): void {
  //   if (this.uploadedFile) {
  //     this.apiService
  //       .uploadAndExtract(this.uploadedFile, this.sessionID)
  //       .subscribe((response) => {
  //         console.log(response.message);
  //         this.downloadFilename = response.processed_filename;
  //         this.checkFileStatus();
  //       });
  //   }
  // }

  // checkFileStatus(): void {
  //   this.statusCheckInterval = interval(1000).subscribe(() => {
  //     if (this.downloadFilename) {
  //       this.apiService
  //         .checkFileStatus(this.downloadFilename)
  //         .subscribe((statusResponse) => {
  //           if (statusResponse.status === 'ready') {
  //             this.statusCheckInterval?.unsubscribe();
  //             this.downloadFile();
  //           }
  //         });
  //     }
  //   });
  // }

  // downloadFile(): void {
  //   if (this.downloadFilename) {
  //     this.apiService.downloadFile(this.downloadFilename).subscribe((blob) => {
  //       const url = window.URL.createObjectURL(blob);
  //       const a = document.createElement('a');
  //       a.href = url;
  //       a.download = this.downloadFilename;
  //       document.body.appendChild(a);
  //       a.click();
  //       window.URL.revokeObjectURL(url);
  //     });
  //   }
  // }

  // -------------------------------------------------------------------------------

  //Meant as placeholder, would ideally dynamicall update text based on route
  //Using router on init does not work, as this always shows '/' route
  // buttonText = 'Swap between upload and viewer';

  // export class AppComponent implements OnInit {
  //   isExtractor = false;
  //   buttonText = ['Extract Logfiles', 'Sip Viewer'];

  //   constructor(
  //     private router: Router,
  //     private renderer: Renderer2,
  //     @Inject(DOCUMENT) private document: Document,
  //     private rerouteService: RerouteService
  //   ) {
  //     this.rerouteService.rerouteEvent.subscribe(() => {
  //       this.navigateToRoute();
  //     });
  //   }

  //   ngOnInit(): void {
  //     this.router.events.subscribe((event) => {
  //       if (event instanceof NavigationEnd) {
  //         // Check if the current route is the specific route
  //         this.updateRoute();
  //       }
  //     });
  //   }

  //   updateRoute() {
  //     const currentRoute = this.router.url;
  //     if (currentRoute == '/upload') {
  //       this.isExtractor = true;
  //       this.renderer.setStyle(document.body, 'overflow', 'auto');
  //     }
  //     if (currentRoute == '/') {
  //       this.isExtractor = false;
  //       this.renderer.setStyle(document.body, 'overflow', 'hidden');
  //     }
  //   }

  //   navigateToRoute() {
  //     const currentRoute = this.router.url;
  //     if (currentRoute == '/upload') {
  //       this.router.navigate(['']);
  //     }
  //     if (currentRoute == '/') {
  //       this.router.navigate(['/upload']);
  //     }
  //     this.scrollToTop();
  //   }

  //   scrollToTop() {
  //     this.renderer.setProperty(this.document.documentElement, 'scrollTop', 0);
  //     this.renderer.setProperty(this.document.body, 'scrollTop', 0);
  //   }
}
