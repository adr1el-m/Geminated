import { db } from './db';
import { REGISTRATION_REGIONS, REGION_DIVISIONS_BY_REGION } from './constants';

type TeacherRow = {
  id: string;
  region: string;
  division: string;
  occupation: string;
  qualification_level: string;
  star_participation_status: string;
  consent_data_processing: boolean;
  consent_research: boolean;
  anonymization_opt_out: boolean;
  profile_last_updated_at: string;
  years_of_experience: number;
  subjects_taught: string[] | null;
};

type RegionTeacherDirectoryRow = {
  id: string;
  star_id: string;
  full_name: string;
  occupation: string;
  region: string;
  division: string;
  school: string;
  qualification_level: string;
  subjects_taught: string[] | null;
  years_of_experience: number;
  star_participation_status: string;
  data_quality_score: number;
  consent_data_processing: boolean;
  consent_research: boolean;
  anonymization_opt_out: boolean;
  profile_last_updated_at: string;
};

export type RegionalDivisionSnapshot = {
  region: string;
  division: string;
  teacherCount: number;
  averageExperience: number;
  experienceDistribution: {
    newTeachers: number;
    midCareer: number;
    veteran: number;
  };
  qualificationLevels: Array<{ level: string; count: number }>;
  subjectMix: Array<{ subject: string; count: number }>;
  participationRates: Array<{ status: string; rate: number; count: number }>;
  underservedScore: number;
  underservedReasons: string[];
};

export type NeedsSegmentationByRegion = {
  region: string;
  totalTeachers: number;
  newTeachers: number;
  midCareerTeachers: number;
  veteranTeachers: number;
  masterTrackTeachers: number;
  stemSpecializationGap: number;
};

export type RegionFreshnessIndicator = {
  region: string;
  teacherCount: number;
  lastUpdatedAt: string;
  completenessPercentage: number;
};

export type AnonymizedResearchSummary = {
  totalConsentedTeachers: number;
  anonymizedDatasetRows: number;
  includedRegions: number;
};

export type RegionalCoverageGap = {
  region: string;
  teacherCount: number;
  expectedDivisions: number;
  coveredDivisions: number;
  coveragePercentage: number;
  missingDivisions: string[];
  gapLevel: 'critical' | 'warning' | 'healthy';
};

export type PriorityRegionInsight = {
  region: string;
  teacherCount: number;
  priorityScore: number;
  averageUnderservedScore: number;
  starAccessRate: number;
  completenessPercentage: number;
  reasons: string[];
};

export type ProgramRecommendationCard = {
  region: string;
  priorityScore: number;
  teacherCount: number;
  recommendedPrograms: string[];
  rationale: string[];
};

export type RegionTeacherDirectoryEntry = {
  id: string;
  starId: string;
  fullName: string;
  occupation: string;
  division: string;
  school: string;
  qualificationLevel: string;
  subjectsTaught: string[];
  yearsOfExperience: number;
  starParticipationStatus: string;
  dataQualityScore: number;
  consentDataProcessing: boolean;
  consentResearch: boolean;
  anonymizationOptOut: boolean;
  profileLastUpdatedAt: string;
};

export type RegionProfileDetails = {
  region: string;
  teacherCount: number;
  divisionsCovered: number;
  averageExperience: number;
  averageDataQualityScore: number;
  consentDataProcessingRate: number;
  consentResearchRate: number;
  anonymizationOptOutRate: number;
  lastUpdatedAt: string;
  topSubjects: Array<{ subject: string; count: number }>;
  participationMix: Array<{ status: string; count: number; rate: number }>;
  qualificationMix: Array<{ level: string; count: number; rate: number }>;
  teachers: RegionTeacherDirectoryEntry[];
};

export type SchoolActivitySnapshot = {
  region: string;
  school: string;
  teacherCount: number;
  forumTopicCount: number;
  forumCommentCount: number;
  resourceShareCount: number;
  activityScore: number;
  activityPerTeacher: number;
  isIsolated: boolean;
  interventionPriority: number;
  lastActivityAt: string | null;
};

