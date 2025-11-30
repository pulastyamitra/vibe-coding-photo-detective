export interface DetectedTool {
  name: string;
  likelihoodScore: number; // 0 to 10
  reasoning: string;
}

export interface AnalysisResult {
  overallAssessment: string;
  estimatedEditLayerCount: number;
  originalDevice: string;     // Estimated by AI based on visual characteristics
  metadataDevice?: string | null; // Extracted from file metadata (EXIF)
  detectedTools: DetectedTool[];
}

export enum AnalysisState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}