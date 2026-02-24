/**
 * IEP Goal Bank — Structured, measurable annual goals organized by domain.
 * Each goal includes benchmarks, measurement method, and grade/GE triggers
 * for smart deficit-driven suggestions.
 *
 * geTrigger: if the student's GE in the matching area is AT OR BELOW this
 * value relative to their grade level, the goal is flagged as "Suggested".
 * A geTrigger of -2 means "suggest if student is 2+ years below grade level."
 */

// ─── READING GOALS ───────────────────────────────────────────────────────────

const READING_GOALS = [
  {
    id: 'r01',
    area: 'Reading',
    domain: 'Reading Comprehension',
    gradeRange: [6, 12],
    geTrigger: -2,
    goalText: 'Given grade-level narrative and informational text, {name} will answer comprehension questions (literal, inferential, and evaluative) with 80% accuracy on 3 consecutive curriculum-based assessments.',
    benchmarks: [
      'Identify main idea and supporting details with 70% accuracy.',
      'Make inferences using text evidence with 70% accuracy.',
      'Answer evaluative questions with 75% accuracy.',
    ],
    measureMethod: 'Curriculum-based assessment / teacher-made tests',
  },
  {
    id: 'r02',
    area: 'Reading',
    domain: 'Reading Comprehension',
    gradeRange: [6, 12],
    geTrigger: -3,
    goalText: 'Given text at the instructional level, {name} will independently use at least 3 comprehension strategies (predicting, summarizing, questioning, visualizing) to demonstrate understanding by orally or in writing retelling key events with 80% accuracy.',
    benchmarks: [
      'Apply predicting and confirming strategy in 4 out of 5 trials.',
      'Summarize passages in own words capturing main idea and 3 details.',
      'Generate 2 relevant questions per passage to demonstrate engagement.',
    ],
    measureMethod: 'Teacher observation, reading response journals',
  },
  {
    id: 'r03',
    area: 'Reading',
    domain: 'Reading Fluency',
    gradeRange: [6, 12],
    geTrigger: -2,
    goalText: 'Given grade-level text, {name} will read aloud at a rate of {target} words correct per minute with 95% accuracy and appropriate prosody on 3 consecutive probes.',
    benchmarks: [
      'Increase oral reading fluency by 20 WCPM from baseline.',
      'Read with appropriate phrasing and expression in 4 out of 5 observations.',
      'Self-correct reading errors in 80% of opportunities.',
    ],
    measureMethod: 'DIBELS / curriculum-based measurement oral reading fluency probes',
  },
  {
    id: 'r04',
    area: 'Reading',
    domain: 'Vocabulary',
    gradeRange: [6, 12],
    geTrigger: -2,
    goalText: 'Given instruction in context clues and morphemic analysis, {name} will determine the meaning of unknown grade-level vocabulary words with 80% accuracy across 3 consecutive assessments.',
    benchmarks: [
      'Use context clues to define unknown words with 75% accuracy.',
      'Identify prefixes, suffixes, and root words to decode meaning with 70% accuracy.',
      'Apply new vocabulary correctly in written sentences in 4 out of 5 opportunities.',
    ],
    measureMethod: 'Vocabulary assessments, curriculum-based measures',
  },
];

// ─── MATH GOALS ──────────────────────────────────────────────────────────────

const MATH_GOALS = [
  {
    id: 'm01',
    area: 'Math',
    domain: 'Math Computation',
    gradeRange: [6, 12],
    geTrigger: -2,
    goalText: 'Given grade-level computation problems involving whole numbers, fractions, and decimals, {name} will solve problems with 85% accuracy on 3 consecutive curriculum-based assessments.',
    benchmarks: [
      'Solve multi-digit multiplication and division problems with 80% accuracy.',
      'Add, subtract, multiply, and divide fractions with 75% accuracy.',
      'Perform decimal operations with 80% accuracy.',
    ],
    measureMethod: 'Teacher-made tests, curriculum-based assessments',
  },
  {
    id: 'm02',
    area: 'Math',
    domain: 'Math Problem Solving',
    gradeRange: [6, 12],
    geTrigger: -2,
    goalText: 'Given multi-step word problems at the instructional level, {name} will identify relevant information, select the correct operations, and solve with 75% accuracy on curriculum-based assessments.',
    benchmarks: [
      'Identify relevant vs. irrelevant information in word problems with 80% accuracy.',
      'Select the correct operations for multi-step problems in 4 out of 5 trials.',
      'Show complete work and explain reasoning in 3 out of 4 opportunities.',
    ],
    measureMethod: 'Curriculum-based assessments, problem-solving rubrics',
  },
  {
    id: 'm03',
    area: 'Math',
    domain: 'Algebraic Reasoning',
    gradeRange: [8, 12],
    geTrigger: -2,
    goalText: 'Given algebraic expressions and equations, {name} will simplify expressions and solve one- and two-step equations with 80% accuracy on 3 consecutive assessments.',
    benchmarks: [
      'Combine like terms and simplify expressions with 75% accuracy.',
      'Solve one-step equations with 85% accuracy.',
      'Solve two-step equations with 75% accuracy.',
    ],
    measureMethod: 'Curriculum-based assessments, quizzes',
  },
  {
    id: 'm04',
    area: 'Math',
    domain: 'Number Sense',
    gradeRange: [6, 12],
    geTrigger: -3,
    goalText: 'Given instruction in number sense concepts, {name} will demonstrate understanding of place value, number relationships, and estimation with 80% accuracy on curriculum-based measures.',
    benchmarks: [
      'Identify place value through millions with 90% accuracy.',
      'Compare and order integers, fractions, and decimals with 80% accuracy.',
      'Estimate sums, differences, products, and quotients within 10% of actual answers.',
    ],
    measureMethod: 'Curriculum-based assessments',
  },
];

