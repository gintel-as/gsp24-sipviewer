export interface SessionInfo {
  sessionID: string;
  time: Date;
  from: string;
  to: string;
  associatedSessions: string[];
}
