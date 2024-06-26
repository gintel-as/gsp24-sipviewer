import { Component, ElementRef, ViewChild } from '@angular/core';
import { DataService } from '../data.service';
import * as d3 from 'd3';
import Utils from './utils';
import { DiagramMessage } from '../diagram-message';
import { tap } from 'rxjs';

type messageIndexDict = { [key: number]: string };
type sessionDict = { [key: string]: string };

@Component({
  selector: 'app-sequence-diagram',
  standalone: true,
  imports: [],
  templateUrl: './sequence-diagram.component.html',
  styleUrl: './sequence-diagram.component.css',
})
export class SequenceDiagramComponent {
  controlsOn: boolean = false;
  @ViewChild('sequenceDiagram', { static: false })
  diagram!: ElementRef;
  @ViewChild('diagramLabels', { static: false })
  diagramLabels!: ElementRef;
  private markedMessageId: string = '';
  private selectedPacketIndex: number = 0;
  private messageIndexDict: messageIndexDict = {};
  private arrowStyles: string[] = Utils.getArrowStyles();
  private sessionDict: sessionDict = {};

  constructor(private dataService: DataService) {
    dataService.currentSelectedMessageID$.subscribe((selectedMessageID) => {
      this.markSelectedMessage(selectedMessageID);
    });
    dataService.selectedSessionIDs$.subscribe((selectedSessionIDs) => {
      this.onUpdatedSelectedSessions(selectedSessionIDs);
    });
    dataService.keyEvent$.subscribe((keyEvent) => {
      this.onKeyUpDown(keyEvent);
    });
  }

  //When sessions are updated, update diagram
  onUpdatedSelectedSessions(selectedSessionIDs: string[]) {
    this.updateSessionStyles(selectedSessionIDs);
    Utils.importCombined(this.dataService.getMessagesFromSelectedSessions())
      .pipe(
        tap((data) =>
          this.drawSequenceDiagram(data.diagramMessages, data.participants)
        )
      )
      .subscribe();
  }

  //If session already has a style selected, keep this selection and randomly assign for other sessions
  updateSessionStyles(selectedSessionIDs: string[]) {
    let newSessionDict: sessionDict = {};
    Object.keys(this.sessionDict).forEach((key) => {
      if (selectedSessionIDs.includes(key)) {
        newSessionDict[key] = this.sessionDict[key];
      }
    });
    let newSessions = selectedSessionIDs.filter(
      (sessionID) => !Object.keys(this.sessionDict).includes(sessionID)
    );
    let styles = this.arrowStyles.filter(
      (style) => !Object.values(newSessionDict).includes(style)
    );
    newSessions.forEach((sessionID, index) => {
      newSessionDict[sessionID] = styles[index];
    });
    this.sessionDict = newSessionDict;
  }

