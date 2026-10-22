import assert from 'node:assert';
import { calculateClientPriority, CATEGORY_MAXES } from '../services/priorityCalculator.js';

console.log('--- RUNNING FRONTEND PRIORITY CALCULATOR TESTS ---');

// Test 1: Healthy animal high confidence -> 0 severity points
{
  const res = calculateClientPriority({
    detectionConfidence: 0.98,
    description: 'A healthy brown dog playing happily in the park',
    detectedAnimalType: 'Dog',
    isAnimalDetected: true
  });
  assert.strictEqual(res.score, 0.0, 'Healthy animal should score 0.0');
  assert.strictEqual(res.priority, 'ROUTINE');
  assert.strictEqual(res.requiresHumanReview, false);
  assert.strictEqual(res.urgentSafeguardTriggered, false);
  console.log('✓ Scenario 1: Healthy animal detected with high confidence -> 0 pts');
}

// Test 2: Severe injury with low confidence
{
  const res = calculateClientPriority({
    detectionConfidence: 0.22,
    description: 'Dog was hit by vehicle and has a broken leg, cannot walk',
    detectedAnimalType: 'Dog',
    isAnimalDetected: true
  });
  assert.strictEqual(res.score, 40.0, 'Major trauma (25) + unable to walk (15) = 40.0');
  assert.strictEqual(res.priority, 'HIGH');
  assert.strictEqual(res.requiresHumanReview, true);
  console.log('✓ Scenario 2: Severe reported injury -> high triage & operator review');
}

// Test 3: 'Not bleeding' negation
{
  const res = calculateClientPriority({
    detectionConfidence: 0.85,
    description: 'Animal has a minor cut on ear, but is not bleeding and not dying',
    detectedAnimalType: 'Dog',
    isAnimalDetected: true
  });
  assert.strictEqual(res.categoryScores.life_threatening, 0.0);
  assert.strictEqual(res.categoryScores.major_injuries, 0.0);
  assert.strictEqual(res.score, 5.0, 'Only minor cut should score (+5.0)');
  assert.strictEqual(res.priority, 'ROUTINE');
  assert.ok(res.negatedSymptomsExcluded.length >= 1, 'Negated symptom must be excluded');
  console.log('✓ Scenario 3: Negation "not bleeding" -> 0 bleeding pts');
}

// Test 4: Duplicate injury keywords capped
{
  const res = calculateClientPriority({
    detectionConfidence: 0.90,
    description: 'Dog is bleeding, bleeding heavily from wound, lots of blood and bloody leg',
    detectedAnimalType: 'Dog',
    isAnimalDetected: true
  });
  assert.strictEqual(res.categoryScores.major_injuries, 18.0, 'Must not duplicate bleeding points');
  assert.strictEqual(res.score, 18.0);
  console.log('✓ Scenario 4: Duplicate injury keywords -> no duplicate points');
}

// Test 5: Human-only frame
{
  const res = calculateClientPriority({
    detectionConfidence: 0.0,
    description: 'Person walking down street',
    detectedAnimalType: 'NO ANIMAL DETECTED',
    isAnimalDetected: false
  });
  assert.strictEqual(res.score, 0.0);
  assert.strictEqual(res.priority, 'ROUTINE');
  assert.ok(res.reasoning.includes('NO ANIMAL DETECTED'));
  console.log('✓ Scenario 5: Human-only frame -> NO ANIMAL DETECTED, 0 triage score');
}

// Test 6: Missing visual inference
{
  const res = calculateClientPriority({
    detectionConfidence: 0.0,
    description: 'Cat hit by car, unable to move',
    detectedAnimalType: 'Cat',
    isAnimalDetected: true
  });
  assert.strictEqual(res.score, 40.0);
  assert.strictEqual(res.priority, 'HIGH');
  assert.strictEqual(res.requiresHumanReview, true);
  console.log('✓ Scenario 6: Missing visual inference -> non-fabricated score & operator review');
}

// Test 7: Overlapping symptoms no double counting
{
  const res = calculateClientPriority({
    detectionConfidence: 0.90,
    description: 'Profuse arterial bleeding, open wound bleeding. Animal is unable to walk and cannot stand.',
    detectedAnimalType: 'Dog',
    isAnimalDetected: true
  });
  assert.strictEqual(res.categoryScores.life_threatening, 35.0);
  assert.strictEqual(res.categoryScores.major_injuries, 0.0, 'Arterial bleeding suppresses duplicate major bleeding');
  assert.strictEqual(res.categoryScores.functional_impairment, 15.0, 'Impairment capped at 15.0');
  assert.strictEqual(res.score, 50.0);
  assert.strictEqual(res.urgentSafeguardTriggered, true);
  assert.strictEqual(res.priority, 'CRITICAL');
  console.log('✓ Scenario 7: Overlapping symptoms -> no unjustified double-counting');
}

// Test 8: Critical warning signs safeguard
{
  const res = calculateClientPriority({
    detectionConfidence: 0.80,
    description: 'Puppy is unconscious on sidewalk',
    detectedAnimalType: 'Dog',
    isAnimalDetected: true
  });
  assert.strictEqual(res.score, 45.0);
  assert.strictEqual(res.urgentSafeguardTriggered, true);
  assert.strictEqual(res.priority, 'CRITICAL', 'Safeguard must escalate to CRITICAL even if numerical score < 70');
  assert.strictEqual(res.requiresHumanReview, true);
  console.log('✓ Scenario 8: Critical warning signs -> urgent-review safeguard elevated to CRITICAL');
}

// Test 9: Experimental red pixel cue
{
  const res = calculateClientPriority({
    detectionConfidence: 0.92,
    description: 'Healthy stray dog resting in yard',
    visualDistressScore: 0.95,
    detectedAnimalType: 'Dog',
    isAnimalDetected: true
  });
  assert.ok(res.score <= 3.0, 'Experimental cue must not exceed 3.0 non-decisive pts');
  assert.strictEqual(res.priority, 'ROUTINE');
  console.log('✓ Scenario 9: Experimental red pixel cue -> non-decisive advisory');
}

console.log('ALL FRONTEND PARITY TESTS PASSED SUCCESSFULLY! 🚀');
