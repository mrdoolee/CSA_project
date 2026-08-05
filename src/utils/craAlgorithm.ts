import {
  CraStudent,
  DeskPosition,
  LayoutType,
  GridDimensions,
  SeatingConstraints,
  SeatingResult,
  HiddenPreset,
} from '../types';

/**
 * Generates default desk positions for various classroom layouts.
 */
export function generateDeskLayout(
  layoutType: LayoutType,
  studentCount: number = 25
): { desks: DeskPosition[]; dimensions: GridDimensions } {
  const desks: DeskPosition[] = [];

  if (layoutType === 'pairs') {
    // 2-desk pairs: 3 pairs (6 columns) x 5 rows = 30 seats
    const cols = 6;
    const rows = 5;
    let deskIdx = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const pairIndex = Math.floor(c / 2);
        const podId = r * 3 + pairIndex;
        desks.push({
          id: `desk_${r}_${c}`,
          row: r,
          col: c,
          podId,
          disabled: deskIdx >= studentCount,
        });
        deskIdx++;
      }
    }
    // Gaps after col 1, col 3 (splitting into 3 blocks of pairs)
    return { desks, dimensions: { rows, cols, rowAisles: [], colAisles: [1, 3] } };
  }

  if (layoutType === 'pods4') {
    // 4-person pods (2x2 per pod) -> 6 cols x 6 rows
    const cols = 6;
    const rows = 6;
    let deskIdx = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const podRow = Math.floor(r / 2);
        const podCol = Math.floor(c / 2);
        const podId = podRow * 3 + podCol;
        desks.push({
          id: `desk_${r}_${c}`,
          row: r,
          col: c,
          podId,
          disabled: deskIdx >= studentCount,
        });
        deskIdx++;
      }
    }
    // Row gaps after 1, 3; Col gaps after 1, 3 (making 2x2 pods clearly visible)
    return { desks, dimensions: { rows, cols, rowAisles: [1, 3], colAisles: [1, 3] } };
  }

  if (layoutType === 'pods6') {
    // 6-person pods (3x2 per pod) -> 6 cols x 5 rows
    const cols = 6;
    const rows = 5;
    let deskIdx = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const podRow = Math.floor(r / 2);
        const podCol = Math.floor(c / 3);
        const podId = podRow * 2 + podCol;
        desks.push({
          id: `desk_${r}_${c}`,
          row: r,
          col: c,
          podId,
          disabled: deskIdx >= studentCount,
        });
        deskIdx++;
      }
    }
    return { desks, dimensions: { rows, cols, rowAisles: [1, 3], colAisles: [2] } };
  }

  if (layoutType === 'single') {
    // Single seats: 6 columns x 5 rows with aisle gap after EVERY column (1-2, 2-3, 3-4, 4-5, 5-6)
    const cols = 6;
    const rows = 5;
    let deskIdx = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        desks.push({
          id: `desk_${r}_${c}`,
          row: r,
          col: c,
          podId: r * cols + c,
          disabled: deskIdx >= studentCount,
        });
        deskIdx++;
      }
    }
    return { desks, dimensions: { rows, cols, rowAisles: [], colAisles: [0, 1, 2, 3, 4] } };
  }

  // Custom / Default (6x5)
  const cols = 6;
  const rows = 5;
  let deskIdx = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      desks.push({
        id: `desk_${r}_${c}`,
        row: r,
        col: c,
        podId: Math.floor(r / 2) * 3 + Math.floor(c / 2),
        disabled: deskIdx >= studentCount,
      });
      deskIdx++;
    }
  }
  return { desks, dimensions: { rows, cols, rowAisles: [], colAisles: [1, 3] } };
}

/**
 * Distance between two desk positions in grid
 */
export function getDeskDistance(d1: DeskPosition, d2: DeskPosition): number {
  return Math.abs(d1.row - d2.row) + Math.abs(d1.col - d2.col);
}

