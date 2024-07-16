import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Message } from './message';
import { Session } from './session';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private messages: BehaviorSubject<Message[]> = new BehaviorSubject<Message[]>(
    []
  );
  private sessions: BehaviorSubject<Session[]> = new BehaviorSubject<Session[]>(
    []
  );
  private currentSelectedMessageIDSource = new Subject<string>();
  private selectedSessionIDs = new Subject<string[]>();
  private sessionIDs: string[] = new Array<string>();
  private keyEventSource = new Subject<string>();

  constructor(private http: HttpClient) {
    //Add listener to ineract with keyEvent subject
    const detectArrowUpDown = (event: KeyboardEvent) => {
      if (event.key == 'ArrowUp') {
        this.keyEventSource.next('ArrowUp');
      }
      if (event.key == 'ArrowDown') {
        this.keyEventSource.next('ArrowDown');
      }
    };
    window.addEventListener('keydown', detectArrowUpDown);
  }

  //Subject of currently selected session IDs
  currentSelectedMessageID$ =
    this.currentSelectedMessageIDSource.asObservable();

  //Subject of currently selected session IDs
  selectedSessionIDs$ = this.selectedSessionIDs.asObservable();

  //Subject of keyEvent
  keyEvent$ = this.keyEventSource.asObservable();

  //If session ID new, add to array, else remove
  updateSelectedSession(sessionID: string) {
    //Session ID not in sessionIDs
    if (this.sessionIDs.indexOf(sessionID) == -1) {
      this.sessionIDs.push(sessionID);
    } else {
      this.sessionIDs.splice(this.sessionIDs.indexOf(sessionID), 1);
    }
    this.selectedSessionIDs.next(this.sessionIDs);
  }

  updateSelectedSessionsByList(sessionIDList: string[]) {
    this.sessionIDs = sessionIDList;
    this.selectedSessionIDs.next(this.sessionIDs);
  }

  //Sets new messageID as selected in subject
  selectNewMessageByID(selectedID: string) {
    this.currentSelectedMessageIDSource.next(selectedID);
  }

  //Get lists of messages:
  getMessages(): Observable<Message[]> {
    return this.messages.asObservable();
  }

  getSessions(): Observable<Session[]> {
    return this.sessions.asObservable();
  }

  getSelectedSessions(): Observable<Session[]> {
    return this.getSessions().pipe(
      map((sessions: Session[]) =>
        sessions.filter(
          (session) =>
            this.sessionIDs.indexOf(session.sessionInfo.sessionID) !== -1
        )
      )
    );
  }

  getMessageByID(messageID: string): Observable<Message | undefined> {
    return this.getMessages().pipe(
      map((messages: Message[]) =>
        messages.find((message) => message.startLine.messageID === messageID)
      )
    );
  }

  //Get Message[] from all sessions in the selectedSessions subject
  getMessagesFromSelectedSessions(): Observable<Message[]> {
    return this.getMessages().pipe(
      map((messages: Message[]) =>
        messages.filter(
          (message) =>
            this.sessionIDs.indexOf(message.startLine.sessionID) !== -1
        )
      )
    );
  }

  getMessagesBySessionID(sessionID: string): Observable<Message[]> {
    return this.getMessages().pipe(
      map((messages: Message[]) =>
        messages.filter((message) => message.startLine.sessionID === sessionID)
      )
    );
  }

  // Upload JSON
  uploadFileContent(fileContent: string) {
    try {
      const parsedJson = JSON.parse(fileContent);
      const formattedSessions: Session[] = parsedJson.map(
        (session: Session) => {
          session.sessionInfo.time = new Date(session.sessionInfo.time);
          session.messages = session.messages.map((message: Message) => {
            message.startLine.time = new Date(message.startLine.time);
            return message;
          });
          return session;
        }
      );

      let currentSessions: Session[] = [];
      this.getSessions().subscribe((sessions: Session[]) => {
        currentSessions = sessions;
      });
      currentSessions = this.mergeSessionLists(
        currentSessions,
        formattedSessions
      );
      this.sessions.next(currentSessions);

      const allMessages: Message[] = currentSessions.reduce(
        (messagesInSession: Message[], session: Session) => {
          messagesInSession.push(...session.messages);
          return messagesInSession;
        },
        []
      );
      allMessages.sort(
        (a, b) => a.startLine.time.getTime() - b.startLine.time.getTime()
      );
      this.messages.next(allMessages);
      console.log('File content received and stored: ', formattedSessions);
    } catch (error) {
      console.error('Error parsing or processing file content', error);
    }
  }

  mergeSessionLists(sessions1: Session[], sessions2: Session[]) {
    const mergeSessionMap: { [key: string]: Session } = {};
    const addOrMerge = (session: Session) => {
      if (mergeSessionMap[session.sessionInfo.sessionID]) {
        let currentSessionEntry =
          mergeSessionMap[session.sessionInfo.sessionID];
        if (currentSessionEntry.sessionInfo.time > session.sessionInfo.time) {
          //If currentSessionEntry older than new entry, replace starttime
          currentSessionEntry.sessionInfo = session.sessionInfo;
        }
        currentSessionEntry.sessionInfo.associatedSessions = Array.from(
          new Set(
            currentSessionEntry.sessionInfo.associatedSessions.concat(
              session.sessionInfo.associatedSessions
            )
          )
        );
        currentSessionEntry.messages = this.mergeMessageLists(
          currentSessionEntry.messages,
          session.messages
        );
      } else {
        mergeSessionMap[session.sessionInfo.sessionID] = { ...session };
      }
    };
    sessions1.forEach((session) => addOrMerge(session));
    sessions2.forEach((session) => addOrMerge(session));

    return Object.values(mergeSessionMap);
  }

  mergeMessageLists(messages1: Message[], messages2: Message[]) {
    let mergedMessageMap: { [key: string]: Message } = {};
    const addIfNew = (message: Message) => {
      //If messageID not in map, add message
      if (!mergedMessageMap[message.startLine.messageID]) {
        mergedMessageMap[message.startLine.messageID] = message;
      }
    };
    messages1.forEach((message) => addIfNew(message));
    messages2.forEach((message) => addIfNew(message));
    return Object.values(mergedMessageMap);
  }

  clearUploadedFileContent() {
    this.sessions.next([]);
    this.messages.next([]);
    this.selectNewMessageByID('');
    this.updateSelectedSessionsByList([]);
  }

  downloadJsonFile(jsonString: string, fileName: string): void {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}
