import { NgFor } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-message-detail',
  standalone: true,
  imports: [NgFor],
  templateUrl: './message-detail.component.html',
  styleUrl: './message-detail.component.css'
})
export class MessageDetailComponent {

}
