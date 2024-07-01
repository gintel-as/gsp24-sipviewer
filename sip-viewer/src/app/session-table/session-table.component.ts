import { NgFor } from '@angular/common';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { DataService } from '../data.service';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckbox, MatCheckboxModule } from '@angular/material/checkbox';
import { SelectionModel } from '@angular/cdk/collections';

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
  sessionIDList: string[] = [];
  sessionIDsToSendToDataService: string[] = [];
  senders: string[] = [];
  receivers: string[] = [];
  times: string[] = [];
  tableData: any[] = []; //List of dictionaries which represent a session
  columnsToDisplay = ['Select', 'Time', 'Session ID', 'Sender', 'Receiver'];
  dataSource = new MatTableDataSource(this.tableData); // Data used in the table
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
        this.tableData = []; // Empty the table to avoid duplicate copies of the sessions
        this.selection.clear(); // Set all sessions as not selected

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
            let newDict: { [key: string]: any } = {};
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
        this.dataService.updateSelectedSessionsByList(this.sessionIDList);
        this.sessionIDsToSendToDataService = this.sessionIDList;
        this.dataSource.data.forEach((row) => {
          this.selection.select(row);
        });
      },
      (error) => {
        console.error('Error fetching messages', error);
      }
    );
  }

  onCheckboxClicked(row: any): void {
    this.selection.select(row);
    const sessionID = row.SessionID;
    if (this.sessionIDsToSendToDataService.indexOf(sessionID) !== -1) {
      let index = this.sessionIDsToSendToDataService.indexOf(sessionID);
      this.sessionIDsToSendToDataService.splice(index, 1);
    } else {
      this.sessionIDsToSendToDataService.push(sessionID);
    }
    this.dataService.updateSelectedSessionsByList(
      this.sessionIDsToSendToDataService
    );
    if (this.sessionIDsToSendToDataService.length === 0) {
      this.headerCheckbox.toggle();
      this.selection.clear();
    }
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  toggleAllRows() {
    if (this.isAllSelected()) {
      // If all sessions are selected from before, clear selection
      this.sessionIDsToSendToDataService = [];
      this.selection.clear();
    }
    // If no sessions are selected, select all
    else if (this.selection.isEmpty()) {
      this.dataSource.data.forEach((row) => {
        this.selection.select(row);
        this.sessionIDsToSendToDataService.push(row['SessionID']);
      });
    }
    // If not all are selected, select the ones that are not selected
    else {
      this.dataSource.data.forEach((row) => {
        if (!this.selection.isSelected(row)) {
          this.selection.select(row);
          const sessionID = row['SessionID'];
          this.sessionIDsToSendToDataService.push(sessionID);
        }
      });
    }
    // Update data service to reflect selection
    this.dataService.updateSelectedSessionsByList(
      this.sessionIDsToSendToDataService
    );
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
