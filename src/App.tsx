import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { CraDataModal } from './components/CraDataModal';
import { LayoutSetup } from './components/LayoutSetup';
import { ConstraintSetup } from './components/ConstraintSetup';
import { ResultView } from './components/ResultView';
import { RaffleAndVotingView } from './components/RaffleAndVotingView';
import { HistoryModal } from './components/HistoryModal';
import { HelpModal } from './components/HelpModal';
import { RestoredSeatingModal } from './components/RestoredSeatingModal';
import { OfflineGuideModal } from './components/OfflineGuideModal';
import { SystemInfoModal } from './components/SystemInfoModal';
import { CraGuideModal } from './components/CraGuideModal';

import { SAMPLE_CRA_STUDENTS } from './data/sampleCraData';
import {
  CraStudent,
  DeskPosition,
  GridDimensions,
  LayoutType,
  SeatingConstraints,
  SeatingResult,
  ViewPerspective,
} from './types';
import {
  generateDeskLayout,
  generateCandidateArrangements,
  evaluateArrangement,
} from './utils/craAlgorithm';

export default function App() {
  // 1. Core State - Starts empty as per user request
  const [students, setStudents] = useState<CraStudent[]>([]);
  const [layoutType, setLayoutType] = useState<LayoutType>('pairs');

  const initialLayout = generateDeskLayout('pairs', 25);
  const [desks, setDesks] = useState<DeskPosition[]>(initialLayout.desks);
  const [dimensions, setDimensions] = useState<GridDimensions>(initialLayout.dimensions);

  const [perspective, setPerspective] = useState<ViewPerspective>('student');
  const [activeTab, setActiveTab] = useState<
    'cra' | 'layout' | 'constraints' | 'result' | 'raffleAndVote'
  >('cra');

  // Checked candidates for student raffle event
  const [raffleCandidateIds, setRaffleCandidateIds] = useState<string[]>([
    'opt_1',
    'opt_2',
    'opt_3',
    'opt_4',
    'opt_5',
  ]);

  const handleToggleRaffleCandidate = (candidateId: string) => {
    setRaffleCandidateIds((prev) => {
      if (prev.includes(candidateId)) {
        if (prev.length === 1) return prev; // Keep at least 1 candidate selected
        return prev.filter((id) => id !== candidateId);
      } else {
        return [...prev, candidateId];
      }
    });
  };

  // Constraints State
  const [constraints, setConstraints] = useState<SeatingConstraints>({
    genderRule: 'mixed_pairs',
    fixedSeats: [],
    pairConstraints: [],
    avoidPastNeighbors: true,
    prioritizeExpansion: true,
    separateIntimacyCliques: true,
    separateHighInfluence: true,
  });

  // Saved Results History
  const [savedResults, setSavedResults] = useState<SeatingResult[]>(() => {
    try {
      const stored = localStorage.getItem('cra_seating_history');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Candidate Arrangements State
  const [candidates, setCandidates] = useState<SeatingResult[]>([]);

  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('opt_4');

  // Modals state
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isCraGuideOpen, setIsCraGuideOpen] = useState<boolean>(false);
  const [isOfflineGuideOpen, setIsOfflineGuideOpen] = useState<boolean>(false);
  const [isSystemInfoOpen, setIsSystemInfoOpen] = useState<boolean>(false);
  const [restoredModalResult, setRestoredModalResult] = useState<SeatingResult | null>(null);
  const [isRestoredModalOpen, setIsRestoredModalOpen] = useState<boolean>(false);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('cra_seating_history', JSON.stringify(savedResults));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }, [savedResults]);

  // Handler to regenerate candidate options
  const handleGenerateCandidates = () => {
    if (students.length === 0) {
      alert('등록된 학생 데이터가 없습니다. 먼저 1단계에서 학생 명단을 입력/업로드해 주세요.');
      setActiveTab('cra');
      return;
    }
    const pastAssignments = savedResults.map((r) => r.assignments);
    const newCandidates = generateCandidateArrangements(
      desks,
      students,
      constraints,
      undefined,
      pastAssignments
    );
    setCandidates(newCandidates);
    // Default to opt_4 if only 1 candidate generated (no CRA data), else opt_1
    setSelectedCandidateId(newCandidates.length === 1 ? 'opt_4' : 'opt_1');
    setActiveTab('result');
  };

  // Handler to update entire candidate result (or add custom candidate)
  const handleUpdateCandidate = (candidateId: string, updatedCandidate: SeatingResult) => {
    setCandidates((prev) => {
      const exists = prev.some((c) => c.id === candidateId);
      if (exists) {
        return prev.map((c) => (c.id === candidateId ? updatedCandidate : c));
      } else {
        return [...prev, updatedCandidate];
      }
    });
  };

  // Handler for manual desk student swap in result view
  const handleUpdateCandidateAssignments = (
    candidateId: string,
    newAssignments: Record<string, string | null>
  ) => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id === candidateId) {
          const pastAssignments = savedResults.map((r) => r.assignments);
          const metrics = evaluateArrangement(
            newAssignments,
            desks,
            students,
            constraints,
            pastAssignments
          );
          return {
            ...c,
            assignments: newAssignments,
            metrics,
          };
        }
        return c;
      })
    );
  };

  // Handler to save current arrangement to history
  const handleSaveToHistory = (result: SeatingResult) => {
    const newHistoryItem: SeatingResult = {
      ...result,
      id: `saved_${Date.now()}`,
      date: new Date().toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    setSavedResults([newHistoryItem, ...savedResults]);
    alert(`[${result.title}] 배치안이 누적 히스토리에 개별 저장되었습니다!`);
  };

  const handleDeleteHistory = (id: string) => {
    setSavedResults(savedResults.filter((r) => r.id !== id));
  };

  const handleLoadHistory = (result: SeatingResult) => {
    setRestoredModalResult(result);
    setIsRestoredModalOpen(true);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-800 flex flex-row">
      {/* Sidebar Navigation */}
      <div className="no-print h-full shrink-0">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          perspective={perspective}
          setPerspective={setPerspective}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onOpenHelp={() => setIsHelpOpen(true)}
          onOpenCraGuide={() => setIsCraGuideOpen(true)}
          onOpenOfflineGuide={() => setIsOfflineGuideOpen(true)}
          onOpenSystemInfo={() => setIsSystemInfoOpen(true)}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto print:overflow-visible">
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'cra' && (
            <CraDataModal
              students={students}
              setStudents={setStudents}
              desks={desks}
              setDesks={setDesks}
              dimensions={dimensions}
              setDimensions={setDimensions}
              setLayoutType={setLayoutType}
              onSaveToHistory={(res) => setSavedResults((prev) => [res, ...prev])}
              onProceedToLayout={() => setActiveTab('layout')}
              onOpenCraGuide={() => setIsCraGuideOpen(true)}
            />
          )}

          {activeTab === 'layout' && (
            <LayoutSetup
              layoutType={layoutType}
              setLayoutType={setLayoutType}
              desks={desks}
              setDesks={setDesks}
              dimensions={dimensions}
              setDimensions={setDimensions}
              studentCount={students.length}
              onProceedToConstraints={() => setActiveTab('constraints')}
            />
          )}

          {activeTab === 'constraints' && (
            <ConstraintSetup
              students={students}
              desks={desks}
              dimensions={dimensions}
              constraints={constraints}
              setConstraints={setConstraints}
              onGenerateCandidates={handleGenerateCandidates}
            />
          )}

          {activeTab === 'result' && (
            <ResultView
              candidates={candidates}
              selectedCandidateId={selectedCandidateId}
              setSelectedCandidateId={setSelectedCandidateId}
              desks={desks}
              students={students}
              dimensions={dimensions}
              perspective={perspective}
              setPerspective={setPerspective}
              constraints={constraints}
              raffleCandidateIds={raffleCandidateIds}
              onToggleRaffleCandidate={handleToggleRaffleCandidate}
              onOpenRaffle={() => setActiveTab('raffleAndVote')}
              onOpenVoting={() => setActiveTab('raffleAndVote')}
              onSaveToHistory={handleSaveToHistory}
              onUpdateCandidateAssignments={handleUpdateCandidateAssignments}
              onUpdateCandidate={handleUpdateCandidate}
            />
          )}

          {activeTab === 'raffleAndVote' && (
            <RaffleAndVotingView
              candidates={candidates}
              selectedCandidateId={selectedCandidateId}
              setSelectedCandidateId={setSelectedCandidateId}
              students={students}
              desks={desks}
              dimensions={dimensions}
              raffleCandidateIds={raffleCandidateIds}
            />
          )}
        </main>

        {/* Footer (Matching Reference UI Image 7) */}
        <footer className="no-print py-6 text-center text-xs text-sky-700/80 font-medium border-t border-slate-200/80 bg-slate-50/50 mt-auto shrink-0 space-y-1">
          <div>
            <span className="font-bold text-sky-700">
              CSA (Classroom Seating Arrangement) 버전 v1.0(2026.07.)
            </span>
          </div>
          <div className="text-slate-500 font-normal">
            © 2026 Designed & Developed by 두리쌤. All rights reserved.
          </div>
        </footer>
      </div>

      {/* Global Modals */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        savedResults={savedResults}
        onDeleteHistory={handleDeleteHistory}
        onLoadHistory={handleLoadHistory}
      />

      <RestoredSeatingModal
        isOpen={isRestoredModalOpen}
        onClose={() => setIsRestoredModalOpen(false)}
        result={restoredModalResult}
        students={students}
        defaultDesks={desks}
        defaultDimensions={dimensions}
      />

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      <CraGuideModal
        isOpen={isCraGuideOpen}
        onClose={() => setIsCraGuideOpen(false)}
      />

      <OfflineGuideModal
        isOpen={isOfflineGuideOpen}
        onClose={() => setIsOfflineGuideOpen(false)}
      />

      <SystemInfoModal
        isOpen={isSystemInfoOpen}
        onClose={() => setIsSystemInfoOpen(false)}
      />
    </div>
  );
}
