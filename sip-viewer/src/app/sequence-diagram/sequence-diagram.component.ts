import { Component, ElementRef, AfterViewInit, ViewChild } from '@angular/core';
import * as d3 from 'd3';

interface DiagramMessage {
  from: string;
  to: string;
  message: string;
  index: number;
}

@Component({
  selector: 'app-sequence-diagram',
  standalone: true,
  imports: [],
  templateUrl: './sequence-diagram.component.html',
  styleUrl: './sequence-diagram.component.css'
})
export class SequenceDiagramComponent implements AfterViewInit {
  controlsOn: boolean = false;
  @ViewChild('sequenceDiagram', { static: false })
  diagram!: ElementRef;

  constructor() {}

  ngAfterViewInit(): void {
    const participants = ['LegA', 'Call Handling', 'LegB'];
    const messages = [
      { from: 'LegA', to: 'Call Handling', message: 'INVITE', index: 0 },
      { from: 'Call Handling', to: 'LegB', message: 'INVITE', index: 1 },
      { from: 'LegB', to: 'Call Handling', message: '180 Trying', index: 2 },
      { from: 'Call Handling', to: 'LegA', message: '180 Trying', index: 3 },
      { from: 'LegA', to: 'Call Handling', message: 'INVITE', index: 4 },
      { from: 'Call Handling', to: 'LegB', message: 'INVITE', index: 5 },
      { from: 'LegB', to: 'Call Handling', message: '180 Trying', index: 6 },
      { from: 'Call Handling', to: 'LegA', message: '180 Trying', index: 7 },
      { from: 'LegA', to: 'Call Handling', message: 'INVITE', index: 8 },
      { from: 'Call Handling', to: 'LegB', message: 'INVITE', index: 9 },
      { from: 'LegB', to: 'Call Handling', message: '180 Trying', index: 10 },
      { from: 'Call Handling', to: 'LegA', message: '180 Trying', index: 11 }
    ];
    console.log("hi")
    console.log(this.diagram)
    this.drawSequenceDiagram(messages, participants);
  }

  private drawSequenceDiagram(messages: DiagramMessage[], participants: string[]): void {
    const svgWidth = 600;
    const svgHeight = Math.max(500,50 + 40*messages.length);
    
    const svg = d3.select(this.diagram.nativeElement)
      .append('svg')
      .attr('width', svgWidth)
      .attr('height', svgHeight);
    
    const xScale = d3.scaleBand()
      .domain(participants)
      .range([100, svgWidth - 100])
      .padding(0.5);

    const messageSeparator = Math.min(svgHeight, messages.length*40)
    const yScale = d3.scaleLinear()
          .domain([0, messages.length])
          .range([50, messageSeparator]);

    console.log(yScale.domain(), yScale.range(), yScale(2))

    // Draw participant lines
    svg.selectAll('.participant-line')
    .data(participants)
    .enter()
    .append('line')
    .attr('class', 'participant-line')
    .attr('x1', d => xScale(d) ?? 0)
    .attr('x2', d => xScale(d) ?? 0)
    .attr('y1', 0)
    .attr('y2', svgHeight)
    .attr('stroke', 'black')
    .attr('stroke-width', 2);

    // Draw participant labels
    svg.selectAll('.participant-label')
    .data(participants)
    .enter()
    .append('text')
    .attr('class', 'participant-label')
    .attr('x', d => xScale(d) ?? 0)
    .attr('y', 30)
    .attr('text-anchor', 'middle')
    .text(d => d);

    // Draw messages
    messages.forEach(msg => {
    const fromX = xScale(msg.from) ?? 0;
    const toX = xScale(msg.to) ?? 0;
    const y = yScale(msg.index);


    // Draw arrow
    svg.append('line')
    .attr('x1', fromX)
    .attr('x2', toX)
    .attr('y1', y)
    .attr('y2', y)
    .attr('stroke', 'black')
    .attr('stroke-width', 2)
    .attr('marker-end', 'url(#arrow)')
    .style('color', 'red')
    .on('click', (event) => console.log(msg, msg.index));

    // Draw message text
    svg.append('text')
    .attr('x', (fromX + toX) / 2)
    .attr('y', y - 5)
    .attr('text-anchor', 'middle')
    .text(msg.message);
    });

    // Define arrow marker
    svg.append('defs')
    .append('marker')
    .attr('id', 'arrow')
    .attr('viewBox', '0 0 10 10')
    .attr('refX', 5)
    .attr('refY', 5)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto-start-reverse')
    .append('path')
    .attr('d', 'M 0 0 L 10 5 L 0 10 z')
    .attr('fill', 'black');
        
  }
}