/**
 * Checks if two desks are adjacent in 3x3 neighborhood (horizontal, vertical, and 4 diagonals) or same pod
 */
export function areDesksNeighbors(d1: DeskPosition, d2: DeskPosition): boolean {
  if (d1.id === d2.id) return false;
  const rowDiff = Math.abs(d1.row - d2.row);
  const colDiff = Math.abs(d1.col - d2.col);
  // 3x3 neighborhood: row diff <= 1 AND col diff <= 1 (includes 8 surrounding desks)
  if (rowDiff <= 1 && colDiff <= 1) return true;
  if (d1.podId !== undefined && d1.podId === d2.podId) return true;
  return false;
}

/**
 * Evaluates a candidate seating arrangement against CRA principles & constraints
 */
export function evaluateArrangement(
  assignments: Record<string, string | null>,
  desks: DeskPosition[],
  students: CraStudent[],
  constraints: SeatingConstraints,
  pastAssignments?: Record<string, string | null>[]
): {
  expansionScore: number;
  intimacyDispersionScore: number;
  influenceBalanceScore: number;
  constraintSatisfactionScore: number;
  overallScore: number;
} {
  const deskMap = new Map<string, DeskPosition>(desks.map((d) => [d.id, d]));

  // Inverse lookup: studentId -> deskPosition
  const studentDeskMap = new Map<string, DeskPosition>();
  Object.entries(assignments).forEach(([deskId, sId]) => {
    if (sId && deskMap.has(deskId)) {
      studentDeskMap.set(sId, deskMap.get(deskId)!);
    }
  });

  // 1. Constraint satisfaction
  let constraintViolations = 0;
  let totalConstraints = 0;

  // Fixed seats check
  constraints.fixedSeats.forEach((fs) => {
    totalConstraints++;
    if (assignments[fs.deskId] !== fs.studentId) {
      constraintViolations++;
    }
  });

  // Pair constraints check
  constraints.pairConstraints.forEach((pc) => {
    totalConstraints++;
    const d1 = studentDeskMap.get(pc.student1Id);
    const d2 = studentDeskMap.get(pc.student2Id);
    if (d1 && d2) {
      const isNeighbor = areDesksNeighbors(d1, d2);
      if (pc.type === 'must_together' && !isNeighbor) {
        constraintViolations++;
      } else if (pc.type === 'must_separate' && isNeighbor) {
        constraintViolations++;
      }
    }
  });

  // Past neighbors check (via pastSeatInfo string or pastAssignments history)
  if (constraints.avoidPastNeighbors) {
    const pastPairSet = new Set<string>();

    // 1. From student's pastSeatInfo string (e.g. "짝: 홍길동" or identical past seat "1행 2열")
    students.forEach((s1) => {
      students.forEach((s2) => {
        if (s1.id < s2.id) {
          const s1Text = s1.pastSeatInfo || '';
          const s2Text = s2.pastSeatInfo || '';
          const mentionsEachOther =
            (s1Text !== '' && s1Text.includes(s2.name)) ||
            (s2Text !== '' && s2Text.includes(s1.name)) ||
            (s1Text !== '' && s1Text === s2Text);

          if (mentionsEachOther) {
            pastPairSet.add(`${s1.id}_${s2.id}`);
          }
        }
      });
    });

    // 2. From pastAssignments array history
    if (pastAssignments && pastAssignments.length > 0) {
      pastAssignments.forEach((pastMap) => {
        const pastDeskToStudent = pastMap;
        const pastStudentToDesk = new Map<string, string>();
        Object.entries(pastDeskToStudent).forEach(([dId, sId]) => {
          if (sId) pastStudentToDesk.set(sId, dId);
        });

        students.forEach((s1) => {
          students.forEach((s2) => {
            if (s1.id < s2.id) {
              const pastD1 = deskMap.get(pastStudentToDesk.get(s1.id) || '');
              const pastD2 = deskMap.get(pastStudentToDesk.get(s2.id) || '');
              if (pastD1 && pastD2 && areDesksNeighbors(pastD1, pastD2)) {
                pastPairSet.add(`${s1.id}_${s2.id}`);
              }
            }
          });
        });
      });
    }

    // Evaluate current overlap violations against past pairs
    pastPairSet.forEach((pair) => {
      totalConstraints++;
      const [s1Id, s2Id] = pair.split('_');
      const d1 = studentDeskMap.get(s1Id);
      const d2 = studentDeskMap.get(s2Id);
      if (d1 && d2 && areDesksNeighbors(d1, d2)) {
        constraintViolations += 1;
      }
    });
  }

  const constraintSatisfactionScore = totalConstraints === 0
    ? 100
    : Math.max(0, Math.round(100 * (1 - constraintViolations / totalConstraints)));

  // 2. Intimacy Clique Dispersion Score (정서적 친밀감 분산)
  // Higher score if students in same intimacy group are NOT in adjacent desks
  let intimacyNeighborPenalty = 0;
  let intimacyChecks = 0;
  students.forEach((s1) => {
    students.forEach((s2) => {
      if (s1.id < s2.id && s1.intimacyGroup && s1.intimacyGroup === s2.intimacyGroup) {
        intimacyChecks++;
        const d1 = studentDeskMap.get(s1.id);
        const d2 = studentDeskMap.get(s2.id);
        if (d1 && d2 && areDesksNeighbors(d1, d2)) {
          // Penalty for keeping tight intimacy group together
          intimacyNeighborPenalty += 1;
        }
      }
    });
  });
  const intimacyDispersionScore = intimacyChecks === 0
    ? 100
    : Math.max(0, Math.round(100 * (1 - intimacyNeighborPenalty / intimacyChecks)));

  // 3. Social Influence Balance Score (사회적 영향력 분산)
  // High influence students (e.g. weighted >= 15 or nominated >= 5) should be separated
  const highInfluenceStudents = students.filter(
    (s) => s.influenceWeighted >= 15 || s.influenceNominated >= 5
  );
  let influenceClashCount = 0;
  for (let i = 0; i < highInfluenceStudents.length; i++) {
    for (let j = i + 1; j < highInfluenceStudents.length; j++) {
      const d1 = studentDeskMap.get(highInfluenceStudents[i].id);
      const d2 = studentDeskMap.get(highInfluenceStudents[j].id);
      if (d1 && d2) {
        const dist = getDeskDistance(d1, d2);
        if (dist <= 2) {
          influenceClashCount++;
        }
      }
    }
  }
  const maxClashes = Math.max(1, (highInfluenceStudents.length * (highInfluenceStudents.length - 1)) / 2);
  const influenceBalanceScore = Math.max(
    0,
    Math.round(100 * (1 - influenceClashCount / maxClashes))
  );

  // 4. Peer Relationship Expansion Score (교우관계 확장 - 맞지목 친구 우선 보상)
  let expansionReward = 0;
  let expansionTotal = 0;
  students.forEach((s1) => {
    if (s1.expansionNominated > 0 || s1.expansionWeighted > 0) {
      expansionTotal++;
      const d1 = studentDeskMap.get(s1.id);
      if (d1) {
        let maxStudentReward = 0;
        students.forEach((s2) => {
          if (s1.id !== s2.id) {
            const d2 = studentDeskMap.get(s2.id);
            if (d2 && areDesksNeighbors(d1, d2)) {
              // Check for mutual expansion nomination (맞지목 친구)
              const isMutualExpansion =
                (s1.expansionNominated > 0 && s2.expansionNominated > 0) ||
                (s1.expansionGroup && s1.expansionGroup === s2.expansionGroup && s1.expansionGroup !== '0');

              if (isMutualExpansion && s1.intimacyGroup !== s2.intimacyGroup) {
                // Highest reward for mutual expansion target from different intimacy group
                maxStudentReward = Math.max(maxStudentReward, 1.0);
              } else if (s1.intimacyGroup !== s2.intimacyGroup) {
                // Secondary reward for pairing with any peer outside current intimacy group
                maxStudentReward = Math.max(maxStudentReward, 0.7);
              }
            }
          }
        });
        expansionReward += maxStudentReward;
      }
    }
  });
  const expansionScore = expansionTotal === 0
    ? 100
    : Math.min(100, Math.round(100 * (expansionReward / expansionTotal)));

  // Overall Score calculation using teacher configured algorithm weights
  const weights = constraints.algorithmWeights || {
    intimacyWeight: 35,
    expansionWeight: 35,
    influenceWeight: 30,
  };
  // If the teacher drags every weight slider down to 0, treat it as "no preference"
  // and fall back to equal weighting instead of collapsing the CRA score to 0.
  const rawSumWeights = weights.intimacyWeight + weights.expansionWeight + weights.influenceWeight;
  const effectiveWeights = rawSumWeights === 0
    ? { intimacyWeight: 1, expansionWeight: 1, influenceWeight: 1 }
    : weights;
  const sumWeights = rawSumWeights === 0 ? 3 : rawSumWeights;

  const craWeightedScore =
    (intimacyDispersionScore * effectiveWeights.intimacyWeight +
      expansionScore * effectiveWeights.expansionWeight +
      influenceBalanceScore * effectiveWeights.influenceWeight) /
    sumWeights;

  // 30% Constraint Satisfaction + 70% CRA Weighted Score
  const overallScore = Math.round(
    constraintSatisfactionScore * 0.3 + craWeightedScore * 0.7
  );

  return {
    expansionScore,
    intimacyDispersionScore,
    influenceBalanceScore,
    constraintSatisfactionScore,
    overallScore,
  };
}

