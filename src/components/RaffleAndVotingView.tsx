import React, { useState } from 'react';
import { SeatingResult, CraStudent, DeskPosition, GridDimensions } from '../types';
import { Sparkles, Dices } from 'lucide-react';

interface RaffleAndVotingViewProps {
  candidates: SeatingResult[];
  selectedCandidateId: string;
  setSelectedCandidateId: (id: string) => void;
  students: CraStudent[];
  desks: DeskPosition[];
  dimensions: GridDimensions;
  raffleCandidateIds: string[];
}

export const RaffleAndVotingView: React.FC<RaffleAndVotingViewProps> = ({
  candidates,
  selectedCandidateId,
  setSelectedCandidateId,
  students,
  desks,
  dimensions,
  raffleCandidateIds,
}) => {
  const raffleCandidates = candidates.filter((c) => raffleCandidateIds.includes(c.id));
  const activeCandidates = raffleCandidates.length > 0 ? raffleCandidates : candidates;

  const isSingleCandidateMode = activeCandidates.length === 1;

  // Raffle state
  const [isRaffling, setIsRaffling] = useState(false);
  const [revealedDesks, setRevealedDesks] = useState<Set<string>>(new Set());
  const [hasRaffleStarted, setHasRaffleStarted] = useState<boolean>(false);

  // If candidate selected is not in activeCandidates, select first active candidate
  const effectiveCandidateId = activeCandidates.some((c) => c.id === selectedCandidateId)
    ? selectedCandidateId
    : activeCandidates[0]?.id || selectedCandidateId;

  const currentCandidate =
    candidates.find((c) => c.id === effectiveCandidateId) || candidates[0];

  const LETTER_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  const getCandidateName = (cand: SeatingResult) => {
    const index = activeCandidates.findIndex((c) => c.id === cand.id);
    if (index >= 0 && index < LETTER_LABELS.length) {
      return `후보 ${LETTER_LABELS[index]}`;
    }
    return `후보 A`;
  };

  const studentMap = new Map<string, CraStudent>(students.map((s) => [s.id, s]));

  const handleStartRaffle = () => {
    setHasRaffleStarted(true);
    setIsRaffling(true);
    setRevealedDesks(new Set());

    const activeDesks = desks.filter((d) => !d.disabled);
    let count = 0;
    const interval = setInterval(() => {
      if (count >= activeDesks.length) {
        clearInterval(interval);
        setIsRaffling(false);
        return;
      }
      const targetDesk = activeDesks[count];
      setRevealedDesks((prev) => new Set([...prev, targetDesk.id]));
      count++;
    }, 250);
  };

  if (!currentCandidate) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm max-w-xl mx-auto my-12 space-y-4">
        <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto">
          <Sparkles className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-black text-slate-800">아직 자리배치 후보가 생성되지 않았습니다</h3>
        <p className="text-sm text-slate-500 leading-relaxed">
          <strong>3단계 [제약조건 & 알고리즘 설정]</strong> 메뉴에서 <strong>[자리후보 생성하기]</strong> 버튼을 눌러 자리배치 후보를 먼저 생성해 주세요!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Menu Header - Header title only without description text */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 text-xs font-bold bg-purple-100 text-purple-800 rounded-lg border border-purple-200">
            학급 이벤트 메뉴
          </span>
          <h2 className="text-xl font-black text-slate-800">
            🎉 학급 자리배치 추첨
          </h2>
        </div>
      </div>

      {/* Raffle View */}
      <div className="bg-slate-950 p-8 rounded-3xl shadow-2xl border border-slate-800 text-white space-y-6">
        {/* Candidate Selection Tabs for Raffle - Hidden if only 1 candidate checked */}
        {!isSingleCandidateMode && (
          <div className="space-y-3 border-b border-slate-800 pb-4">
            <div className="text-xs font-bold text-slate-400">
              추첨할 후보안을 선택하세요:
            </div>
            <div className="flex flex-wrap gap-2">
              {activeCandidates.map((cand) => {
                const isSelected = cand.id === effectiveCandidateId;
                const candName = getCandidateName(cand);
                return (
                  <button
                    key={cand.id}
                    onClick={() => {
                      setSelectedCandidateId(cand.id);
                      setHasRaffleStarted(false);
                      setRevealedDesks(new Set());
                      setIsRaffling(false);
                    }}
                    className={`px-5 py-2.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-2 ${
                      isSelected
                        ? 'bg-purple-900/80 border-purple-400 text-purple-100 ring-2 ring-purple-500/30 font-black'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-sm font-black">{candName}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-black text-amber-300 flex items-center gap-2">
              <Dices className="w-5 h-5 text-amber-400" />
              <span>
                {isSingleCandidateMode
                  ? `🎯 우리 반 자리배치 공개 추첨 (${getCandidateName(currentCandidate)})`
                  : `[${getCandidateName(currentCandidate)}] 자리 추첨`}
              </span>
            </h3>
          </div>

          <button
            onClick={handleStartRaffle}
            disabled={isRaffling}
            className={`px-6 py-3 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-600 hover:to-purple-700 shadow-xl shadow-purple-900/40 transition-all cursor-pointer ${
              isRaffling ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isRaffling ? '🎲 자리 공개 추첨 진행 중...' : '🎉 추첨 시작!'}
          </button>
        </div>

        {/* Blackboard */}
        <div className="w-full bg-slate-900 border-2 border-emerald-500/50 rounded-2xl py-3 text-center shadow-lg">
          <span className="text-base font-black text-emerald-400 tracking-widest uppercase">
            [ 칠 판 / 교 탁 (교실 앞) ]
          </span>
        </div>

        {/* Initial state notice if not started */}
        {!hasRaffleStarted && (
          <div className="p-8 text-center bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl space-y-2">
            <Dices className="w-10 h-10 text-amber-400 mx-auto animate-pulse" />
            <div className="text-base font-black text-amber-300">
              추첨 대기 중입니다!
            </div>
            <p className="text-xs text-slate-400">
              상단의 <strong className="text-purple-300">'🎉 추첨 시작!'</strong> 버튼을 누르면 전체 책상이 하나씩 순차 공개됩니다.
            </p>
          </div>
        )}

        {/* Seating Grid with Reveal Animation */}
        {hasRaffleStarted && (
          <div className="flex flex-col items-center gap-4 py-4 overflow-x-auto">
            {Array.from({ length: dimensions.rows }).map((_, r) => {
              const hasRowAisle = dimensions.rowAisles?.includes(r);
              return (
                <React.Fragment key={`raf_r_frag_${r}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-500 w-6 text-right">{r + 1}행</span>
                    <div className="flex items-center gap-3">
                      {Array.from({ length: dimensions.cols }).map((_, c) => {
                        const hasColAisle = dimensions.colAisles?.includes(c);
                        const desk = desks.find((d) => d.row === r && d.col === c);

                        if (!desk || desk.disabled) {
                          return (
                            <React.Fragment key={`empty_raf_${r}_${c}`}>
                              <div className="w-28 h-20 rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/40 opacity-40 flex items-center justify-center text-[10px] text-slate-600 font-bold">
                                빈 통로
                              </div>
                              {hasColAisle && <div className="w-6 h-20 bg-slate-800/30 rounded-lg" />}
                            </React.Fragment>
                          );
                        }

                        const studentId = currentCandidate.assignments[desk.id];
                        const student = studentId ? studentMap.get(studentId) : null;
                        const isRevealed = revealedDesks.has(desk.id);

                        return (
                          <React.Fragment key={desk.id}>
                            <div
                              className={`w-28 h-20 rounded-2xl border-2 p-2 flex flex-col justify-between transition-all duration-500 transform ${
                                isRevealed
                                  ? 'bg-indigo-950/90 border-indigo-400 rotate-0 scale-100 shadow-lg shadow-indigo-950/80'
                                  : 'bg-slate-900 border-slate-800 scale-95 opacity-40'
                              }`}
                            >
                              <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-400">
                                <span>{r + 1}-{c + 1}</span>
                                {isRevealed && student && (
                                  <span
                                    className={`w-2 h-2 rounded-full ${
                                      student.gender === 'M' ? 'bg-blue-400' : 'bg-pink-400'
                                    }`}
                                  />
                                )}
                              </div>

                              <div className="font-black text-sm my-auto text-center">
                                {isRevealed ? (
                                  student ? (
                                    <span className="text-amber-300 drop-shadow-md">
                                      {student.studentNumber ? `${student.studentNumber} ` : ''}
                                      {student.name}
                                    </span>
                                  ) : (
                                    <span className="text-slate-500">빈 좌석</span>
                                  )
                                ) : (
                                  <span className="text-slate-600 font-extrabold">❓</span>
                                )}
                              </div>

                              <div className="flex items-center justify-between text-[9px] text-slate-400">
                                {isRevealed ? (
                                  <>
                                    <span className="text-[9px] text-emerald-400 font-bold">공개완료</span>
                                    {student && (
                                      <div className="flex items-center gap-0.5">
                                        {(student.influenceWeighted >= 15 || student.influenceNominated >= 5) && (
                                          <span title="리더/핵심 영향력 학생">👑</span>
                                        )}
                                        {student.expansionWeighted > 0 && (
                                          <span title="교우관계 확장 지목">🌱</span>
                                        )}
                                        {student.notes && (student.notes.includes('시력') || student.notes.includes('앞자리')) && (
                                          <span title="특이사항/앞자리">👓</span>
                                        )}
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-[9px] text-slate-500">대기중</span>
                                )}
                              </div>
                            </div>
                            {hasColAisle && <div className="w-6 h-20 bg-slate-800/30 rounded-lg" />}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                  {hasRowAisle && <div className="h-6 w-full bg-slate-800/30 rounded-lg my-1" />}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
