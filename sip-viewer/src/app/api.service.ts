import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiUrl = 'http://127.0.0.1:5000/api';

  constructor(private http: HttpClient) {}

  uploadAndExtract(
    file: File,
    sessionID: string,
    startTime: string,
    endTime: string
  ): Observable<any> {
    const formData: FormData = new FormData();
    formData.append('file', file, file.name);
    formData.append('sessionID', sessionID);
    return this.http.post<any>(`${this.apiUrl}/uploadAndExtract`, formData);
  }

  checkFileStatus(filename: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/check_status/${filename}`);
  }

  downloadFile(filename: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/download/${filename}`, {
      responseType: 'blob',
    });
  }
}
