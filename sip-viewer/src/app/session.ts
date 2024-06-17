import { Message } from "./message";

export interface Session {
    id: number;
    messages: Message[];
}
