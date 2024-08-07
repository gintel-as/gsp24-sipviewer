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

  //Update which sessions get what styling, aims to keep currently selected sessions style and randomly assign new ones based on what is the next free style in the list of styles
  updateSessionStyles(selectedSessionIDs: string[]) {
    let oldSessionIDs = Object.keys(this.sessionDict);
    let newSessionDict: sessionDict = {};
    let styles = Utils.getArrowStyles(selectedSessionIDs.length);
    selectedSessionIDs.forEach((sessionID) => {
      if (!oldSessionIDs.includes(sessionID)) {
        newSessionDict[sessionID] = styles.shift() ?? 'colored-line-orange';
      } else {
        //Keep previous style of unchanged sessions, but remove one occurence of the style
        newSessionDict[sessionID] = this.sessionDict[sessionID];
        styles = Utils.removeFirstOccurrenceOfStyle(
          styles,
          this.sessionDict[sessionID]
        );
      }
    });
    this.sessionDict = newSessionDict;
  }

  markSelectedMessage(messageID: string): void {
    this.markedMessageId = messageID;
    for (const key in this.messageIndexDict) {
      if (this.messageIndexDict[key] === messageID) {
        this.selectedPacketIndex = Number(key);
      }
    }
    //Select ID's marking the selected messages, and remove it from previously selected messages
    d3.select('#selected-message').attr('id', '');
    d3.select('#selected-message-text').attr('id', '');
    d3.select('#selected-message-timestamp').attr('id', '');
    d3.select('#selected-message-rect').attr('id', '');
    //Find new message to select and mark it with selected ID for styling
    d3.select(`[message-id="${messageID}"`).attr('id', 'selected-message');
    d3.select(`[message-text-id="${messageID}"`).attr(
      'id',
      'selected-message-text'
    );
    d3.select(`[message-timestamp-id="${messageID}`).attr(
      'id',
      'selected-message-timestamp'
    );
    d3.select(`[message-rect-id="${messageID}`).attr(
      'id',
      'selected-message-rect'
    );

    try {
      const nativeElement = d3.select('#selected-message').node() as Element;
      nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    } catch (error) {}
  }

  selectMessage(msg: DiagramMessage): void {
    this.dataService.selectNewMessageByID(msg.message.startLine.messageID);
    this.selectedPacketIndex = msg.index;
  }

  indexOfPreviouslySelectedMessageOrFirst(): number {
    //If first packet selected, do not stay on this packet if an earlier packet is loaded in a newly selected session
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

  //Handles keyboard navigation on ArrowUp or ArrowDown, by incrementing local packetindex
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

  //Needed for keyboard navigation, provides a simple index that can be incremented and then find the messageID of that packet.
  setMessageIndexToIDDictionary(messages: DiagramMessage[]) {
    this.messageIndexDict = {};
    this.messageIndexDict = messages.reduce((acc, message) => {
      acc[message.index] = message.message.startLine.messageID;
      return acc;
    }, this.messageIndexDict);
  }

  //If name begins with LegA, add to the left of CH, else just take first on the left, other participants go to the right
  addCallHandlingToParticipants(participants: string[], ch: string): string[] {
    if (participants.length == 0) {
      return [];
    }
    let leftParticipants: string[] = [];
    //Right participants starts with Call Handling
    let rightParticipants: string[] = [ch];
    participants.forEach((participant) => {
      if (participant.toLowerCase().startsWith('lega')) {
        leftParticipants.push(participant);
      } else {
        rightParticipants.push(participant);
      }
    });
    return leftParticipants.concat(rightParticipants);
  }

  private drawSequenceDiagram(
    messages: DiagramMessage[],
    participants: string[]
  ): void {
    //If a diagram should be drawn, add CH and get all LegA occurences on left side of CH
    let ch = 'Call Handling';
    participants = this.addCallHandlingToParticipants(participants, ch);

    //Constants to add spaceing for topbar and timestamps
    const spaceForTime = 180;
    const messageSpaceFromTop = 40;
    let xSpaceForIndex = 0;
    if (messages.length !== 0) {
      xSpaceForIndex =
        20 + messages[messages.length - 1].index.toString().length * 10;
    }

    //Set height, drawidth, and "viewwidth"(how wide the background should be)
    const svgHeight = 40 * messages.length + messageSpaceFromTop;
    const svgDrawWidth =
      200 * participants.length + spaceForTime + xSpaceForIndex;
    const svgViewWidth = svgDrawWidth + 4000;

    //Create dictionary that maps index to message objects
    this.setMessageIndexToIDDictionary(messages);

    //Clear elements for blank canvas
    d3.select(this.diagram.nativeElement).selectAll('*').remove();
    d3.select(this.diagramLabels.nativeElement).selectAll('*').remove();

    //svg is the diagram div, for questions look at d3 docs
    const svg = d3
      .select(this.diagram.nativeElement)
      .append('svg')
      .attr('width', svgViewWidth)
      .attr('height', svgHeight)
      .attr('y', 0)
      .attr('id', 'diagramSVG')
      .attr('scroll-margin-top', 50);

    //svg2 is the upepr div "diagramLabels"
    const svg2 = d3
      .select(this.diagramLabels.nativeElement)
      .append('svg')
      .attr('width', svgDrawWidth)
      .attr('height', 50);

    const xScale = d3
      .scaleBand()
      .domain(participants)
      .range([spaceForTime, svgDrawWidth])
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
      let labelX = spaceForTime + xSpaceForIndex;
      let textLine = msg.message.startLine.method;
      let rectClass = '';
      // If even index, set background rectangle class with color background
      if (msg.index % 2 == 0) {
        rectClass = 'message-background-line-red';
      }

      //Add 'SDP' to each line with content length > 0, if no content length attr catch error
      try {
        if (msg.message.sipHeader['Content-Length'][0] > 0) {
          textLine = `${textLine} [SDP]`;
        }
      } catch (error) {}

      //Select style for message based on session
      let classes = this.sessionDict[`${msg.message.startLine.sessionID}`];

      // Draw background rectangle
      svg
        .append('rect')
        .attr('x', 0)
        .attr('width', svgViewWidth)
        .attr('y', y - 25)
        .attr('height', 40)
        .attr('class', rectClass)
        .attr('message-rect-id', msg.message.startLine.messageID)
        .on('click', () => this.selectMessage(msg));

      // Draw invisibleline for highlights
      svg
        .append('line')
        .attr('x1', fromX)
        .attr('x2', toX)
        .attr('y1', y)
        .attr('y2', y)
        .attr('stroke', 'none ')
        .attr('stroke-width', 10)
        .attr('message-id', msg.message.startLine.messageID)
        .on('click', () => this.selectMessage(msg));

      // Draw arrow-line
      svg
        .append('line')
        .attr('x1', fromX)
        .attr('x2', toX + directionOffset)
        .attr('y1', y)
        .attr('y2', y)
        .attr('marker-end', 'url(#arrow)')
        .attr('class', `${classes} arrow-line`)
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
        .attr('message-timestamp-id', msg.message.startLine.messageID)
        .text(
          `${msg.index + 1}: ${Utils.getDateString(msg.message.startLine.time)}`
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
    } else {
      //Reset marking values to default if messages is empty
      this.markedMessageId = '';
      this.selectedPacketIndex = 0;
    }
  }
}