// ─── WRITING GOALS ───────────────────────────────────────────────────────────

const WRITING_GOALS = [
  {
    id: 'w01',
    area: 'Writing',
    domain: 'Written Expression',
    gradeRange: [6, 12],
    geTrigger: -2,
    goalText: 'Given a writing prompt, {name} will compose a multi-paragraph essay with a clear thesis, supporting details, transitions, and a conclusion, scoring 3 out of 4 or higher on a district writing rubric in 3 out of 4 writing samples.',
    benchmarks: [
      'Write a clear topic sentence/thesis statement in 4 out of 5 opportunities.',
      'Include at least 3 supporting details per body paragraph.',
      'Use transition words and phrases to connect ideas in 80% of paragraphs.',
    ],
    measureMethod: 'Writing rubric scoring, portfolio review',
  },
  {
    id: 'w02',
    area: 'Writing',
    domain: 'Writing Mechanics',
    gradeRange: [6, 12],
    geTrigger: -2,
    goalText: 'Given a writing assignment, {name} will produce a final draft with no more than 5 mechanical errors (capitalization, punctuation, spelling) per page on 3 consecutive writing samples.',
    benchmarks: [
      'Use correct end punctuation and capitalization in 90% of sentences.',
      'Spell grade-level words correctly with 85% accuracy.',
      'Use commas correctly in compound and complex sentences in 80% of opportunities.',
    ],
    measureMethod: 'Error analysis of writing samples',
  },
  {
    id: 'w03',
    area: 'Writing',
    domain: 'Writing Process',
    gradeRange: [6, 12],
    geTrigger: -2,
    goalText: 'Given explicit instruction in the writing process, {name} will independently plan, draft, revise, and edit written work using a graphic organizer and self-editing checklist in 4 out of 5 writing assignments.',
    benchmarks: [
      'Complete a graphic organizer before drafting in 4 out of 5 assignments.',
      'Make at least 3 meaningful revisions to content during the revision stage.',
      'Use a self-editing checklist to correct at least 80% of errors before final submission.',
    ],
    measureMethod: 'Process documentation review, teacher observation',
  },
  {
    id: 'w04',
    area: 'Writing',
    domain: 'Sentence Structure',
    gradeRange: [6, 12],
    geTrigger: -3,
    goalText: 'Given instruction in sentence construction, {name} will write grammatically correct simple, compound, and complex sentences with 80% accuracy on 3 consecutive writing samples.',
    benchmarks: [
      'Write grammatically correct simple sentences in 90% of attempts.',
      'Combine sentences using coordinating conjunctions in 80% of opportunities.',
      'Write complex sentences with subordinating conjunctions in 75% of opportunities.',
    ],
    measureMethod: 'Writing sample analysis, sentence-combining exercises',
  },
];

// ─── BEHAVIOR / SELF-REGULATION GOALS ────────────────────────────────────────

