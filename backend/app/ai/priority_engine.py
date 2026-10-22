import re
import json
from typing import Tuple, Dict, Any, List, Optional, Set

# ============================================================================
# CATEGORY DEFINITIONS & PROVISIONAL ENGINEERING WEIGHTS (TOTAL MAX = 100)
# ============================================================================
# 1. Life-threatening signs: maximum 40 points (Urgent-review safeguard)
# 2. Major injuries: maximum 25 points
# 3. Functional impairment (unable to stand/walk): maximum 15 points
# 4. Other observed injury/distress: maximum 10 points
# 5. Vulnerability (puppy/infant): maximum 5 points
# 6. Immediate environmental danger: maximum 5 points

CATEGORY_MAXES = {
    "life_threatening": 40.0,
    "major_injuries": 25.0,
    "functional_impairment": 15.0,
    "other_injuries": 10.0,
    "vulnerability": 5.0,
    "environmental_danger": 5.0
}

# Negation terms that invert symptom presence within preceding token window
NEGATION_TOKENS = {
    "not", "no", "never", "without", "isnt", "isn't", "aren't", "arent",
    "wasnt", "wasn't", "neither", "nor", "none", "zero", "uninjured",
    "hardly", "barely", "denies", "negative", "false"
}

# Clause boundary punctuation separating negation scope
CLAUSE_BOUNDARIES = {".", ",", ";", "!", "?", "\n", "but", "however", "although"}

# --- CATEGORY 1: Life-Threatening Signs (Max 40 pts) ---
# Any match triggers the Urgent Review Safeguard (elevates to CRITICAL).
LIFE_THREATENING_RULES = [
    {
        "id": "arterial_hemorrhage",
        "patterns": [
            r"\b(profuse|arterial|severe|heavy|massive|uncontrolled)\s+(bleeding|hemorrhage|blood loss)\b",
            r"\bbleeding\s+profusely\b",
            r"\bhemorrhag(e|ing)\b",
            r"\bgushing\s+blood\b"
        ],
        "points": 35.0,
        "label": "Profuse / Arterial Bleeding",
        "suppresses": ["major_bleeding", "minor_wound"]
    },
    {
        "id": "unconscious_collapsed",
        "patterns": [
            r"\bunconscious\b",
            r"\bunresponsive\b",
            r"\bcomatose\b",
            r"\bdying\b",
            r"\bcollapsed\b",
            r"\bfainted\b",
            r"\bnot\s+moving\s+at\s+all\b"
        ],
        "points": 40.0,
        "label": "Unconscious / Unresponsive / Collapsed"
    },
    {
        "id": "respiratory_arrest",
        "patterns": [
            r"\bnot\s+breathing\b",
            r"\bchoking\b",
            r"\bsuffocat(ing|ed)\b",
            r"\bgasping\s+for\s+(air|breath)\b",
            r"\bsevere\s+respiratory\s+distress\b"
        ],
        "points": 40.0,
        "label": "Severe Respiratory Distress / Choking"
    },
    {
        "id": "convulsions_poisoning",
        "patterns": [
            r"\bseizur(e|es|ing)\b",
            r"\bconvuls(ion|ions|ing)\b",
            r"\bfoam(ing)?\s+at\s+(the\s+)?mouth\b",
            r"\bpoison(ed|ing)?\b",
            r"\btoxic\s+ingestion\b"
        ],
        "points": 35.0,
        "label": "Convulsions / Suspected Poisoning"
    },
    {
        "id": "rabies_aggression",
        "patterns": [
            r"\brabid\b",
            r"\bsuspected\s+rabies\b",
            r"\brabies\s+risk\b",
            r"\bviolently\s+aggressive\b"
        ],
        "points": 35.0,
        "label": "Suspected Rabies / Extreme Neurological Risk"
    }
]

