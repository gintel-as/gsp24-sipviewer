import { Message } from '../message';
import { DiagramMessage } from '../diagram-message';
import { Observable, forkJoin, map } from 'rxjs';
import d3, { index } from 'd3';
import { StartLine } from '../start-line';

export default class Utils {
  static importDataFromDataServiceMap(messages: Observable<Message[]>) {
    return messages.pipe(
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
}
