import { Component, OnInit } from '@angular/core';
import {CommonModule} from '@angular/common';
import { DataService } from '../data.service';
import { NgFor } from '@angular/common';
import { Message } from '../message';
import { SequenceDiagramComponent } from "../sequence-diagram/sequence-diagram.component";

@Component({
    selector: 'app-flow-chart',
    standalone: true,
    templateUrl: './flow-chart.component.html',
    styleUrl: './flow-chart.component.css',
    imports: [CommonModule, NgFor, SequenceDiagramComponent]
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
