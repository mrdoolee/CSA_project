import { CraStudent, SeatingResult } from '../types';

export interface AssignmentResolution {
  assignments: Record<string, string | null>;
  matchedByRoster: number;
  matchedById: number;
  matchedByLegacyGuess: number;
  unmatched: number;
}

// Student IDs are minted fresh (with Date.now()) every time a basic student list is
// uploaded, so a desk->studentId assignment map saved in one session almost never
// matches student IDs in a later session/upload, even for the same class roster.
// This resolves a saved/uploaded assignment map against the CURRENTLY loaded students,
// preferring the embedded name/studentNumber snapshot (studentRoster) when present,
// falling back to a direct ID match (same-session case), and finally to a best-effort
// guess from the legacy `s_basic_<idx>_...` / `s_cra_<idx>_...` upload-order ID pattern
// for backups saved before studentRoster existed.
export function resolveAssignmentsToCurrentStudents(
  result: Pick<SeatingResult, 'assignments' | 'studentRoster'>,
  currentStudents: CraStudent[]
): AssignmentResolution {
  const rosterMap = new Map<string, { name: string; studentNumber?: string }>(
    (result.studentRoster || []).map((r) => [r.id, { name: r.name, studentNumber: r.studentNumber }])
  );

  let matchedByRoster = 0;
  let matchedById = 0;
  let matchedByLegacyGuess = 0;
  let unmatched = 0;

  const resolveOne = (oldId: string): string | null => {
    const info = rosterMap.get(oldId);
    if (info) {
      const byNumber = info.studentNumber
        ? currentStudents.find((s) => s.studentNumber === info.studentNumber)
        : undefined;
      const match = byNumber || currentStudents.find((s) => s.name === info.name);
      if (match) {
        matchedByRoster++;
        return match.id;
      }
    }
    if (currentStudents.some((s) => s.id === oldId)) {
      matchedById++;
      return oldId;
    }
    if (!info) {
      const legacyIdx = oldId.match(/^s_(?:basic|cra)_(\d+)_/)?.[1];
      if (legacyIdx !== undefined) {
        const guess = currentStudents[Number(legacyIdx)];
        if (guess) {
          matchedByLegacyGuess++;
          return guess.id;
        }
      }
    }
    unmatched++;
    return null;
  };

  const assignments: Record<string, string | null> = {};
  Object.entries(result.assignments || {}).forEach(([deskId, oldId]) => {
    assignments[deskId] = oldId ? resolveOne(oldId) : null;
  });

  return { assignments, matchedByRoster, matchedById, matchedByLegacyGuess, unmatched };
}
