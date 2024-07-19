export interface SessionInfo {
  sessionID: string;
  time: Date;
  from: string;
  to: string;
  participants: string[];
  initialInvite: boolean;
  associatedSessions: string[];
}