# --- CATEGORY 2: Major Injuries (Max 25 pts) ---
MAJOR_INJURY_RULES = [
    {
        "id": "vehicular_trauma",
        "patterns": [
            r"\bhit\s+and\s+run\b",
            r"\bhit\s+by\s+(car|vehicle|truck|bike|bus|auto|tempo)\b",
            r"\brun\s+over\b",
            r"\bcar\s+accident\b",
            r"\bvehicular\s+accident\b",
            r"\broad\s+accident\b"
        ],
        "points": 25.0,
        "label": "Vehicular Impact Trauma (Hit & Run)"
    },
    {
        "id": "fracture_bone",
        "patterns": [
            r"\bcompound\s+fracture\b",
            r"\bopen\s+fracture\b",
            r"\bbroken\s+(bone|leg|limb|hip|pelvis|jaw|spine)\b",
            r"\bfractur(e|ed)\b",
            r"\bbone\s+sticking\s+out\b"
        ],
        "points": 25.0,
        "label": "Severe Fracture / Broken Bone"
    },
    {
        "id": "deep_trauma_attack",
        "patterns": [
            r"\bdeep\s+(wound|laceration|cut)\b",
            r"\bsevered\b",
            r"\bmutilat(ed|ion)\b",
            r"\b(dog|animal)\s+attack\b",
            r"\bmauled\b",
            r"\bgored\b"
        ],
        "points": 20.0,
        "label": "Deep Laceration / Animal Mauling"
    },
    {
        "id": "major_bleeding",
        "patterns": [
            r"\bbleeding\b",
            r"\bblood\b",
            r"\bbloody\b",
            r"\bopen\s+wound\b"
        ],
        "points": 18.0,
        "label": "Observed Active Bleeding / Open Wound",
        "suppresses": ["minor_wound"]
    },
    {
        "id": "severe_burn_ocular",
        "patterns": [
            r"\bsevere\s+burn\b",
            r"\bacid\s+attack\b",
            r"\beye\s+(popped|prolapse|protruding|lost)\b"
        ],
        "points": 20.0,
        "label": "Severe Burn / Ocular Trauma"
    }
]

# --- CATEGORY 3: Functional Impairment (Max 15 pts) ---
FUNCTIONAL_IMPAIRMENT_RULES = [
    {
        "id": "unable_to_walk",
        "patterns": [
            r"\bunable\s+to\s+(walk|stand|move|rise)\b",
            r"\bcannot\s+(walk|stand|move|rise)\b",
            r"\bcan't\s+(walk|stand|move|rise)\b",
            r"\bimmobile\b",
            r"\bparaly(zed|sis)\b",
            r"\bhind\s+leg\s+paralysis\b",
            r"\bdragging\s+(its\s+)?(legs|hind legs|body)\b",
            r"\bseverely\s+limping\b",
            r"\bcrippled\b"
        ],
        "points": 15.0,
        "label": "Severe Functional Impairment (Unable to Stand/Walk)"
    },
    {
        "id": "limping_mild",
        "patterns": [
            r"\blimping\b",
            r"\blimp\b",
            r"\bstruggling\s+to\s+walk\b"
        ],
        "points": 10.0,
        "label": "Moderate Locomotion Difficulty"
    }
]

# --- CATEGORY 4: Other Observed Injury / Distress (Max 10 pts) ---
OTHER_INJURY_RULES = [
    {
        "id": "maggot_infection",
        "patterns": [
            r"\bmaggot(s)?\b",
            r"\bmaggot\s+wound\b",
            r"\bsevere\s+mange\b",
            r"\bmange\b",
            r"\bopen\s+sores\b",
            r"\brot(ting)?\s+flesh\b",
            r"\binfestation\b"
        ],
        "points": 10.0,
        "label": "Maggot Wound / Severe Mange Infestation"
    },
    {
        "id": "malnutrition_dehydration",
        "patterns": [
            r"\bstarv(ing|ed)\b",
            r"\bmalnourish(ed)?\b",
            r"\bemaciat(ed)?\b",
            r"\bribs\s+visible\b",
            r"\bdehydrat(ed)?\b",
            r"\bshivering\b"
        ],
        "points": 6.0,
        "label": "Severe Malnutrition / Dehydration / Shivering"
    },
    {
        "id": "swelling_abscess",
        "patterns": [
            r"\bswelling\b",
            r"\bswollen\b",
            r"\babscess\b",
            r"\btumor\b",
            r"\blump\b",
            r"\bpus\b"
        ],
        "points": 6.0,
        "label": "Abscess / Significant Swelling"
    },
    {
        "id": "minor_wound",
        "patterns": [
            r"\bminor\s+(cut|wound|scratch)\b",
            r"\bscratch(es)?\b",
            r"\babrasion(s)?\b",
            r"\bcut\b",
            r"\bwound\b",
            r"\binjur(y|ed)\b"
        ],
        "points": 5.0,
        "label": "Minor Observed Cut / Abrasion"
    },
    {
        "id": "vocal_distress",
        "patterns": [
            r"\bwhimpering\b",
            r"\bcrying\s+in\s+pain\b",
            r"\byelping\b",
            r"\bpain\b"
        ],
        "points": 5.0,
        "label": "Severe Pain Vocalization / Distress"
    }
]

