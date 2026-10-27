import unittest
import base64
import os
from app.ai.video_verification import are_species_compatible, verify_live_video_frame, compute_biometric_correlation
from app.database import SessionLocal
from app import models

class TestVideoVerification(unittest.TestCase):
    def test_species_compatibility(self):
        self.assertTrue(are_species_compatible("cow", "cattle"))
        self.assertTrue(are_species_compatible("Cow", "water buffalo"))
        self.assertTrue(are_species_compatible("dog", "puppy"))
        self.assertTrue(are_species_compatible("cat", "kitten"))
        self.assertFalse(are_species_compatible("cow", "dog"))
        self.assertFalse(are_species_compatible("cow", "cat"))
        self.assertFalse(are_species_compatible("dog", "bird"))

    def test_non_animal_human_frame_rejection(self):
        # Human image: static/uploads/reports/00788a01b1d54eefb853d34710442390.jpg
        human_path = "static/uploads/reports/00788a01b1d54eefb853d34710442390.jpg"
        if not os.path.exists(human_path):
            self.skipTest("Sample image not found")

        with open(human_path, "rb") as f:
            b64_data = base64.b64encode(f.read()).decode("utf-8")

        res = verify_live_video_frame(b64_data)
        self.assertFalse(res["match"])
        self.assertEqual(res["confidence"], 0.0)
        self.assertEqual(res["similarity_percentage"], 0.0)
        self.assertIn("NO ANIMAL DETECTED", res["explanation"])

    def test_species_mismatch_rejection(self):
        # Cat image: static/uploads/reports/00cd085d8c354e4d9c863dd34bb80f71.png
        cat_path = "static/uploads/reports/00cd085d8c354e4d9c863dd34bb80f71.png"
        if not os.path.exists(cat_path):
            self.skipTest("Sample cat image not found")

        with open(cat_path, "rb") as f:
            b64_data = base64.b64encode(f.read()).decode("utf-8")

        # Test against case RN-CD01A5 which is a Cow
        res = verify_live_video_frame(b64_data, "RN-CD01A5")
        if res.get("target_animal") and res["target_animal"].lower() == "cow":
            self.assertFalse(res["match"])
            self.assertEqual(res["confidence"], 0.0)
            self.assertEqual(res["similarity_percentage"], 0.0)
            self.assertIn("Species mismatch", res["explanation"])

if __name__ == "__main__":
    unittest.main()
