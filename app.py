from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from model import StudyPlannerML
from datetime import date, datetime

app = Flask(__name__)
CORS(app)

ml = StudyPlannerML()

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/generate", methods=["POST"])
def generate():
    data = request.json
    subjects    = data.get("subjects", [])
    daily_hours = data.get("dailyHours", 6)
    break_type  = data.get("breakType", "pomodoro")
    mode        = data.get("mode", "weakness")
    days        = int(data.get("days", 14))

    if not subjects:
        return jsonify({"error": "No subjects provided"}), 400

    timetable = ml.generate_timetable(subjects, daily_hours, break_type, mode, days)
    analytics = ml.get_analytics(subjects, timetable)
    scores    = ml.compute_scores(subjects, mode)
    total     = sum(scores.values()) or 1
    pct       = {k: round(v / total * 100, 1) for k, v in scores.items()}

    return jsonify({
        "timetable":   timetable,
        "analytics":   analytics,
        "scores":      scores,
        "percentages": pct,
    })

@app.route("/api/insights", methods=["POST"])
def insights():
    subjects = request.json.get("subjects", [])
    today    = date.today()
    recs     = []

    for s in subjects:
        days = max(0, (datetime.strptime(s["examDate"], "%Y-%m-%d").date() - today).days)
        conf = s.get("confidence", 50)
        if conf < 40:
            recs.append({"type": "danger", "icon": "🔴",
                         "title": f"High risk: {s['name']}",
                         "detail": f"Only {conf}% confidence — allocate at least 3h daily."})
        if days <= 5:
            recs.append({"type": "urgent", "icon": "🚨",
                         "title": f"{s['name']} exam in {days} days!",
                         "detail": "Switch to pure revision — past papers, flashcards only."})
        if s.get("weakTopics") and days > 7:
            recs.append({"type": "focus", "icon": "🎯",
                         "title": f"Weak areas in {s['name']}",
                         "detail": f"Prioritise: {', '.join(s['weakTopics'][:3])}"})

    if not recs:
        recs = [
            {"type": "ok", "icon": "✅", "title": "You're on track!", "detail": "Maintain your current study rhythm."},
            {"type": "ok", "icon": "🔄", "title": "Use spaced repetition", "detail": "Re-visit each topic every 3 days to retain information."},
            {"type": "ok", "icon": "😴", "title": "Protect your sleep", "detail": "7–8 hours of sleep improves memory consolidation by 40%."},
            {"type": "ok", "icon": "💧", "title": "Stay hydrated", "detail": "Even mild dehydration reduces cognitive performance."},
        ]

    return jsonify({"recommendations": recs[:6]})


if __name__ == "__main__":
    print("\n  ╔══════════════════════════════════════╗")
    print("  ║  ⚡ StudyAI running → localhost:5000  ║")
    print("  ╚══════════════════════════════════════╝\n")
    app.run(debug=True, port=5000)
