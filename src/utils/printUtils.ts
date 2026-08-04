import { SeatingResult, CraStudent, DeskPosition, GridDimensions, ViewPerspective } from '../types';

export function printSeatingChart(options: {
  title: string;
  subtitle: string;
  perspective: ViewPerspective;
  result: SeatingResult;
  students: CraStudent[];
  defaultDesks: DeskPosition[];
  defaultDimensions: GridDimensions;
  listPosition?: 'none' | 'left' | 'right';
}) {
  const {
    title,
    subtitle,
    perspective,
    result,
    students,
    defaultDesks,
    defaultDimensions,
    listPosition = 'none',
  } = options;

  const studentMap = new Map<string, CraStudent>(students.map((s) => [s.id, s]));
  const effectiveDesks = result.desks && result.desks.length > 0 ? result.desks : defaultDesks;
  const effectiveDimensions = result.dimensions || defaultDimensions;

  const rows = effectiveDimensions.rows;
  const cols = effectiveDimensions.cols;

  const rowIndices =
    perspective === 'student'
      ? Array.from({ length: rows }, (_, i) => i)
      : Array.from({ length: rows }, (_, i) => rows - 1 - i);

  let gridHtml = '';

  rowIndices.forEach((r) => {
    const hasRowAisle = effectiveDimensions.rowAisles?.includes(r);
    let rowCellsHtml = '';

    for (let c = 0; c < cols; c++) {
      const hasColAisle = effectiveDimensions.colAisles?.includes(c);
      const desk = effectiveDesks.find((d) => d.row === r && d.col === c);

      if (!desk || desk.disabled) {
        rowCellsHtml += `<div class="desk empty">빈 통로</div>`;
      } else {
        const studentId = result.assignments[desk.id];
        const student = studentId ? studentMap.get(studentId) : null;

        if (student) {
          const numStr = student.studentNumber ? `${student.studentNumber}` : `${r + 1}-${c + 1}`;
          rowCellsHtml += `
            <div class="desk occupied">
              <div class="s-num">${numStr}</div>
              <div class="s-name">${student.name}</div>
            </div>
          `;
        } else {
          rowCellsHtml += `<div class="desk empty">빈 좌석</div>`;
        }
      }

      if (hasColAisle) {
        rowCellsHtml += `<div class="aisle-v"></div>`;
      }
    }

    gridHtml += `<div class="row-container"><div class="row-cells">${rowCellsHtml}</div></div>`;
    if (hasRowAisle) {
      gridHtml += `<div class="aisle-h"></div>`;
    }
  });

  // Student List Table sorted by studentNumber ascending
  let studentTableHtml = '';
  if (listPosition && listPosition !== 'none') {
    const sortedStudents = [...students].sort((a, b) => {
      const numA = parseInt(a.studentNumber || '0', 10);
      const numB = parseInt(b.studentNumber || '0', 10);
      if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
        return numA - numB; // 오름차순
      }
      return (a.studentNumber || '').localeCompare(b.studentNumber || '');
    });

    const rowsHtml = sortedStudents
      .map(
        (s) => `<tr><td class="num">${s.studentNumber || '-'}</td><td class="name">${s.name}</td></tr>`
      )
      .join('');

    studentTableHtml = `
      <div class="student-list-panel">
        <div class="list-title">학생 명단</div>
        <table class="student-table">
          <thead>
            <tr>
              <th>학번</th>
              <th>이름</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;
  }

  const boardText =
    perspective === 'student'
      ? '[ 칠 판 / 교 탁 (교실 앞) ]'
      : '[ 칠 판 / 교 탁 (교실 앞 - 교사 시선) ]';

  const boardHtml = `<div class="board">${boardText}</div>`;
  const topBoard = perspective === 'student' ? boardHtml : '';
  const bottomBoard = perspective === 'teacher' ? boardHtml : '';

  const formattedSubtitle = subtitle ? subtitle.replace(/\n/g, '<br/>') : '';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <title>${title || '학급 자리배치표'}</title>
      <style>
        @page { size: A4 landscape; margin: 8mm; }
        * { box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Malgun Gothic", sans-serif; margin: 0; padding: 8px; background: #fff; color: #111; }
        .header { text-align: center; border-bottom: 2px solid #1e293b; padding-bottom: 6px; margin-bottom: 8px; }
        .header h1 { font-size: 20px; margin: 0 0 4px 0; font-weight: 900; color: #0f172a; }
        .header p { font-size: 11.5px; margin: 0; color: #475569; font-weight: 600; white-space: pre-line; line-height: 1.35; }
        .board { background: #f1f5f9; border: 2px solid #334155; border-radius: 8px; text-align: center; padding: 5px; font-weight: 800; font-size: 11.5px; letter-spacing: 2px; color: #0f172a; margin: 0 0 8px 0; width: 100%; }
        .content-layout { display: flex; align-items: center; justify-content: center; gap: 16px; width: 100%; margin: 6px 0; }
        .grid-wrapper { display: flex; flex-direction: column; align-items: center; gap: 5px; flex-shrink: 0; }
        .row-container { display: flex; align-items: center; justify-content: center; }
        .row-cells { display: flex; align-items: center; gap: 6px; }
        .desk { width: 88px; height: 58px; border: 1.5px solid #1e293b; border-radius: 8px; padding: 4px 5px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; background: #fff; }
        .desk.empty { border: 1.5px dashed #cbd5e1; background: #f8fafc; color: #94a3b8; font-size: 9.5px; display: flex; align-items: center; justify-content: center; }
        .s-num { font-size: 10px; font-weight: 800; color: #3730a3; font-family: monospace; line-height: 1; }
        .s-name { font-size: 13px; font-weight: 900; color: #0f172a; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .aisle-v { width: 8px; height: 58px; }
        .aisle-h { height: 6px; width: 100%; }

        /* Student List Panel */
        .student-list-panel { width: 145px; flex-shrink: 0; border: 1.5px solid #334155; border-radius: 8px; padding: 4px; background: #f8fafc; }
        .student-list-panel .list-title { font-weight: 800; font-size: 10px; text-align: center; border-bottom: 1.5px solid #334155; padding-bottom: 3px; margin-bottom: 3px; color: #0f172a; }
        .student-table { width: 100%; border-collapse: collapse; text-align: center; }
        .student-table th { background: #e2e8f0; padding: 2px 3px; font-weight: 800; font-size: 9px; border-bottom: 1px solid #94a3b8; }
        .student-table td { padding: 2px 3px; font-weight: 700; border-bottom: 1px solid #e2e8f0; font-size: 9.5px; line-height: 1.15; }
        .student-table tr:nth-child(even) { background: #f1f5f9; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title || result.title}</h1>
        ${formattedSubtitle ? `<p>${formattedSubtitle}</p>` : ''}
      </div>
      <div class="content-layout">
        ${listPosition === 'left' ? studentTableHtml : ''}
        <div class="grid-wrapper">
          ${topBoard}
          ${gridHtml}
          ${bottomBoard}
        </div>
        ${listPosition === 'right' ? studentTableHtml : ''}
      </div>
    </body>
    </html>
  `;

  let windowOpened = false;
  try {
    const printWin = window.open('', '_blank', 'width=950,height=850');
    if (printWin) {
      windowOpened = true;
      printWin.document.open();
      printWin.document.write(htmlContent);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => {
        printWin.print();
      }, 300);
    }
  } catch (e) {
    console.warn('Popup blocked, falling back to iframe print', e);
  }

  if (!windowOpened) {
    let iframe = document.getElementById('app-print-iframe') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'app-print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0px';
      iframe.style.height = '0px';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
    }
    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      }, 300);
    } else {
      window.print();
    }
  }
}
