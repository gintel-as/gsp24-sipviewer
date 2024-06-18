import { Component, ElementRef, AfterViewInit, ViewChild } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'app-seq-dia',
  standalone: true,
  imports: [],
  template: '<p>seq-dia works!</p><div #sequenceDiagram>Hi!</div>',
  styleUrl: './seq-dia.component.css'
})
export class SeqDiaComponent implements AfterViewInit {
  controlsOn: boolean = false;
  @ViewChild('sequenceDiagram', { static: false })
  sequenceDiagram!: ElementRef;

  constructor() {}

  ngAfterViewInit(): void {
    console.log("passed");
    console.log(this.sequenceDiagram.nativeElement);
    // const seqDia = this.sequenceDiagram.nativeElement;
    const svg = d3.select(this.sequenceDiagram.nativeElement);
    // console.log(d3.select(this.sequenceDiagram.nativeElement))
    // console.log(svg);
    // const svg = d3.select(this.sequenceDiagram.nativeElement)
    //   .style('fill', 'red');
    // console.log(svg)
    // this.drawSequenceDiagram();
  }

  // private drawSequenceDiagram(): void {
  //   const svg = d3.select(this.sequenceDiagram.nativeElement).select('sequenceDiagram')
  //                .style("fill", "red");

  //   // Your D3.js code to draw the sequence diagram goes here
  //   // Example: drawing Bob and Alice saying hi to each other
  //   svg.append('text')
  //      .attr('x', 50)
  //      .attr('y', 50)
  //      .text('Bob says: Hi Alice!');

  //   svg.append('text')
  //      .attr('x', 50)
  //      .attr('y', 100)
  //      .text('Alice says: Hi Bob!');
  // }
}