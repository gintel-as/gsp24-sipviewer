import { StartLine } from "./start-line";
import { SipHeader} from "./sip-header";

export interface Message {
    // startLine: StartLine;
    // sipHeader: SipHeader;
    startLine: string;
    sipHeader: string; 
    body: string;
}
