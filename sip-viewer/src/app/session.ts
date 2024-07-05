import { SessionInfo } from './sessionInfo';
import { Message } from './message';

export interface Session {
  sessionInfo: SessionInfo;
  messages: Message[];
}
