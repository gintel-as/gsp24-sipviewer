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
  methodList: string[] = [];
  directionList: string[] = [];

  constructor(private dataService: DataService) { }

  ngOnInit(): void {
    this.fetchMessages();
  }

  fetchMessages(): void {
    this.dataService.getMessages().subscribe(
      (messages: any[]) => {
        // Extract 'method' from each 'startLine' object
        this.methodList = messages.map(message => message.startLine.method),
        this.directionList = messages.map(message => message.startLine.direction);
      },
      error => {
        console.error('Error fetching messages', error);
      }
    );
  }

}
