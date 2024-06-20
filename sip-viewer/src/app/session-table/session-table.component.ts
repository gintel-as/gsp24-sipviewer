import { NgFor } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { DataService } from '../data.service';
import { Session } from '../session';
import { MatList } from '@angular/material/list';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';


@Component({
  selector: 'app-session-table',
  standalone: true,
  imports: [NgFor, MatFormFieldModule, MatInputModule, MatTableModule, MatToolbarModule, MatTooltipModule, MatIconModule],
  templateUrl: './session-table.component.html',
  styleUrl: './session-table.component.css'
})
export class SessionTableComponent implements OnInit{
  sessionIdList: string[] = [];
  senders: string[] = []; // from: sender of the first message in the session (phone number)
  receivers: string[] = []; // to: receiver of the first message in the session (phone number)
  times: string[] = []; // time of first INVITE in the session
  tableData: any[] = []; //List of dictionaries which represent a session
  
  // For displaying data in table
  displayedColumns: string[] = ['Time', 'Session ID', 'Sender', 'Receiver'];
  columnsToDisplay = ['Time', 'Session ID', 'Sender', 'Receiver'];
  dataSource = new MatTableDataSource(this.tableData);
  clickedRow: any = null; 

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

 
  constructor(private dataService: DataService) { }

  ngOnInit(): void {
    this.fetchSessionIds();
  }

  fetchSessionIds(): void {
    this.dataService.getMessages().subscribe(
      (messages: any[]) => {
        // Extract unique session IDs and add time, session ID, sender and receiver to lists
        const sessionIds = new Set<string>(); // Use set to store unique session IDs
        const phoneNumberPattern = /<sip:?(\+?\d+)@/;
        messages.forEach(message => {
          if (!sessionIds.has(message.startLine.sessionID)) { // Only add sender, receiver and time if it is the first message with this sessionID
            this.times.push(message.startLine.time)
            sessionIds.add(message.startLine.sessionID)
            const matchSender = message.sipHeader['From'][0].match(phoneNumberPattern) // Keep only the phone number
            this.senders.push(matchSender[1]) 
            const matchReceiver = message.sipHeader['To'][0].match(phoneNumberPattern) // Keep only the phone number
            this.receivers.push(matchReceiver[1])
            
            // Create new dictionary and add it to tableData
            let newDict: {[key: string]: any} = {}; 
            newDict['Time'] = message.startLine.time
            newDict['SessionID'] = message.startLine.sessionID
            newDict['Sender'] = matchSender[1]
            newDict['Receiver'] = matchReceiver[1]
            this.tableData.push(newDict)
          }
          // sessionIds.add(message.startLine.sessionID);
        });
        this.sessionIdList = Array.from(sessionIds);
        this.dataSource = new MatTableDataSource(this.tableData);
      },
      error => {
        console.error('Error fetching messages', error);
      }
    );
  }

  onRowClicked(row: any): void {
    this.clickedRow = row;
    console.log('Row clicked: ', this.clickedRow) // Can be removed
  }

}
