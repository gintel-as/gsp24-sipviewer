import { NgFor } from '@angular/common';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { DataService } from '../data.service';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
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
  sessionIDList: string[] = [];
  sessionIDsToSendToDataService: string[] = [];
  senders: string[] = []; // from: sender of the first message in the session (phone number)
  receivers: string[] = []; // to: receiver of the first message in the session (phone number)
  times: string[] = []; // time of first INVITE in the session
  tableData: any[] = []; //List of dictionaries which represent a session
  columnsToDisplay = ['Select', 'Time', 'Session ID', 'Sender', 'Receiver']; // Columns of the table
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
        // this.selection.selected.forEach((message) => {
        //   if (message && message.startLine) {
        //     this.dataService.updateSelectedSession(message.startLine.sessionID);
        //   }
        // });
        this.selection.clear(); // Set all sessions as not selected

        // Extract unique session IDs and add time, session ID, sender and receiver to lists
        const sessionIDs = new Set<string>(); // Use set to store unique session IDs
        const phoneNumberPattern = /<sip:?(\+?\d+)@/;
        messages.forEach((message) => {
          if (!sessionIDs.has(message.startLine.sessionID)) {
            // Only add sender, receiver and time if it is the first message with this sessionID
            this.times.push(message.startLine.time);
            sessionIDs.add(message.startLine.sessionID);
            const matchSender =
              message.sipHeader['From'][0].match(phoneNumberPattern); // Keep only the phone number
            this.senders.push(matchSender[1]);
            const matchReceiver =
              message.sipHeader['To'][0].match(phoneNumberPattern); // Keep only the phone number
            this.receivers.push(matchReceiver[1]);

            // Create new dictionary and add it to tableData
            let newDict: { [key: string]: any } = {};
            newDict['Time'] = message.startLine.time;
            newDict['SessionID'] = message.startLine.sessionID;
            newDict['Sender'] = matchSender[1];
            newDict['Receiver'] = matchReceiver[1];
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
          // const sessionID = row.SessionID;
          // this.dataService.updateSelectedSession(sessionID);
        });

        // this.toggleAllRows();
      },
      (error) => {
        console.error('Error fetching messages', error);
      }
    );
  }

  onCheckboxClicked(row: any): void {
    // this.selection.toggle(row);
    console.log(1, this.sessionIDsToSendToDataService);
    this.selection.select(row);
    const sessionID = row.SessionID;
    if (this.sessionIDsToSendToDataService.indexOf(sessionID) !== -1) {
      console.log('removed ', sessionID);
      let index = this.sessionIDsToSendToDataService.indexOf(sessionID);
      // this.sessionIDsToSendToDataService =
      this.sessionIDsToSendToDataService.splice(index, 1);
    } else {
      console.log('addded ', sessionID);
      this.sessionIDsToSendToDataService.push(sessionID);
    }
    this.dataService.updateSelectedSessionsByList(
      this.sessionIDsToSendToDataService
    );
    console.log(2, this.sessionIDsToSendToDataService);
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  toggleAllRows() {
    if (this.isAllSelected()) {
      // If all sessions are selected from before, clear selection
      this.selection.selected.forEach((sessionID) => {
        this.dataService.updateSelectedSession(sessionID); // Update data service to reflect deselection
      });
      this.selection.clear();
    } else {
      // If not all are selected, select the ones that are not selected
      this.dataSource.data.forEach((row) => {
        if (!this.selection.isSelected(row)) {
          this.selection.select(row);
          const sessionID = row['SessionID'];
          this.dataService.updateSelectedSession(sessionID); // Update data service to reflect selection
        }
      });
    }
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
