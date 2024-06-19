import { Component, OnInit } from '@angular/core';
import {CommonModule} from '@angular/common';
import { DataService } from '../data.service';
import { NgFor } from '@angular/common';
import { Clipboard } from '@angular/cdk/clipboard';


@Component({
  selector: 'app-message-detail',
  standalone: true,
  imports: [CommonModule, NgFor],
  templateUrl: './message-detail.component.html',
  styleUrl: './message-detail.component.css'
})
export class MessageDetailComponent {

  resultList: any[] = [];
  textToCopy: any[] = [];

  constructor(
    private dataService: DataService,
    private clipboard: Clipboard
  ) { }

  ngOnInit(): void {
    this.fetchMessages();
  }

  copyText() {
    let output = this.textToCopy.join('');
    this.clipboard.copy(output);
  }

  findInJson(inputArr: any[], index: number, str: 'sipHeader'|'body'): string[] {
    let output: string[] = [];
    let headers;
    
    if (str == 'sipHeader') {
      headers = inputArr[index].sipHeader;

      for (const key in headers) {
        if (headers.hasOwnProperty(key)) {
          headers[key].forEach((value: string) => {
            const str = key+ ': ' + value;
            this.textToCopy.push(str + '\n')
            output.push(str);
          });
        }
      }
    } else if (str == 'body') {
      headers = inputArr[index].body;

      for (const key in headers) {
        if (headers.hasOwnProperty(key)) {
          headers[key].forEach((value: string) => {
            const str = value;
            this.textToCopy.push(str + '\n')
            output.push(str);
          });
        }
      }
    }
    return output;
  }
  
  fetchMessages(): void {
    this.dataService.getMessages().subscribe(
      (messages: any[]) => {
        let index: number = 0;
        this.resultList = [
          ...this.findInJson(messages, index, 'sipHeader'),
          ...this.findInJson(messages, index, 'body')
        ];
      },
      error => {
        console.error('Error fetching messages', error);
      }
    );
  }


}



