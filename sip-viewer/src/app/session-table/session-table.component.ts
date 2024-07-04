import { NgFor, NgIf } from '@angular/common';
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
import { filter } from 'd3';

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
    NgIf,
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
  selection = new SelectionModel<any>(true, []); // Selected sessions
  filterActive = false; // Used to check whether filter is given input
  relationsActivated = false;
  // relationSelection = new SelectionModel<boolean>(true, []);

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

            const date = this.getDateString(message.startLine.time);
            newDict['Time'] = date;
            newDict['SessionID'] = message.startLine.sessionID;
            newDict['Sender'] = msgSender;
            newDict['Receiver'] = msgReciever;
            this.tableData.push(newDict);
          }
        });
        this.sessionIDList = Array.from(sessionIDs);
        this.dataSource = new MatTableDataSource(this.tableData);

        // // Select all sessions when the application is started
        // this.selection.select(...this.dataSource.data);
        // this.dataService.updateSelectedSessionsByList(this.updatedSessions());
      },
      (error) => {
        console.error('Error fetching messages', error);
      }
    );
  }

  addZeroInFront(n: number) {
    if (n < 10) {
      return `0${n}`;
    }
    return `${n}`;
  }

  getDateString(date: Date) {
    return `${date.getFullYear()}-${this.addZeroInFront(
      date.getMonth()
    )}-${this.addZeroInFront(date.getDay())} ${this.getTimeString(date)}`;
  }

  getTimeString(date: Date) {
    return `${this.addZeroInFront(date.getHours())}:${this.addZeroInFront(
      date.getMinutes()
    )}:${this.addZeroInFront(
      date.getSeconds()
    )}.${this.addZeroBehindForThreeDigits(date.getMilliseconds())}`;
  }

  addZeroBehindForThreeDigits(n: number) {
    if (n < 10) {
      return n * 100;
    }
    if (n < 100) {
      return n * 10;
    }
    return n;
  }

  getSelectedSessions(): SessionDict[] {
    const selectedSessions: SessionDict[] = [];
    this.selection.selected.forEach((session) => {
      selectedSessions.push(session);
    });
    return selectedSessions;
  }

  updatedSessions(): string[] {
    const selectedSessions: SessionDict[] = [];
    this.selection.selected.forEach((session) => {
      selectedSessions.push(session);
    });
    const sessionIDsToPush: string[] = selectedSessions.map(
      (dict) => dict.SessionID
    );
    return sessionIDsToPush;
  }

  onCheckboxClicked(row: any): void {
    const selectedSessions = this.getSelectedSessions();
    if (selectedSessions.includes(row)) {
      this.selection.deselect(row);
    } else {
      this.selection.select(row);
    }
    this.dataService.updateSelectedSessionsByList(this.updatedSessions());
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      this.dataService.updateSelectedSessionsByList(this.updatedSessions());
      return;
    }
    this.selection.select(...this.dataSource.data);
    this.dataService.updateSelectedSessionsByList(this.updatedSessions());
  }

  checkboxLabel(row?: any): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${
      row.position + 1
    }`;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value
      .trim()
      .toLowerCase();

    let column: string | null = null;
    let searchValue = filterValue;

    const regex = /^(time|session id|sender|receiver)\s*=\s*(.*)$/i;
    const match = regex.exec(filterValue);

    if (match) {
      column =
        match[1].charAt(0).toUpperCase() +
        match[1].slice(1).replace(/\s+/g, '');
      searchValue = match[2].trim();
    }

    this.filterActive = filterValue.length > 0;

    // Set custom filter predicate based on the column
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      if (column) {
        return data[column]?.toString().toLowerCase().includes(filter);
      } else {
        return Object.values(data).some((value) => {
          if (typeof value === 'string' || typeof value === 'number') {
            return value.toString().toLowerCase().includes(filter);
          }
          return false;
        });
      }
    };
    this.dataSource.filter = searchValue;
  }

  onRelationsCheckboxClicked() {
    if (this.relationsActivated === true) {
      console.log('Checkbox was untoggled!');
      this.relationsActivated = false;
    } else if (this.relationsActivated === false) {
      console.log('Checkbox was toggled!');
      this.relationsActivated = true;
    }
    // Logic for choosing all related sessions in the session table
  }
}