/**
 * Checks if students array contains valid CRA relationship data
 */
export function hasCraData(students: CraStudent[]): boolean {
  if (!students || students.length === 0) return false;
  return students.some(
    (s) =>
      (s.totalNominated !== undefined && s.totalNominated > 0) ||
      (s.intimacyNominated !== undefined && s.intimacyNominated > 0) ||
      (s.expansionNominated !== undefined && s.expansionNominated > 0) ||
      (s.cooperationNominated !== undefined && s.cooperationNominated > 0) ||
      (s.influenceNominated !== undefined && s.influenceNominated > 0) ||
      (s.intimacyGroup && s.intimacyGroup !== '모둠_1' && s.intimacyGroup !== '신규_전입')
  );
}

/**
 * Generates candidate arrangements based on teacher options, CRA rules, and Candidate 4 (Pure Random)
 */
export function generateCandidateArrangements(
  desks: DeskPosition[],
  students: CraStudent[],
  constraints: SeatingConstraints,
  hiddenPreset?: HiddenPreset,
  pastAssignments?: Record<string, string | null>[],
  dimensions?: GridDimensions
): SeatingResult[] {
  const activeDesks = desks.filter((d) => !d.disabled);
  if (students.length > 0 && activeDesks.length < students.length) {
    // If fewer active desks than students, enable additional desks dynamically
    desks.forEach((d, idx) => {
      if (idx < students.length) d.disabled = false;
    });
  }

  // Generate Candidate 4: Default arrangement respecting constraints 1..4 (and past neighbors)
  const opt4Assignments = generateRandomArrangement(desks, students, constraints, pastAssignments);
  const opt4Metrics = evaluateArrangement(opt4Assignments, desks, students, constraints, pastAssignments);
  const opt4Result: SeatingResult = {
    id: 'opt_4',
    title: '후보 4: 기본 제약조건 준수 배치안',
    description:
      '자리 고정, 같이/따로 관계, 성별 배치, 이전 짝꿍 회피 규칙을 준수하는 무작위 최적화 배치안입니다.',
    date: new Date().toLocaleDateString('ko-KR'),
    assignments: opt4Assignments,
    metrics: opt4Metrics,
    desks,
    dimensions,
  };

  const craAvailable = hasCraData(students);

  // If CRA data was NOT uploaded, return ONLY Candidate 4 (CRA candidates 1-3 disabled)
  if (!craAvailable) {
    return [opt4Result];
  }

  // Check if hidden secret preset is active
  if (hiddenPreset && hiddenPreset.isSecretActive && Object.keys(hiddenPreset.presetAssignments).length > 0) {
    const assignments = { ...hiddenPreset.presetAssignments };
    // Fill remaining desks with unassigned students
    const assignedStudents = new Set(Object.values(assignments).filter(Boolean) as string[]);
    const unassignedStudents = students.filter((s) => !assignedStudents.has(s.id));
    const emptyDesks = activeDesks.filter((d) => !assignments[d.id]);

    unassignedStudents.forEach((st, idx) => {
      if (emptyDesks[idx]) {
        assignments[emptyDesks[idx].id] = st.id;
      }
    });

    const metrics = evaluateArrangement(assignments, desks, students, constraints, pastAssignments);

    const opt2PresetAssignments = generateSingleArrangement(desks, students, constraints, 'expansion', pastAssignments);
    const opt3PresetAssignments = generateSingleArrangement(desks, students, constraints, 'intimacy', pastAssignments);

    return [
      {
        id: 'opt_1',
        title: '후보 1: 교사 비밀 맞춤형 (추첨 연출용)',
        description: '교사가 사전에 지정한 교실 최적화 자리배치안입니다.',
        date: new Date().toLocaleDateString('ko-KR'),
        assignments,
        metrics,
        desks,
        dimensions,
      },
      {
        id: 'opt_2',
        title: '후보 2: 교우관계 확장 최우선형',
        description: '새로운 친구관계를 지속적으로 형성할 수 있는 균형안입니다.',
        date: new Date().toLocaleDateString('ko-KR'),
        assignments: opt2PresetAssignments,
        metrics: evaluateArrangement(opt2PresetAssignments, desks, students, constraints, pastAssignments),
        desks,
        dimensions,
      },
      {
        id: 'opt_3',
        title: '후보 3: 친밀감 분산 & 학급 통합형',
        description: '기존의 단짝 소집단을 균등히 분산시켜 반 전체 분위기를 조율합니다.',
        date: new Date().toLocaleDateString('ko-KR'),
        assignments: opt3PresetAssignments,
        metrics: evaluateArrangement(opt3PresetAssignments, desks, students, constraints, pastAssignments),
        desks,
        dimensions,
      },
      opt4Result,
    ];
  }

  // Standard generation of 4 distinct candidates
  const opt1Assignments = generateSingleArrangement(desks, students, constraints, 'expansion', pastAssignments);
  const opt2Assignments = generateSingleArrangement(desks, students, constraints, 'balanced', pastAssignments);
  const opt3Assignments = generateSingleArrangement(desks, students, constraints, 'intimacy', pastAssignments);

  const opt1Metrics = evaluateArrangement(opt1Assignments, desks, students, constraints, pastAssignments);
  const opt2Metrics = evaluateArrangement(opt2Assignments, desks, students, constraints, pastAssignments);
  const opt3Metrics = evaluateArrangement(opt3Assignments, desks, students, constraints, pastAssignments);

  return [
    {
      id: 'opt_1',
      title: '후보 1: 교우관계 확장 중심형',
      description: '소외 학생 배려 및 새로운 친구 관계 형성을 최우선으로 고려한 배치안입니다.',
      date: new Date().toLocaleDateString('ko-KR'),
      assignments: opt1Assignments,
      metrics: opt1Metrics,
      desks,
      dimensions,
    },
    {
      id: 'opt_2',
      title: '후보 2: 종합 균형 추천형',
      description: '교우 확장, 친밀도 유지, 성별/시력 제약조건의 최적 밸런스를 고루 반영한 추천 배치안입니다.',
      date: new Date().toLocaleDateString('ko-KR'),
      assignments: opt2Assignments,
      metrics: opt2Metrics,
      desks,
      dimensions,
    },
    {
      id: 'opt_3',
      title: '후보 3: 친밀관계 유지 중심형',
      description: '기존의 친한 친구 관계 및 안정을 최우선으로 유지하는 배치안입니다.',
      date: new Date().toLocaleDateString('ko-KR'),
      assignments: opt3Assignments,
      metrics: opt3Metrics,
      desks,
      dimensions,
    },
    opt4Result,
  ];
}