# --- CATEGORY 5: Vulnerability (Max 5 pts) ---
VULNERABILITY_RULES = [
    {
        "id": "puppy_infant",
        "patterns": [
            r"\bpupp(y|ies)\b",
            r"\bkitten(s)?\b",
            r"\binfant\b",
            r"\bnewborn\b",
            r"\bbaby\s+animal\b",
            r"\borphan(ed)?\b"
        ],
        "points": 5.0,
        "label": "High Vulnerability: Infant / Puppy / Kitten"
    },
    {
        "id": "blind_pregnant_geriatric",
        "patterns": [
            r"\bblind\b",
            r"\bpregnant\b",
            r"\bgeriatric\b",
            r"\bold\s+(dog|cat|animal)\b",
            r"\bnursing\s+mother\b"
        ],
        "points": 5.0,
        "label": "High Vulnerability: Blind / Pregnant / Geriatric"
    }
]

# --- CATEGORY 6: Immediate Environmental Danger (Max 5 pts) ---
ENVIRONMENTAL_DANGER_RULES = [
    {
        "id": "traffic_railway",
        "patterns": [
            r"\bhighway\b",
            r"\bexpressway\b",
            r"\bbusy\s+road\b",
            r"\btraffic\b",
            r"\btrain\s+track\b",
            r"\brailway\b",
            r"\bmiddle\s+of\s+road\b"
        ],
        "points": 5.0,
        "label": "Active Highway / Railway / Traffic Hazard"
    },
    {
        "id": "drain_sewer_well",
        "patterns": [
            r"\bdrain\b",
            r"\bgutter\b",
            r"\bnallah\b",
            r"\bsewer\b",
            r"\bwell\b",
            r"\bcanal\b",
            r"\bdrowning\b",
            r"\btrapped\s+in\b"
        ],
        "points": 5.0,
        "label": "Submerged / Trapped in Drain, Sewer or Well"
    },
    {
        "id": "weather_locked",
        "patterns": [
            r"\bextreme\s+heat\b",
            r"\bflood(ing)?\b",
            r"\bstorm\b",
            r"\blocked\s+inside\b",
            r"\btied\s+up\b"
        ],
        "points": 5.0,
        "label": "Harsh Weather / Locked Entrapment"
    }
]


# ============================================================================
# NEGATION DETECTION HELPER
# ============================================================================
def is_pattern_negated(text: str, start_char: int) -> Tuple[bool, str]:
    """
    Checks if a matched pattern is preceded by a negation word within a 3-token
    window in the same clause or sentence.
    Returns (is_negated, matched_negation_token).
    """
    preceding_text = text[:start_char].strip()
    if not preceding_text:
        return False, ""

    # Split into words from right to left
    # Stop at clause boundary characters
    tokens: List[str] = []
    current_token: List[str] = []
    
    for ch in reversed(preceding_text):
        if ch in CLAUSE_BOUNDARIES:
            break
        if ch.isspace():
            if current_token:
                tokens.append("".join(reversed(current_token)).lower())
                current_token = []
                if len(tokens) >= 4:
                    break
        else:
            current_token.append(ch)
            
    if current_token and len(tokens) < 4:
        tokens.append("".join(reversed(current_token)).lower())

    # Check the closest tokens for negation
    for t in tokens:
        clean_token = re.sub(r"[^\w']", "", t)
        if clean_token in NEGATION_TOKENS:
            return True, clean_token

    return False, ""


