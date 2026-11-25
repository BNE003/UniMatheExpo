/**
 * Klausurlogik aus Views/ExamDetailView.swift: Notenschlüssel und Zeitanzeige.
 */

export interface GradeInfo {
  grade: string;
  pointRange: string;
  percentageRange: string;
  isPassing: boolean;
}

const GRADES = [
  { grade: '1,0', min: 95, max: 100 },
  { grade: '1,3', min: 90, max: 94 },
  { grade: '1,7', min: 85, max: 89 },
  { grade: '2,0', min: 80, max: 84 },
  { grade: '2,3', min: 75, max: 79 },
  { grade: '2,7', min: 70, max: 74 },
  { grade: '3,0', min: 65, max: 69 },
  { grade: '3,3', min: 60, max: 64 },
  { grade: '3,7', min: 55, max: 59 },
  { grade: '4,0', min: 50, max: 54 },
  { grade: '5,0', min: 0, max: 49 },
] as const;

/** getGradingScale(totalPoints:) – Punktbereiche werden wie in iOS aufgerundet. */
export function gradingScale(totalPoints: number): GradeInfo[] {
  return GRADES.map(({ grade, min, max }) => {
    const minPoints = Math.max(1, Math.ceil((totalPoints * min) / 100));
    const maxPoints = Math.ceil((totalPoints * max) / 100);
    let pointRange: string;
    if (grade === '5,0') pointRange = `0 - ${Math.floor(totalPoints * 0.49)}`;
    else if (grade === '1,0') pointRange = `${minPoints} - ${totalPoints}`;
    else pointRange = `${minPoints} - ${maxPoints}`;
    return { grade, pointRange, percentageRange: `${min} - ${max}%`, isPassing: grade !== '5,0' };
  });
}

/** formatTime: „mm:ss“ bzw. „h:mm:ss“. */
export function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  const two = (n: number) => String(n).padStart(2, '0');
  return hours > 0 ? `${hours}:${two(minutes)}:${two(secs)}` : `${two(minutes)}:${two(secs)}`;
}