/**
 * Generates Candidate 4: Placement respecting basic constraints 1..4 (and past neighbors)
 */
export function generateRandomArrangement(
  desks: DeskPosition[],
  students: CraStudent[],
  constraints: SeatingConstraints,
  pastAssignments?: Record<string, string | null>[]
): Record<string, string | null> {
  const activeDesks = desks.filter((d) => !d.disabled);
  const assignment: Record<string, string | null> = {};

  activeDesks.forEach((d) => {
    assignment[d.id] = null;
  });

  const assignedStudentIds = new Set<string>();

  // 1. Fixed seats
  constraints.fixedSeats.forEach((fs) => {
    if (activeDesks.some((d) => d.id === fs.deskId)) {
      assignment[fs.deskId] = fs.studentId;
      assignedStudentIds.add(fs.studentId);
    }
  });

  // 2. Pair constraints (must_together)
  const togetherPairs = constraints.pairConstraints.filter((pc) => pc.type === 'must_together');
  const availableDesksList = activeDesks.filter((d) => assignment[d.id] === null);

  togetherPairs.forEach((pc) => {
    if (!assignedStudentIds.has(pc.student1Id) && !assignedStudentIds.has(pc.student2Id)) {
      for (let i = 0; i < availableDesksList.length; i++) {
        const d1 = availableDesksList[i];
        if (assignment[d1.id] !== null) continue;
        const d2 = availableDesksList.find(
          (other) => assignment[other.id] === null && areDesksNeighbors(d1, other)
        );
        if (d2) {
          assignment[d1.id] = pc.student1Id;
          assignment[d2.id] = pc.student2Id;
          assignedStudentIds.add(pc.student1Id);
          assignedStudentIds.add(pc.student2Id);
          break;
        }
      }
    }
  });

  // 3. Gender rule handling
  const maleStudents = students.filter((s) => s.gender === 'M' && !assignedStudentIds.has(s.id));
  const femaleStudents = students.filter((s) => s.gender === 'F' && !assignedStudentIds.has(s.id));
  shuffleArray(maleStudents);
  shuffleArray(femaleStudents);

  const emptyDeskList = activeDesks.filter((d) => assignment[d.id] === null);

  if (constraints.genderRule === 'mixed_pairs' || constraints.genderRule === 'even_distribution') {
    let mIdx = 0;
    let fIdx = 0;
    for (let i = 0; i < emptyDeskList.length; i++) {
      const d = emptyDeskList[i];
      if (!d || assignment[d.id] !== null) continue;

      if (i % 2 === 0) {
        if (maleStudents[mIdx]) {
          assignment[d.id] = maleStudents[mIdx].id;
          assignedStudentIds.add(maleStudents[mIdx].id);
          mIdx++;
        } else if (femaleStudents[fIdx]) {
          assignment[d.id] = femaleStudents[fIdx].id;
          assignedStudentIds.add(femaleStudents[fIdx].id);
          fIdx++;
        }
      } else {
        if (femaleStudents[fIdx]) {
          assignment[d.id] = femaleStudents[fIdx].id;
          assignedStudentIds.add(femaleStudents[fIdx].id);
          fIdx++;
        } else if (maleStudents[mIdx]) {
          assignment[d.id] = maleStudents[mIdx].id;
          assignedStudentIds.add(maleStudents[mIdx].id);
          mIdx++;
        }
      }
    }
  }

  // Fill remaining unplaced students
  const unplaced = students.filter((s) => !assignedStudentIds.has(s.id));
  shuffleArray(unplaced);
  const remainingDesks = activeDesks.filter((d) => assignment[d.id] === null);
  unplaced.forEach((st, idx) => {
    if (remainingDesks[idx]) {
      assignment[remainingDesks[idx].id] = st.id;
    }
  });

  // Optimize to maximize constraint satisfaction score (constraints 1..4)
  const fixedDeskIds = new Set(constraints.fixedSeats.map((fs) => fs.deskId));
  const movableDesks = activeDesks.filter((d) => !fixedDeskIds.has(d.id));

  let bestEval = evaluateArrangement(assignment, activeDesks, students, constraints, pastAssignments);

  for (let iter = 0; iter < 100; iter++) {
    if (movableDesks.length < 2) break;
    const idx1 = Math.floor(Math.random() * movableDesks.length);
    let idx2 = Math.floor(Math.random() * movableDesks.length);
    while (idx1 === idx2) {
      idx2 = Math.floor(Math.random() * movableDesks.length);
    }

    const d1 = movableDesks[idx1];
    const d2 = movableDesks[idx2];

    const temp = assignment[d1.id];
    assignment[d1.id] = assignment[d2.id];
    assignment[d2.id] = temp;

    const newEval = evaluateArrangement(assignment, activeDesks, students, constraints, pastAssignments);
    if (newEval.constraintSatisfactionScore > bestEval.constraintSatisfactionScore) {
      bestEval = newEval;
    } else {
      assignment[d2.id] = assignment[d1.id];
      assignment[d1.id] = temp;
    }
  }

  return assignment;
}

