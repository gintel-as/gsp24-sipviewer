import { Component } from '@angular/core';
import { NgFor } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FileUploadComponent } from '../file-upload/file-upload.component';

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

  constructor(private fb: FormBuilder) {
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
    } else {
      console.log('Form is not valid');
    }
  }
  sendForm() {
    console.log('Form has been sent');
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
      this.handleFiles(event.dataTransfer.files);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(input.files);
    }
  }

  handleFiles(fileList: FileList): void {
    for (let i = 0; i < fileList.length; i++) {
      this.files.push(fileList[i]);
      console.log(fileList[i]);
    }
  }

  removeFile(index: number): void {
    this.files.splice(index, 1);
  }
}
