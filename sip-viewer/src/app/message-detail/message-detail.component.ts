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
  resultList: any[] = [];
  textToCopy: any[] = [];
  packetIndex: number = 0;
  messageIDList: string[] = [];

  constructor(private dataService: DataService, private clipboard: Clipboard) {
    // Observes changes in selected sessionIDs in session-table
    dataService.selectedSessionIDs$.subscribe(() => {
      dataService.getMessagesFromSelectedSessions().subscribe(
        (messages: any[]) => {
          this.messageIDList = messages.map((item) => item.startLine.messageID); // updates messageIDList from selected sessions
        },
        (error) => {
          console.error(
            'Error fetching messages of selected sessionIDs',
            error
          );
        }
      );
    });
    // Observes selected message in diagram and prints out the details
    dataService.currentSelectedMessageID$.subscribe((selectedMessageID) => {
      this.printPacketDetail(selectedMessageID);
    });
  }

  changePacket(direction: 'next' | 'previous') {
    if (direction == 'next') {
      if (this.packetIndex + 1 < this.messageIDList.length) {
        this.packetIndex++;
      } else {
        this.packetIndex = 0;
      }
    } else if (direction == 'previous') {
      if (this.packetIndex - 1 >= 0) {
        this.packetIndex--;
      } else {
        this.packetIndex = this.messageIDList.length - 1;
      }
    }
    const id = this.messageIDList[this.packetIndex];
    this.printPacketDetail(id);
    this.dataService.selectNewMessageByID(id);
  }

  printPacketDetail(id: string): void {
    this.textToCopy = [];
    this.resultList = [];
    this.packetIndex = this.messageIDList.indexOf(id); // Update packet detail meta information

    this.dataService.getMessageByID(id).subscribe(
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
        // catches undefined so output is not undefined
        if (message == undefined) {
          return;
        }
        this.resultList = output;
      },
      (error) => {
        console.error('Error printing message with id = ' + id, error);
      }
    );
  }

  copyText(): void {
    let output = this.textToCopy.join('');
    this.clipboard.copy(output);
  }
}
