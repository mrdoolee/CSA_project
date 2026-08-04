import React, { useState, useEffect } from 'react';
import { CraStudent, DeskPosition, SeatingResult } from '../types';
import confetti from 'canvas-confetti';
import { Sparkles, Trophy, Play, CheckCircle2, X } from 'lucide-react';

interface RaffleModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: SeatingResult;
  desks: DeskPosition[];
  students: CraStudent[];
}

export const RaffleModal: React.FC<RaffleModalProps> = ({
  isOpen,
  onClose,
  candidate,
  desks,
  students,
}) => {
  const [revealedCount, setRevealedCount] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [shufflingName, setShufflingName] = useState<string>('추첨 시작을 눌러주세요!');

  const activeDesks = desks.filter((d) => !d.disabled);
  const studentMap = new Map<string, CraStudent>(students.map((s) => [s.id, s]));

  useEffect(() => {
    if (!isOpen) {
      setRevealedCount(0);
      setIsRunning(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartRaffle = () => {
    setRevealedCount(0);
    setIsRunning(true);

    let count = 0;
    const total = activeDesks.length;

    const interval = setInterval(() => {
      // Pick random name for slot effect
      const randomStudent = students[Math.floor(Math.random() * students.length)];
      if (randomStudent) {
        setShufflingName(`🎲 자리 추첨 중... (${randomStudent.name})`);
      }

      count++;
      setRevealedCount(count);

      if (count >= total) {
        clearInterval(interval);
        setIsRunning(false);
        setShufflingName('🎉 모든 자리 추첨이 완료되었습니다!');
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
      }
    }, 400); // reveals one student desk every 400ms
  };

  const handleQuickReveal = () => {
    setRevealedCount(activeDesks.length);
    setIsRunning(false);
    setShufflingName('🎉 전석 공개 완료!');
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 w-full max-w-4xl shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white p-2 rounded-xl"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-xs font-bold inline-block">
            🎉 학생용 자리 추첨 이벤트 연출 모드
          </span>
          <h2 className="text-2xl font-black text-slate-100">우리 반 스마트 자리 추첨!</h2>
          <p className="text-sm text-slate-400">{shufflingName}</p>
        </div>

        {/* Control buttons */}
        <div className="flex justify-center gap-3">
          <button
            onClick={handleStartRaffle}
            disabled={isRunning}
            className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-2xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>자리 추첨 시작 (순차 공개)</span>
          </button>

          <button
            onClick={handleQuickReveal}
            disabled={isRunning}
            className="flex items-center gap-2 px-5 py-3 text-sm font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-2xl border border-slate-700 transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>전체 한꺼번에 공개</span>
          </button>
        </div>

        {/* Raffle Grid View */}
        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
          <div className="text-center py-2 border border-emerald-600/40 rounded-xl bg-slate-900 text-emerald-400 text-xs font-bold mb-6">
            [ 칠 판 / 교 탁 (교실 앞) ]
          </div>

          <div className="grid grid-cols-6 gap-3">
            {activeDesks.map((desk, idx) => {
              const isRevealed = idx < revealedCount;
              const studentId = candidate.assignments[desk.id];
              const student = studentId ? studentMap.get(studentId) : null;

              return (
                <div
                  key={desk.id}
                  className={`p-3 rounded-2xl border-2 flex flex-col justify-between items-center min-h-[95px] transition-all duration-300 ${
                    isRevealed
                      ? 'bg-gradient-to-br from-indigo-950 to-slate-900 border-indigo-500 text-white scale-100 shadow-lg shadow-indigo-950/80'
                      : 'bg-slate-900/60 border-slate-800 text-slate-600 scale-95 opacity-60'
                  }`}
                >
                  <div className="text-[10px] font-bold text-slate-500">
                    {desk.row + 1}-{desk.col + 1}
                  </div>

                  <div className="text-center my-auto">
                    {isRevealed ? (
                      <div>
                        <div className="text-base font-black text-amber-300 animate-bounce">
                          {student ? student.name : '빈 자석'}
                        </div>
                        {student && (
                          <div className="text-[10px] text-indigo-300 font-semibold mt-0.5">
                            {student.gender === 'M' ? '남' : '여'} · {student.intimacyGroup}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xl font-bold text-slate-700">❓</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
