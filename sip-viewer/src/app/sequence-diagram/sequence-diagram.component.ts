import { Component, ElementRef, AfterViewInit, ViewChild } from '@angular/core';
import { DataService } from '../data.service';
import { SelectedMessageService } from '../selected-message.service';
import * as d3 from 'd3';
import Utils from './utils';
import { DiagramMessage } from '../diagram-message';
import { tap } from 'rxjs';

@Component({
  selector: 'app-sequence-diagram',
  standalone: true,
  imports: [],
  templateUrl: './sequence-diagram.component.html',
  styleUrl: './sequence-diagram.component.css',
})
export class SequenceDiagramComponent implements AfterViewInit {
  controlsOn: boolean = false;
  @ViewChild('sequenceDiagram', { static: false })
  diagram!: ElementRef;

  constructor(
    private dataService: DataService,
    private selectedMessageService: SelectedMessageService
  ) {
    selectedMessageService.currentSelectedMessageID$.subscribe(
      (selectedMessageID) => {
        this.markSelectedMessage(selectedMessageID);
      }
    );
  }

  markSelectedMessage(messageID: string): void {
    d3.select('#selected-message').attr('id', '');
    d3.select(`[message-id="${messageID}"`).attr('id', 'selected-message');
  }

  selectMessage(messageID: string): void {
    this.selectedMessageService.selectNewMessageByID(messageID);
  }

  ngAfterViewInit(): void {
    Utils.importCombined(this.dataService.getMessages())
      .pipe(
        tap((data) =>
          this.drawSequenceDiagram(data.diagramMessages, data.participants)
        )
      )
      .subscribe();
  }

  private drawSequenceDiagram(
    messages: DiagramMessage[],
    participants: string[]
  ): void {
    let ch = 'Call Handling';
    participants.splice(1, 0, ch);
    const svgWidth = Math.max(500, 200 * participants.length);
    const svgHeight = Math.max(500, 50 + 40 * messages.length);

    const svg = d3
      .select(this.diagram.nativeElement)
      .append('svg')
      .attr('width', svgWidth)
      .attr('height', svgHeight);

    const xScale = d3
      .scaleBand()
      .domain(participants)
      .range([0, svgWidth - 0])
      .padding(0.5);

    const messageSeparator = Math.min(svgHeight, messages.length * 40);
    const yScale = d3
      .scaleLinear()
      .domain([0, messages.length])
      .range([50, messageSeparator]);

    // Draw participant lines
    svg
      .selectAll('.participant-line')
      .data(participants)
      .enter()
      .append('line')
      .attr('class', 'participant-line')
      .attr('x1', (d) => xScale(d) ?? 0)
      .attr('x2', (d) => xScale(d) ?? 0)
      .attr('y1', 30)
      .attr('y2', svgHeight)
      .attr('stroke', 'black')
      .attr('stroke-width', 2);

    // Draw participant labels
    svg
      .selectAll('.participant-label')
      .data(participants)
      .enter()
      .append('text')
      .attr('class', 'participant-label')
      .attr('x', (d) => xScale(d) ?? 0)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .text((d) => d);

    // Draw messages
    messages.forEach((msg) => {
      let parties = Utils.identifyMessageRecieverAndSender(
        msg.message.startLine,
        ch
      );
      const fromX = xScale(parties.from) ?? 0;
      const toX = xScale(parties.to) ?? 0;
      const y = yScale(msg.index);
      let textLine = msg.message.startLine.method;
      try {
        if (msg.message.sipHeader['Content-Length'][0] > 0) {
          textLine = `${textLine} [SDP]`;
        }
      } catch (error) {}

      // Draw arrow
      svg
        .append('line')
        .attr('x1', fromX)
        .attr('x2', toX)
        .attr('y1', y)
        .attr('y2', y)
        .attr('marker-end', 'url(#arrow)')
        .attr('class', `session-${msg.message.startLine.sessionID} arrow-line`)
        .attr('message-id', msg.message.startLine.messageID)
        .on('click', () => this.selectMessage(msg.message.startLine.messageID));

      // Draw message text
      svg
        .append('text')
        .attr('x', (fromX + toX) / 2)
        .attr('y', y - 5)
        .attr('class', 'arrow-text')
        .text(textLine)
        .on('click', function () {
          d3.select('#selected-message').attr('id', '');
          d3.select(`[message-id="${msg.message.startLine.messageID}"`).attr(
            'id',
            'selected-message'
          );
        });
    });

    // Define arrow marker
    svg
      .append('defs')
      .append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 5)
      .attr('refY', 5)
      .attr('markerWidth', 3)
      .attr('markerHeight', 3)
      .attr('orient', 'auto-start-reverse')
      .append('path')
      .attr('markerUnit', 'useSpaceOnUse')
      .attr('d', 'M 0 0 L 10 5 L 0 10 z');
  }
}
