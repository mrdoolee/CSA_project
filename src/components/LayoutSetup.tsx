import React, { useState } from 'react';
import { DeskPosition, GridDimensions, LayoutType, SavedLayoutPreset } from '../types';
import { generateDeskLayout } from '../utils/craAlgorithm';
import {
  Grid,
  CheckCircle2,
  AlertTriangle,
  MinusCircle,
  PlusCircle,
  Save,
  FolderOpen,
  Trash2,
  Sliders,
  Columns,
  Rows,
} from 'lucide-react';

interface LayoutSetupProps {
  layoutType: LayoutType;
  setLayoutType: (type: LayoutType) => void;
  desks: DeskPosition[];
  setDesks: (desks: DeskPosition[]) => void;
  dimensions: GridDimensions;
  setDimensions: (dim: GridDimensions) => void;
  studentCount: number;
  onProceedToConstraints: () => void;
}

export const LayoutSetup: React.FC<LayoutSetupProps> = ({
  layoutType,
  setLayoutType,
  desks,
  setDesks,
  dimensions,
  setDimensions,
  studentCount,
  onProceedToConstraints,
}) => {
  const activeDeskCount = desks.filter((d) => !d.disabled).length;

  // Saved presets state from localStorage
  const [savedPresets, setSavedPresets] = useState<SavedLayoutPreset[]>(() => {
    try {
      const stored = localStorage.getItem('cra_saved_layout_presets');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [presetNameInput, setPresetNameInput] = useState('');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  const handleSelectPreset = (type: LayoutType) => {
    setLayoutType(type);
    const { desks: newDesks, dimensions: newDim } = generateDeskLayout(type, studentCount);
    setDesks(newDesks);
    setDimensions(newDim);
  };

  const toggleDeskDisabled = (deskId: string) => {
    setDesks(
      desks.map((d) => {
        if (d.id === deskId) {
          return { ...d, disabled: !d.disabled };
        }
        return d;
      })
    );
  };

  const handleCustomDimensionsChange = (rows: number, cols: number) => {
    const validRows = Math.max(2, Math.min(10, rows));
    const validCols = Math.max(2, Math.min(12, cols));

    const newDim: GridDimensions = {
      ...dimensions,
      rows: validRows,
      cols: validCols,
      rowAisles: dimensions.rowAisles || [],
      colAisles: dimensions.colAisles || [],
    };
    setDimensions(newDim);

    const newDesks: DeskPosition[] = [];
    let idx = 0;
    for (let r = 0; r < validRows; r++) {
      for (let c = 0; c < validCols; c++) {
        newDesks.push({
          id: `desk_${r}_${c}`,
          row: r,
          col: c,
          podId: Math.floor(r / 2) * 3 + Math.floor(c / 2),
          disabled: idx >= studentCount,
        });
        idx++;
      }
    }
    setDesks(newDesks);
  };

  // Toggle aisle gap after column `colIdx`
  const toggleColAisle = (colIdx: number) => {
    const currentAisles = dimensions.colAisles || [];
    const exists = currentAisles.includes(colIdx);
    const newAisles = exists
      ? currentAisles.filter((i) => i !== colIdx)
      : [...currentAisles, colIdx].sort((a, b) => a - b);

    setDimensions({ ...dimensions, colAisles: newAisles });
  };

  // Toggle aisle gap after row `rowIdx`
  const toggleRowAisle = (rowIdx: number) => {
    const currentAisles = dimensions.rowAisles || [];
    const exists = currentAisles.includes(rowIdx);
    const newAisles = exists
      ? currentAisles.filter((i) => i !== rowIdx)
      : [...currentAisles, rowIdx].sort((a, b) => a - b);

    setDimensions({ ...dimensions, rowAisles: newAisles });
  };

  // Save current layout to local presets
  const handleSaveLayoutPreset = () => {
    if (!presetNameInput.trim()) return;
    const newPreset: SavedLayoutPreset = {
      id: `preset_${Date.now()}`,
      name: presetNameInput.trim(),
      type: layoutType,
      dimensions,
      desks,
    };
    const updated = [newPreset, ...savedPresets];
    setSavedPresets(updated);
    try {
      localStorage.setItem('cra_saved_layout_presets', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    setPresetNameInput('');
    setIsSaveModalOpen(false);
    alert('현재 책상 배치 형태가 저장되었습니다!');
  };

  const handleLoadLayoutPreset = (preset: SavedLayoutPreset) => {
    setLayoutType(preset.type);
    setDimensions(preset.dimensions);
    setDesks(preset.desks);
  };

  const handleDeletePreset = (id: string) => {
    const updated = savedPresets.filter((p) => p.id !== id);
    setSavedPresets(updated);
    localStorage.setItem('cra_saved_layout_presets', JSON.stringify(updated));
  };

  return (
    <div className="space-y-6">
      {/* Top Configuration Bar */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-lg shrink-0">
                2단계: 책상 배치 설정
              </span>
              <h2 className="text-xl font-black text-slate-800">책상 배열 및 복도(공백) 설정</h2>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              2인 짝궁 배치, 4인 모둠 배치 등 기본 형태를 선택하거나, 행/열 사이 복도(공백)를 자유롭게 배치하여 교실 구조를 만듭니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setIsSaveModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Save className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="whitespace-nowrap">현재 배치 저장</span>
            </button>

            <div
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold whitespace-nowrap shrink-0 ${
                activeDeskCount === studentCount
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : activeDeskCount > studentCount
                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              {activeDeskCount === studentCount ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <span className="whitespace-nowrap">
                학생 {studentCount}명 / 활성 좌석 {activeDeskCount}개
              </span>
            </div>

            <button
              onClick={onProceedToConstraints}
              className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-black text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl shadow-md shadow-indigo-200 transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <span className="whitespace-nowrap">3단계: 제약조건 & 알고리즘 설정</span>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>

        {/* Layout Template Selector Buttons */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-3">
            기본 책상 배치 형태 선택
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <button
              type="button"
              onClick={() => handleSelectPreset('pairs')}
              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                layoutType === 'pairs'
                  ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-900 shadow-sm'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80 text-slate-700'
              }`}
            >
              <span className="text-2xl">👥</span>
              <div className="mt-3">
                <div className="font-extrabold text-sm">2인 짝궁 배치</div>
                <div className="text-xs text-slate-500 mt-0.5">2명씩 짝을 지은 분단 배치</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('single')}
              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                layoutType === 'single'
                  ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-900 shadow-sm'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80 text-slate-700'
              }`}
            >
              <span className="text-2xl">👤</span>
              <div className="mt-3">
                <div className="font-extrabold text-sm">1인용 시험 배치</div>
                <div className="text-xs text-slate-500 mt-0.5">독립된 일렬 복도 배열</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('pods4')}
              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                layoutType === 'pods4'
                  ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-900 shadow-sm'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80 text-slate-700'
              }`}
            >
              <span className="text-2xl">🧩</span>
              <div className="mt-3">
                <div className="font-extrabold text-sm">4인 모둠 배치</div>
                <div className="text-xs text-slate-500 mt-0.5">2x2 모둠 구역 통로배치</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('pods6')}
              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                layoutType === 'pods6'
                  ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-900 shadow-sm'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80 text-slate-700'
              }`}
            >
              <span className="text-2xl">👨‍👩‍👧‍👦</span>
              <div className="mt-3">
                <div className="font-extrabold text-sm">6인 대모둠 배치</div>
                <div className="text-xs text-slate-500 mt-0.5">3x2 대형 모둠 통로배치</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('custom')}
              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                layoutType === 'custom'
                  ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-900 shadow-sm'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80 text-slate-700'
              }`}
            >
              <span className="text-2xl">⚙️</span>
              <div className="mt-3">
                <div className="font-extrabold text-sm">사용자 지정 커스텀</div>
                <div className="text-xs text-slate-500 mt-0.5">행x열 및 복도 자유 조절</div>
              </div>
            </button>
          </div>
        </div>

        {/* Row & Column & Aisle Controls */}
        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-slate-700">세로 줄 (행 Rows):</span>
                <button
                  onClick={() =>
                    handleCustomDimensionsChange(dimensions.rows - 1, dimensions.cols)
                  }
                  className="p-1 text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  <MinusCircle className="w-5 h-5" />
                </button>
                <span className="font-black text-sm px-2">{dimensions.rows}행</span>
                <button
                  onClick={() =>
                    handleCustomDimensionsChange(dimensions.rows + 1, dimensions.cols)
                  }
                  className="p-1 text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  <PlusCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-slate-700">가로 줄 (열 Cols):</span>
                <button
                  onClick={() =>
                    handleCustomDimensionsChange(dimensions.rows, dimensions.cols - 1)
                  }
                  className="p-1 text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  <MinusCircle className="w-5 h-5" />
                </button>
                <span className="font-black text-sm px-2">{dimensions.cols}열</span>
                <button
                  onClick={() =>
                    handleCustomDimensionsChange(dimensions.rows, dimensions.cols + 1)
                  }
                  className="p-1 text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  <PlusCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Saved Layout Presets Quick Loader */}
            {savedPresets.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">저장된 배치:</span>
                <div className="flex flex-wrap gap-1.5">
                  {savedPresets.map((p) => (
                    <div
                      key={p.id}
                      className="inline-flex items-center gap-1 bg-white border border-slate-300 px-2.5 py-1 rounded-xl text-xs font-bold text-indigo-700 shadow-2xs"
                    >
                      <button
                        onClick={() => handleLoadLayoutPreset(p)}
                        className="hover:underline cursor-pointer"
                      >
                        {p.name}
                      </button>
                      <button
                        onClick={() => handleDeletePreset(p.id)}
                        className="text-slate-400 hover:text-rose-600 ml-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Aisle / Corridor toggles */}
          <div className="pt-3 border-t border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Columns className="w-4 h-4 text-indigo-600" />
              <span>열(Col) 사이 복도/통로(공백) 지정:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: dimensions.cols - 1 }).map((_, cIdx) => {
                const isAisle = (dimensions.colAisles || []).includes(cIdx);
                return (
                  <button
                    key={`col_aisle_${cIdx}`}
                    onClick={() => toggleColAisle(cIdx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      isAisle
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm font-extrabold'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cIdx + 1}열 과 {cIdx + 2}열 사이 {isAisle ? '🚶 통로(공백)' : '붙임'}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 pt-2">
              <Rows className="w-4 h-4 text-indigo-600" />
              <span>행(Row) 사이 복도/통로(공백) 지정:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: dimensions.rows - 1 }).map((_, rIdx) => {
                const isAisle = (dimensions.rowAisles || []).includes(rIdx);
                return (
                  <button
                    key={`row_aisle_${rIdx}`}
                    onClick={() => toggleRowAisle(rIdx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      isAisle
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm font-extrabold'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {rIdx + 1}행 과 {rIdx + 2}행 사이 {isAisle ? '🚶 통로(공백)' : '붙임'}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Classroom Desk Grid Canvas */}
      <div className="bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-800 text-white space-y-6">
        {/* Blackboard Header */}
        <div className="w-full bg-slate-800/90 border-2 border-emerald-600/40 rounded-2xl py-3 text-center shadow-inner">
          <span className="text-sm font-black text-emerald-400 tracking-widest uppercase">
            [ 칠 판 / 교 탁 (교실 앞) ]
          </span>
        </div>

        {/* Grid Render with Row & Column Aisles */}
        <div className="flex flex-col items-center py-4 overflow-x-auto">
          {Array.from({ length: dimensions.rows }).map((_, r) => {
            const hasRowAisle = (dimensions.rowAisles || []).includes(r);

            return (
              <React.Fragment key={`row_group_${r}`}>
                <div className="flex items-center">
                  <span className="text-xs font-bold text-slate-500 w-8 text-right pr-2">
                    {r + 1}행
                  </span>
                  <div className="flex items-center">
                    {Array.from({ length: dimensions.cols }).map((_, c) => {
                      const desk = desks.find((d) => d.row === r && d.col === c);
                      const hasColAisle = (dimensions.colAisles || []).includes(c);

                      if (!desk) return null;

                      return (
                        <React.Fragment key={desk.id}>
                          <button
                            type="button"
                            onClick={() => toggleDeskDisabled(desk.id)}
                            className={`w-20 h-16 rounded-2xl border-2 flex flex-col items-center justify-center p-1 m-1 transition-all cursor-pointer ${
                              desk.disabled
                                ? 'bg-slate-800/50 border-slate-700/80 text-slate-600 opacity-50 hover:opacity-100'
                                : 'bg-indigo-950/80 border-indigo-500 hover:border-amber-400 text-indigo-100 shadow-lg shadow-indigo-950/80 hover:scale-105'
                            }`}
                            title={
                              desk.disabled
                                ? '비활성화된 자석입니다. 클릭하여 활성화'
                                : '활성 책상입니다. 클릭하여 빈 자석으로 처리'
                            }
                          >
                            <span className="text-[10px] font-mono text-slate-400">
                              {r + 1}-{c + 1}
                            </span>
                            <span className="text-xs font-extrabold mt-0.5">
                              {desk.disabled ? '빈 자석' : '책상'}
                            </span>
                          </button>

                          {/* Column Aisle Gap */}
                          {hasColAisle && (
                            <div
                              className="w-8 border-x border-dashed border-slate-700/60 h-16 flex items-center justify-center mx-1"
                              title="열 복도/통로 (공백)"
                            >
                              <span className="text-[9px] text-slate-600 transform -rotate-90 font-mono">
                                통로
                              </span>
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* Row Aisle Gap */}
                {hasRowAisle && (
                  <div
                    className="w-full h-8 border-y border-dashed border-slate-700/60 my-1 flex items-center justify-center"
                    title="행 복도/통로 (공백)"
                  >
                    <span className="text-[9px] text-slate-600 font-mono">
                      === 복도 / 이동 통로 ===
                    </span>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Legend Footer */}
        <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-indigo-950 border border-indigo-500" />
              <span>활성 책상</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-slate-800 border border-slate-700" />
              <span>앉지 않는 자석</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-amber-500/20 border border-amber-500" />
              <span>복도/통로 (공백)</span>
            </div>
          </div>

          <div className="text-slate-400 font-semibold">
            💡 모둠 배치에서는 통로(공백) 설정을 적용하여 1-1, 1-2, 2-1, 2-2 등이 구역별로 모여 보이도록
            설정할 수 있습니다.
          </div>
        </div>
      </div>

      {/* Save Preset Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-extrabold text-slate-800">현재 책상 배치 형태 저장</h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">배치 명칭</label>
              <input
                type="text"
                value={presetNameInput}
                onChange={(e) => setPresetNameInput(e.target.value)}
                placeholder="예: 4인 모둠 중앙복도 배치"
                className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsSaveModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                취소
              </button>
              <button
                onClick={handleSaveLayoutPreset}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm"
              >
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
