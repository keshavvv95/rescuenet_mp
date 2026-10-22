import unittest
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.ai.priority_engine import calculate_priority_score, CATEGORY_MAXES

class TestPriorityEngine(unittest.TestCase):
    def test_healthy_animal_high_confidence(self):
        """
        Scenario 1: Healthy animal detected with high confidence
        Must receive 0 severity points for species detection alone.
        """
        res = calculate_priority_score(
            detection_confidence=0.98,
            description="A healthy brown dog playing happily in the park",
            detected_animal_type="Dog",
            is_animal_detected=True
        )
        self.assertEqual(res["score"], 0.0, f"Expected 0.0 severity score, got {res['score']}")
        self.assertEqual(res["priority"], "ROUTINE", f"Expected ROUTINE, got {res['priority']}")
        self.assertFalse(res["requires_human_review"])
        self.assertFalse(res["urgent_safeguard_triggered"])
        self.assertEqual(res["evidence"]["detection_confidence"], 0.98)
        self.assertEqual(res["category_scores"]["life_threatening"], 0.0)
        self.assertEqual(res["category_scores"]["major_injuries"], 0.0)

    def test_severe_injury_low_confidence(self):
        """
        Scenario 2: Severe reported injury with low detection confidence
        Triage score must reflect reported injury and flag for operator review.
        """
        res = calculate_priority_score(
            detection_confidence=0.22,
            description="Dog was hit by vehicle and has a broken leg, cannot walk",
            detected_animal_type="Dog",
            is_animal_detected=True
        )
        # Major injury (vehicular trauma + fracture: capped at 25)
        # Functional impairment (cannot walk: 15)
        # Total = 40.0
        self.assertEqual(res["score"], 40.0, f"Expected 40.0, got {res['score']}")
        self.assertEqual(res["priority"], "HIGH", f"Expected HIGH, got {res['priority']}")
        self.assertTrue(res["requires_human_review"], "Low confidence with high injury must flag for review")
        self.assertTrue(any("Low visual detection confidence" in u for u in res["uncertainties"]))

    def test_not_bleeding_negation(self):
        """
        Scenario 3: 'Not bleeding' negation handling
        Must award 0 points for negated bleeding symptom and log exclusion.
        """
        res = calculate_priority_score(
            detection_confidence=0.85,
            description="Animal has a minor cut on ear, but is not bleeding and not dying",
            detected_animal_type="Dog",
            is_animal_detected=True
        )
        # Minor cut: 5.0 pts (Category 4)
        # 'not bleeding' -> 0 pts
        # 'not dying' -> 0 pts
        self.assertEqual(res["category_scores"]["life_threatening"], 0.0)
        self.assertEqual(res["category_scores"]["major_injuries"], 0.0)
        self.assertEqual(res["score"], 5.0, f"Expected 5.0 from minor cut only, got {res['score']}")
        self.assertEqual(res["priority"], "ROUTINE")
        self.assertGreaterEqual(len(res["negated_symptoms_excluded"]), 1)
        self.assertTrue(any("not" in n.lower() for n in res["negated_symptoms_excluded"]))

    def test_duplicate_injury_keywords_capped(self):
        """
        Scenario 4: Duplicate injury keywords
        Must not double-count repeated mentions of the same symptom.
        """
        res = calculate_priority_score(
            detection_confidence=0.90,
            description="Dog is bleeding, bleeding heavily from wound, lots of blood and bloody leg",
            detected_animal_type="Dog",
            is_animal_detected=True
        )
        # Major bleeding rule matched once -> 18.0 pts
        # Category 2 cap is 25.0 pts. Must not sum 18 * 4.
        self.assertLessEqual(res["category_scores"]["major_injuries"], CATEGORY_MAXES["major_injuries"])
        self.assertEqual(res["category_scores"]["major_injuries"], 18.0)
        self.assertEqual(res["score"], 18.0)

    def test_human_only_frame(self):
        """
        Scenario 5: Human-only frame
        Must return 'NO ANIMAL DETECTED' with 0 triage severity score.
        """
        res = calculate_priority_score(
            detection_confidence=0.0,
            description="Person walking down street",
            detected_animal_type="NO ANIMAL DETECTED",
            is_animal_detected=False
        )
        self.assertEqual(res["score"], 0.0)
        self.assertEqual(res["priority"], "ROUTINE")
        self.assertEqual(res["evidence"]["detected_species"], "NO ANIMAL DETECTED")
        self.assertFalse(res["evidence"]["is_animal_detected"])
        self.assertIn("NO ANIMAL DETECTED", res["reasoning"])

    def test_missing_or_unconfirmed_inference(self):
        """
        Scenario 6: Missing/unconfirmed visual inference
        Must not fabricate score, and flag for operator review.
        """
        res = calculate_priority_score(
            detection_confidence=0.0,
            description="Cat hit by car, unable to move",
            detected_animal_type="Cat",
            is_animal_detected=True
        )
        # Evaluates reported symptoms (Hit & run: 25, unable to move: 15 = 40)
        self.assertEqual(res["score"], 40.0)
        self.assertEqual(res["priority"], "HIGH")
        self.assertTrue(res["requires_human_review"])
        self.assertTrue(any("Visual confirmation unavailable" in u for u in res["uncertainties"]))

    def test_overlapping_symptoms_no_double_counting(self):
        """
        Scenario 7: Overlapping symptoms
        Category 1 arterial bleeding must suppress Category 2 bleeding.
        Multiple immobility phrases must cap at 15 pts.
        """
        res = calculate_priority_score(
            detection_confidence=0.90,
            description="Profuse arterial bleeding, open wound bleeding. Animal is unable to walk and cannot stand.",
            detected_animal_type="Dog",
            is_animal_detected=True
        )
        # Category 1: arterial bleeding (35.0) -> suppresses Category 2 major_bleeding
        # Category 3: unable to walk + cannot stand -> capped at 15.0 pts
        # Total = 35.0 + 15.0 = 50.0
        self.assertEqual(res["category_scores"]["life_threatening"], 35.0)
        self.assertEqual(res["category_scores"]["major_injuries"], 0.0, "Arterial bleeding must suppress duplicate major bleeding")
        self.assertEqual(res["category_scores"]["functional_impairment"], 15.0, "Impairment must cap at 15.0")
        self.assertEqual(res["score"], 50.0)
        self.assertTrue(res["urgent_safeguard_triggered"])
        self.assertEqual(res["priority"], "CRITICAL")

    def test_urgent_review_safeguard_low_numerical_score(self):
        """
        Scenario 8: Critical warning signs safeguard
        Life-threatening indicator must elevate priority to CRITICAL even if numerical score < 70.
        """
        res = calculate_priority_score(
            detection_confidence=0.80,
            description="Puppy is unconscious on sidewalk",
            detected_animal_type="Dog",
            is_animal_detected=True
        )
        # Category 1: unconscious (40.0)
        # Category 5: puppy (5.0)
        # Total score = 45.0 (normally HIGH 40-69)
        self.assertEqual(res["score"], 45.0)
        self.assertTrue(res["urgent_safeguard_triggered"], "Unconscious must trigger urgent safeguard")
        self.assertEqual(res["priority"], "CRITICAL", "Priority must be escalated to CRITICAL via safeguard")
        self.assertTrue(res["requires_human_review"])

    def test_experimental_red_pixel_cue_non_decisive(self):
        """
        Scenario 9: Experimental red-pixel chromatic cue
        Must never decisively drive emergency triage.
        """
        res = calculate_priority_score(
            detection_confidence=0.92,
            description="Healthy stray dog resting in yard",
            visual_distress_score=0.95,
            detected_animal_type="Dog",
            is_animal_detected=True
        )
        # No injuries reported in description
        # Red-pixel signal is non-decisive (max 3 pts in Category 4)
        self.assertLessEqual(res["score"], 3.0)
        self.assertEqual(res["priority"], "ROUTINE")
        self.assertGreaterEqual(len(res["experimental_signals"]), 1)
        self.assertIn("Experimental", res["experimental_signals"][0])

    def test_triage_preview_schema_contract(self):
        """
        Scenario 10: Triage preview response schema contract
        """
        res = calculate_priority_score(
            detection_confidence=0.88,
            description="Dog with broken leg",
            detected_animal_type="Dog"
        )
        self.assertIn("priority", res)
        self.assertIn("score", res)
        self.assertIn("category_scores", res)
        self.assertIn("category_maxes", res)
        self.assertIn("requires_human_review", res)
        self.assertIn("matched_findings", res)
        self.assertIn("negated_symptoms_excluded", res)
        self.assertIn("disclaimer", res)

if __name__ == "__main__":
    unittest.main()
