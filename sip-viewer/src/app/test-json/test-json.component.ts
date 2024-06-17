import { Component, OnInit } from '@angular/core';
import { Message } from '../message';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import * as messageData from '../assets/messages2.json';

@Component({
  selector: 'app-test-json',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './test-json.component.html',
  styleUrl: './test-json.component.css'
})
export class TestJsonComponent implements OnInit {
  messages: Message[] = [];
  data : any = messageData;

  ngOnInit(): void {
    console.log('Data', this.data.length)
    console.log('Raw data', messageData)
  }
}
