import { apiClient } from './apiClient.js';

/**
 * RescueNet Frontend Priority Calculator & Triage Client
 * Mirrors the authoritative backend priority engine (0–100 Explainable Severity).
 * 
 * Category Weights:
 * 1. Life-threatening signs: max 40 points (Triggers Urgent Review Safeguard)
 * 2. Major injuries: max 25 points
 * 3. Functional impairment: max 15 points
 * 4. Other observed injury/distress: max 10 points
 * 5. Vulnerability: max 5 points
 * 6. Immediate environmental danger: max 5 points
 * 
 * Unified Priority Policy:
 * - 70–100: CRITICAL (Emergency triage queue & immediate human review)
 * - 40–69:  HIGH (Prompt rescue-team review)
 * - 0–39:   ROUTINE (Standard queue)
 */

export const CATEGORY_MAXES = {
  life_threatening: 40.0,
  major_injuries: 25.0,
  functional_impairment: 15.0,
  other_injuries: 10.0,
  vulnerability: 5.0,
  environmental_danger: 5.0
};

const NEGATION_TOKENS = new Set([
  'not', 'no', 'never', 'without', 'isnt', "isn't", 'arent', "aren't",
  'wasnt', "wasn't", 'neither', 'nor', 'none', 'zero', 'uninjured',
  'hardly', 'barely', 'denies', 'negative', 'false'
]);

const CLAUSE_BOUNDARIES = new Set(['.', ',', ';', '!', '?', '\n']);

