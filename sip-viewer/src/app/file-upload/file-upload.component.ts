import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { DataService } from '../data.service';
import { NgIf } from '@angular/common';
import { ApiService } from '../api.service';
@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [MatIconModule, MatDividerModule, MatButtonModule, NgIf],
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.css',
})
export class FileUploadComponent {
  fileName = '';
  constructor(private dataService: DataService) {}

  onJsonFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      const file = input.files[0];
      if (!this.fileName) {
        this.fileName = file.name;
      } else {
        this.fileName = `${this.fileName}, ${file.name}`;
      }

      const reader = new FileReader();
      reader.onload = (e: any) => {
        const fileContent = e.target.result;
        this.dataService.uploadFileContent(fileContent);
      };
      reader.readAsText(file);
    }
  }

  clearSelectedFiles() {
    this.dataService.clearUploadedFileContent();
    this.fileName = '';
  }
}
