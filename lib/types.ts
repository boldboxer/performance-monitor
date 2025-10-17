// lib/types.ts

/**
 * Represents a set of sub-strand scores under one strand.
 * Example:
 * {
 *   "Listening": "A",
 *   "Speaking": "B"
 * }
 */
export interface SubStrandScores {
  [subStrand: string]: string;
}

/**
 * Represents a full strand (e.g., "English", "Math") with its sub-strands.
 */
export interface StrandScores {
  [strand: string]: SubStrandScores;
}

/**
 * Represents a single learning area (e.g., "Mathematics") for one learner.
 */
export interface LearningArea {
  /** Subject or area name (e.g., "English") */
  learningArea: string;

  /** All scores under that subject, grouped by strand */
  scores: StrandScores;

  /** Optional teacher comment */
  comment?: string;

  /** Optional total score */
  total?: string;

  /** The learner’s full name (optional in some flows) */
  name?: string;

  /** Admission number for identifying the learner */
  admissionNo: string;

  /** Grade (optional, used in parsing) */
  grade?: string;
}

/**
 * Represents a single learner with all their learning areas.
 */
export interface Learner {
  name: string;
  admissionNo: string;
  grade: string;
  learningAreas: LearningArea[];
}

/**
 * Simple summary info about each learning area sheet
 * (number of rows and columns).
 */
export interface LearningAreaSummary {
  rows: number;
  columns: number;
}

/**
 * Mapping of learning area names → their Google Sheet URLs.
 */
export interface LearningAreaLinks {
  [learningAreaName: string]: string;
}

/**
 * Google Sheet identifiers for the Sheets API.
 */
export interface SheetInfo {
  sheetId: string;
  gid?: string;
  sheetName: string;
}

export interface ExtractResult extends SheetInfo {
  availableTabs?: string[];
}


/**
 * Used when updating specific cells in Google Sheets.
 */
export interface CellUpdate {
  row: number;
  col: number;
  value: string;
}