function isPatternNegated(text, matchIndex) {
  const preceding = text.substring(0, matchIndex).trim();
  if (!preceding) return false;

  const tokens = [];
  let currentToken = [];
  for (let i = preceding.length - 1; i >= 0; i--) {
    const ch = preceding[i];
    if (CLAUSE_BOUNDARIES.has(ch)) break;
    if (/\s/.test(ch)) {
      if (currentToken.length > 0) {
        tokens.push(currentToken.reverse().join('').toLowerCase());
        currentToken = [];
        if (tokens.length >= 4) break;
      }
    } else {
      currentToken.push(ch);
    }
  }
  if (currentToken.length > 0 && tokens.length < 4) {
    tokens.push(currentToken.reverse().join('').toLowerCase());
  }

  for (const t of tokens) {
    const clean = t.replace(/[^\w']/g, '');
    if (NEGATION_TOKENS.has(clean)) return true;
  }
  return false;
}

const LIFE_THREATENING_RULES = [
  {
    id: 'arterial_hemorrhage',
    patterns: [
      /\b(profuse|arterial|severe|heavy|massive|uncontrolled)\s+(bleeding|hemorrhage|blood loss)\b/i,
      /\bbleeding\s+profusely\b/i,
      /\bhemorrhag(e|ing)\b/i,
      /\bgushing\s+blood\b/i
    ],
    points: 35.0,
    label: 'Profuse / Arterial Bleeding',
    suppresses: ['major_bleeding', 'minor_wound']
  },
  {
    id: 'unconscious_collapsed',
    patterns: [
      /\bunconscious\b/i,
      /\bunresponsive\b/i,
      /\bcomatose\b/i,
      /\bdying\b/i,
      /\bcollapsed\b/i,
      /\bfainted\b/i,
      /\bnot\s+moving\s+at\s+all\b/i
    ],
    points: 40.0,
    label: 'Unconscious / Unresponsive / Collapsed'
  },
  {
    id: 'respiratory_arrest',
    patterns: [
      /\bnot\s+breathing\b/i,
      /\bchoking\b/i,
      /\bsuffocat(ing|ed)\b/i,
      /\bgasping\s+for\s+(air|breath)\b/i,
      /\bsevere\s+respiratory\s+distress\b/i
    ],
    points: 40.0,
    label: 'Severe Respiratory Distress / Choking'
  },
  {
    id: 'convulsions_poisoning',
    patterns: [
      /\bseizur(e|es|ing)\b/i,
      /\bconvuls(ion|ions|ing)\b/i,
      /\bfoam(ing)?\s+at\s+(the\s+)?mouth\b/i,
      /\bpoison(ed|ing)?\b/i,
      /\btoxic\s+ingestion\b/i
    ],
    points: 35.0,
    label: 'Convulsions / Suspected Poisoning'
  },
  {
    id: 'rabies_aggression',
    patterns: [
      /\brabid\b/i,
      /\bsuspected\s+rabies\b/i,
      /\brabies\s+risk\b/i,
      /\bviolently\s+aggressive\b/i
    ],
    points: 35.0,
    label: 'Suspected Rabies / Extreme Neurological Risk'
  }
];

const MAJOR_INJURY_RULES = [
  {
    id: 'vehicular_trauma',
    patterns: [
      /\bhit\s+and\s+run\b/i,
      /\bhit\s+by\s+(car|vehicle|truck|bike|bus|auto|tempo)\b/i,
      /\brun\s+over\b/i,
      /\bcar\s+accident\b/i,
      /\bvehicular\s+accident\b/i,
      /\broad\s+accident\b/i
    ],
    points: 25.0,
    label: 'Vehicular Impact Trauma (Hit & Run)'
  },
  {
    id: 'fracture_bone',
    patterns: [
      /\bcompound\s+fracture\b/i,
      /\bopen\s+fracture\b/i,
      /\bbroken\s+(bone|leg|limb|hip|pelvis|jaw|spine)\b/i,
      /\bfractur(e|ed)\b/i,
      /\bbone\s+sticking\s+out\b/i
    ],
    points: 25.0,
    label: 'Severe Fracture / Broken Bone'
  },
  {
    id: 'deep_trauma_attack',
    patterns: [
      /\bdeep\s+(wound|laceration|cut)\b/i,
      /\bsevered\b/i,
      /\bmutilat(ed|ion)\b/i,
      /\b(dog|animal)\s+attack\b/i,
      /\bmauled\b/i,
      /\bgored\b/i
    ],
    points: 20.0,
    label: 'Deep Laceration / Animal Mauling'
  },
  {
    id: 'major_bleeding',
    patterns: [
      /\bbleeding\b/i,
      /\bblood\b/i,
      /\bbloody\b/i,
      /\bopen\s+wound\b/i
    ],
    points: 18.0,
    label: 'Observed Active Bleeding / Open Wound',
    suppresses: ['minor_wound']
  },
  {
    id: 'severe_burn_ocular',
    patterns: [
      /\bsevere\s+burn\b/i,
      /\bacid\s+attack\b/i,
      /\beye\s+(popped|prolapse|protruding|lost)\b/i
    ],
    points: 20.0,
    label: 'Severe Burn / Ocular Trauma'
  }
];

const FUNCTIONAL_IMPAIRMENT_RULES = [
  {
    id: 'unable_to_walk',
    patterns: [
      /\bunable\s+to\s+(walk|stand|move|rise)\b/i,
      /\bcannot\s+(walk|stand|move|rise)\b/i,
      /\bcan't\s+(walk|stand|move|rise)\b/i,
      /\bimmobile\b/i,
      /\bparaly(zed|sis)\b/i,
      /\bhind\s+leg\s+paralysis\b/i,
      /\bdragging\s+(its\s+)?(legs|hind legs|body)\b/i,
      /\bseverely\s+limping\b/i,
      /\bcrippled\b/i
    ],
    points: 15.0,
    label: 'Severe Functional Impairment (Unable to Stand/Walk)'
  },
  {
    id: 'limping_mild',
    patterns: [
      /\blimping\b/i,
      /\blimp\b/i,
      /\bstruggling\s+to\s+walk\b/i
    ],
    points: 10.0,
    label: 'Moderate Locomotion Difficulty'
  }
];

const OTHER_INJURY_RULES = [
  {
    id: 'maggot_infection',
    patterns: [
      /\bmaggot(s)?\b/i,
      /\bmaggot\s+wound\b/i,
      /\bsevere\s+mange\b/i,
      /\bmange\b/i,
      /\bopen\s+sores\b/i,
      /\brot(ting)?\s+flesh\b/i,
      /\binfestation\b/i
    ],
    points: 10.0,
    label: 'Maggot Wound / Severe Mange Infestation'
  },
  {
    id: 'malnutrition_dehydration',
    patterns: [
      /\bstarv(ing|ed)\b/i,
      /\bmalnourish(ed)?\b/i,
      /\bemaciat(ed)?\b/i,
      /\bribs\s+visible\b/i,
      /\bdehydrat(ed)?\b/i,
      /\bshivering\b/i
    ],
    points: 6.0,
    label: 'Severe Malnutrition / Dehydration / Shivering'
  },
  {
    id: 'swelling_abscess',
    patterns: [
      /\bswelling\b/i,
      /\bswollen\b/i,
      /\babscess\b/i,
      /\btumor\b/i,
      /\blump\b/i,
      /\bpus\b/i
    ],
    points: 6.0,
    label: 'Abscess / Significant Swelling'
  },
  {
    id: 'minor_wound',
    patterns: [
      /\bminor\s+(cut|wound|scratch)\b/i,
      /\bscratch(es)?\b/i,
      /\babrasion(s)?\b/i,
      /\bcut\b/i,
      /\bwound\b/i,
      /\binjur(y|ed)\b/i
    ],
    points: 5.0,
    label: 'Minor Observed Cut / Abrasion'
  },
  {
    id: 'vocal_distress',
    patterns: [
      /\bwhimpering\b/i,
      /\bcrying\s+in\s+pain\b/i,
      /\byelping\b/i,
      /\bpain\b/i
    ],
    points: 5.0,
    label: 'Severe Pain Vocalization / Distress'
  }
];

const VULNERABILITY_RULES = [
  {
    id: 'puppy_infant',
    patterns: [
      /\bpupp(y|ies)\b/i,
      /\bkitten(s)?\b/i,
      /\binfant\b/i,
      /\bnewborn\b/i,
      /\bbaby\s+animal\b/i,
      /\borphan(ed)?\b/i
    ],
    points: 5.0,
    label: 'High Vulnerability: Infant / Puppy / Kitten'
  },
  {
    id: 'blind_pregnant_geriatric',
    patterns: [
      /\bblind\b/i,
      /\bpregnant\b/i,
      /\bgeriatric\b/i,
      /\bold\s+(dog|cat|animal)\b/i,
      /\bnursing\s+mother\b/i
    ],
    points: 5.0,
    label: 'High Vulnerability: Blind / Pregnant / Geriatric'
  }
];

const ENVIRONMENTAL_DANGER_RULES = [
  {
    id: 'traffic_railway',
    patterns: [
      /\bhighway\b/i,
      /\bexpressway\b/i,
      /\bbusy\s+road\b/i,
      /\btraffic\b/i,
      /\btrain\s+track\b/i,
      /\brailway\b/i,
      /\bmiddle\s+of\s+road\b/i
    ],
    points: 5.0,
    label: 'Active Highway / Railway / Traffic Hazard'
  },
  {
    id: 'drain_sewer_well',
    patterns: [
      /\bdrain\b/i,
      /\bgutter\b/i,
      /\bnallah\b/i,
      /\bsewer\b/i,
      /\bwell\b/i,
      /\bcanal\b/i,
      /\bdrowning\b/i,
      /\btrapped\s+in\b/i
    ],
    points: 5.0,
    label: 'Submerged / Trapped in Drain, Sewer or Well'
  },
  {
    id: 'weather_locked',
    patterns: [
      /\bextreme\s+heat\b/i,
      /\bflood(ing)?\b/i,
      /\bstorm\b/i,
      /\blocked\s+inside\b/i,
      /\btied\s+up\b/i
    ],
    points: 5.0,
    label: 'Harsh Weather / Locked Entrapment'
  }
];

function evaluateCategory(rules, text, activeSuppressions, symptomSet, categoryMax) {
  let score = 0;
  const matchedLabels = [];
  const negatedLabels = [];
  const newSuppressions = new Set();
  const awardedIds = new Set();

  for (const rule of rules) {
    if (activeSuppressions.has(rule.id)) continue;

    let ruleMatched = false;
    let isNegated = false;

    // Check symptom pills
    let tagMatch = false;
    if (rule.id === 'arterial_hemorrhage' && symptomSet.has('Arterial Bleeding')) tagMatch = true;
    else if (rule.id === 'vehicular_trauma' && symptomSet.has('Hit & Run')) tagMatch = true;
    else if (rule.id === 'major_bleeding' && symptomSet.has('Bleeding')) tagMatch = true;
    else if (rule.id === 'unable_to_walk' && symptomSet.has('Unable to Walk')) tagMatch = true;
    else if (rule.id === 'rabies_aggression' && (symptomSet.has('Aggressive / Rabies Risk') || symptomSet.has('Rabies'))) tagMatch = true;
    else if (rule.id === 'puppy_infant' && (symptomSet.has('Puppy / Infant') || symptomSet.has('Infant'))) tagMatch = true;

    // Regex scan
    for (const pat of rule.patterns) {
      const match = text.match(pat);
      if (match) {
        if (isPatternNegated(text, match.index)) {
          isNegated = true;
        } else {
          ruleMatched = true;
          break;
        }
      }
    }

    if (isNegated && !ruleMatched && !tagMatch) {
      negatedLabels.push(`${rule.label} (Negated)`);
      continue;
    }

    if ((ruleMatched || tagMatch) && !awardedIds.has(rule.id)) {
      awardedIds.add(rule.id);
      score += rule.points;
      matchedLabels.push(`${rule.label} (+${rule.points} pts)`);
      if (rule.suppresses) {
        for (const s of rule.suppresses) newSuppressions.add(s);
      }
    }
  }

  const finalScore = Math.min(categoryMax, Math.round(score * 10) / 10);
  return { finalScore, matchedLabels, negatedLabels, newSuppressions };
}

/**
 * Calculates client-side triage score adhering 100% to backend weights and safeguards.
 */
export function calculateClientPriority({
  detectionConfidence = 0.0,
  description = '',
  visualDistressScore = 0.0,
  detectedAnimalType = 'Dog',
  selectedSymptoms = [],
  isAnimalDetected = null
}) {
  const cleanDesc = (description || '').trim();
  const symptomSet = new Set(selectedSymptoms || []);
  const conf = Number(detectionConfidence) || 0.0;
  const animalStr = String(detectedAnimalType || 'Unknown').trim();

  const noAnimalTokens = new Set(['no animal detected', 'unknown', 'none', 'person', 'human']);
  const isSupported = (
    !noAnimalTokens.has(animalStr.toLowerCase()) &&
    (isAnimalDetected === true || (isAnimalDetected === null && conf > 0.0 && animalStr !== 'Unknown'))
  );

  if (!isSupported) {
    return {
      priority: 'ROUTINE',
      score: 0.0,
      categoryScores: {
        life_threatening: 0, major_injuries: 0, functional_impairment: 0,
        other_injuries: 0, vulnerability: 0, environmental_danger: 0
      },
      categoryMaxes: CATEGORY_MAXES,
      requiresHumanReview: false,
      urgentSafeguardTriggered: false,
      safeguardReasons: [],
      matchedFindings: [],
      negatedSymptomsExcluded: [],
      uncertainties: ['No supported animal detected in frame'],
      experimentalSignals: [],
      reasoning: 'Priority Score: 0/100 [ROUTINE]. NO ANIMAL DETECTED. Animal triage bypassed.'
    };
  }

  const allSuppressions = new Set();
  const categoryScores = {};
  const allMatched = [];
  const allNegated = [];

  // Cat 1: Life threatening
  const c1 = evaluateCategory(LIFE_THREATENING_RULES, cleanDesc, allSuppressions, symptomSet, CATEGORY_MAXES.life_threatening);
  categoryScores.life_threatening = c1.finalScore;
  allMatched.push(...c1.matchedLabels);
  allNegated.push(...c1.negatedLabels);
  c1.newSuppressions.forEach(s => allSuppressions.add(s));

  // Cat 2: Major injuries
  const c2 = evaluateCategory(MAJOR_INJURY_RULES, cleanDesc, allSuppressions, symptomSet, CATEGORY_MAXES.major_injuries);
  categoryScores.major_injuries = c2.finalScore;
  allMatched.push(...c2.matchedLabels);
  allNegated.push(...c2.negatedLabels);
  c2.newSuppressions.forEach(s => allSuppressions.add(s));

  // Cat 3: Functional impairment
  const c3 = evaluateCategory(FUNCTIONAL_IMPAIRMENT_RULES, cleanDesc, allSuppressions, symptomSet, CATEGORY_MAXES.functional_impairment);
  categoryScores.functional_impairment = c3.finalScore;
  allMatched.push(...c3.matchedLabels);
  allNegated.push(...c3.negatedLabels);
  c3.newSuppressions.forEach(s => allSuppressions.add(s));

  // Cat 4: Other injuries
  const c4 = evaluateCategory(OTHER_INJURY_RULES, cleanDesc, allSuppressions, symptomSet, CATEGORY_MAXES.other_injuries);
  let c4Score = c4.finalScore;
  const experimentalSignals = [];
  const vDistress = Number(visualDistressScore) || 0.0;
  if (vDistress > 0.35 && c1.finalScore === 0 && c2.finalScore === 0 && c4Score < 5.0) {
    const expPts = Math.min(3.0, Math.round(vDistress * 3.0 * 10) / 10);
    c4Score = Math.min(CATEGORY_MAXES.other_injuries, c4Score + expPts);
    experimentalSignals.push(`Experimental red-pixel signal (+${expPts} pts)`);
  }
  categoryScores.other_injuries = c4Score;
  allMatched.push(...c4.matchedLabels);
  allNegated.push(...c4.negatedLabels);
  c4.newSuppressions.forEach(s => allSuppressions.add(s));

  // Cat 5: Vulnerability
  const c5 = evaluateCategory(VULNERABILITY_RULES, cleanDesc, allSuppressions, symptomSet, CATEGORY_MAXES.vulnerability);
  categoryScores.vulnerability = c5.finalScore;
  allMatched.push(...c5.matchedLabels);
  allNegated.push(...c5.negatedLabels);

  // Cat 6: Environmental danger
  const c6 = evaluateCategory(ENVIRONMENTAL_DANGER_RULES, cleanDesc, allSuppressions, symptomSet, CATEGORY_MAXES.environmental_danger);
  categoryScores.environmental_danger = c6.finalScore;
  allMatched.push(...c6.matchedLabels);
  allNegated.push(...c6.negatedLabels);

  const rawTotal = Object.values(categoryScores).reduce((a, b) => a + b, 0);
  const totalScore = Math.min(100.0, Math.max(0.0, Math.round(rawTotal * 10) / 10));

  let urgentSafeguardTriggered = false;
  let requiresHumanReview = false;
  const safeguardReasons = [];
  const uncertainties = [];

  if (categoryScores.life_threatening > 0) {
    urgentSafeguardTriggered = true;
    requiresHumanReview = true;
    safeguardReasons.push('Credible life-threatening indicators trigger urgent review safeguard');
  }

  let finalPriority = 'ROUTINE';
  if (totalScore >= 70.0) {
    finalPriority = 'CRITICAL';
    requiresHumanReview = true;
  } else if (totalScore >= 40.0) {
    finalPriority = 'HIGH';
  } else {
    finalPriority = 'ROUTINE';
  }

  if (urgentSafeguardTriggered && finalPriority !== 'CRITICAL') {
    finalPriority = 'CRITICAL';
    safeguardReasons.push('Escalated to CRITICAL priority due to life-threatening indicators');
  }

  if (conf > 0.0 && conf < 0.40 && (totalScore >= 40.0 || urgentSafeguardTriggered)) {
    requiresHumanReview = true;
    uncertainties.push('Low visual detection confidence with high reported injury; requires operator review');
  } else if (conf === 0.0 && totalScore >= 40.0) {
    requiresHumanReview = true;
    uncertainties.push('Visual confirmation unavailable; triage score derived from reported citizen symptoms.');
  }

  const catSummary = `Life-Threatening=${categoryScores.life_threatening}/40, Major=${categoryScores.major_injuries}/25, Impairment=${categoryScores.functional_impairment}/15, Other=${categoryScores.other_injuries}/10, Vulnerability=${categoryScores.vulnerability}/5, Danger=${categoryScores.environmental_danger}/5`;
  const reasoning = `Priority Score: ${totalScore}/100 [${finalPriority}]. AI Detection: ${animalStr} (${Math.round(conf * 100)}% conf, +0 pts) | ${catSummary} | Findings: ${allMatched.length > 0 ? allMatched.join('; ') : 'None'}`;

  return {
    priority: finalPriority,
    score: totalScore,
    categoryScores,
    categoryMaxes: CATEGORY_MAXES,
    requiresHumanReview,
    urgentSafeguardTriggered,
    safeguardReasons,
    matchedFindings: allMatched,
    negatedSymptomsExcluded: allNegated,
    uncertainties,
    experimentalSignals,
    reasoning
  };
}

/**
 * Attempts to fetch live triage calculation from authoritative backend.
 * Falls back transparently to identical local calculation if backend is unavailable.
 */
export async function fetchLiveTriagePreview(params) {
  try {
    const res = await apiClient.getTriagePreview({
      detection_confidence: params.detectionConfidence || 0.0,
      description: params.description || '',
      visual_distress_score: params.visualDistressScore || 0.0,
      detected_animal_type: params.detectedAnimalType || 'Dog',
      selected_symptoms: params.selectedSymptoms || [],
      is_animal_detected: params.isAnimalDetected
    });
    if (res && typeof res.score === 'number') {
      return {
        priority: res.priority,
        score: res.score,
        categoryScores: res.category_scores || {},
        categoryMaxes: res.category_maxes || CATEGORY_MAXES,
        requiresHumanReview: Boolean(res.requires_human_review),
        urgentSafeguardTriggered: Boolean(res.urgent_safeguard_triggered),
        safeguardReasons: res.safeguard_reasons || [],
        matchedFindings: res.matched_findings || [],
        negatedSymptomsExcluded: res.negated_symptoms_excluded || [],
        uncertainties: res.uncertainties || [],
        experimentalSignals: res.experimental_signals || [],
        reasoning: res.reasoning || ''
      };
    }
  } catch (err) {
    console.warn('Backend triage preview unreachable, using client parity engine:', err.message);
  }
  return calculateClientPriority(params);
}

/**
 * Shared styling and badge metadata helper for UI consistency.
 */
export function getPriorityBadgeProps(priority) {
  const p = (priority || 'ROUTINE').toUpperCase();
  switch (p) {
    case 'CRITICAL':
    case 'EMERGENCY':
      return {
        label: 'CRITICAL',
        badgeClass: 'bg-red-500/20 text-red-400 border-red-500/40 shadow-sm shadow-red-500/20',
        textClass: 'text-red-500 font-extrabold',
        borderClass: 'border-red-500',
        dotColor: 'bg-red-500'
      };
    case 'HIGH':
      return {
        label: 'HIGH',
        badgeClass: 'bg-orange-500/20 text-amber-300 border-orange-500/40 shadow-sm shadow-orange-500/20',
        textClass: 'text-orange-500 font-bold',
        borderClass: 'border-orange-500',
        dotColor: 'bg-orange-500'
      };
    case 'ROUTINE':
    case 'NORMAL':
    default:
      return {
        label: 'ROUTINE',
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        textClass: 'text-emerald-500 font-medium',
        borderClass: 'border-emerald-500',
        dotColor: 'bg-emerald-500'
      };
  }
}
