import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RedirectCommand, RouterOutlet } from '@angular/router';
// Import components
import { SIPViewerComponent } from './sip-viewer/sip-viewer.component';
import { FlowChartComponent } from './flow-chart/flow-chart.component';
import { MessageDetailComponent } from './message-detail/message-detail.component';
import { SessionTableComponent } from './session-table/session-table.component';
// Import material design
import {MatToolbarModule} from '@angular/material/toolbar'; 

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SIPViewerComponent, FlowChartComponent, MessageDetailComponent, SessionTableComponent, MatToolbarModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'SIP Graphical Viewer';
}
