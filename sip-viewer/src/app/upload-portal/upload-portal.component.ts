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

  uploadedFile: File | null = null;
  downloadFilename: string = '';
  sessionIDList: string = '';
  statusCheckInterval: Subscription | null = null;

  constructor(
    private fb: FormBuilder,
    private dataService: DataService,
    private rerouteService: RerouteService,
    private apiService: ApiService
  ) {
    this.simpleForm = this.fb.group({
      sessionID: [''],
      to: [''],
      from: [''],
      startTime: [''],
      endTime: [''],
    });
  }
  onSubmit(): void {
    if (this.simpleForm.valid) {
      console.log(this.simpleForm.value);
      console.log(this.simpleForm.value.sessionID);

      this.sessionIDList = this.simpleForm.value.sessionID;
      // this.downloadFilename = this.files[0].name;
      // this.uploadedFile = this.files[0];

      if (this.files.length != 0) {
        this.handleMultipleFiles();
      } else {
        console.log('No file chosen');
      }
    } else {
      console.log('Form is not valid');
    }
  }

  handleMultipleFiles(): void {
    this.files.forEach((file) => {
      console.log('handleMultipleFiles(): ' + file.name);
      this.uploadAndProcessFile(file);
    });
  }

  uploadAndProcessFile(file: any): void {
    if (file != null) {
      console.log('uploadAndProcess()');
      this.apiService
        .uploadAndExtract(file, this.sessionIDList)
        .subscribe((response) => {
          console.log(response.message);
          this.downloadFilename = response.processed_filename;
          this.checkFileStatus();
        });
    }
  }

  checkFileStatus(): void {
    this.statusCheckInterval = interval(1000).subscribe(() => {
      if (this.downloadFilename) {
        this.apiService
          .checkFileStatus(this.downloadFilename)
          .subscribe((statusResponse) => {
            if (statusResponse.status === 'ready') {
              this.statusCheckInterval?.unsubscribe();
              this.downloadFile();
            }
          });
      }
    });
  }

  downloadFile(): void {
    if (this.downloadFilename) {
      this.apiService.downloadFile(this.downloadFilename).subscribe((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.downloadFilename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      });
    }
  }

  // ---------------------------------------------------------------------
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
