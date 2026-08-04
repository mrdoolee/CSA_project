import React, { useState } from 'react';
import { SeatingResult } from '../types';
import { Vote, CheckCircle2, X, Award, BarChart3 } from 'lucide-react';

interface VotingModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: SeatingResult[];
  onSelectWinningCandidate: (candidateId: string) => void;
}

export const VotingModal: React.FC<VotingModalProps> = ({
  isOpen,
  onClose,
  candidates,
  onSelectWinningCandidate,
}) => {
  const [votes, setVotes] = useState<Record<string, number>>({
    opt_1: 0,
    opt_2: 0,
    opt_3: 0,
  });

  if (!isOpen) return null;

  const totalVotes = (Object.values(votes) as number[]).reduce((a, b) => a + b, 0);

  const handleVote = (id: string) => {
    setVotes((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const handleResetVotes = () => {
    setVotes({ opt_1: 0, opt_2: 0, opt_3: 0, opt_4: 0 });
  };

  const winningCandidateId = Object.entries(votes).sort((a: [string, number], b: [string, number]) => b[1] - a[1])[0]?.[0];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-2xl space-y-6 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-2 rounded-xl"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold inline-block">
            🗳️ 학급 자리배치 투표
          </span>
          <h2 className="text-xl font-bold text-slate-900">우리 반 자리배치안 현장 투표</h2>
          <p className="text-xs text-slate-500">
            학생들의 민주적 투표로 이번 차시 학급 자리배치 최종안을 결정합니다.
          </p>
        </div>

        {/* Candidate Voting Cards */}
        <div className="space-y-4">
          {candidates.map((cand) => {
            const voteCount = votes[cand.id] || 0;
            const pct = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
            const isWinner = winningCandidateId === cand.id && voteCount > 0;

            return (
              <div
                key={cand.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isWinner ? 'bg-indigo-50/80 border-indigo-500' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{cand.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{cand.description}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleVote(cand.id)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1 cursor-pointer"
                    >
                      <Vote className="w-4 h-4" />
                      <span>+1표</span>
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-600">
                    <span>{voteCount}표</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            onClick={handleResetVotes}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            투표 수 리셋
          </button>

          <button
            onClick={() => {
              if (winningCandidateId) {
                onSelectWinningCandidate(winningCandidateId);
                onClose();
              }
            }}
            className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md"
          >
            최다 득표안 최종 확정 및 반영
          </button>
        </div>
      </div>
    </div>
  );
};
