export type ProjectPromptSnapshot = {
  issueNumber: number;
  issueUrl: string;
  missionId: string;
  participantId: string;
  attempts: number;
  latestScore: number;
  eligible: boolean;
  voting: "Candidate" | "Not eligible";
};

export type ProjectSyncResult = { itemId: string; created: boolean };

export interface ProjectStore {
  syncPrompt(snapshot: ProjectPromptSnapshot): Promise<ProjectSyncResult>;
}
