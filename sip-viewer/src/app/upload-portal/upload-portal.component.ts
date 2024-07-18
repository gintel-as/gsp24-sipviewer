import { BootstrapOptions, Component } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FileUploadComponent } from '../file-upload/file-upload.component';
import { DataService } from '../data.service';
import { RerouteService } from '../reroute.service';
import { ApiService } from '../api.service';
import { interval, Subscription, tap } from 'rxjs';
import { take, takeWhile } from 'rxjs/operators';
import { Session } from '../session';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-upload-portal',
  standalone: true,
  templateUrl: './upload-portal.component.html',
  styleUrl: './upload-portal.component.css',
  imports: [
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule,
    NgFor,
    NgIf,
    FileUploadComponent,
    MatProgressBarModule,
  ],
})
export class UploadPortalComponent {
  simpleForm: FormGroup;
  files: File[] = [];
  jsonFiles: File[] = [];
  testPrint = '';

  sessionIDs: string = '';
  sipTo: string = '';
  sipFrom: string = '';
  startTime: string = '';
  endTime: string = '';

  isLoading: boolean = false;
  statusText: string = '';

  constructor(
    private fb: FormBuilder,
    private dataService: DataService,
    private rerouteService: RerouteService,
    private apiService: ApiService
  ) {
    this.simpleForm = this.fb.group({
      sessionIDs: [''],
      sipTo: [''],
      sipFrom: [''],
      startTime: [''],
      endTime: [''],
    });
    this.dataService.getSessions().subscribe((sessions: Session[]) => {
      sessions.forEach((session: Session) => {
        if (session.sessionInfo.initialInvite) {
          this.testPrint = `${session.sessionInfo.sessionID} contains initial invite, ${this.testPrint}`;
        }
      });
    });
  }

  onSubmit(): void {
    let isValid: boolean = false;

    if (this.simpleForm.valid) {
      isValid = true;
      this.sessionIDs = this.parseSessionID(this.simpleForm.value.sessionIDs);
      this.sipTo = this.simpleForm.value.sipTo;
      this.sipFrom = this.simpleForm.value.sipFrom;
      this.startTime = this.simpleForm.value.startTime;
      this.endTime = this.simpleForm.value.endTime;
    } else {
      isValid = false;
      console.error('Form is not valid');
      return;
    }

    // can add more input validation here
    if (
      this.sipTo.trim() ||
      this.sipFrom.trim() ||
      this.startTime.trim() ||
      this.endTime.trim()
    ) {
      console.log('At least one field not empty');

      if (!this.validateTimestamps()) return;
      // consider adding check for startTime being before EndTime
    } else {
      console.log('All fields empty');
    }

    if (this.files.length != 0) {
      isValid = true;
    } else {
      isValid = false;
      alert('No file uploaded');
      return;
    }

    // Removes all starting or trailing whitespaces
    this.sipTo = this.sipTo.trim();
    this.sipFrom = this.sipFrom.trim();
    this.startTime = this.startTime.trim();
    this.endTime = this.endTime.trim();

    if (isValid) {
      this.files.forEach((file) => {
        this.isLoading = true;
        this.uploadAndProcessFile(file);
        this.statusText = 'Uploading file(s)';
      });
    }
  }

  validateTimestamps(): boolean {
    const timestampPattern =
      '^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}\\.\\d+$';
    const regex = new RegExp(timestampPattern);
    let isValid: boolean = true;

    // if startTime not empty and does not match timestampPattern
    if (this.startTime && !regex.test(this.startTime)) {
      isValid = false;
      alert(
        'The format of StartTime is wrong. Please use "YYYY-MM-DD hh:mm:ss.ms"'
      );
    }

    // if endTime not empty and does not match timestampPattern
    if (this.endTime && !regex.test(this.endTime)) {
      isValid = false;
      alert(
        'The format of EndTime is wrong. Please use "YYYY-MM-DD hh:mm:ss.ms"'
      );
    }

    // check if startTime is smaller than endTime
    if (isValid && this.startTime && this.endTime) {
      const startDate = new Date(this.startTime.replace(' ', 'T'));
      const endDate = new Date(this.endTime.replace(' ', 'T'));

      if (startDate > endDate) {
        isValid = false;
        alert('StartTime must be before EndTime');
      }
    }

    return isValid;
  }

