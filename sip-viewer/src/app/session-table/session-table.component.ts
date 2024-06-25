import { NgFor } from '@angular/common';
import { Component, OnInit } from '@angular/core';
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
export class SessionTableComponent implements OnInit {
  sessionIDList: string[] = [];
  senders: string[] = []; // from: sender of the first message in the session (phone number)
  receivers: string[] = []; // to: receiver of the first message in the session (phone number)
  times: string[] = []; // time of first INVITE in the session
  tableData: any[] = []; //List of dictionaries which represent a session

  // For displaying data in table
  columnsToDisplay = ['Select', 'Time', 'Session ID', 'Sender', 'Receiver'];
  dataSource = new MatTableDataSource(this.tableData);
  clickedRow: any = null;

  // Selected sessions
  selection = new SelectionModel<any>(true, []);
  selectionStatus: { [key: string]: boolean } = {}; // Show whether the row is selected (true) or not (false)

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.fetchSessions();
  }

  fetchSessions(): void {
    this.dataService.getMessages().subscribe(
      (messages: any[]) => {
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
        this.sessionIDList.forEach((sessionID) => {
          this.selectionStatus[sessionID] = false;
        });
      },
      (error) => {
        console.error('Error fetching messages', error);
      }
    );
  }

  onRowClicked(row: any, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    this.clickedRow = row;
    console.log('Row clicked: ', this.clickedRow);
    console.log(this.selection);
    const SessionIDofClickedRow = row['SessionID'];

    // Update dictionary with selected-status (used in toggleAllRows to check which new sessions should be updated to data service)
    if (this.selectionStatus[row] === false) {
      this.selectionStatus[row] = true;
    } else if (this.selectionStatus[row] === true) {
      this.selectionStatus[row] = false;
    }
    this.dataService.updateSelectedSession(SessionIDofClickedRow);
  }

  // onCheckboxClicked(event: any, row: any): void {
  //   event.stopPropagation();
  //   this.clickedRow = row;
  //   console.log('Checkbox clicked: ', this.clickedRow);
  //   const SessionIDofClickedRow = row['SessionID'];

  //   // Update dictionary with selected-status (used in toggleAllRows to check which new sessions should be updated to data service)
  //   if (this.selectionStatus[row] === false) {
  //     this.selectionStatus[row] = true;
  //   } else if (this.selectionStatus[row] === true) {
  //     this.selectionStatus[row] = false;
  //   }
  //   this.dataService.updateSelectedSession(SessionIDofClickedRow);
  // }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  toggleAllRows() {
    if (this.isAllSelected()) {
      // If all sessions are selected from before, clear selection
      this.selection.clear();
      this.sessionIDList.forEach((sessionID) => {
        this.selectionStatus[sessionID] = false; // Mark all as not selected
        this.dataService.updateSelectedSession(sessionID); // Update data service to reflect deselection
      });
    } else {
      // If not all are selected, select the ones that are not selected
      this.dataSource.data.forEach((row) => {
        if (!this.selection.isSelected(row)) {
          this.selection.select(row);
          const sessionID = row['SessionID'];
          this.selectionStatus[sessionID] = true; // Mark as selected
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
