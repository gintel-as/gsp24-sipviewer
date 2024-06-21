import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SelectedMessageService {
  private currentSelectedMessageIDSource = new Subject<string>();

  currentSelectedMessageID$ =
    this.currentSelectedMessageIDSource.asObservable();

  selectNewMessageByID(selectedID: string) {
    this.currentSelectedMessageIDSource.next(selectedID);
  }

  constructor() {}
}