/**
 * Single arrangement generator worker using heuristic sorting & random swaps
 */
export function generateSingleArrangement(
  desks: DeskPosition[],
  students: CraStudent[],
  constraints: SeatingConstraints,
  priorityMode: 'expansion' | 'balanced' | 'intimacy',
  pastAssignments?: Record<string, string | null>[]
): Record<string, string | null> {
  const activeDesks = desks.filter((d) => !d.disabled);
  const assignment: Record<string, string | null> = {};

  activeDesks.forEach((d) => {
    assignment[d.id] = null;
  });

  const assignedStudentIds = new Set<string>();

  // 1. Place Fixed seats
  constraints.fixedSeats.forEach((fs) => {
    if (activeDesks.some((d) => d.id === fs.deskId)) {
      assignment[fs.deskId] = fs.studentId;
      assignedStudentIds.add(fs.studentId);
    }
  });

  // 2. Gender rule handling
  const maleStudents = students.filter((s) => s.gender === 'M' && !assignedStudentIds.has(s.id));
  const femaleStudents = students.filter((s) => s.gender === 'F' && !assignedStudentIds.has(s.id));
  shuffleArray(maleStudents);
  shuffleArray(femaleStudents);

  const remainingStudents = students.filter((s) => !assignedStudentIds.has(s.id));

  // Sort remaining students according to CRA priority mode
  if (priorityMode === 'expansion') {
    remainingStudents.sort((a, b) => b.expansionWeighted - a.expansionWeighted);
  } else if (priorityMode === 'intimacy') {
    remainingStudents.sort((a, b) => b.intimacyWeighted - a.intimacyWeighted);
  } else {
    remainingStudents.sort((a, b) => b.totalWeighted - a.totalWeighted);
  }

  const emptyDeskList = activeDesks.filter((d) => assignment[d.id] === null);

  if (constraints.genderRule === 'mixed_pairs' || constraints.genderRule === 'even_distribution') {
    // Alternate or pair Male and Female evenly across desks
    let mIdx = 0;
    let fIdx = 0;
    for (let i = 0; i < emptyDeskList.length; i++) {
      const d = emptyDeskList[i];
      if (!d) continue;

      if (i % 2 === 0) {
        if (maleStudents[mIdx]) {
          assignment[d.id] = maleStudents[mIdx].id;
          assignedStudentIds.add(maleStudents[mIdx].id);
          mIdx++;
        } else if (femaleStudents[fIdx]) {
          assignment[d.id] = femaleStudents[fIdx].id;
          assignedStudentIds.add(femaleStudents[fIdx].id);
          fIdx++;
        }
      } else {
        if (femaleStudents[fIdx]) {
          assignment[d.id] = femaleStudents[fIdx].id;
          assignedStudentIds.add(femaleStudents[fIdx].id);
          fIdx++;
        } else if (maleStudents[mIdx]) {
          assignment[d.id] = maleStudents[mIdx].id;
          assignedStudentIds.add(maleStudents[mIdx].id);
          mIdx++;
        }
      }
    }
  }

  // Fill remaining unassigned students
  const unplacedStudents = students.filter((s) => !assignedStudentIds.has(s.id));
  const availableDesks = activeDesks.filter((d) => assignment[d.id] === null);

  unplacedStudents.forEach((st, idx) => {
    if (availableDesks[idx]) {
      assignment[availableDesks[idx].id] = st.id;
    }
  });

  // Perform hill-climbing optimization passes to maximize score
  optimizeArrangement(assignment, activeDesks, students, constraints, priorityMode, pastAssignments);

  return assignment;
}

