/**
 * Comment template bank organized by section and tone.
 * Each array contains multiple variants; the generator picks one at random.
 *
 * Tones: encouraging | balanced | formal | direct
 * {firstName} and {pct} are interpolated by the generator.
 */

const OPENING = {
  A: { // 90-100
    encouraging: [
      '{firstName} is excelling with a stellar {pct}% — outstanding work!',
      '{firstName} continues to shine at {pct}%, showing remarkable dedication.',
    ],
    balanced: [
      '{firstName} is demonstrating excellent performance at {pct}%.',
      '{firstName} currently holds a strong {pct}%, reflecting consistent effort.',
    ],
    formal: [
      '{firstName} maintains exemplary academic standing with a {pct}% average.',
      '{firstName}\'s current performance of {pct}% reflects a high standard of achievement.',
    ],
    direct: [
      '{firstName} is at {pct}%. Top-tier work.',
      '{firstName} holds a {pct}% — among the strongest in class.',
    ],
  },
  B: { // 80-89
    encouraging: [
      '{firstName} is doing great with a solid {pct}% — keep it up!',
      '{firstName} is performing well at {pct}% and has the potential to go even higher.',
    ],
    balanced: [
      '{firstName} is performing well with an overall grade of {pct}%.',
      '{firstName} maintains a respectable {pct}%, showing steady progress.',
    ],
    formal: [
      '{firstName} demonstrates competent academic performance with a {pct}% average.',
      '{firstName}\'s current standing of {pct}% is indicative of consistent engagement.',
    ],
    direct: [
      '{firstName} is at {pct}%. Solid performance overall.',
      '{firstName} holds a {pct}% — good, with some room for growth.',
    ],
  },
  C: { // 70-79
    encouraging: [
      '{firstName} is passing at {pct}% and has real potential to improve with a bit more effort.',
      '{firstName} is at {pct}% — a good foundation to build on.',
    ],
    balanced: [
      '{firstName} is maintaining a passing grade at {pct}%.',
      '{firstName} holds a {pct}%, which meets minimum expectations.',
    ],
    formal: [
      '{firstName}\'s current grade of {pct}% meets passing requirements for this course.',
      '{firstName} maintains a {pct}% average, satisfying the minimum performance threshold.',
    ],
    direct: [
      '{firstName} is at {pct}%. Passing, but needs consistent effort to stay there.',
      '{firstName} holds {pct}% — just above the line.',
    ],
  },
  D: { // 60-69
    encouraging: [
      '{firstName} is at {pct}% and will benefit from some targeted support — I believe they can turn this around.',
      '{firstName} is close to passing at {pct}%. With focused effort, improvement is absolutely achievable.',
    ],
    balanced: [
      '{firstName} is at risk with a grade of {pct}% and may need additional support.',
      '{firstName} currently holds {pct}%, which is below passing and warrants attention.',
    ],
    formal: [
      '{firstName}\'s current performance of {pct}% is below the passing threshold and requires remediation.',
      '{firstName} is performing at {pct}%, a level that necessitates academic intervention.',
    ],
    direct: [
      '{firstName} is at {pct}%. Below passing — needs immediate improvement.',
      '{firstName} holds {pct}%. Failing and needs to take corrective action.',
    ],
  },
  F: { // <60
    encouraging: [
      '{firstName} is struggling at {pct}%, but with the right support and a fresh start, improvement is possible.',
      '{firstName} is at {pct}%. I want to work with them to build a recovery plan.',
    ],
    balanced: [
      '{firstName} is currently failing at {pct}% and requires immediate intervention.',
      '{firstName} holds a {pct}%, indicating significant academic difficulty this term.',
    ],
    formal: [
      '{firstName}\'s grade of {pct}% represents a critical academic concern that requires intervention.',
      '{firstName} is performing at {pct}%, well below the minimum standard. Immediate corrective measures are advised.',
    ],
    direct: [
      '{firstName} is at {pct}%. Failing — immediate action required.',
      '{firstName} is at {pct}%. This needs to be addressed now.',
    ],
  },
};

const TREND = {
  improved: {
    encouraging: [
      'Great improvement from {prev}% last quarter!',
      'Showed strong gains, up from {prev}% previously — the hard work is paying off.',
    ],
    balanced: [
      'Showed improvement from {prev}% last quarter.',
      'Grade has risen from {prev}% in the prior term.',
    ],
    formal: [
      'Performance reflects a positive trajectory, improving from {prev}% in the prior reporting period.',
      'This represents measurable growth from the previous quarter\'s {prev}%.',
    ],
    direct: [
      'Up from {prev}% last quarter.',
      'Improved from {prev}% — positive trend.',
    ],
  },
  declined: {
    encouraging: [
      'Grade has dipped from {prev}% last quarter, but this is recoverable with some focused effort.',
      'Slipped from {prev}% previously — let\'s work together to get back on track.',
    ],
    balanced: [
      'Grade has declined from {prev}% last quarter.',
      'Performance has dropped from {prev}% in the prior term.',
    ],
    formal: [
      'This represents a decline from the previous quarter\'s {prev}%, warranting attention.',
      'Performance has decreased from {prev}% in the prior reporting period.',
    ],
    direct: [
      'Down from {prev}% last quarter.',
      'Declined from {prev}% — needs course correction.',
    ],
  },
};

