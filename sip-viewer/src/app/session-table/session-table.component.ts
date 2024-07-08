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

  tableData: Session[] = [];
  columnsToDisplay = [
    'Select',
    'Time',
    'Session ID',
    'From',
    'To',
    'Related Sessions',
  ];
  dataSource = new MatTableDataSource(this.tableData); // Data used in the table
  selection = new SelectionModel<Session>(true, []); // Selected sessions
  filterActive = false; // Used to check whether filter is given input
  relationsActivated = false;

  constructor(private dataService: DataService) {}

  ngAfterViewInit(): void {
    this.fetchSessions();
  }
  fetchSessions(): void {
    this.dataService.getSessions().subscribe(
      (sessions: Session[]) => {
        // Empty table and deselect sessions to avoid duplicates when uploading new file, but keep ID to reselect selected
        let oldSelectedSessionIDs: string[] = this.selection.selected.map(
          (session) => session.sessionInfo.sessionID
        );
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

            // TODO: Format date - not possible to format and still keep Date type. Possible solution: change from Date to string in SessionInfo interface, but this also requires changes other places (e.g., uploadFileContent in data service)
            const formattedDate = this.getDateString(session.sessionInfo.time);

            let newSession: Session = {
              sessionInfo: {
                sessionID: session.sessionInfo.sessionID,
                time: session.sessionInfo.time,
                from: msgFrom,
                to: msgTo,
                associatedSessions: session.sessionInfo.associatedSessions,
              },
              messages: session.messages,
            };
            newSession.sessionInfo.from = msgFrom;
            newSession.sessionInfo.to = msgTo;
            this.tableData.push(newSession);
          }
        });
        //For each session in tabledata, if it was selected previously select again
        this.tableData.forEach((session) => {
          if (
            oldSelectedSessionIDs.indexOf(session.sessionInfo.sessionID) !== -1
          ) {
            this.selection.select(session);
          }

          this.dataService.updateSelectedSessionsByList(this.updatedSessions());
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

  getSelectedSessions(): Session[] {
    const selectedSessions: Session[] = [];
    this.selection.selected.forEach((session) => {
      selectedSessions.push(session);
    });
    return selectedSessions;
  }

  updatedSessions(): string[] {
    const selectedSessions: Session[] = [];
    this.selection.selected.forEach((session) => {
      selectedSessions.push(session);
    });
    const sessionIDsToPush: string[] = selectedSessions.map(
      (session) => session.sessionInfo.sessionID
    );
    return sessionIDsToPush;
  }

  onCheckboxClicked(row: Session): void {
    const selectedSessions = this.getSelectedSessions();
    if (this.relationsActivated === false) {
      if (selectedSessions.includes(row)) {
        this.selection.deselect(row);
      } else {
        this.selection.select(row);
      }
    }
    // Automatically select/deselect all related sessions
    else if (this.relationsActivated === true) {
      const relatedSessionIDsForRow = row.sessionInfo.associatedSessions;
      const relatedSessionsForRow = [];
      for (let i = 0; i < relatedSessionIDsForRow.length; i++) {
        const relatedSessionID = relatedSessionIDsForRow[i];
        const relatedSession = this.tableData.find(
          (session) => session.sessionInfo.sessionID === relatedSessionID
        );
        if (relatedSession) {
          relatedSessionsForRow.push(relatedSession);
        } else {
          console.warn(
            `Session with ID ${relatedSessionID} not found in tableData.`
          );
        }
      }
      if (selectedSessions.includes(row)) {
        relatedSessionsForRow.forEach((session) => {
          this.selection.deselect(session);
        });
      } else {
        relatedSessionsForRow.forEach((session) =>
          this.selection.select(session)
        );
      }
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

    const filterPattern = /^(time|sessionid|session id|from|to)\s*=\s*(.*)$/i;
    const match = filterPattern.exec(filterValue);

    if (match) {
      column =
        match[1].charAt(0).toUpperCase() +
        match[1].slice(1).replace(/\s+/g, '');
      searchValue = match[2].trim();
    }

    this.filterActive = filterValue.length > 0;

    // Set custom filter predicate based on filter
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      //If filter predicate matches column, only look at selected column
      if (column) {
        if (column == 'Sessionid') {
          return data.sessionInfo.sessionID
            ?.toString()
            .toLowerCase()
            .startsWith(filter);
        }
        if (column == 'From') {
          //potentially change to smarter .startsWith using either country code or not
          return data.sessionInfo.from
            ?.toString()
            .toLowerCase()
            .includes(filter);
        }
        if (column == 'To') {
          return data.sessionInfo.to?.toString().toLowerCase().includes(filter);
        }
        if (column == 'Time') {
          return this.getDateString(data.sessionInfo.time)
            ?.toLowerCase()
            .includes(filter);
        }
        //No column matches
        return false;
      } else {
        // Returns true if any column content matches filter
        return (
          data.sessionInfo.sessionID
            ?.toString()
            .toLowerCase()
            .startsWith(filter) ||
          data.sessionInfo.to?.toString().toLowerCase().includes(filter) ||
          data.sessionInfo.from?.toString().toLowerCase().includes(filter) ||
          this.getDateString(data.sessionInfo.time)
            ?.toLowerCase()
            .includes(filter)
        );
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
  }
}
