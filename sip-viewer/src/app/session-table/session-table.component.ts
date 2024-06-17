import { NgFor } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-session-table',
  standalone: true,
  imports: [NgFor],
  templateUrl: './session-table.component.html',
  styleUrl: './session-table.component.css'
})
export class SessionTableComponent {

}
