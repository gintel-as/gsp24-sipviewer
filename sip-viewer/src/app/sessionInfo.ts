export interface SessionInfo {
  sessionID: string;
  time: Date;
  from: string;
  to: string;
  initialInvite: boolean;
  associatedSessions: string[];
}
