import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Message } from './message';
import { Session } from './session';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private messages: Observable<Message[]>;
  private currentSelectedMessageIDSource = new Subject<string>();
  private selectedSessionIDs = new Subject<string[]>();
  private sessionIDs: string[] = new Array<string>();

  constructor(private http: HttpClient) {
    this.messages = this.fetchMessages();
    const detectArrowUpDown = (event: KeyboardEvent) => {
      if (event.key == 'ArrowUp') {
        console.log(2, event);
      }
      console.log(event);
    };
    window.addEventListener('keydown', detectArrowUpDown);
  }

  //Subject of currently selected session IDs
  currentSelectedMessageID$ =
    this.currentSelectedMessageIDSource.asObservable();

  //Subject of currently selected session IDs
  selectedSessionIDs$ = this.selectedSessionIDs.asObservable();

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

  selectNewMessageByID(selectedID: string) {
    this.currentSelectedMessageIDSource.next(selectedID);
  }

  //Get lists of messages:
  getMessages(): Observable<Message[]> {
    return this.messages;
  }

  fetchMessages(): Observable<Message[]> {
    return this.http.get<Message[]>('assets/adapter_bct.log.json').pipe(
      map((data) => {
        return data.map((message) => {
          message.startLine.time = new Date(message.startLine.time);
          return message;
        });
      })
    );
  }

  getMessageByID(messageID: string): Observable<Message | undefined> {
    return this.getMessages().pipe(
      map((messages: Message[]) =>
        messages.find((message) => message.startLine.messageID === messageID)
      )
    );
  }

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
}
