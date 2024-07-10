import { EventEmitter, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class RerouteService {
  public rerouteEvent: EventEmitter<void> = new EventEmitter<void>();
  constructor() {}
}
