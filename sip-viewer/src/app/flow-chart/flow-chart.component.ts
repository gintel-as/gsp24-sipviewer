import { Component, OnInit } from '@angular/core';
import {CommonModule} from '@angular/common';
import { DataService } from '../data.service';
import { NgFor } from '@angular/common';
import { Message } from '../message';

@Component({
  selector: 'app-flow-chart',
  standalone: true,
  imports: [CommonModule, NgFor],
  templateUrl: './flow-chart.component.html',
  styleUrl: './flow-chart.component.css'
})

export class FlowChartComponent implements OnInit {
  messages: Message[] = [];

  constructor(private dataService: DataService) { }

  ngOnInit(): void {
    this.fetchMessages();
  }

  fetchMessages(): void {
    this.dataService.getMessages().subscribe(
      data => this.messages = data,
      error => console.error('Error fetching messages', error)
    );
  }

}
