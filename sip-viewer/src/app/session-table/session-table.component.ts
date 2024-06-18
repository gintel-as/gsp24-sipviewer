import { NgFor } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { DataService } from '../data.service';

@Component({
  selector: 'app-session-table',
  standalone: true,
  imports: [NgFor],
  templateUrl: './session-table.component.html',
  styleUrl: './session-table.component.css'
})
export class SessionTableComponent {
  sessionIdList: string[] = [];

  constructor(private dataService: DataService) { }

  ngOnInit(): void {
    this.fetchSessionIds();
  }

  fetchSessionIds(): void {
    this.dataService.getMessages().subscribe(
      (messages: any[]) => {
        // Extract unique session IDs
        const sessionIds = new Set<string>(); // Use set to store unique session IDs
        messages.forEach(message => {
          sessionIds.add(message.startLine.sessionID);
        });
        this.sessionIdList = Array.from(sessionIds);
      },
      error => {
        console.error('Error fetching messages', error);
      }
    );
  }

}
