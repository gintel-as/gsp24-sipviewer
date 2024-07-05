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
import { Session } from '../session';

interface SessionDict {
  Time: string;
  SessionID: string;
  From: string;
  To: string;
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

  tableData: any[] = []; //List of dictionaries which represent a session
  columnsToDisplay = ['Select', 'Time', 'Session ID', 'From', 'To'];
  dataSource = new MatTableDataSource(this.tableData); // Data used in the table
  selection = new SelectionModel<any>(true, []); // Selected sessions
  filterActive = false; // Used to check whether filter is given input
  relationsActivated = false;
  relatedSessions: { [key: string]: Session[] } = {};

  constructor(private dataService: DataService) {}

  ngAfterViewInit(): void {
    this.fetchSessions();
    this.getRelatedSessions();
  }

  fetchSessions(): void {
    this.dataService.getSessions().subscribe(
      (sessions: Session[]) => {
        // Empty table and deselect sessions to avoid duplicates when uploading new file
        this.tableData = [];
        this.selection.clear();

        // Extract unique session IDs and add time, session ID, from and to to lists
        const sessionIDs = new Set<string>();
        const phoneNumberPattern = /<sip:(\+?\d+)(?=@)/;
        const otherPattern = /<sip:([^>]+)>/;
        sessions.forEach((session) => {
          if (!sessionIDs.has(session.sessionInfo.sessionID)) {
            sessionIDs.add(session.sessionInfo.sessionID);
            let msgFrom = 'Not Found';
            let msgTo = 'Not Found';
            try {
              if (session.sessionInfo.from) {
                const matchResult =
                  session.sessionInfo.from.match(phoneNumberPattern) ||
                  session.sessionInfo.from.match(otherPattern);
                if (matchResult) {
                  msgFrom = matchResult[1];
                }
              }

              if (session.sessionInfo.to) {
                const matchResult =
                  session.sessionInfo.to.match(phoneNumberPattern) ||
                  session.sessionInfo.to.match(otherPattern);
                if (matchResult) {
                  msgTo = matchResult[1];
                }
              }
            } catch {
              try {
                msgFrom = session.sessionInfo.from;
                msgTo = session.sessionInfo.to;
              } catch {
                console.log(
                  'Error with fetching from/to from: ',
                  session.sessionInfo
                );
              }
            }

            // Create new dictionary and add it to tableData
            let newDict: SessionDict = {
              Time: '',
              SessionID: '',
              From: '',
              To: '',
            };

            const date = this.getDateString(session.sessionInfo.time);
            newDict['Time'] = date;
            newDict['SessionID'] = session.sessionInfo.sessionID;
            newDict['From'] = msgFrom;
            newDict['To'] = msgTo;
            this.tableData.push(newDict);
          }
        });
        this.dataSource = new MatTableDataSource(this.tableData);

        // Select all sessions when the application is started
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
    if (this.relationsActivated === false) {
      if (selectedSessions.includes(row)) {
        this.selection.deselect(row);
        console.log('Selected session: ', this.selection.selected);
      } else {
        this.selection.select(row);
        console.log('Selected session: ', this.selection.selected);
      }
    }
    // Automatically select/deselect all related sessions
    else if (this.relationsActivated === true) {
      const relatedSessionsForRow = this.relatedSessions[row.SessionID];
      console.log('Related sessions for row: ', relatedSessionsForRow);
      if (selectedSessions.includes(row)) {
        relatedSessionsForRow.forEach((session) =>
          this.selection.deselect(session)
        );
        console.log('Selected session: ', this.selection.selected);
      } else {
        relatedSessionsForRow.forEach((session) =>
          this.selection.select(session)
        );
        console.log('Selected session: ', this.selection.selected);
      }

      // TODO: selection works, but deselction does not work
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

    const regex = /^(time|session id|from|to)\s*=\s*(.*)$/i;
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

  getRelatedSessions() {
    this.dataService.getSessions().subscribe((sessions: Session[]) => {
      const sessionMap: { [id: string]: Session } = {};
      sessions.forEach((session) => {
        sessionMap[session.sessionInfo.sessionID] = session;
      });

      sessions.forEach((session) => {
        console.log('Session ID', session.sessionInfo.sessionID);
        console.log(
          'Related sessions:',
          session.sessionInfo.associatedSessions
        );
        const currentSessionID = session.sessionInfo.sessionID;
        const relatedSessionIDs = session.sessionInfo.associatedSessions;
        const relatedSessions = relatedSessionIDs
          .map((id) => sessionMap[id])
          .filter(Boolean);
        this.relatedSessions[currentSessionID] = relatedSessions;
      });
    });
    console.log('These are the related sessions:', this.relatedSessions);
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
