import { NgFor } from '@angular/common';
import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { DataService } from '../data.service';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckbox, MatCheckboxModule } from '@angular/material/checkbox';
import { SelectionModel } from '@angular/cdk/collections';

interface SessionDict {
  Time: string;
  SessionID: string;
  Sender: string;
  Receiver: string;
}

@Component({
  selector: 'app-session-table',
  standalone: true,
  imports: [
    NgFor,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatToolbarModule,
    MatTooltipModule,
    MatIconModule,
    MatCheckboxModule,
  ],
  templateUrl: './session-table.component.html',
  styleUrl: './session-table.component.css',
})
export class SessionTableComponent implements AfterViewInit {
  @ViewChild('headerCheckbox') headerCheckbox!: MatCheckbox;

  // Fetching data and creating table
  sessionIDList: string[] = [];
  senders: string[] = [];
  receivers: string[] = [];
  times: string[] = [];
  tableData: any[] = []; //List of dictionaries which represent a session
  columnsToDisplay = ['Select', 'Time', 'Session ID', 'Sender', 'Receiver'];
  dataSource = new MatTableDataSource(this.tableData); // Data used in the table

  // For checkboxes
  selection = new SelectionModel<any>(true, []); // Selected sessions

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  constructor(private dataService: DataService) {}

  ngAfterViewInit(): void {
    this.fetchSessions();
  }

  fetchSessions(): void {
    this.dataService.getMessages().subscribe(
      (messages: any[]) => {
        // Empty table and deselect sessions to avoid duplicates when uploading new file
        this.tableData = [];
        this.selection.clear();

        // Extract unique session IDs and add time, session ID, sender and receiver to lists
        const sessionIDs = new Set<string>();
        const phoneNumberPattern = /<sip:?(\+?\d+)@/;
        messages.forEach((message) => {
          if (!sessionIDs.has(message.startLine.sessionID)) {
            // Only add sender, receiver and time if it is the first message with this sessionID
            this.times.push(message.startLine.time);
            sessionIDs.add(message.startLine.sessionID);
            let msgSender = 'Not Found';
            let msgReciever = 'Not Found';
            try {
              msgSender =
                message.sipHeader['From'][0].match(phoneNumberPattern)[1]; // Keep only the phone number
              msgReciever =
                message.sipHeader['To'][0].match(phoneNumberPattern)[1]; // Keep only the phone number
            } catch {
              try {
                msgSender = message.sipHeader['From'][0];
                msgReciever = message.sipHeader['To'][0];
              } catch {
                console.log(
                  'Error with fetching sender/reciever from: ',
                  message.sipHeader
                );
              }
            }
            this.senders.push(msgSender);
            this.receivers.push(msgReciever);

            // Create new dictionary and add it to tableData
            let newDict: SessionDict = {
              Time: '',
              SessionID: '',
              Sender: '',
              Receiver: '',
            };
            newDict['Time'] = message.startLine.time;
            newDict['SessionID'] = message.startLine.sessionID;
            newDict['Sender'] = msgSender;
            newDict['Receiver'] = msgReciever;
            this.tableData.push(newDict);
          }
        });
        this.sessionIDList = Array.from(sessionIDs);
        this.dataSource = new MatTableDataSource(this.tableData);

        // Select all sessions when the application is started
        this.selection.select(...this.dataSource.data);
        const sessionIDsToPush: string[] = this.getSelectedSessions().map(
          (dict) => dict.SessionID
        );
        this.dataService.updateSelectedSessionsByList(sessionIDsToPush);
      },
      (error) => {
        console.error('Error fetching messages', error);
      }
    );
  }

  getSelectedSessions(): SessionDict[] {
    const selectedSessions: SessionDict[] = [];
    this.selection.selected.forEach((session) => {
      selectedSessions.push(session);
    });
    return selectedSessions;
  }

  onCheckboxClicked(row: any): void {
    const selectedSessions = this.getSelectedSessions();
    if (selectedSessions.includes(row)) {
      this.selection.deselect(row);
    } else {
      this.selection.select(row);
    }
    const sessionIDsToPush: string[] = this.getSelectedSessions().map(
      (dict) => dict.SessionID
    );
    this.dataService.updateSelectedSessionsByList(sessionIDsToPush);
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }
    this.selection.select(...this.dataSource.data);
  }

  checkboxLabel(row?: any): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${
      row.position + 1
    }`;
  }
}
