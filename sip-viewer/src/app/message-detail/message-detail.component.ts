import { Component, OnInit } from '@angular/core';
import {CommonModule} from '@angular/common';
import { DataService } from '../data.service';
import { NgFor } from '@angular/common';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';


@Component({
  selector: 'app-message-detail',
  standalone: true,
  imports: [CommonModule, NgFor, MatToolbarModule, MatTooltipModule, MatIconModule],
  templateUrl: './message-detail.component.html',
  styleUrl: './message-detail.component.css'
})
export class MessageDetailComponent {
  log: any[] = [];
  resultList: any[] = [];
  textToCopy: any[] = [];
  packetIndex: number = 0;

  constructor(
    private dataService: DataService,
    private clipboard: Clipboard
  ) { }

  ngOnInit(): void {
    this.fetchMessages();
  }

  changePacket(direction: 'next'|'previous') {
    if (direction == 'next') {
      if ((this.packetIndex + 1) > this.log.length) {
        // alert("You are on the last packet and cannot go any further forward");
      } else {
        this.packetIndex++;
        this.printPacketDetail();
      }
    } else if (direction == 'previous') {
      if ((this.packetIndex - 1) < 0) {
        // alert("You are on the first packet and cannot go any further backwards");
        // Kan visst disable html button. Se på det senere
      } else {
        this.packetIndex--;
        this.printPacketDetail();
      }
    }
    console.log(this.packetIndex + ' : ' + this.log.length)
  }

  // fix bug: copies everything
  copyText() {
    let output = this.textToCopy.join('');
    this.clipboard.copy(output);
  }

  // remove print of header
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
        // console.log(messages.length)
        this.log = messages;
        console.log(this.log.length)

        this.printPacketDetail();
        // this.resultList = [
        //   ...this.findInJson(this.log, this.packetIndex, 'sipHeader'),
        //   ...this.findInJson(this.log, this.packetIndex, 'body')
        // ];
      },
      error => {
        console.error('Error fetching messages', error);
      }
    );
  }

  printPacketDetail(): void {
    this.resultList = [
      ...this.findInJson(this.log, this.packetIndex, 'sipHeader'),
      ...this.findInJson(this.log, this.packetIndex, 'body')
    ];
  }


}