  uploadAndProcessFile(file: any): void {
    if (file != null) {
      this.apiService
        .uploadAndExtract(
          file,
          this.sessionIDs,
          this.startTime,
          this.endTime,
          this.sipTo,
          this.sipFrom
        )
        .subscribe((response) => {
          console.log('Response message: ', response.message);
          const downloadFilename = response.processed_filename;
          this.checkFileStatus(downloadFilename);
        });
    }
  }

  checkFileStatus(filename: string): void {
    let isChecking = true;
    let timeoutCounter: number = 0;
    let maxCount: number = 120;
    const statusCheckInterval = interval(1000)
      .pipe(
        take(maxCount),
        tap(() => {
          timeoutCounter++;
          console.log(timeoutCounter);
          this.statusText = 'Processing file(s)';
          if (timeoutCounter >= maxCount) {
            alert('File download timeouted ');
          }
        }),
        takeWhile(() => isChecking)
      )
      .subscribe(() => {
        if (filename) {
          this.apiService
            .checkFileStatus(filename)
            .subscribe((statusResponse) => {
              if (statusResponse.status === 'ready') {
                isChecking = false;
                statusCheckInterval?.unsubscribe();
                this.statusText = 'File(s) ready. Downloading...';
                this.downloadFile(filename);
              }
              if (statusResponse.status === 'error') {
                isChecking = false;
                statusCheckInterval?.unsubscribe();
                this.statusText = '';
                alert('An error has occured proccessing the file');
              }
            });
        }
      });
  }

  downloadFile(filename: string): void {
    if (filename) {
      this.apiService.downloadFile(filename).subscribe((blob) => {
        const file = new File([blob], filename, { type: blob.type });
        this.jsonFiles.push(file);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        this.isLoading = false;
        this.statusText = '';
      });
    }
  }

  // This is a very ugly function, but better than rewriting the API
  parseSessionID(value: string): string {
    if (value.trim() === '') {
      return '';
    }
    let arr = value
      .split(/[\s,]+/)
      .map(Number)
      .filter((num) => !isNaN(num));
    return arr.toString();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const dropzone = event.currentTarget as HTMLElement;
    dropzone.classList.add('dragover');
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const dropzone = event.currentTarget as HTMLElement;
    dropzone.classList.remove('dragover');
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const dropzone = event.currentTarget as HTMLElement;
    dropzone.classList.remove('dragover');

    if (event.dataTransfer?.files) {
      this.handleUploadedFiles(event.dataTransfer.files);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleUploadedFiles(input.files);
    }
  }

  handleUploadedFiles(fileList: FileList): void {
    for (let i = 0; i < fileList.length; i++) {
      if (fileList[i].type == 'application/json') {
        this.jsonFiles.push(fileList[i]);
      } else {
        this.files.push(fileList[i]);
      }
      console.log(fileList[i].type);
      console.log(this.files[0].name);
    }
  }

  removeFile(index: number): void {
    this.files.splice(index, 1);
  }

  removeJsonFile(index: number): void {
    this.jsonFiles.splice(index, 1);
  }

  // Remove later testing function
  readJsonFilesButNoMove() {
    this.jsonFiles.forEach((file: File) => {
      if (file.size > 0) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          const fileContent = e.target.result;
          this.dataService.uploadFileContent(fileContent);
        };
        reader.readAsText(file);
      }
    });
  }

  readJsonFiles() {
    this.jsonFiles.forEach((file: File) => {
      if (file.size > 0) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          const fileContent = e.target.result;
          this.dataService.uploadFileContent(fileContent);
        };
        reader.readAsText(file);
      }
    });
    window.scrollTo({ top: 0 });
    this.rerouteService.rerouteEvent.emit();
  }
}