export type TwinningRecommendation = {
  region: string;
  targetSchool: string;
  mentorSchool: string | null;
  targetTeacherCount: number;
  mentorTeacherCount: number;
  targetActivityScore: number;
  mentorActivityScore: number;
  priorityScore: number;
  rationale: string;
};

const STEM_KEYWORDS = [
  'science',
  'math',
  'mathematics',
  'physics',
  'chemistry',
  'biology',
  'earth',
  'stem',
  'algebra',
  'geometry',
  'statistics',
  'research',
  'engineering',
  'robotics',
  'computer',
];

const ADVANCED_QUALIFICATIONS = new Set([
  "Master's Degree",
  'Doctoral Units',
  'Doctoral Degree',
]);

const STAR_ACCESS_STATUSES = new Set(['Active Participant', 'Alumni', 'Applied']);

function hasStemSpecialization(subjects: string[]) {
  const normalized = subjects.map((subject) => subject.toLowerCase());
  return normalized.some((subject) => STEM_KEYWORDS.some((keyword) => subject.includes(keyword)));
}

function round(value: number, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

type SchoolTeacherRow = {
  region: string;
  school: string;
  teacher_count: number;
};

type SchoolActivityCountRow = {
  region: string;
  school: string;
  count: number;
  last_activity_at: string | null;
};

async function buildSchoolActivityAndTwinningInsights() {
  const [teacherRowsRaw, topicRowsRaw, commentRowsRaw, resourceRowsRaw] = await Promise.all([
    db`
      select
        region,
        school,
        count(*)::int as teacher_count
      from profiles
      where role = 'teacher'
        and consent_data_processing = true
      group by region, school
    `,
    db`
      select
        p.region,
        p.school,
        count(*)::int as count,
        max(fp.created_at)::text as last_activity_at
      from forum_posts fp
      inner join profiles p on p.id = fp.author_id
      where fp.moderation_status = 'approved'
        and p.role = 'teacher'
      group by p.region, p.school
    `,
    db`
      select
        p.region,
        p.school,
        count(*)::int as count,
        max(fc.created_at)::text as last_activity_at
      from forum_comments fc
      inner join profiles p on p.id = fc.author_id
      inner join forum_posts fp on fp.id = fc.topic_id
      where fp.moderation_status = 'approved'
        and p.role = 'teacher'
      group by p.region, p.school
    `,
    db`
      select
        p.region,
        p.school,
        count(*)::int as count,
        max(r.created_at)::text as last_activity_at
      from resources r
      inner join profiles p on p.id = r.author_id
      where r.moderation_status = 'approved'
        and p.role = 'teacher'
      group by p.region, p.school
    `,
  ]);

  const teacherRows = teacherRowsRaw as SchoolTeacherRow[];
  const topicRows = topicRowsRaw as SchoolActivityCountRow[];
  const commentRows = commentRowsRaw as SchoolActivityCountRow[];
  const resourceRows = resourceRowsRaw as SchoolActivityCountRow[];

  const topicMap = new Map(topicRows.map((row) => [`${row.region}::${row.school}`, row]));
  const commentMap = new Map(commentRows.map((row) => [`${row.region}::${row.school}`, row]));
  const resourceMap = new Map(resourceRows.map((row) => [`${row.region}::${row.school}`, row]));

  const schoolActivity: SchoolActivitySnapshot[] = teacherRows.map((teacherRow) => {
    const key = `${teacherRow.region}::${teacherRow.school}`;
    const topicCount = topicMap.get(key)?.count ?? 0;
    const commentCount = commentMap.get(key)?.count ?? 0;
    const resourceCount = resourceMap.get(key)?.count ?? 0;
    const activityScore = (topicCount * 3) + (commentCount * 2) + (resourceCount * 2);
    const activityPerTeacher = round(activityScore / Math.max(teacherRow.teacher_count, 1));
    const noInteractionSignals = topicCount === 0 && commentCount === 0 && resourceCount === 0;
    const isIsolated = noInteractionSignals || activityPerTeacher < 0.9;

    const priorityRaw =
      (isIsolated ? 35 : 0)
      + Math.max(0, (1.4 - activityPerTeacher) * 20)
      + Math.min(25, teacherRow.teacher_count * 2.5)
      + (noInteractionSignals ? 15 : 0);

    const timestamps = [
      topicMap.get(key)?.last_activity_at,
      commentMap.get(key)?.last_activity_at,
      resourceMap.get(key)?.last_activity_at,
    ].filter(Boolean) as string[];

    const lastActivityAt = timestamps.length > 0
      ? timestamps.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
      : null;

    return {
      region: teacherRow.region,
      school: teacherRow.school,
      teacherCount: teacherRow.teacher_count,
      forumTopicCount: topicCount,
      forumCommentCount: commentCount,
      resourceShareCount: resourceCount,
      activityScore,
      activityPerTeacher,
      isIsolated,
      interventionPriority: round(Math.min(100, Math.max(0, priorityRaw))),
      lastActivityAt,
    } satisfies SchoolActivitySnapshot;
  });

  const schoolsByRegion = new Map<string, SchoolActivitySnapshot[]>();
  for (const school of schoolActivity) {
    const bucket = schoolsByRegion.get(school.region) ?? [];
    bucket.push(school);
    schoolsByRegion.set(school.region, bucket);
  }

  const allMentors = [...schoolActivity]
    .filter((school) => school.activityPerTeacher >= 1.6 && school.activityScore >= 6)
    .sort((a, b) => b.activityPerTeacher - a.activityPerTeacher || b.activityScore - a.activityScore);

  const twinningTargets: TwinningRecommendation[] = [];

  for (const region of REGISTRATION_REGIONS) {
    const regionSchools = schoolsByRegion.get(region) ?? [];
    const regionMentors = [...regionSchools]
      .filter((school) => school.activityPerTeacher >= 1.6 && school.activityScore >= 6)
      .sort((a, b) => b.activityPerTeacher - a.activityPerTeacher || b.activityScore - a.activityScore);

    const regionTargets = [...regionSchools]
      .filter((school) => school.isIsolated)
      .sort((a, b) => b.interventionPriority - a.interventionPriority || b.teacherCount - a.teacherCount);

    for (const target of regionTargets) {
      const inRegionMentor = regionMentors.find((mentor) => mentor.school !== target.school);
      const fallbackMentor = allMentors.find((mentor) => mentor.school !== target.school);
      const mentor = inRegionMentor ?? fallbackMentor ?? null;

      const rationale = mentor
        ? `Low collaboration activity detected. Pair ${target.school} with ${mentor.school} for structured peer mentoring and resource co-development.`
        : `Low collaboration activity detected. No high-activity mentor school is currently available; prioritize regional onboarding and facilitation support.`;

      twinningTargets.push({
        region,
        targetSchool: target.school,
        mentorSchool: mentor?.school ?? null,
        targetTeacherCount: target.teacherCount,
        mentorTeacherCount: mentor?.teacherCount ?? 0,
        targetActivityScore: target.activityScore,
        mentorActivityScore: mentor?.activityScore ?? 0,
        priorityScore: round(Math.min(100, target.interventionPriority + (mentor ? 0 : 8))),
        rationale,
      });
    }
  }

  return {
    schoolActivity: schoolActivity.sort((a, b) => b.interventionPriority - a.interventionPriority),
    twinningTargets: twinningTargets.sort((a, b) => b.priorityScore - a.priorityScore),
  };
}

type RegionalInsightsOptions = {
  includeRegionalAnalytics?: boolean;
  includeSchoolActivity?: boolean;
};

export async function getRegionalInsightsDashboard(options: RegionalInsightsOptions = {}) {
  const includeRegionalAnalytics = options.includeRegionalAnalytics ?? true;
  const includeSchoolActivity = options.includeSchoolActivity ?? true;

  const emptySchoolInsights = {
    schoolActivity: [] as SchoolActivitySnapshot[],
    twinningTargets: [] as TwinningRecommendation[],
  };

  if (!includeRegionalAnalytics) {
    const schoolInsights = includeSchoolActivity
      ? await buildSchoolActivityAndTwinningInsights()
      : emptySchoolInsights;

    return {
      divisionSnapshots: [] as RegionalDivisionSnapshot[],
      underservedAreas: [] as RegionalDivisionSnapshot[],
      needsSegmentation: [] as NeedsSegmentationByRegion[],
      freshnessIndicators: [] as RegionFreshnessIndicator[],
      coverageGaps: [] as RegionalCoverageGap[],
      topPriorityRegions: [] as PriorityRegionInsight[],
      programRecommendations: [] as ProgramRecommendationCard[],
      schoolActivity: schoolInsights.schoolActivity,
      twinningTargets: schoolInsights.twinningTargets,
      anonymizedResearchSummary: {
        totalConsentedTeachers: 0,
        anonymizedDatasetRows: 0,
        includedRegions: 0,
      } as AnonymizedResearchSummary,
    };
  }

  const rows = (await db`
    select
      id,
      region,
      division,
      occupation,
      qualification_level,
      star_participation_status,
      consent_data_processing,
      consent_research,
      anonymization_opt_out,
      profile_last_updated_at,
      years_of_experience,
      subjects_taught
    from profiles
    where role = 'teacher'
      and consent_data_processing = true
  `) as TeacherRow[];

  if (rows.length === 0) {
    const coverageGaps: RegionalCoverageGap[] = REGISTRATION_REGIONS.map((region) => ({
      region,
      teacherCount: 0,
      expectedDivisions: (REGION_DIVISIONS_BY_REGION[region] ?? []).length,
      coveredDivisions: 0,
      coveragePercentage: 0,
      missingDivisions: REGION_DIVISIONS_BY_REGION[region] ?? [],
      gapLevel: 'critical',
    }));

    return {
      divisionSnapshots: [] as RegionalDivisionSnapshot[],
      underservedAreas: [] as RegionalDivisionSnapshot[],
      needsSegmentation: [] as NeedsSegmentationByRegion[],
      freshnessIndicators: [] as RegionFreshnessIndicator[],
      coverageGaps,
      topPriorityRegions: [] as PriorityRegionInsight[],
      programRecommendations: [] as ProgramRecommendationCard[],
      schoolActivity: emptySchoolInsights.schoolActivity,
      twinningTargets: emptySchoolInsights.twinningTargets,
      anonymizedResearchSummary: {
        totalConsentedTeachers: 0,
        anonymizedDatasetRows: 0,
        includedRegions: 0,
      } as AnonymizedResearchSummary,
    };
  }

  const averageTeachersPerDivision = rows.length / new Set(rows.map((row) => `${row.region}::${row.division}`)).size;

  const divisionGroups = new Map<string, TeacherRow[]>();
  const regionGroups = new Map<string, TeacherRow[]>();

  for (const row of rows) {
    const divisionKey = `${row.region}::${row.division}`;
    const divisionRows = divisionGroups.get(divisionKey) ?? [];
    divisionRows.push(row);
    divisionGroups.set(divisionKey, divisionRows);

    const regionRows = regionGroups.get(row.region) ?? [];
    regionRows.push(row);
    regionGroups.set(row.region, regionRows);
  }

  const divisionSnapshots: RegionalDivisionSnapshot[] = [];

  for (const [key, divisionRows] of divisionGroups.entries()) {
    const [region, division] = key.split('::');
    const teacherCount = divisionRows.length;
    const averageExperience = round(
      divisionRows.reduce((sum, row) => sum + Math.max(0, row.years_of_experience || 0), 0) / Math.max(teacherCount, 1)
    );

    let newTeachers = 0;
    let midCareer = 0;
    let veteran = 0;
    let advancedQualifications = 0;
    let starAccessCount = 0;
    let outOfFieldCount = 0;

    const qualificationMap = new Map<string, number>();
    const subjectMap = new Map<string, number>();
    const participationMap = new Map<string, number>();

    for (const row of divisionRows) {
      const years = Math.max(0, row.years_of_experience || 0);
      if (years <= 3) {
        newTeachers += 1;
      } else if (years <= 10) {
        midCareer += 1;
      } else {
        veteran += 1;
      }

      const qualification = row.qualification_level || 'Not Specified';
      qualificationMap.set(qualification, (qualificationMap.get(qualification) ?? 0) + 1);
      if (ADVANCED_QUALIFICATIONS.has(qualification)) {
        advancedQualifications += 1;
      }

      const participation = row.star_participation_status || 'Not Yet Participated';
      participationMap.set(participation, (participationMap.get(participation) ?? 0) + 1);
      if (STAR_ACCESS_STATUSES.has(participation)) {
        starAccessCount += 1;
      }

      const subjects = (row.subjects_taught ?? []).map((subject) => subject.trim()).filter(Boolean);
      for (const subject of subjects) {
        subjectMap.set(subject, (subjectMap.get(subject) ?? 0) + 1);
      }

      if (!hasStemSpecialization(subjects)) {
        outOfFieldCount += 1;
      }
    }

    const advancedQualificationRate = advancedQualifications / Math.max(teacherCount, 1);
    const starAccessRate = starAccessCount / Math.max(teacherCount, 1);
    const outOfFieldRate = outOfFieldCount / Math.max(teacherCount, 1);
    const densityRatio = teacherCount / Math.max(averageTeachersPerDivision, 1);

    let underservedScore = 0;
    const underservedReasons: string[] = [];

    if (densityRatio < 0.6 || teacherCount < 3) {
      const severity = Math.min(1, (0.6 - Math.min(densityRatio, 0.6)) / 0.6 + (teacherCount < 3 ? 0.25 : 0));
      underservedScore += 35 * severity;
      underservedReasons.push('Low teacher density');
    }

    if (advancedQualificationRate < 0.4) {
      underservedScore += 25 * ((0.4 - advancedQualificationRate) / 0.4);
      underservedReasons.push('Low advanced qualification rate');
    }

    if (starAccessRate < 0.5) {
      underservedScore += 25 * ((0.5 - starAccessRate) / 0.5);
      underservedReasons.push('Low STAR access rate');
    }

    if (outOfFieldRate > 0.3) {
      underservedScore += 15 * ((outOfFieldRate - 0.3) / 0.7);
      underservedReasons.push('High out-of-field teaching risk');
    }

    divisionSnapshots.push({
      region,
      division,
      teacherCount,
      averageExperience,
      experienceDistribution: {
        newTeachers,
        midCareer,
        veteran,
      },
      qualificationLevels: [...qualificationMap.entries()]
        .map(([level, count]) => ({ level, count }))
        .sort((a, b) => b.count - a.count),
      subjectMix: [...subjectMap.entries()]
        .map(([subject, count]) => ({ subject, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      participationRates: [...participationMap.entries()]
        .map(([status, count]) => ({
          status,
          count,
          rate: round((count / Math.max(teacherCount, 1)) * 100),
        }))
        .sort((a, b) => b.count - a.count),
      underservedScore: round(Math.min(100, Math.max(0, underservedScore))),
      underservedReasons,
    });
  }

  const underservedAreas = divisionSnapshots
    .filter((snapshot) => snapshot.underservedScore >= 35)
    .sort((a, b) => b.underservedScore - a.underservedScore);

  const needsSegmentation: NeedsSegmentationByRegion[] = [];
  const freshnessIndicators: RegionFreshnessIndicator[] = [];
  let anonymizedDatasetRows = 0;

  for (const [region, regionRows] of regionGroups.entries()) {
    let newTeachers = 0;
    let midCareerTeachers = 0;
    let veteranTeachers = 0;
    let masterTrackTeachers = 0;
    let stemSpecializationGap = 0;

    for (const row of regionRows) {
      const years = Math.max(0, row.years_of_experience || 0);
      if (years <= 3) {
        newTeachers += 1;
      } else if (years <= 10) {
        midCareerTeachers += 1;
      } else {
        veteranTeachers += 1;
      }

      if (/master|head teacher|principal/i.test(row.occupation || '')) {
        masterTrackTeachers += 1;
      }

      const subjects = (row.subjects_taught ?? []).map((subject) => subject.trim()).filter(Boolean);
      if (!hasStemSpecialization(subjects)) {
        stemSpecializationGap += 1;
      }

      if (row.consent_research && !row.anonymization_opt_out) {
        anonymizedDatasetRows += 1;
      }
    }

    const completenessScores = regionRows.map((row) => {
      let filled = 0;
      const required = 9;

      if (row.region) filled += 1;
      if (row.division) filled += 1;
      if (row.occupation) filled += 1;
      if (row.qualification_level && row.qualification_level !== 'Not Specified') filled += 1;
      if (row.star_participation_status) filled += 1;
      if ((row.subjects_taught ?? []).length > 0) filled += 1;
      if (row.years_of_experience >= 0) filled += 1;
      if (row.consent_data_processing) filled += 1;
      if (row.profile_last_updated_at) filled += 1;

      return (filled / required) * 100;
    });

    const lastUpdatedAt = regionRows
      .map((row) => row.profile_last_updated_at)
      .filter(Boolean)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? new Date().toISOString();

    freshnessIndicators.push({
      region,
      teacherCount: regionRows.length,
      lastUpdatedAt,
      completenessPercentage: round(
        completenessScores.reduce((sum, value) => sum + value, 0) / Math.max(completenessScores.length, 1)
      ),
    });

    needsSegmentation.push({
      region,
      totalTeachers: regionRows.length,
      newTeachers,
      midCareerTeachers,
      veteranTeachers,
      masterTrackTeachers,
      stemSpecializationGap,
    });
  }

  needsSegmentation.sort((a, b) => b.totalTeachers - a.totalTeachers);
  freshnessIndicators.sort((a, b) => b.completenessPercentage - a.completenessPercentage);
  divisionSnapshots.sort((a, b) => b.teacherCount - a.teacherCount);

  const freshnessByRegion = new Map(freshnessIndicators.map((item) => [item.region, item]));
  const segmentationByRegion = new Map(needsSegmentation.map((item) => [item.region, item]));

  const coverageGaps: RegionalCoverageGap[] = REGISTRATION_REGIONS.map((region) => {
    const expectedDivisions = REGION_DIVISIONS_BY_REGION[region] ?? [];
    const regionRows = regionGroups.get(region) ?? [];
    const coveredDivisionSet = new Set(regionRows.map((row) => row.division).filter(Boolean));
    const missingDivisions = expectedDivisions.filter((division) => !coveredDivisionSet.has(division));
    const coveragePercentage = expectedDivisions.length > 0
      ? round((coveredDivisionSet.size / expectedDivisions.length) * 100)
      : 0;

    let gapLevel: RegionalCoverageGap['gapLevel'] = 'healthy';
    if (regionRows.length === 0 || coveragePercentage < 25) {
      gapLevel = 'critical';
    } else if (coveragePercentage < 60 || regionRows.length < 5) {
      gapLevel = 'warning';
    }

    return {
      region,
      teacherCount: regionRows.length,
      expectedDivisions: expectedDivisions.length,
      coveredDivisions: coveredDivisionSet.size,
      coveragePercentage,
      missingDivisions,
      gapLevel,
    };
  }).sort((a, b) => a.coveragePercentage - b.coveragePercentage || a.teacherCount - b.teacherCount);

  const topPriorityRegions: PriorityRegionInsight[] = [];
  const programRecommendations: ProgramRecommendationCard[] = [];

  for (const region of REGISTRATION_REGIONS) {
    const regionRows = regionGroups.get(region) ?? [];
    const teacherCount = regionRows.length;
    const regionDivisionSnapshots = divisionSnapshots.filter((snapshot) => snapshot.region === region);
    const segmentation = segmentationByRegion.get(region);
    const completenessPercentage = freshnessByRegion.get(region)?.completenessPercentage ?? 0;

    const starAccessCount = regionRows.filter((row) => STAR_ACCESS_STATUSES.has(row.star_participation_status || '')).length;
    const starAccessRate = teacherCount > 0 ? round((starAccessCount / teacherCount) * 100) : 0;

    const averageUnderservedScore = regionDivisionSnapshots.length > 0
      ? round(
          regionDivisionSnapshots.reduce((sum, snapshot) => sum + snapshot.underservedScore, 0) /
            Math.max(regionDivisionSnapshots.length, 1)
        )
      : 0;

    let priorityScore = 0;
    const reasons: string[] = [];

    if (teacherCount === 0) {
      priorityScore += 40;
      reasons.push('No teacher records currently captured');
    } else if (teacherCount < 5) {
      priorityScore += 12;
      reasons.push('Very low teacher sample size');
    } else if (teacherCount < 15) {
      priorityScore += 6;
      reasons.push('Limited teacher sample size');
    }

    if (starAccessRate < 50) {
      priorityScore += (50 - starAccessRate) * 0.6;
      reasons.push('Low STAR access participation');
    }

    if (averageUnderservedScore >= 35) {
      priorityScore += averageUnderservedScore * 0.35;
      reasons.push('High underserved risk signals');
    }

    if (completenessPercentage < 70) {
      priorityScore += (70 - completenessPercentage) * 0.3;
      reasons.push('Low profile completeness/freshness quality');
    }

    const finalPriorityScore = round(Math.min(100, Math.max(0, priorityScore)));

    if (reasons.length === 0) {
      reasons.push('Maintain current support and periodic monitoring');
    }

    topPriorityRegions.push({
      region,
      teacherCount,
      priorityScore: finalPriorityScore,
      averageUnderservedScore,
      starAccessRate,
      completenessPercentage,
      reasons,
    });

    const recommendedPrograms: string[] = [];
    const stemGapCount = segmentation?.stemSpecializationGap ?? 0;
    const stemGapRate = teacherCount > 0 ? round((stemGapCount / teacherCount) * 100) : 0;
    const newTeacherRate = teacherCount > 0
      ? round((((segmentation?.newTeachers ?? 0) / teacherCount) * 100))
      : 0;

    if (teacherCount === 0) {
      recommendedPrograms.push('Regional teacher mapping and onboarding drive with division focal persons');
    }
    if (starAccessRate < 50) {
      recommendedPrograms.push('STAR orientation and application clinic for underserved schools');
    }
    if (averageUnderservedScore >= 40) {
      recommendedPrograms.push('Targeted coaching package with division-level mentoring support');
    }
    if (stemGapRate >= 40) {
      recommendedPrograms.push('STEM specialization bridging workshop and content support');
    }
    if (newTeacherRate >= 35) {
      recommendedPrograms.push('New teacher induction and lesson-study mentoring cohort');
    }
    if (completenessPercentage < 70) {
      recommendedPrograms.push('Profile completion sprint with regional data validation checkpoints');
    }
    if (recommendedPrograms.length === 0) {
      recommendedPrograms.push('Sustain current interventions and monitor regional indicators monthly');
    }

    programRecommendations.push({
      region,
      priorityScore: finalPriorityScore,
      teacherCount,
      recommendedPrograms: recommendedPrograms.slice(0, 4),
      rationale: reasons.slice(0, 3),
    });
  }

  topPriorityRegions.sort((a, b) => b.priorityScore - a.priorityScore || a.teacherCount - b.teacherCount);
  programRecommendations.sort((a, b) => b.priorityScore - a.priorityScore || a.teacherCount - b.teacherCount);
  const schoolInsights = includeSchoolActivity
    ? await buildSchoolActivityAndTwinningInsights()
    : emptySchoolInsights;

  return {
    divisionSnapshots,
    underservedAreas,
    needsSegmentation,
    freshnessIndicators,
    coverageGaps,
    topPriorityRegions,
    programRecommendations,
    schoolActivity: schoolInsights.schoolActivity,
    twinningTargets: schoolInsights.twinningTargets,
    anonymizedResearchSummary: {
      totalConsentedTeachers: rows.filter((row) => row.consent_research).length,
      anonymizedDatasetRows,
      includedRegions: new Set(rows.filter((row) => row.consent_research && !row.anonymization_opt_out).map((row) => row.region)).size,
    },
  };
}

export async function getRegionProfileDetails(region: string): Promise<RegionProfileDetails> {
  const rows = (await db`
    select
      id,
      star_id,
      full_name,
      occupation,
      region,
      division,
      school,
      qualification_level,
      subjects_taught,
      years_of_experience,
      star_participation_status,
      data_quality_score,
      consent_data_processing,
      consent_research,
      anonymization_opt_out,
      profile_last_updated_at
    from profiles
    where role = 'teacher'
      and region = ${region}
    order by division asc, full_name asc
  `) as RegionTeacherDirectoryRow[];

  if (rows.length === 0) {
    return {
      region,
      teacherCount: 0,
      divisionsCovered: 0,
      averageExperience: 0,
      averageDataQualityScore: 0,
      consentDataProcessingRate: 0,
      consentResearchRate: 0,
      anonymizationOptOutRate: 0,
      lastUpdatedAt: new Date().toISOString(),
      topSubjects: [],
      participationMix: [],
      qualificationMix: [],
      teachers: [],
    };
  }

  const subjectMap = new Map<string, number>();
  const participationMap = new Map<string, number>();
  const qualificationMap = new Map<string, number>();
  const divisions = new Set<string>();

  let totalExperience = 0;
  let totalQualityScore = 0;
  let consentDataProcessingCount = 0;
  let consentResearchCount = 0;
  let anonymizationOptOutCount = 0;

  for (const row of rows) {
    divisions.add(row.division || 'Not specified');
    totalExperience += Math.max(0, row.years_of_experience || 0);
    totalQualityScore += Math.max(0, row.data_quality_score || 0);

    if (row.consent_data_processing) {
      consentDataProcessingCount += 1;
    }
    if (row.consent_research) {
      consentResearchCount += 1;
    }
    if (row.anonymization_opt_out) {
      anonymizationOptOutCount += 1;
    }

    const participation = row.star_participation_status || 'Not Yet Participated';
    participationMap.set(participation, (participationMap.get(participation) ?? 0) + 1);

    const qualification = row.qualification_level || 'Not Specified';
    qualificationMap.set(qualification, (qualificationMap.get(qualification) ?? 0) + 1);

    for (const subject of (row.subjects_taught ?? []).map((item) => item.trim()).filter(Boolean)) {
      subjectMap.set(subject, (subjectMap.get(subject) ?? 0) + 1);
    }
  }

  const teacherCount = rows.length;

  const participationMix = [...participationMap.entries()]
    .map(([status, count]) => ({
      status,
      count,
      rate: round((count / Math.max(teacherCount, 1)) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  const qualificationMix = [...qualificationMap.entries()]
    .map(([level, count]) => ({
      level,
      count,
      rate: round((count / Math.max(teacherCount, 1)) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  const teachers: RegionTeacherDirectoryEntry[] = rows.map((row) => ({
    id: row.id,
    starId: row.star_id,
    fullName: row.full_name,
    occupation: row.occupation,
    division: row.division,
    school: row.school,
    qualificationLevel: row.qualification_level,
    subjectsTaught: row.subjects_taught ?? [],
    yearsOfExperience: Math.max(0, row.years_of_experience || 0),
    starParticipationStatus: row.star_participation_status,
    dataQualityScore: Math.max(0, row.data_quality_score || 0),
    consentDataProcessing: row.consent_data_processing,
    consentResearch: row.consent_research,
    anonymizationOptOut: row.anonymization_opt_out,
    profileLastUpdatedAt: row.profile_last_updated_at,
  }));

  const lastUpdatedAt = rows
    .map((row) => row.profile_last_updated_at)
    .filter(Boolean)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? new Date().toISOString();

  return {
    region,
    teacherCount,
    divisionsCovered: divisions.size,
    averageExperience: round(totalExperience / Math.max(teacherCount, 1)),
    averageDataQualityScore: round(totalQualityScore / Math.max(teacherCount, 1)),
    consentDataProcessingRate: round((consentDataProcessingCount / Math.max(teacherCount, 1)) * 100),
    consentResearchRate: round((consentResearchCount / Math.max(teacherCount, 1)) * 100),
    anonymizationOptOutRate: round((anonymizationOptOutCount / Math.max(teacherCount, 1)) * 100),
    lastUpdatedAt,
    topSubjects: [...subjectMap.entries()]
      .map(([subject, count]) => ({ subject, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
    participationMix,
    qualificationMix,
    teachers,
  };
}
