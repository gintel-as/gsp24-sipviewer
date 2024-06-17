import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Message } from './message';

@Injectable({
  providedIn: 'root'
})
export class FetchJsonService {

  constructor(private http: HttpClient) {}

  getMessages(): Observable<Message[]> {
    return this.http.get<Message[]>('assets/messages2.json')
  }

}

// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable } from 'rxjs';

// @Injectable({
//   providedIn: 'root'
// })
// export class DataService {

//   constructor(private http: HttpClient) { }

//   getMessages(): Observable<any[]> {
//     return this.http.get<any[]>('assets/jsonfile.json'); // Adjust the path based on your JSON file location. Original path given: assets/messages.json
//   } 
// }