const CATEGORY_STRENGTH = {
  encouraging: [
    'Doing especially well in {best} ({bestPct}%) — great effort there!',
    'Strongest area is {best} at {bestPct}%, which is impressive.',
  ],
  balanced: [
    'Strong performance in {best} ({bestPct}%).',
    'Performing well in {best} at {bestPct}%.',
  ],
  formal: [
    'Demonstrates particular proficiency in {best}, maintaining {bestPct}%.',
    'Strongest performance is observed in {best} at {bestPct}%.',
  ],
  direct: [
    'Best area: {best} at {bestPct}%.',
    'Strongest in {best} ({bestPct}%).',
  ],
};

const CATEGORY_WEAKNESS = {
  encouraging: [
    'A little extra practice in {worst} ({worstPct}%) could make a big difference.',
    'Some additional focus in {worst} would help round out the overall grade.',
  ],
  balanced: [
    'Additional focus recommended in {worst} ({worstPct}%).',
    '{worst} ({worstPct}%) represents an area for improvement.',
  ],
  formal: [
    'Targeted support in {worst} ({worstPct}%) is recommended to strengthen overall performance.',
    'The area of {worst}, currently at {worstPct}%, would benefit from structured remediation.',
  ],
  direct: [
    'Weakest area: {worst} at {worstPct}%. Needs work.',
    '{worst} is at {worstPct}% — bring this up.',
  ],
};

const IEP_HOOKS = {
  general: [
    'Accommodations per IEP are in place and being monitored.',
    'Continuing to provide IEP-specified accommodations and supports.',
  ],
  goalAreas: {
    reading: 'Progress on reading goals is being tracked alongside grade performance.',
    math: 'Math IEP goals are being addressed through differentiated instruction.',
    writing: 'Written expression goals are being supported through modified assignments.',
    behavior: 'Behavioral supports per IEP are active; consistent structure is helping.',
    socialSkills: 'Social skills goals are addressed through structured peer interactions.',
  },
};

const ATTENDANCE = {
  severe: { // 8+ absences AND below 70%
    encouraging: [
      'Attendance ({count} absences) may be playing a role; consistent presence would help a lot.',
    ],
    balanced: [
      'Attendance ({count} absences) appears to be impacting academic progress.',
    ],
    formal: [
      'The record of {count} absences correlates with diminished performance and should be addressed.',
    ],
    direct: [
      '{count} absences — attendance is hurting the grade.',
    ],
  },
  moderate: { // 5-7 absences
    encouraging: [
      'Has {count} absences this term — being in class more often will help maintain progress.',
    ],
    balanced: [
      'Has accumulated {count} absences this term.',
    ],
    formal: [
      'The student has been absent {count} times this term, which merits monitoring.',
    ],
    direct: [
      '{count} absences this term — keep an eye on it.',
    ],
  },
};

const CLOSING = {
  A: {
    encouraging: ['Keep up the fantastic work!', 'Truly impressive — looking forward to continued success.'],
    balanced: ['Consistently strong performance this term.', 'No concerns at this time.'],
    formal: ['Performance meets the highest expectations for this course.', 'No corrective action is required.'],
    direct: ['No issues. Keep going.', 'On track. No action needed.'],
  },
  B: {
    encouraging: ['With a little push, an A is within reach!', 'Great trajectory — keep the momentum going.'],
    balanced: ['On track for continued success.', 'Solid standing heading into the next quarter.'],
    formal: ['The student is well-positioned for continued academic achievement.', 'Current trajectory suggests stable performance.'],
    direct: ['Doing fine. A small push could mean an A.', 'Solid. Could still move up.'],
  },
  C: {
    encouraging: ['I believe they can push this grade higher with consistent effort.', 'Encourage them to come for help — improvement is very doable.'],
    balanced: ['Consistent effort will help maintain and improve this grade.', 'Staying engaged with assignments is key to staying on track.'],
    formal: ['Sustained effort is recommended to ensure continued passing performance.', 'The student is encouraged to seek additional support as needed.'],
    direct: ['Needs to keep working to stay above the line.', 'Passing, but no margin for missed work.'],
  },
  D: {
    encouraging: ['I\'d love to set up a plan to help them get back on track.', 'A recovery plan is very achievable — let\'s connect.'],
    balanced: ['A meeting to discuss a recovery plan is recommended.', 'Additional support and consistent attendance are critical.'],
    formal: ['A parent-teacher conference is recommended to discuss intervention strategies.', 'Immediate academic support should be arranged.'],
    direct: ['Needs a plan. Let\'s meet.', 'Below passing — action needed now.'],
  },
  F: {
    encouraging: ['I want to help build a path forward — please reach out so we can coordinate.', 'Recovery is possible with a structured plan. Let\'s talk.'],
    balanced: ['Urgent intervention is needed. Please contact me to discuss next steps.', 'A structured recovery plan and consistent attendance are essential.'],
    formal: ['Immediate academic intervention is imperative. A formal conference is requested.', 'A comprehensive remediation plan must be established promptly.'],
    direct: ['Failing. Meeting required immediately.', 'Critical. Contact me ASAP.'],
  },
};

export {
  OPENING,
  TREND,
  CATEGORY_STRENGTH,
  CATEGORY_WEAKNESS,
  IEP_HOOKS,
  ATTENDANCE,
  CLOSING,
};
