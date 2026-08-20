import React, { useEffect } from 'react';
import { X, Sparkles, Instagram } from 'lucide-react';

interface CreditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreditModal: React.FC<CreditModalProps> = ({ isOpen, onClose }) => {
  // Close on Escape + lock background scroll while open. Purely presentational —
  // no app state is read or written here, so opening/closing never affects anything else.
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="제작자 크레딧 안내"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4 relative"
      >
        <button
          onClick={onClose}
          aria-label="닫기"
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-2 rounded-xl transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 제작: 두리쌤 */}
        <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-4 space-y-2">
          <h3 className="font-extrabold text-sm text-purple-950 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-purple-600" />
            제작: 두리쌤
          </h3>
          <div className="space-y-1 text-purple-900 leading-relaxed">
            <div className="font-extrabold text-purple-950 mb-1">📌 이용 조건</div>
            <ul className="space-y-1 pl-1 font-medium">
              <li>• 교육 목적으로 자유롭게 사용하실 수 있습니다.</li>
              <li>• 재배포 시 출처(제작자 표기)를 유지해주세요.</li>
              <li>• 코드를 임의로 수정한 버전을 다시 배포하지 말아주세요.</li>
              <li>• 수정이 필요하시면 아래 연락처로 요청해주세요.</li>
            </ul>
          </div>
        </div>

        {/* 문의 */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
          <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
            <Instagram className="w-4 h-4 text-pink-600" />
            문의
          </h3>
          <ul className="space-y-1 text-slate-700 font-medium">
            <li>
              • Instagram:{' '}
              <a
                href="https://www.instagram.com/trdoolee"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-indigo-600 hover:underline"
              >
                trdoolee
              </a>
            </li>
            <li>
              • Blog:{' '}
              <a
                href="https://blog.naver.com/trdoolee"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-indigo-600 hover:underline"
              >
                blog.naver.com/trdoolee
              </a>
            </li>
            <li className="text-slate-500 text-[11px] italic">
              • 간단한 질문 위주로 답변드리며, 답변이 늦어질 수 있습니다.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
