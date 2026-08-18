export type Gender = 'M' | 'F';

export interface CraStudent {
  id: string;
  studentNumber?: string; // 학번 (예: 10101 또는 1)
  name: string;
  gender: Gender;
  pastSeatInfo?: string; // 이전 자리배치 기록 (예: 1열 2행 / 홍길동)
  notes?: string; // 비고 및 특이사항 (시력, 청력, 특별 지도 등)
  // [0_전체_통합]
  totalNominated: number;
  totalWeighted: number;
  totalMediator: number;
  totalGroup: string;
  // [1_정서적_친밀감]
  intimacyNominated: number;
  intimacyWeighted: number;
  intimacyMediator: number;
  intimacyGroup: string;
  // [2_기능적_협력]
  cooperationNominated: number;
  cooperationWeighted: number;
  cooperationMediator: number;
  cooperationGroup: string;
  // [3_사회적_영향력]
  influenceNominated: number;
  influenceWeighted: number;
  influenceMediator: number;
  influenceGroup: string;
  // [4_교우관계_확장]
  expansionNominated: number;
  expansionWeighted: number;
  expansionMediator: number;
  expansionGroup: string;
}

export type LayoutType = 'pairs' | 'single' | 'pods4' | 'pods6' | 'custom';

export interface DeskPosition {
  id: string; // e.g. "desk_0_0"
  row: number;
  col: number;
  podId?: number; // group/pod ID
  disabled: boolean; // if true, seat is unoccupied / empty
}

export interface GridDimensions {
  rows: number;
  cols: number;
  rowAisles?: number[]; // indices of rows after which an aisle gap is inserted
  colAisles?: number[]; // indices of cols after which an aisle gap is inserted
}

export interface SavedLayoutPreset {
  id: string;
  name: string;
  type: LayoutType;
  dimensions: GridDimensions;
  desks: DeskPosition[];
}

export type GenderRule = 'mixed_pairs' | 'no_male_cross_adjacent' | 'even_distribution' | 'random' | 'balanced_group';

export interface FixedSeatConstraint {
  studentId: string;
  deskId: string;
}

export interface PairConstraint {
  student1Id: string;
  student2Id: string;
  type: 'must_together' | 'must_separate';
}

export interface AlgorithmWeights {
  intimacyWeight: number; // 정서적 친밀감 분산 비중 (%)
  expansionWeight: number; // 교우관계 확장 비중 (%)
  influenceWeight: number; // 사회적 영향력 균등 비중 (%)
}

export interface SeatingConstraints {
  genderRule: GenderRule;
  fixedSeats: FixedSeatConstraint[];
  pairConstraints: PairConstraint[];
  avoidPastNeighbors: boolean;
  prioritizeExpansion: boolean;
  separateIntimacyCliques: boolean;
  separateHighInfluence: boolean;
  algorithmWeights?: AlgorithmWeights;
  pastSeatingFileContent?: Record<string, string>; // past assignments map (studentId -> neighborId or deskId)
}

export interface SeatingResult {
  id: string;
  title: string;
  description: string;
  date: string;
  // Map deskId -> studentId (or null if empty)
  assignments: Record<string, string | null>;
  desks?: DeskPosition[];
  dimensions?: GridDimensions;
  // Snapshot of students referenced in `assignments`, so backups can be restored
  // by name/studentNumber even after student IDs are regenerated in a later session,
  // and so the seating chart can be displayed straight from the file with no student
  // roster loaded at all.
  studentRoster?: { id: string; name: string; studentNumber?: string; gender?: Gender }[];
  metrics: {
    expansionScore: number; // 0~100
    intimacyDispersionScore: number; // 0~100
    influenceBalanceScore: number; // 0~100
    constraintSatisfactionScore: number; // 0~100
    overallScore: number; // 0~100
  };
}

export interface HiddenPreset {
  isSecretActive: boolean;
  // Map deskId -> studentId
  presetAssignments: Record<string, string>;
}

export type ViewPerspective = 'student' | 'teacher'; // student: top=board, teacher: bottom=board

export type EventDisplayMode = 'all_candidates' | 'single_final';

export interface EventDisplayConfig {
  displayMode: EventDisplayMode;
  targetCandidateId: string;
}

export interface VoteRecord {
  optionId: string;
  votes: number;
}

