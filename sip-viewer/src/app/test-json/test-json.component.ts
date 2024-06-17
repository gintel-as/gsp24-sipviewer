import { Component, OnInit } from '@angular/core';
import { Message } from '../message';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import messageData from '../assets/messages.json';

@Component({
  selector: 'app-test-json',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './test-json.component.html',
  styleUrl: './test-json.component.css'
})
export class TestJsonComponent implements OnInit {
  messages: Message[] = [];
  data : Message[] = messageData;

  ngOnInit(): void {
    console.log('Data', this.data[0])
    console.log('Raw data', messageData)
  }
}
