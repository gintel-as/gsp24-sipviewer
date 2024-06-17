import { Component, OnInit } from '@angular/core';
import {CommonModule} from '@angular/common';
import { DataService } from '../data.service';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-flow-chart',
  standalone: true,
  imports: [CommonModule, NgFor],
  templateUrl: './flow-chart.component.html',
  styleUrl: './flow-chart.component.css'
})

export class FlowChartComponent implements OnInit {
  // startLineList: string[] = ["Hei","på", "deg"];
  // When interface is finished: 
  // startLineList: FlowChart[] = [
  //   {
  //     ...
  //   }
  //   {
  //     ...
  //   }
  // ]

  startLineList: string[] = [];

  constructor(private dataService: DataService) { }

  ngOnInit(): void {
    this.fetchMessages();
  }

  fetchMessages(): void {
    this.dataService.getMessages().subscribe(
      (messages: any[]) => {
        // Extract 'method' from each 'startLine' object
        this.startLineList = messages.map(message => message.startLine.method);
      },
      error => {
        console.error('Error fetching messages', error);
      }
    );
  }

}