# ============================================================================
# CATEGORY SCORING ENGINE
# ============================================================================
def evaluate_category(
    rules: List[Dict[str, Any]],
    text: str,
    active_suppressions: Set[str],
    symptom_tags: Set[str],
    category_max: float
) -> Tuple[float, List[str], List[str], Set[str]]:
    """
    Evaluates rules for a specific severity category.
    Handles negation, non-overlapping suppression, and category ceiling.
    Returns:
    - category_score (float, capped at category_max)
    - matched_labels (list of explainable findings)
    - negated_labels (list of excluded negated findings)
    - new_suppressions (set of rule IDs to suppress in lower categories)
    """
    score = 0.0
    matched_labels: List[str] = []
    negated_labels: List[str] = []
    new_suppressions: Set[str] = set()
    awarded_rule_ids: Set[str] = set()

    for rule in rules:
        rule_id = rule["id"]
        if rule_id in active_suppressions:
            continue

        rule_matched = False
        is_negated = False
        neg_word = ""

        # 1. Check explicit UI symptom tags if relevant
        # (e.g. "Bleeding", "Hit & Run", "Unable to Walk", "Puppy / Infant", "Aggressive / Rabies Risk")
        tag_match = False
        if rule_id == "arterial_hemorrhage" and "Arterial Bleeding" in symptom_tags:
            tag_match = True
        elif rule_id == "vehicular_trauma" and "Hit & Run" in symptom_tags:
            tag_match = True
        elif rule_id == "major_bleeding" and "Bleeding" in symptom_tags:
            tag_match = True
        elif rule_id == "unable_to_walk" and "Unable to Walk" in symptom_tags:
            tag_match = True
        elif rule_id == "rabies_aggression" and ("Aggressive / Rabies Risk" in symptom_tags or "Rabies" in symptom_tags):
            tag_match = True
        elif rule_id == "puppy_infant" and ("Puppy / Infant" in symptom_tags or "Infant" in symptom_tags):
            tag_match = True

        # 2. Check regex patterns in text description
        for pat in rule["patterns"]:
            for match in re.finditer(pat, text, re.IGNORECASE):
                neg_flag, n_word = is_pattern_negated(text, match.start())
                if neg_flag:
                    is_negated = True
                    neg_word = n_word
                else:
                    rule_matched = True
                    break
            if rule_matched:
                break

        if is_negated and not rule_matched and not tag_match:
            negated_labels.append(f"{rule['label']} (Negated by '{neg_word}')")
            continue

        if (rule_matched or tag_match) and rule_id not in awarded_rule_ids:
            awarded_rule_ids.add(rule_id)
            pts = rule["points"]
            score += pts
            matched_labels.append(f"{rule['label']} (+{pts} pts)")
            
            # Register suppressed child rules (e.g. arterial bleeding suppresses moderate bleeding)
            for s in rule.get("suppresses", []):
                new_suppressions.add(s)

    final_category_score = min(category_max, round(score, 1))
    return final_category_score, matched_labels, negated_labels, new_suppressions


