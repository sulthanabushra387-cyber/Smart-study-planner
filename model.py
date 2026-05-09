# model.py
import os
from datetime import date, datetime
import anthropic

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

class StudyPlannerML:

    def generate_timetable(self, subjects, daily_hours, break_type, mode, days):
        names = [s["name"] if isinstance(s, dict) else s for s in subjects]
        weak = []
        for s in subjects:
            if isinstance(s, dict) and s.get("weakTopics"):
                weak.extend(s["weakTopics"])

        style_map = {
            "balanced": "balanced across all subjects, rotating daily",
            "intensive": "highly intensive with long focused sessions",
            "spaced": "using spaced repetition — review at increasing intervals",
            "pomodoro": "using Pomodoro technique (25 min study / 5 min break)",
        }

        prompt = f"""You are an expert academic coach. Create a detailed study plan.

DETAILS:
- Subjects: {', '.join(names)}
- Days: {days}
- Daily Hours: {daily_hours}
- Style: {style_map.get(break_type, 'balanced')}
- Mode: {mode}
- Weak Topics: {', '.join(weak) if weak else 'None'}

RULES:
1. Each day MUST start with exactly "Day N:" on its own line.
2. Example: Day 1: Mathematics — Integration (weak topic focus)
3. Be specific with topics and activities.
4. Last 2 days: full revision and rest.

Generate the complete {days}-day plan:"""

        message = client.messages.create(
            model="claude-opus-4-5",
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}]
        )
        return message.content[0].text

    def get_analytics(self, subjects, timetable):
        names = [s["name"] if isinstance(s, dict) else s for s in subjects]
        return {
            "totalSubjects": len(names),
            "subjects": names,
        }

    def compute_scores(self, subjects, mode):
        scores = {}
        for s in subjects:
            name = s["name"] if isinstance(s, dict) else s
            conf = s.get("confidence", 50) if isinstance(s, dict) else 50
            if mode == "weakness":
                scores[name] = max(10, 100 - conf)
            else:
                scores[name] = 50
        return scores