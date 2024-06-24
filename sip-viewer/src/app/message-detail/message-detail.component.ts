import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../data.service';
import { NgFor } from '@angular/common';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { Observable, find, first, tap } from 'rxjs';
import { Message } from '../message';
import { pack } from 'd3';

@Component({
  selector: 'app-message-detail',
  standalone: true,
  imports: [
    CommonModule,
    NgFor,
    MatToolbarModule,
    MatTooltipModule,
    MatIconModule,
  ],
  templateUrl: './message-detail.component.html',
  styleUrl: './message-detail.component.css',
})
export class MessageDetailComponent {
  log: any[] = [];
  resultList: any[] = [];
  textToCopy: any[] = [];
  packetIndex: number = 0;

  // currentMessage: Message | undefined;

  currentMessageId: string = '';
  messageIdList: string[] = []; // Remove later

  constructor(private dataService: DataService, private clipboard: Clipboard) {
    dataService.currentSelectedMessageID$.subscribe((selectedMessageID) => {
      this.printPacketDetail(selectedMessageID);
    });
  }

  ngOnInit() {
    this.fetchMessages();
  }

  changePacket(direction: 'next' | 'previous') {
    if (direction == 'next') {
      if (this.packetIndex + 1 < this.messageIdList.length) {
        this.packetIndex++;
        const id = this.messageIdList[this.packetIndex];
        this.printPacketDetail(id);
      }
    } else if (direction == 'previous') {
      if (this.packetIndex - 1 >= 0) {
        this.packetIndex--;
        const id = this.messageIdList[this.packetIndex];
        this.printPacketDetail(id);
      }
    }
  }

  findInJsonByMessageId(id: string) {
    return this.dataService.getMessageByID(id);
    // return this.dataService.getMessageByID(id).pipe(
    //   tap((message: Message | undefined) => {
    //     this.currentMessage = message;
    //   })
    // );
  }

  printPacketDetail(id: string): void {
    this.textToCopy = [];
    this.resultList = [];

    this.findInJsonByMessageId(id).subscribe(
      (message: Message | undefined) => {
        let output: string[] = [];
        let sipHeaderArr = message?.sipHeader;
        let bodyArr = message?.body;

        // stringifies sipHeader for printing
        for (const key in sipHeaderArr) {
          if (sipHeaderArr.hasOwnProperty(key)) {
            sipHeaderArr[key].forEach((value: string) => {
              let str: string = '';
              if (key == 'Header') {
                str = value;
              } else {
                str = key + ': ' + value;
              }
              this.textToCopy.push(str + '\n');
              output.push(str);
            });
          }
        }

        // stringifies body for printing
        if (bodyArr && bodyArr.content) {
          bodyArr.content.forEach((value) => {
            const str = value;
            this.textToCopy.push(str + '\n');
            output.push(str);
          });
        }

        this.resultList = output;
      },
      (error) => {
        console.error('Error printing message with id = ' + id, error);
      }
    );
  }

  fetchMessages(): void {
    this.dataService.getMessages().subscribe(
      (messages: any[]) => {
        this.log = messages;
        this.messageIdList = messages.map((item) => item.startLine.messageID);
        this.printFirstMessage();
      },
      (error) => {
        console.error('Error fetching messages', error);
      }
    );
  }

  printFirstMessage(): void {
    this.currentMessageId = this.messageIdList[0];
    this.printPacketDetail(this.currentMessageId);
  }

  copyText(): void {
    let output = this.textToCopy.join('');
    this.clipboard.copy(output);
  }
}
