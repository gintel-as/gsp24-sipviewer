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

  constructor(private http: HttpClient) {
    this.messages = this.fetchMessages();
  }

  //Provide current message ID:
  currentSelectedMessageID$ =
    this.currentSelectedMessageIDSource.asObservable();

  selectNewMessageByID(selectedID: string) {
    this.currentSelectedMessageIDSource.next(selectedID);
  }

  //Get lists of messages:
  getMessages(): Observable<Message[]> {
    return this.messages;
  }

  fetchMessages(): Observable<Message[]> {
    return this.http.get<Message[]>('assets/adapter_bct.log.json'); // Adjust the path based on your JSON file location
  }

  getMessageByID(messageID: string): Observable<Message | undefined> {
    return this.getMessages().pipe(
      map((messages: Message[]) =>
        messages.find((message) => message.startLine.messageID === messageID)
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
