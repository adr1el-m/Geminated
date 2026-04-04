export type IndicatorDefinition = {
  indicator: string;
  definition: string;
  formula: string;
  source: string;
  updateFrequency: string;
};

export const REGIONAL_DATA_DICTIONARY: IndicatorDefinition[] = [
  {
    indicator: 'Teacher Count',
    definition: 'Number of registered teachers in a specific region/division.',
    formula: 'count(teacher profiles)',
    source: 'profiles',
    updateFrequency: 'Real-time on registration/profile updates',
  },
  {
    indicator: 'Average Experience',
    definition: 'Mean years of teaching experience for teachers in a region/division.',
    formula: 'sum(years_of_experience) / teacher_count',
    source: 'profiles.years_of_experience',
    updateFrequency: 'Real-time on profile updates',
  },
  {
    indicator: 'Advanced Qualification Rate',
    definition: 'Share of teachers with Master\'s or Doctoral-level qualifications.',
    formula: 'teachers with advanced qualification / teacher_count',
    source: 'profiles.qualification_level',
    updateFrequency: 'Real-time on profile updates',
  },
  {
    indicator: 'STAR Access Rate',
    definition: 'Share of teachers who have applied, are active participants, or are alumni in STAR.',
    formula: '(Applied + Active Participant + Alumni) / teacher_count',
    source: 'profiles.star_participation_status',
    updateFrequency: 'Real-time on profile updates',
  },
  {
    indicator: 'STEM Specialization Gap',
    definition: 'Count of teachers without mapped STEM-related subject specialization keywords.',
    formula: 'teacher_count - teachers_with_stem_specialization',
    source: 'profiles.subjects_taught',
    updateFrequency: 'Real-time on profile updates',
  },
  {
    indicator: 'Data Completeness %',
    definition: 'Average profile completeness score by region using required planning fields.',
    formula: 'avg(populated_required_fields / required_fields) * 100',
    source: 'profiles',
    updateFrequency: 'Real-time on profile updates',
  },
  {
    indicator: 'Data Freshness Timestamp',
    definition: 'Most recent profile update timestamp in a region.',
    formula: 'max(profile_last_updated_at)',
    source: 'profiles.profile_last_updated_at',
    updateFrequency: 'Real-time on profile updates',
  },
  {
    indicator: 'Underserved Score',
    definition: 'Composite severity score indicating service gaps in a division.',
    formula: 'weighted rules for density, qualification, STAR access, and out-of-field risk',
    source: 'computed from regional analytics engine',
    updateFrequency: 'Calculated on dashboard load',
  },
];
