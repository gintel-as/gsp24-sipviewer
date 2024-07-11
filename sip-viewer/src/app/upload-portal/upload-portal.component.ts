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

  constructor(
    private fb: FormBuilder,
    private dataService: DataService,
    private rerouteService: RerouteService
  ) {
    this.simpleForm = this.fb.group({
      sessionID: [''],
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
    if (this.simpleForm.valid) {
      console.log(this.simpleForm.value);
      console.log(this.simpleForm.value.sessionID);
    } else {
      console.log('Form is not valid');
    }
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