/**
 * Hill-climbing heuristic optimization to swap students and maximize CRA score
 */
function optimizeArrangement(
  assignment: Record<string, string | null>,
  activeDesks: DeskPosition[],
  students: CraStudent[],
  constraints: SeatingConstraints,
  priorityMode: 'expansion' | 'balanced' | 'intimacy',
  pastAssignments?: Record<string, string | null>[]
) {
  const fixedDeskIds = new Set(constraints.fixedSeats.map((fs) => fs.deskId));
  const deskList = activeDesks.filter((d) => !fixedDeskIds.has(d.id));

  let bestEval = evaluateArrangement(assignment, activeDesks, students, constraints, pastAssignments);

  // Run 150 optimization iterations
  for (let iter = 0; iter < 150; iter++) {
    if (deskList.length < 2) break;
    const idx1 = Math.floor(Math.random() * deskList.length);
    let idx2 = Math.floor(Math.random() * deskList.length);
    while (idx1 === idx2) {
      idx2 = Math.floor(Math.random() * deskList.length);
    }

    const d1 = deskList[idx1];
    const d2 = deskList[idx2];

    // Swap students
    const temp = assignment[d1.id];
    assignment[d1.id] = assignment[d2.id];
    assignment[d2.id] = temp;

    const newEval = evaluateArrangement(assignment, activeDesks, students, constraints, pastAssignments);

    let isBetter = false;
    if (priorityMode === 'expansion') {
      isBetter = newEval.overallScore * 0.5 + newEval.expansionScore * 0.5 > bestEval.overallScore * 0.5 + bestEval.expansionScore * 0.5;
    } else if (priorityMode === 'intimacy') {
      isBetter = newEval.overallScore * 0.5 + newEval.intimacyDispersionScore * 0.5 > bestEval.overallScore * 0.5 + bestEval.intimacyDispersionScore * 0.5;
    } else {
      isBetter = newEval.overallScore > bestEval.overallScore;
    }

    if (isBetter) {
      bestEval = newEval;
    } else {
      // Revert swap
      assignment[d2.id] = assignment[d1.id];
      assignment[d1.id] = temp;
    }
  }
}

function shuffleArray<T>(array: T[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
