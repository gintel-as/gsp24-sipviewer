import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { DataService } from '../data.service';
import { NgIf } from '@angular/common';
import { Session } from '../session';
@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [MatIconModule, MatDividerModule, MatButtonModule, NgIf],
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.css',
})
export class FileUploadComponent implements OnInit {
  fileName = '';
  selectedSessions: Session[] = [];
  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.dataService.selectedSessionIDs$.subscribe(() => {
      this.dataService
        .getSelectedSessions()
        .subscribe((sessions: Session[]) => {
          this.selectedSessions = sessions;
        });
    });
  }

  onJsonFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      const fileList: FileList = input.files;
      for (let i = 0; i < fileList.length; i++) {
        this.uploadFile(fileList[i]);
      }
    }
  }

  uploadFile(file: File) {
    //If file is of type json, proccess file
    if (file.type == 'application/json') {
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

  //Exports selected sessions as a pretty JSON-file with indent=2
  exportSelectedToJson() {
    const jsonText = JSON.stringify(this.selectedSessions, null, 2);
    this.dataService.downloadJsonFile(jsonText, 'output.json');
  }
}