const BEHAVIOR_GOALS = [
  {
    id: 'b01',
    area: 'Behavior',
    domain: 'Self-Regulation',
    gradeRange: [6, 12],
    geTrigger: null,
    goalText: 'When presented with a frustrating or challenging academic task, {name} will independently use a learned coping strategy (deep breathing, requesting a break, positive self-talk) instead of engaging in disruptive behavior in 4 out of 5 observed opportunities across 3 consecutive weeks.',
    benchmarks: [
      'Identify personal frustration triggers with staff support in 3 sessions.',
      'Select and use a coping strategy with a verbal prompt in 80% of opportunities.',
      'Independently use a coping strategy without prompts in 4 out of 5 opportunities.',
    ],
    measureMethod: 'Behavior tracking logs, staff observation',
  },
  {
    id: 'b02',
    area: 'Behavior',
    domain: 'Task Completion',
    gradeRange: [6, 12],
    geTrigger: null,
    goalText: '{name} will remain on task during independent work periods for at least 15 consecutive minutes without redirection in 4 out of 5 observed intervals across 3 consecutive weeks.',
    benchmarks: [
      'Stay on task for 5 minutes without redirection in 4 out of 5 intervals.',
      'Stay on task for 10 minutes without redirection in 4 out of 5 intervals.',
      'Stay on task for 15 minutes without redirection in 4 out of 5 intervals.',
    ],
    measureMethod: 'Time-on-task observation data, interval recording',
  },
  {
    id: 'b03',
    area: 'Behavior',
    domain: 'Compliance',
    gradeRange: [6, 12],
    geTrigger: null,
    goalText: '{name} will follow adult directions within 30 seconds of the initial request without verbal refusal or argument in 80% of observed opportunities across 4 consecutive weeks.',
    benchmarks: [
      'Follow one-step directions within 1 minute in 70% of opportunities.',
      'Follow two-step directions with one prompt in 75% of opportunities.',
      'Follow multi-step directions within 30 seconds without argument in 80% of opportunities.',
    ],
    measureMethod: 'Behavior tracking data, teacher observation logs',
  },
  {
    id: 'b04',
    area: 'Behavior',
    domain: 'Anger Management',
    gradeRange: [6, 12],
    geTrigger: null,
    goalText: 'When experiencing anger or conflict, {name} will de-escalate using a learned strategy (walk away, count to 10, request mediation) without physical aggression or property destruction in 90% of documented incidents across 4 consecutive weeks.',
    benchmarks: [
      'Identify escalation warning signs with staff prompting in 4 out of 5 discussions.',
      'Use a de-escalation strategy with verbal cueing in 80% of incidents.',
      'Independently de-escalate without physical aggression in 90% of incidents.',
    ],
    measureMethod: 'Incident reports, behavior tracking logs',
  },
];

// ─── SOCIAL SKILLS GOALS ────────────────────────────────────────────────────

const SOCIAL_GOALS = [
  {
    id: 'ss01',
    area: 'Social Skills',
    domain: 'Peer Interaction',
    gradeRange: [6, 12],
    geTrigger: null,
    goalText: 'During unstructured and structured group activities, {name} will engage in positive peer interactions (sharing, turn-taking, cooperative language) without conflict in 4 out of 5 observed opportunities across 4 consecutive weeks.',
    benchmarks: [
      'Initiate a positive interaction with a peer during group time in 3 out of 5 opportunities.',
      'Share materials and take turns without prompting in 4 out of 5 opportunities.',
      'Use cooperative language (please, thank you, compromise phrases) in 80% of interactions.',
    ],
    measureMethod: 'Social skills observation checklist, staff logs',
  },
  {
    id: 'ss02',
    area: 'Social Skills',
    domain: 'Communication',
    gradeRange: [6, 12],
    geTrigger: null,
    goalText: '{name} will appropriately express needs, wants, and feelings using "I" statements and respectful language in 80% of observed opportunities across 4 consecutive weeks.',
    benchmarks: [
      'Use an "I" statement to express a feeling in 3 out of 5 practice situations.',
      'Request help or a break using respectful language in 4 out of 5 opportunities.',
      'Express disagreement without raising voice or using profanity in 80% of incidents.',
    ],
    measureMethod: 'Staff observation, group counseling records',
  },
  {
    id: 'ss03',
    area: 'Social Skills',
    domain: 'Social Pragmatics',
    gradeRange: [6, 12],
    geTrigger: null,
    goalText: 'During conversations and group discussions, {name} will demonstrate appropriate social pragmatic skills (eye contact, topic maintenance, reading social cues) in 4 out of 5 observed opportunities.',
    benchmarks: [
      'Maintain appropriate eye contact during conversation in 4 out of 5 observations.',
      'Stay on topic and contribute relevant comments in group discussions 80% of the time.',
      'Recognize and respond appropriately to nonverbal social cues in 3 out of 5 scenarios.',
    ],
    measureMethod: 'Social skills checklist, teacher/counselor observation',
  },
];

// ─── TRANSITION / INDEPENDENT LIVING GOALS ──────────────────────────────────

