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

  static getArrowStyles() {
    return [
      'colored-line-red', // Solid red
      'colored-line-purple dotted-line-short', // Short dotted purple
      'colored-line-yellow dotted-line-long', // Long dotted yellow

      'colored-line-blue', // Solid blue
      'colored-line-magenta dotted-line-short', // Short dotted magenta
      'colored-line-cyan dotted-line-long', // Long dotted cyan

      'colored-line-black', // Solid black
      'colored-line-brown dotted-line-short', // Short dotted brown
      'colored-line-orange dotted-line-long', // Long dotted orange

      'colored-line-orange', // Solid orange
      'colored-line-purple dotted-line-short', // Short dotted purple
      'colored-line-green dotted-line-long', // Long dotted green

      'colored-line-blue', // Solid blue
      'colored-line-red dotted-line-short', // Short dotted red
      'colored-line-yellow dotted-line-long', // Long dotted yellow

      'colored-line-black', // Solid black
      'colored-line-cyan dotted-line-short', // Short dotted cyan
      'colored-line-brown dotted-line-long', // Long dotted brown

      'colored-line-magenta', // Solid magenta
      'colored-line-purple dotted-line-short', // Short dotted purple
      'colored-line-green dotted-line-long', // Long dotted green

      'colored-line-red', // Solid red
      'colored-line-blue dotted-line-short', // Short dotted blue
      'colored-line-yellow dotted-line-long', // Long dotted yellow

      'colored-line-orange', // Solid orange
      'colored-line-cyan dotted-line-short', // Short dotted cyan
      'colored-line-brown dotted-line-long', // Long dotted brown

      'colored-line-brown', // Solid brown
      'colored-line-magenta dotted-line-short', // Short dotted magenta
      'colored-line-green dotted-line-long', // Long dotted green
    ];
  }
}
