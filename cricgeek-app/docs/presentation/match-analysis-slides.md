---
marp: true
theme: default
size: 16:9
paginate: true
---

<style>
section {
  background: #070b12;
  color: #f3f6f4;
  font-family: "Aptos", "Segoe UI", sans-serif;
  font-size: 19px;
  padding: 42px 54px;
}
h1 {
  color: #ffffff;
  border-bottom: 3px solid #22c55e;
  font-size: 34px;
  margin: 0 0 18px;
  padding-bottom: 10px;
}
h2 { color: #22c55e; font-size: 22px; margin: 12px 0 6px; }
p { margin: 7px 0; line-height: 1.3; }
strong { color: #4ade80; }
table { border-collapse: collapse; font-size: 17px; width: 100%; }
th {
  background: #122019;
  color: #4ade80;
  font-weight: 700;
  text-align: left;
}
th, td { border-bottom: 1px solid #26382e; padding: 7px 10px; vertical-align: top; }
blockquote {
  background: #101a15;
  border-left: 4px solid #22c55e;
  color: #d3ddd6;
  margin: 12px 0;
  padding: 9px 14px;
}
.small { color: #aab8af; font-size: 14px; }
.cover h1 { font-size: 48px; margin-top: 85px; }
.cover p { font-size: 23px; }
</style>

<!-- _class: cover -->

# Match EDA — Cover

**CricGeek** · Match **1415755**

India vs South Africa  
Cricsheet Historical Warehouse  
**Reconciliation: Partial**

---

# Game-Changing Moments ⭐

| Rank | Evidence | Context |
|---|---|---|
| **#1** | High-contribution batter dismissed: **H Klaasen** | Innings 2 · South Africa · Over 17 · source position 16.1 · event 100 |
| **#2** | High-pressure late-chase wicket: **DA Miller** | Innings 2 · South Africa · Over 20 · source position 19.1 · event 118 |

| Moment | Impact score | Runs involved | Wickets involved |
|---|---:|---:|---:|
| H Klaasen | 10 | 52 | 1 |
| DA Miller | 10 | 21 | 1 |

<p class="small">Impact summarizes observed evidence, not causality, win probability, or match result.</p>

---

# Match Overview

| Innings | Runs | Wickets | Legal deliveries |
|---|---:|---:|---:|
| India · Innings 1 | **176** | 7 | 120 |
| South Africa · Innings 2 | **169** | 8 | 120 |

| Match metric | Value |
|---|---|
| Highest individual score | V Kohli · **76 from 59 balls** |
| Best bowling | HH Pandya · **3 wickets for 20 runs** |

<p class="small">Scores are compared as innings totals only; no result is inferred.</p>

---

# Batting Performance

<p><strong>Selector:</strong> Batter selection and optional comparison are supported by the existing analysis page. Example shown: **S Dube**.</p>

| Available API metric | S Dube |
|---|---:|
| Runs | **27** |
| Strike rate | **168.75 runs/100 balls** |
| Balls faced | **16** |
| Fours | **3** |
| Sixes | **1** |
| Dot-ball percentage | **18.75%** |

<p class="small">No comparison batter values or additional metrics are supplied here.</p>

---

# Batting Contribution

**India · Innings 1 · batter runs**

| Batter | Runs | Batter | Runs |
|---|---:|---|---:|
| V Kohli | **76** | AR Patel | **47** |
| S Dube | **27** | RG Sharma | **9** |
| HH Pandya | **5** | SA Yadav | **3** |
| RA Jadeja | **2** | RR Pant | **0** |

---

# Bowling Performance

| Bowler | Wickets | Runs conceded | Overs | Maidens | Economy | Balls/wicket |
|---|---:|---:|---|---|---|---|
| HH Pandya | **3** | **20** | Unavailable | Unavailable | Unavailable | Unavailable |

<p class="small">The project supports these bowling fields; only wickets and runs conceded are available in the supplied match evidence. Missing figures are not estimated.</p>

---

# Bowling Contribution

| Available bowler contribution | Wickets | Runs conceded |
|---|---:|---:|
| HH Pandya | **3** | **20** |

<blockquote>Other bowler names and contribution figures are unavailable in the checked-in match data and supplied evidence.</blockquote>

---

# Innings Breakdown

| Team · innings | Score | Legal deliveries | Available batting detail | Available bowling detail |
|---|---:|---:|---|---|
| India · Innings 1 | **176/7** | 120 | Batter runs shown on “Batting Contribution” | Unavailable |
| South Africa · Innings 2 | **169/8** | 120 | Unavailable | HH Pandya: **3/20**; other figures unavailable |

<p class="small">Totals are reported independently; no outcome is inferred.</p>

---

# Scoring & Extras

| Recorded delivery runs | Count |
|---:|---:|
| 0 | 34 |
| 1 | 64 |
| 2 | 9 |
| 3 | 0 |
| 4 | 13 |
| 6 | 7 |
| Other | 0 |

**Extras:** wides **6** · no-balls **1**  
<p class="small">The supplied distribution has no innings label.</p>

---

# Runs & Wicket Progression

| Progression field | Availability |
|---|---|
| Cumulative runs by recorded over | **Unavailable** — no over-by-over cumulative values are present in the checked-in match data or supplied evidence |
| Dismissal-over markers | Innings 2 · Over 17 (event 100); Over 20 (event 118) |

<blockquote>Display-only chart grouping; it does not replace API metric cards. No cumulative curve is synthesized from the event markers.</blockquote>

---

# Dismissals & Key Events

| Innings | Over | Batter | Bowler | Event details |
|---|---:|---|---|---|
| 2 · South Africa | 17 · source position 16.1 | H Klaasen | Unavailable | Dismissal · source event 100 |
| 2 · South Africa | 20 · source position 19.1 | DA Miller | Unavailable | Dismissal · source event 118 |

<p class="small">Bowler names and further dismissal descriptions are unavailable in the supplied event evidence.</p>

---

# Advanced Insights

| Metric | Value / status |
|---|---|
| Historical baseline | **Unavailable** — requires at least 5 distinct matches and 5 performances |
| Candidate window | Capped at **30 matches** |
| Team runs per legal ball | **1.47** |
| Run rate | **Unavailable** |
| Dot-ball percentage | **28.33%** |
| Boundary percentage | **16.67%** |
| Phase comparisons | **Unavailable** — not marked available in the supplied data |

---

# Evidence, Availability & Data Quality

- Historical values and availability come from the post-match API. Match reconciliation is **Partial**.
- Chart groupings are display-only and are not substitutes for API metrics.
- Event evidence is not a historical baseline and does not imply causality or win probability.
- **Partnership tracking becomes available once ball-by-ball sequencing is available.** The project also states: “No eligible baseline; none is inferred from this match alone.”
- The project notes: “Ball-by-ball commentary was unavailable, so over-by-over and partnership storytelling is limited to scorecard evidence.” In that case, “No usable over sequence; delivery patterns are not inferred.”
- The project’s scorecard/report wording for missing batter-level dot counts is: “The scorecard/report does not provide batter-level dot-ball counts.” The S Dube percentage above is shown as supplied for this deck; the scorecard-only fallback remains unavailable.
