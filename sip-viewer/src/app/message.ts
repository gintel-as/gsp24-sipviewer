import { StartLine } from './start-line';
import { SipHeader } from './sip-header';
import { SipBody } from './sip-body';

export interface Message {
  startLine: StartLine;
  sipHeader: SipHeader;
  body: SipBody;
}
