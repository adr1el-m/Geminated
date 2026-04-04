type ProfileQualityInput = {
  fullName: string;
  school: string;
  region: string;
  division: string;
  occupation: string;
  qualificationLevel: string;
  ageBracket: string;
  gender: string;
  yearsOfExperience: number;
  subjectsTaught: string[];
  starParticipationStatus: string;
  trainingHistory: string[];
};

export function normalizeCsvList(raw: string, limit: number) {
  return Array.from(
    new Set(
      raw
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    )
  ).slice(0, limit);
}

export function normalizeLineList(raw: string, limit: number) {
  return Array.from(
    new Set(
      raw
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  ).slice(0, limit);
}

export function computeProfileDataQualityScore(input: ProfileQualityInput) {
  let score = 0;

  if (input.fullName.length >= 5) score += 10;
  if (input.school.length >= 4) score += 8;
  if (input.region.length > 0) score += 8;
  if (input.division.length > 0) score += 8;
  if (input.occupation.length > 0) score += 8;
  if (input.qualificationLevel.length > 0 && input.qualificationLevel !== 'Not Specified') score += 10;
  if (input.ageBracket.length > 0 && input.ageBracket !== 'Prefer not to say') score += 6;
  if (input.gender.length > 0 && input.gender !== 'Prefer not to say') score += 6;
  if (Number.isInteger(input.yearsOfExperience) && input.yearsOfExperience >= 0 && input.yearsOfExperience <= 60) score += 8;
  if (input.subjectsTaught.length >= 1) score += 12;
  if (input.subjectsTaught.length >= 2) score += 4;
  if (input.trainingHistory.length >= 1) score += 8;
  if (input.starParticipationStatus.length > 0) score += 4;

  return Math.min(100, Math.max(0, score));
}

export function isLikelyDuplicateNameSchool(nameA: string, schoolA: string, nameB: string, schoolB: string) {
  const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, ' ').trim();
  return normalize(nameA) === normalize(nameB) && normalize(schoolA) === normalize(schoolB);
}
