import React from 'react';
import { HelpCircle, X, Users, HeartHandshake, Zap, SlidersHorizontal, Trophy, Eye } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-2xl space-y-6 relative max-h-[85vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-2 rounded-xl cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-1">
          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold inline-block">
            📖 교사용 활용 가이드
          </span>
          <h2 className="text-xl font-bold text-slate-900">학급 자리배치 도우미(CSA) 사용법</h2>
          <p className="text-xs text-slate-500">
            기본 자리배치는 물론, 학급 교우관계 분석 도우미(CRA)의 분석 결과를 활용하여 학급 자리배치를 구성합니다.
          </p>
        </div>

        <div className="space-y-4 text-xs text-slate-700">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-600" />
              1. 시작 방법 & CRA 데이터 선택 업로드
            </h3>
            <p className="leading-relaxed">
              처음 접속 시 학생 데이터가 없이 시작됩니다. <b>[25명 CRA 샘플 데이터로 시작하기]</b> 버튼을 눌러 바로 테스트하거나, 선생님의 <b>[학생 기본명단 엑셀]</b>을 업로드해 시작할 수 있습니다.
              CRA 관계분석 시트 업로드는 <b>선택 사항</b>이며, CRA 시트를 올리지 않아도 <b>랜덤/수동 일반 배치(후보 4)</b> 기능을 사용할 수 있습니다.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
              2. 제약조건 & 알고리즘 설정 (메뉴 3)
            </h3>
            <ul className="list-disc list-inside space-y-1 text-slate-600">
              <li><b>1~3번 (자리배치 필수 조건):</b> 자리 고정, 성별 배치 규칙, 같이/따로 앉아야 하는 짝 지정</li>
              <li><b>4번 (이전 짝꿍 회피):</b> CRA 데이터 유무와 상관없이 직전 자리배치의 짝과 다시 짝이 되지 않도록 회피</li>
              <li><b>5번 (CRA 관계 알고리즘):</b> CRA 분석 시트를 업로드한 경우 활성화되며, 정서적 친밀감·협력·영향력·관계 확장 가중치를 조절하여 후보 1~3을 생성</li>
            </ul>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-600" />
              3. 🎉 우리 반 자리배치 공개 추첨 (메뉴 5)
            </h3>
            <p className="leading-relaxed">
              선생님이 선택한 자리배치안을 두근거리는 추첨 연출로 학생들과 함께 공개할 수 있습니다.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-purple-600" />
              4. 시점 전환 & 배치 히스토리 저장
            </h3>
            <p className="leading-relaxed">
              학생 시점(칠판 상단)과 교사 시점(칠판 하단)으로 간편히 화면을 전환할 수 있습니다. <b>[배치 저장]</b> 버튼을 누르면 과거 자리배치 기록이 로컬 브라우저에 보관되며, 다음 자리배치 시 이전 짝꿍 자동 회피에 활용됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
