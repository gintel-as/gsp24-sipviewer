import { Message } from '../message';
import { DiagramMessage } from '../diagram-message';
import { Observable, forkJoin, map, take } from 'rxjs';
import d3, { index } from 'd3';
import { StartLine } from '../start-line';

export default class Utils {
  static importDataFromDataServiceMap(messages: Observable<Message[]>) {
    return messages.pipe(
      take(1),
      map((msgList) =>
        msgList.map((msg, i) => {
          return {
            message: msg,
            index: i,
          };
        })
      )
    );
  }

  static importParseParticipants(messages: Observable<Message[]>) {
    return messages.pipe(
      take(1),
      map((msgList) =>
        msgList.map((msg) => msg.startLine.party).filter(this.onlyUnique)
      )
    );
  }

  static importCombined(messages: Observable<Message[]>) {
    return forkJoin({
      diagramMessages: this.importDataFromDataServiceMap(messages),
      participants: this.importParseParticipants(messages),
    });
  }

  static onlyUnique(value: any, index: any, array: string | any[]) {
    return array.indexOf(value) === index;
  }

  static identifyMessageRecieverAndSender(
    startLine: StartLine,
    defaultParty: string
  ) {
    if (startLine.direction == 'to') {
      return { from: defaultParty, to: startLine.party };
    } else {
      return { from: startLine.party, to: defaultParty };
    }
  }

  //Function to select color based on session string, might need to be moved elsewhere for dynamic logic
  static selectArrowColor(session: string) {
    if (session == '304286493') {
      return 'red';
    }
    return 'blue';
  }

  static getDateString(date: Date) {
    return `${date.getFullYear()}-${this.addZeroInFront(
      date.getMonth()
    )}-${this.addZeroInFront(date.getDay())} ${this.getTimeString(date)}`;
  }

  static getTimeString(date: Date) {
    return `${this.addZeroInFront(date.getHours())}:${this.addZeroInFront(
      date.getMinutes()
    )}:${this.addZeroInFront(date.getSeconds())}.${date.getMilliseconds()}`;
  }

  static addZeroInFront(n: number) {
    if (n < 10) {
      return `0${n}`;
    }
    return `${n}`;
  }
}
