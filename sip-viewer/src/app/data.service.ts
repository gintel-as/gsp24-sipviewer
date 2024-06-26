import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Message } from './message';
import { Session } from './session';
import { json } from 'd3';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private messages: BehaviorSubject<Message[]> = new BehaviorSubject<Message[]>(
    []
  );
  private currentSelectedMessageIDSource = new Subject<string>();
  private selectedSessionIDs = new Subject<string[]>();
  private sessionIDs: string[] = new Array<string>();
  private keyEventSource = new Subject<string>();

  constructor(private http: HttpClient) {
    // this.fetchMessages();

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

  //Fetches from http, should only be called by constructor
  // fetchMessages(): void {
  //   this.http
  //     .get<Message[]>('assets/adapter_bct.log.json')
  //     .pipe(
  //       map((data) => {
  //         return data.map((message) => {
  //           message.startLine.time = new Date(message.startLine.time);
  //           return message;
  //         });
  //       }),
  //       tap((data) => this.messages.next(data))
  //     )
  //     .subscribe();
  // }

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
      const formattedMessages = parsedJson.map((message: Message) => {
        message.startLine.time = new Date(message.startLine.time);
        return message;
      });
      this.messages.next(formattedMessages);
      console.log('File content received and stored: ', formattedMessages);
    } catch (error) {
      console.error('Error parsing or processing file content', error);
    }
  }
}
