import React from 'react';
import { ViewPerspective } from '../types';
import {
  Users,
  Grid,
  SlidersHorizontal,
  LayoutGrid,
  Eye,
  History,
  Lock,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'cra' | 'layout' | 'constraints' | 'result';
  setActiveTab: (tab: 'cra' | 'layout' | 'constraints' | 'result') => void;
  perspective: ViewPerspective;
  setPerspective: (p: ViewPerspective) => void;
  onOpenHistory: () => void;
  onOpenHiddenPreset: () => void;
  isSecretActive: boolean;
  onOpenHelp: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  perspective,
  setPerspective,
  onOpenHistory,
  onOpenHiddenPreset,
  isSecretActive,
  onOpenHelp,
}) => {
  return (
    <header className="bg-slate-900 text-white shadow-md border-b border-slate-800 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & App Title */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/30 cursor-pointer"
              title="Classroom Seating Arrangement"
              onClick={onOpenHiddenPreset}
            >
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-slate-100">
                  교실 자리배치 <span className="text-xs font-normal text-indigo-300">Classroom Seating</span>
                </h1>
                <span className="px-2 py-0.5 text-[11px] font-medium bg-indigo-950 text-indigo-300 border border-indigo-800/80 rounded-full">
                  CRA 관계분석 Add-on
                </span>
                {isSecretActive && (
                  <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-full flex items-center gap-1 animate-pulse">
                    <Lock className="w-3 h-3" /> 교사 비밀지정 적용중
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                SNA 학급관계망(친밀감·영향력·관계확장) 기반 스마트 자리배치 시스템
              </p>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Perspective Toggle Button */}
            <button
              onClick={() => setPerspective(perspective === 'student' ? 'teacher' : 'student')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors"
              title="학생 시점(칠판 위)과 교사 시점(칠판 아래)을 전환합니다."
            >
              <Eye className="w-4 h-4 text-indigo-400" />
              <span>{perspective === 'student' ? '🏫 학생 시점 (칠판 위)' : '👨‍🏫 교사 시점 (칠판 아래)'}</span>
            </button>

            {/* History Modal Trigger */}
            <button
              onClick={onOpenHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors"
            >
              <History className="w-4 h-4 text-purple-400" />
              <span>자리 기록</span>
            </button>

            {/* Hidden Secret Preset Toggle */}
            <button
              onClick={onOpenHiddenPreset}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                isSecretActive
                  ? 'bg-amber-950 text-amber-200 border-amber-700'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="교사 사전 지정 히든 메뉴"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>히든 메뉴</span>
            </button>

            {/* Help / Guide */}
            <button
              onClick={onOpenHelp}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="도움말 및 앱 안내"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 border-t border-slate-800/80 pt-1 pb-1">
          <button
            onClick={() => setActiveTab('cra')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'cra'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>1. CRA 데이터 관리</span>
          </button>

          <button
            onClick={() => setActiveTab('layout')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'layout'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>2. 책상 배치 설정</span>
          </button>

          <button
            onClick={() => setActiveTab('constraints')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'constraints'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>3. 제약조건 & 알고리즘 설정</span>
          </button>

          <button
            onClick={() => setActiveTab('result')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'result'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>4. 자리배치 결과 확인 & 변경</span>
          </button>
        </div>
      </div>
    </header>
  );
};