  markSelectedMessage(messageID: string): void {
    this.markedMessageId = messageID;
    d3.select('#selected-message').attr('id', '');
    d3.select('#selected-message-text').attr('id', '');
    d3.select(`[message-id="${messageID}"`).attr('id', 'selected-message');
    d3.select(`[message-text-id="${messageID}"`).attr(
      'id',
      'selected-message-text'
    );

    const nativeElement = d3.select('#selected-message').node() as Element;
    nativeElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
    });

    //Potential fix on redone resize windows
    // if (0 == 0) {
    //   console.log(1);
    //   const nativeElement = d3.select('#selected-message').node() as Element;
    //   nativeElement.scrollIntoView({
    //     behavior: 'smooth',
    //     block: 'center',
    //     inline: 'nearest',
    //   });
    // } else {
    //   console.log(2);
    //   const nativeParent = document.getElementById('#leftDiv') as Element;
    //   nativeParent.scrollTop = 0;
    //   // document.scroll;
    //   console.log(nativeParent.scrollTop);
    // }
  }

  selectMessage(msg: DiagramMessage): void {
    this.dataService.selectNewMessageByID(msg.message.startLine.messageID);
    this.selectedPacketIndex = msg.index;
  }

  indexOfPreviouslySelectedMessageOrFirst(): number {
    //Potentially remove this to always stay on first packet
    if (this.selectedPacketIndex == 0) {
      return 0;
    }
    let index = Object.values(this.messageIndexDict).indexOf(
      this.markedMessageId
    );
    if (index == -1) {
      return 0;
    }
    return index;
  }

  onKeyUpDown(keyEvent: string) {
    let maxIndex = Object.keys(this.messageIndexDict).length;
    if (keyEvent === 'ArrowUp') {
      this.selectedPacketIndex--;
    }
    if (keyEvent === 'ArrowDown') {
      this.selectedPacketIndex++;
    }
    if (this.selectedPacketIndex >= maxIndex) {
      this.selectedPacketIndex = 0;
    }
    if (this.selectedPacketIndex < 0) {
      this.selectedPacketIndex = maxIndex - 1;
    }
    this.dataService.selectNewMessageByID(
      this.messageIndexDict[this.selectedPacketIndex]
    );
  }

  setMessageIndexToIDDictionary(messages: DiagramMessage[]) {
    this.messageIndexDict = messages.reduce((acc, message) => {
      acc[message.index] = message.message.startLine.messageID;
      return acc;
    }, this.messageIndexDict);
  }

  private drawSequenceDiagram(
    messages: DiagramMessage[],
    participants: string[]
  ): void {
    let ch = 'Call Handling';
    if (participants.length !== 0) {
      participants.splice(1, 0, ch);
    }
    let spaceForTime = 180;
    const svgWidth = Math.max(500, 200 * participants.length + spaceForTime);
    const messageSpaceFromTop = 40;
    const svgHeight = 40 * messages.length + messageSpaceFromTop;
    this.setMessageIndexToIDDictionary(messages);

    //Clear elements for blank canvas
    d3.select(this.diagram.nativeElement).selectAll('*').remove();
    d3.select(this.diagramLabels.nativeElement).selectAll('*').remove();

    //svg is the diagram div, for questions look at d3 docs
    const svg = d3
      .select(this.diagram.nativeElement)
      .append('svg')
      .attr('width', svgWidth)
      .attr('height', svgHeight)
      .attr('y', 0)
      .attr('id', 'diagramSVG')
      .attr('scroll-margin-top', 50);

    //svg2 is the upepr div "diagramLabels"
    const svg2 = d3
      .select(this.diagramLabels.nativeElement)
      .append('svg')
      .attr('width', svgWidth)
      .attr('height', 50);

    const xScale = d3
      .scaleBand()
      .domain(participants)
      .range([spaceForTime, svgWidth])
      .padding(0.5);

    const yScale = d3
      .scaleLinear()
      .domain([0, messages.length])
      .range([messageSpaceFromTop, svgHeight]);

    // Draw participant lines
    svg
      .selectAll('.participant-line')
      .data(participants)
      .enter()
      .append('line')
      .attr('class', 'participant-line')
      .attr('x1', (d) => xScale(d) ?? 0)
      .attr('x2', (d) => xScale(d) ?? 0)
      .attr('y1', 0)
      .attr('y2', svgHeight)
      .attr('stroke', 'black')
      .attr('stroke-width', 2);

    // Draw participant labels
    svg2
      .selectAll('.participant-label')
      .data(participants)
      .enter()
      .append('text')
      .attr('class', 'participant-label')
      .attr('x', (d) => xScale(d) ?? 0)
      .attr('y', 30)
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
      let directionOffset = 0;
      //Add space for arrow depending on direction
      if (fromX > toX) {
        directionOffset = 5;
      } else {
        directionOffset = -5;
      }
      const y = yScale(msg.index);
      //Potentially change/remove labelSpace? Currently hard coded to 80px, but should probably be made flexible
      let labelSpace = msg.index.toString().length * 5 + 2;
      let labelX = spaceForTime + 80;
      let textLine = msg.message.startLine.method;

      //Add 'SDP' to each line with content length > 0, if no content length attr catch error
      try {
        if (msg.message.sipHeader['Content-Length'][0] > 0) {
          textLine = `${textLine} [SDP]`;
        }
      } catch (error) {}

      //Select style for message based on session
      let classes = this.sessionDict[`${msg.message.startLine.sessionID}`];

      // Draw arrow
      svg
        .append('line')
        .attr('x1', fromX)
        .attr('x2', toX + directionOffset)
        .attr('y1', y)
        .attr('y2', y)
        .attr('marker-end', 'url(#arrow)')
        .attr('marker-start', '1')
        .attr('class', `${classes} arrow-line`)
        .attr('message-id', msg.message.startLine.messageID)
        .on('click', () => this.selectMessage(msg));

      // Draw message text
      svg
        .append('text')
        .attr('x', (fromX + toX) / 2)
        .attr('y', y - 5)
        .attr('class', 'arrow-text')
        .text(textLine)
        .attr('message-text-id', msg.message.startLine.messageID)
        .on('click', () => this.selectMessage(msg));

      //Draw timestamp and packet index
      svg
        .append('text')
        .attr('x', labelX)
        .attr('y', y + 5.5)
        .attr('class', 'side-details')
        .text(
          `${msg.index}: ${Utils.getDateString(msg.message.startLine.time)}`
        )
        .on('click', () => this.selectMessage(msg));
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

    //Obtain index of message to mark, and select it after having drawn diagram
    if (messages.length !== 0) {
      let indexToMark = this.indexOfPreviouslySelectedMessageOrFirst();
      this.selectMessage(messages[indexToMark]);
    }
  }
}