# ============================================================================
# CORE AI PRIORITY SCORING ENGINE
# ============================================================================
def calculate_priority_score(
    detection_confidence: float = 0.0,
    description: str = "",
    visual_distress_score: float = 0.0,
    detected_animal_type: str = "Dog",
    selected_symptoms: Optional[List[str]] = None,
    is_animal_detected: Optional[bool] = None
) -> Dict[str, Any]:
    """
    RescueNet Production AI Priority Scoring Engine (0–100 Explainable Severity).
    
    Weight Distribution:
    1. Life-threatening signs: max 40 points
    2. Major injuries: max 25 points
    3. Functional impairment (unable to stand/walk): max 15 points
    4. Other observed injury/distress: max 10 points
    5. Vulnerability (puppy/infant): max 5 points
    6. Immediate environmental danger: max 5 points

    Authoritative Priority Levels:
    - 70–100: CRITICAL (urgent emergency response)
    - 40–69: HIGH (prompt rescue review)
    - 0–39: ROUTINE (standard queue)

    Safeguards:
    - Credible life-threatening indicators trigger urgent review and CRITICAL priority
      regardless of numerical score.
    - Detection confidence contributes 0 severity points (kept as separate evidence).
    - Human-only or non-animal frames return 0 score and "NO ANIMAL DETECTED".
    - Negations ('not bleeding') receive 0 points.
    - Red-pixel distress cues are non-decisive experimental signals only.
    """
    clean_desc = (description or "").strip()
    symptom_set: Set[str] = set(selected_symptoms or [])
    
    # ------------------------------------------------------------------------
    # STEP 1: Separate Animal Detection Check from Severity
    # ------------------------------------------------------------------------
    conf = float(detection_confidence or 0.0)
    animal_str = str(detected_animal_type or "Unknown").strip()
    
    # Check if a supported animal was detected
    no_animal_tokens = {"no animal detected", "unknown", "none", "person", "human"}
    is_supported_animal = (
        animal_str.lower() not in no_animal_tokens 
        and (is_animal_detected is True or (is_animal_detected is None and conf > 0.0 and animal_str != "Unknown"))
    )

    if not is_supported_animal:
        # Human-only or failed animal detection frame
        status_label = "NO ANIMAL DETECTED"
        reason = "NO ANIMAL DETECTED (Human or non-animal frame). Animal triage bypassed."
        return {
            "priority": "ROUTINE",
            "score": 0.0,
            "category_scores": {k: 0.0 for k in CATEGORY_MAXES},
            "category_maxes": CATEGORY_MAXES,
            "requires_human_review": False,
            "urgent_safeguard_triggered": False,
            "safeguard_reasons": [],
            "matched_findings": [],
            "negated_symptoms_excluded": [],
            "uncertainties": ["No supported animal detected in frame"],
            "experimental_signals": [],
            "evidence": {
                "detected_species": status_label,
                "detection_confidence": 0.0,
                "is_animal_detected": False,
                "symptoms_reported": list(symptom_set),
                "user_description": clean_desc
            },
            "reasoning": f"Priority Score: 0/100 [ROUTINE]. {reason}",
            "disclaimer": "AI triage score is a provisional engineering prioritization metric and does not constitute a clinical veterinary diagnosis."
        }

    # ------------------------------------------------------------------------
    # STEP 2: Evaluate Symptoms & Categories with Deduplication & Negation
    # ------------------------------------------------------------------------
    all_suppressions: Set[str] = set()
    category_scores: Dict[str, float] = {}
    all_matched_findings: List[str] = []
    all_negated_findings: List[str] = []

    # Category 1: Life-threatening signs (max 40)
    c1_score, c1_m, c1_n, s1 = evaluate_category(
        LIFE_THREATENING_RULES, clean_desc, all_suppressions, symptom_set, CATEGORY_MAXES["life_threatening"]
    )
    category_scores["life_threatening"] = c1_score
    all_matched_findings.extend(c1_m)
    all_negated_findings.extend(c1_n)
    all_suppressions.update(s1)

    # Category 2: Major injuries (max 25)
    c2_score, c2_m, c2_n, s2 = evaluate_category(
        MAJOR_INJURY_RULES, clean_desc, all_suppressions, symptom_set, CATEGORY_MAXES["major_injuries"]
    )
    category_scores["major_injuries"] = c2_score
    all_matched_findings.extend(c2_m)
    all_negated_findings.extend(c2_n)
    all_suppressions.update(s2)

    # Category 3: Functional impairment (max 15)
    c3_score, c3_m, c3_n, s3 = evaluate_category(
        FUNCTIONAL_IMPAIRMENT_RULES, clean_desc, all_suppressions, symptom_set, CATEGORY_MAXES["functional_impairment"]
    )
    category_scores["functional_impairment"] = c3_score
    all_matched_findings.extend(c3_m)
    all_negated_findings.extend(c3_n)
    all_suppressions.update(s3)

    # Category 4: Other observed injury / distress (max 10)
    c4_score, c4_m, c4_n, s4 = evaluate_category(
        OTHER_INJURY_RULES, clean_desc, all_suppressions, symptom_set, CATEGORY_MAXES["other_injuries"]
    )
    
    # Process experimental visual distress cue (non-decisive, capped at 3 pts only if no explicit wounds)
    experimental_signals: List[str] = []
    v_distress = float(visual_distress_score or 0.0)
    if v_distress > 0.35 and c1_score == 0 and c2_score == 0 and c4_score < 5.0:
        exp_pts = min(3.0, round(v_distress * 3.0, 1))
        c4_score = min(CATEGORY_MAXES["other_injuries"], c4_score + exp_pts)
        experimental_signals.append(
            f"Experimental chromatic red-pixel cue ({int(v_distress * 100)}%): +{exp_pts} pts (Non-decisive advisory)"
        )
    elif v_distress > 0.0:
        experimental_signals.append(
            f"Experimental chromatic red-pixel cue ({int(v_distress * 100)}%): 0 pts (Decisive triage prioritized reported clinical indicators)"
        )

    category_scores["other_injuries"] = c4_score
    all_matched_findings.extend(c4_m)
    all_negated_findings.extend(c4_n)
    all_suppressions.update(s4)

    # Category 5: Vulnerability (max 5)
    c5_score, c5_m, c5_n, s5 = evaluate_category(
        VULNERABILITY_RULES, clean_desc, all_suppressions, symptom_set, CATEGORY_MAXES["vulnerability"]
    )
    category_scores["vulnerability"] = c5_score
    all_matched_findings.extend(c5_m)
    all_negated_findings.extend(c5_n)

    # Category 6: Immediate environmental danger (max 5)
    c6_score, c6_m, c6_n, s6 = evaluate_category(
        ENVIRONMENTAL_DANGER_RULES, clean_desc, all_suppressions, symptom_set, CATEGORY_MAXES["environmental_danger"]
    )
    category_scores["environmental_danger"] = c6_score
    all_matched_findings.extend(c6_m)
    all_negated_findings.extend(c6_n)

    # ------------------------------------------------------------------------
    # STEP 3: Compute Total Score (0–100)
    # ------------------------------------------------------------------------
    raw_total = sum(category_scores.values())
    total_score = min(100.0, max(0.0, round(raw_total, 1)))

    # ------------------------------------------------------------------------
    # STEP 4: Unified Priority Tiers & Urgent Review Safeguard
    # ------------------------------------------------------------------------
    safeguard_reasons: List[str] = []
    urgent_safeguard_triggered = False
    requires_human_review = False
    uncertainties: List[str] = []

    # Life-threatening signs trigger urgent-review safeguard
    if c1_score > 0.0:
        urgent_safeguard_triggered = True
        requires_human_review = True
        safeguard_reasons.append(
            f"Credible life-threatening signs identified ({', '.join(c1_m)}). Urgent human review and veterinary triage required."
        )

    # Base Priority Assignment
    if total_score >= 70.0:
        base_priority = "CRITICAL"
        requires_human_review = True
    elif total_score >= 40.0:
        base_priority = "HIGH"
    else:
        base_priority = "ROUTINE"

    # Apply Safeguard: Elevate to CRITICAL if life-threatening signs present
    if urgent_safeguard_triggered and base_priority != "CRITICAL":
        final_priority = "CRITICAL"
        safeguard_reasons.append(
            f"Priority escalated from {base_priority} to CRITICAL via urgent-review safeguard."
        )
    else:
        final_priority = base_priority

    # Flag uncertainties (e.g. low visual confidence with severe reported injury)
    if conf > 0.0 and conf < 0.40 and (total_score >= 40.0 or urgent_safeguard_triggered):
        requires_human_review = True
        uncertainties.append(
            f"Low visual detection confidence ({int(conf * 100)}%) with high reported injury; requires operator verification."
        )
    elif conf == 0.0 and total_score >= 40.0:
        requires_human_review = True
        uncertainties.append("Visual confirmation unavailable; triage score derived from reported citizen symptoms.")

    # ------------------------------------------------------------------------
    # STEP 5: Construct Explainability Audit & Human-Readable Reasoning
    # ------------------------------------------------------------------------
    reasoning_parts: List[str] = []
    
    # 1. Detection Evidence (0 severity points)
    reasoning_parts.append(f"AI Detection: {animal_str} ({int(conf * 100)}% conf) [Evidence only, +0 severity pts]")
    
    # 2. Category Breakdown
    cat_summary = (
        f"Categories: Life-Threatening={c1_score}/40, Major Injury={c2_score}/25, "
        f"Impairment={c3_score}/15, Other={c4_score}/10, Vulnerability={c5_score}/5, "
        f"Danger={c6_score}/5"
    )
    reasoning_parts.append(cat_summary)

    if all_matched_findings:
        reasoning_parts.append(f"Findings: {'; '.join(all_matched_findings)}")
    else:
        reasoning_parts.append("Findings: No active injury or distress symptoms identified")

    if all_negated_findings:
        reasoning_parts.append(f"Excluded Negations: {'; '.join(all_negated_findings)}")

    if urgent_safeguard_triggered:
        reasoning_parts.append("SAFEGUARD ACTIVE: Escalated for immediate emergency review")

    reasoning_text = f"Priority Score: {total_score}/100 [{final_priority}]. " + " | ".join(reasoning_parts)

    return {
        "priority": final_priority,
        "score": float(total_score),
        "category_scores": category_scores,
        "category_maxes": CATEGORY_MAXES,
        "requires_human_review": requires_human_review,
        "urgent_safeguard_triggered": urgent_safeguard_triggered,
        "safeguard_reasons": safeguard_reasons,
        "matched_findings": all_matched_findings,
        "negated_symptoms_excluded": all_negated_findings,
        "uncertainties": uncertainties,
        "experimental_signals": experimental_signals,
        "evidence": {
            "detected_species": animal_str,
            "detection_confidence": round(conf, 2),
            "is_animal_detected": is_supported_animal,
            "symptoms_reported": list(symptom_set),
            "user_description": clean_desc
        },
        "reasoning": reasoning_text,
        "disclaimer": "AI triage score is a provisional engineering prioritization metric and does not constitute a clinical veterinary diagnosis. Emergency dispatch requires human verification."
    }
