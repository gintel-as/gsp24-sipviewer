import { Component, OnInit } from '@angular/core';
import {CommonModule} from '@angular/common';
import { DataService } from '../data.service';
import { NgFor } from '@angular/common';
import { forEachChild } from 'typescript';


@Component({
  selector: 'app-message-detail',
  standalone: true,
  imports: [CommonModule, NgFor],
  templateUrl: './message-detail.component.html',
  styleUrl: './message-detail.component.css'
})
export class MessageDetailComponent {

  resultList: any[] = [];

  constructor(private dataService: DataService) { }

  ngOnInit(): void {
    this.fetchMessages();
  }

  findInJson(inputArr: any[], index: number, str: 'sipHeader'|'body'): string[] {
    let output: string[] = [];
    let headers;
    
    if (str == 'sipHeader') {
      headers = inputArr[index].sipHeader;
      output.push('---------------------------------------Header--------------------------------------');

      for (const key in headers) {
        if (headers.hasOwnProperty(key)) {
          headers[key].forEach((value: string) => {
            output.push(`${key}: ${value}`);
          });
        }
      }
    } else if (str == 'body') {
      headers = inputArr[index].body;
      output.push('----------------------------------------Body---------------------------------------');

      for (const key in headers) {
        if (headers.hasOwnProperty(key)) {
          headers[key].forEach((value: string) => {
            // result += `${key}: ${value} \n\n\n`;
            output.push(`${value}`);
            // console.log(`${key}: ${value}\n`)
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



