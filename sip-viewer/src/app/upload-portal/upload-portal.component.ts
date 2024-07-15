import { Component } from '@angular/core';
import { NgFor } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FileUploadComponent } from '../file-upload/file-upload.component';
import { DataService } from '../data.service';
import { RerouteService } from '../reroute.service';
import { ApiService } from '../api.service';
import { interval, Subscription } from 'rxjs';
import { takeWhile } from 'rxjs/operators';
import { Session } from '../session';

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
    FileUploadComponent,
  ],
})
export class UploadPortalComponent {
  simpleForm: FormGroup;
  files: File[] = [];
  jsonFiles: File[] = [];
  testPrint = '';

  sessionIDs: string = '';
  statusCheckInterval: Subscription | null = null;

  constructor(
    private fb: FormBuilder,
    private dataService: DataService,
    private rerouteService: RerouteService,
    private apiService: ApiService
  ) {
    this.simpleForm = this.fb.group({
      sessionIDs: [''],
      to: [''],
      from: [''],
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
    } else {
      isValid = false;
      console.error('Form is not valid');
      return;
    }

    if (this.files.length != 0) {
      isValid = true;
    } else {
      isValid = false;
      console.error('No file uploaded');
      return;
    }

    if (isValid) {
      this.files.forEach((file) => {
        console.log('Now uploading: ', file.name);
        this.uploadAndProcessFile(file);
      });
    }
  }

  uploadAndProcessFile(file: any): void {
    if (file != null) {
      this.apiService
        .uploadAndExtract(file, this.sessionIDs)
        .subscribe((response) => {
          console.log(response.message);
          const downloadFilename = response.processed_filename;
          this.checkFileStatus(downloadFilename);
        });
    }
  }

  checkFileStatus(filename: string): void {
    let isChecking = true;
    this.statusCheckInterval = interval(1000)
      .pipe(takeWhile(() => isChecking))
      .subscribe(() => {
        if (filename) {
          this.apiService
            .checkFileStatus(filename)
            .subscribe((statusResponse) => {
              if (statusResponse.status === 'ready') {
                isChecking = false;
                this.statusCheckInterval?.unsubscribe();
                this.downloadFile(filename);
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
      });
    }
  }

  // This is a very ugly function, but better than rewriting the API
  parseSessionID(value: string): string {
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