const TRANSITION_GOALS = [
  {
    id: 't01',
    area: 'Transition',
    domain: 'Self-Advocacy',
    gradeRange: [9, 12],
    geTrigger: null,
    goalText: '{name} will independently self-advocate by identifying personal strengths, needs, and accommodations and communicating them to teachers or employers in 4 out of 5 structured opportunities.',
    benchmarks: [
      'List 3 personal strengths and 3 areas of need accurately.',
      'Explain IEP accommodations to an unfamiliar adult in a role-play scenario.',
      'Request accommodations in a real classroom or work-based setting in 4 out of 5 trials.',
    ],
    measureMethod: 'Role-play rubric, teacher observation',
  },
  {
    id: 't02',
    area: 'Transition',
    domain: 'Career Exploration',
    gradeRange: [9, 12],
    geTrigger: null,
    goalText: '{name} will research at least 3 career options aligned with personal interests and abilities, identify the education/training requirements for each, and present findings in a career portfolio by the end of the IEP period.',
    benchmarks: [
      'Complete a career interest inventory and identify top 3 career matches.',
      'Research education/training requirements for each career and document findings.',
      'Create a career portfolio with resume, cover letter, and career summary.',
    ],
    measureMethod: 'Career portfolio rubric, transition assessment',
  },
  {
    id: 't03',
    area: 'Transition',
    domain: 'Daily Living Skills',
    gradeRange: [9, 12],
    geTrigger: null,
    goalText: '{name} will independently demonstrate daily living skills (budgeting, meal planning, personal hygiene routines, time management) with 80% accuracy across 4 structured practice sessions.',
    benchmarks: [
      'Create a simple weekly budget given a fixed income in 3 out of 4 trials.',
      'Plan a weekly meal plan within a budget in 3 out of 4 trials.',
      'Use a planner or digital calendar to manage daily tasks for 5 consecutive days.',
    ],
    measureMethod: 'Skills checklist, performance-based assessment',
  },
  {
    id: 't04',
    area: 'Transition',
    domain: 'Post-Secondary Education',
    gradeRange: [10, 12],
    geTrigger: null,
    goalText: '{name} will complete post-secondary education exploration activities including researching 2 programs of interest, completing a practice application, and identifying available supports/accommodations by end of IEP period.',
    benchmarks: [
      'Research and compare 2 post-secondary programs aligned with career goals.',
      'Complete a practice college/trade school application with all required components.',
      'Identify disability services and how to request accommodations at the post-secondary level.',
    ],
    measureMethod: 'Completed application artifacts, research portfolio',
  },
];


// ─── COMBINED GOAL BANK ─────────────────────────────────────────────────────

export const IEP_GOAL_BANK = [
  ...READING_GOALS,
  ...MATH_GOALS,
  ...WRITING_GOALS,
  ...BEHAVIOR_GOALS,
  ...SOCIAL_GOALS,
  ...TRANSITION_GOALS,
];

/**
 * Returns goals sorted by relevance for a given student.
 * Academic goals are ranked by deficit size; behavior/social/transition goals
 * are included if grade-appropriate.
 *
 * @param {number} gradeLevel - Student's current grade level
 * @param {object} kteaData - { preReadingGE, preMathGE, preWritingGE, postReadingGE, postMathGE, postWritingGE }
 * @returns {{ suggested: Array, other: Array }}
 */
export function getSuggestedGoals(gradeLevel, kteaData) {
  const currentGE = {
    Reading: parseFloat(kteaData?.postReadingGE || kteaData?.preReadingGE) || null,
    Math: parseFloat(kteaData?.postMathGE || kteaData?.preMathGE) || null,
    Writing: parseFloat(kteaData?.postWritingGE || kteaData?.preWritingGE) || null,
  };

  const deficits = {};
  for (const [area, ge] of Object.entries(currentGE)) {
    if (ge !== null) {
      deficits[area] = gradeLevel - ge; // positive = below grade level
    }
  }

  const suggested = [];
  const other = [];

  for (const goal of IEP_GOAL_BANK) {
    // Filter by grade range
    if (gradeLevel < goal.gradeRange[0] || gradeLevel > goal.gradeRange[1]) continue;

    // Academic goals: check deficit trigger
    if (goal.geTrigger !== null && deficits[goal.area] !== undefined) {
      if (deficits[goal.area] >= Math.abs(goal.geTrigger)) {
        suggested.push({ ...goal, deficitSize: deficits[goal.area] });
      } else {
        other.push(goal);
      }
    } else if (goal.geTrigger === null) {
      // Behavioral/social/transition goals — always available
      other.push(goal);
    } else {
      other.push(goal);
    }
  }

  // Sort suggested by deficit size (largest deficit first)
  suggested.sort((a, b) => (b.deficitSize || 0) - (a.deficitSize || 0));

  return { suggested, other };
}

export const GOAL_AREAS = ['Reading', 'Math', 'Writing', 'Behavior', 'Social Skills', 'Transition'];
