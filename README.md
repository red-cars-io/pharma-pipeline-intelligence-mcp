# Pharma Pipeline Intelligence MCP

Competitive pharmaceutical pipeline intelligence for AI agents. Search clinical trials, analyze FDA approvals, detect adverse events, and track drug recalls.

---

## 1. Purpose Statement

Pharma Pipeline Intelligence MCP is an MCP (Model Context Protocol) server that gives AI agents access to pharmaceutical pipeline data across 7 government databases, producing composite Pipeline Threat Scores (0-100) for competitive intelligence. AI agents performing biotech investment analysis, competitive landscape monitoring, patent cliff assessment, safety signal surveillance, or regulatory pathway planning query real-time clinical trials, FDA/EMA approvals, adverse event reports, patent portfolios, and publication trends without requiring API keys or manual database navigation.

**Built for:** AI agents doing biotech investment due diligence, competitive landscape monitoring for business development, patent cliff and generic entry strategy, safety signal surveillance for medical affairs, regulatory pathway planning, and research strategy for emerging therapeutic areas.

---

## 2. Quick Start

Add to your MCP client:

```json
{
  "mcpServers": {
    "pharma-pipeline-intelligence-mcp": {
      "url": "https://red-cars--pharma-pipeline-intelligence-mcp.apify.actor/mcp"
    }
  }
}
```

AI agents can now assess competitive pressure in any therapeutic area, evaluate drug safety signals, monitor patent cliffs, and track regulatory approval landscapes across FDA, EMA, ClinicalTrials.gov, USPTO, and PubMed.

---

## 3. When to Call This MCP

Use Pharma Pipeline Intelligence MCP when you need to:

- **Assess competitive pipeline threats** — Get composite Pipeline Threat Scores (0-100) for any drug or therapeutic area
- **Monitor clinical trial activity** — Track Phase 1/2/3/4 trials by drug, condition, or company
- **Analyze competitive landscapes** — Side-by-side FDA vs EMA approval status with threat scoring
- **Detect adverse event signals** — Screen FDA FAERS reports for divergence scores and MedDRA reactions
- **Track patent cliffs** — Monitor USPTO patent portfolios with expiry dates and First-Mover Advantage scores
- **Compare regulatory pathways** — Analyze FDA vs EMA approval gaps and authorization timelines
- **Monitor drug recalls** — Track FDA Class I/II/III recalls by drug or manufacturer
- **Assess literature momentum** — Measure publication acceleration and journal velocity via PubMed
- **Generate full threat reports** — Composite analysis fanning out to all 7 data sources simultaneously
- **Biotech investment due diligence** — Validate investment theses with pipeline threat, safety, and IP analysis
- **Business development intelligence** — Monitor competitive landscapes for deal sourcing
- **Patent cliff strategy** — Assess generic entry risk and exclusivity remaining
- **Medical affairs surveillance** — Track emerging safety signals before regulatory action
- **Regulatory planning** — Plan market access across FDA and EMA jurisdictions

---

## 4. What Data Can You Access?

| Data Type | Source | Example |
|-----------|--------|---------|
| Clinical Trials | ClinicalTrials.gov | Phase distribution, enrollment, status, sponsors |
| FDA Drug Approvals | openFDA Drug Approvals | NDA/BLA/ANDA approvals by drug class |
| Adverse Event Reports | openFDA FAERS | Serious events, deaths, hospitalizations, MedDRA terms |
| Drug Recalls | FDA Enforcement | Class I/II/III recall notices |
| Patent Portfolio | USPTO | Filing counts, expiry dates, years of exclusivity |
| Publication Trends | PubMed | Yearly counts, acceleration ratios, top journals |

Note: EMA authorizations are not available via public API and have been dropped from this MCP.

---

## 5. Why Use Pharma Pipeline Intelligence MCP?

**The problem:** Pharmaceutical competitive intelligence — clinical trials, FDA/EMA approvals, adverse event signals, patent cliffs, and regulatory pathways — requires searching 7+ government databases and synthesizing findings into actionable intelligence. For biotech investors, business development teams, medical affairs, and patent attorneys, this data is essential for investment decisions, deal sourcing, safety surveillance, and market access planning. Manual research takes days across disconnected ClinicalTrials.gov, FDA, EMA, USPTO, and PubMed systems.

**The solution:** AI agents use Pharma Pipeline Intelligence MCP to get instant, structured competitive intelligence on any drug or therapeutic area — the pharmaceutical intelligence layer for AI agents doing biotech research, BD monitoring, and regulatory planning.

### Key benefits:

- **Pipeline Threat Scoring** — Composite 0-100 scores combining competitive pressure, safety signals, literature momentum, and IP position
- **7 government databases queried simultaneously** — ClinicalTrials.gov, FDA, FAERS, USPTO, PubMed all in one call
- **4 scoring sub-models** — Pipeline Threat, First-Mover Advantage, Adverse Event Divergence, Literature Momentum
- **Adverse event signal detection** — MedDRA reaction aggregation with divergence scoring (NORMAL/ELEVATED/CONCERNING/CRITICAL)
- **Patent cliff monitoring** — USPTO portfolio analysis with years of exclusivity remaining and FMA scores
- **Regulatory gap analysis** — FDA approval status with gap metrics (EMA unavailable)
- **No API key required** — All data sources are free government APIs, works immediately
- **Parallel data fetching** — Promise.allSettled orchestration for fast responses across all sources

---

## 6. Features

**Pipeline Threat Scoring (0-100)**
Composite score measuring competitive pressure in any therapeutic area. Combines Phase 3 competitor counts (8 pts each, cap 40), trial volume (2 pts each, cap 20), FDA approvals (5 pts each, cap 15), and competitor recalls (-5 pts each, cap -15).

**First-Mover Advantage Index (0-100)**
Assesses defensive position via patent portfolio breadth (6 pts/patent, cap 30), exclusivity duration (2.5 pts/year, cap 25), trial phase lead (6.25 pts/phase, cap 25), and FDA approval count (10 pts/approval, cap 20). Patent cliff warning triggers when <2 years remaining.

**Adverse Event Divergence Scoring (0-100)**
Analyzes FDA FAERS reports for safety signals. Components: death reports (7 pts each, cap 35), serious event ratio (ratio x 50, cap 25, triggers at >30%), hospitalization burden (4 pts/report, cap 20), log-normalized volume (log2 x 3, cap 20). Divergence levels: NORMAL (0-24), ELEVATED (25-49), CONCERNING (50-74), CRITICAL (75-100).

**Literature Momentum Scoring (0-100)**
Measures publication acceleration via PubMed. Components: volume (3 pts/pub, cap 30), recency (5 pts/recent pub, cap 30), acceleration ratio (25, triggers at 20% growth threshold), journal diversity (3 pts/journal, cap 15).

**Parallel 6-Source Orchestration**
The generate_pipeline_threat_report tool fans out to all 6 data sources simultaneously via Promise.allSettled. Each source gets 120-second timeout. Partial failure returns available data with warning signals.

**Phase Normalization**
Handles both Arabic ("Phase 3") and Roman numeral ("Phase III") phase labels across ClinicalTrials.gov data.

---

## 7. How It Compares to Alternatives

| Aspect | Our MCP | ApifyForge | Citeline | Cortellis | GlobalData |
|--------|---------|------------|---------|-----------|------------|
| Price | $0.04-$0.15/call | $0.045/call (flat) | $15,000-$50,000/year | $15,000+/year | $20,000+/year |
| API access | MCP (AI-native) | MCP | REST (expensive) | REST | REST |
| Tool count | 8 tools | 8 tools | Full database | Full database | Full database |
| Data sources | 6 (government) | 7 (incl. EMA) | Commercial + govt | Commercial + govt | Commercial |
| Scoring models | 4 sub-models | 4 sub-models | Limited | Limited | Limited |
| Composite report | Yes (threat report) | Yes | Manual synthesis | Manual synthesis | Manual synthesis |
| AI agent integration | Native MCP | Native MCP | No MCP | No MCP | No MCP |
| No API key required | Yes | Yes | No | No | No |
| Public GitHub repo | Yes | No | N/A | N/A | N/A |
| LLM/AI agent SEO | Yes (public) | No | No | No | No |

**Why choose our MCP:**
- MCP protocol is designed for AI agent integration — call pharma intelligence tools with natural language
- Public GitHub repository + llms.txt for AI agent discovery — ApifyForge version is private, not findable by AI agents
- Tiered pricing by value ($0.04-$0.15) vs ApifyForge flat $0.045 — composite reports cost more, simple lookups cost less
- 4 built-in scoring sub-models — commercial platforms require manual analysis
- Commercial platforms (Citeline, Cortellis, GlobalData) cost $15,000-$50,000/year — our MCP is fractions of a cent per call
- No API key required — all data sources are free government APIs, works immediately

**Competitor APIs:**
- ApifyForge: private actor at `ryanclinton/pharma-pipeline-intelligence-mcp` (not publicly discoverable)
- Citeline: https://www.citeline.com (enterprise pricing)
- Cortellis: https://www.cortellis.com (enterprise pricing)
- GlobalData: https://www.globaldata.com (enterprise pricing)

---

## 8. Use Cases for Pharma Pipeline Intelligence

### Biotech Investment Due Diligence
*Persona: Biotech investor validating investment thesis for GLP-1 franchise*

```
AI agent: "Assess competitive threat to Novo Nordisk's semaglutide franchise over next 5 years"
MCP call: generate_pipeline_threat_report({ company: "Novo Nordisk", drug: "semaglutide", indication: "obesity" })
Returns: compositeScore: 64, riskLevel: HIGH, 8 Phase 3 competitors, 11 years exclusivity, elevated adverse event divergence
```

### Competitive Landscape Monitoring for BD
*Persona: Business development team identifying deal targets in CDK4/6 inhibitor space*

```
AI agent: "Who are the top Phase 3 competitors to our CDK4/6 inhibitor in metastatic breast cancer?"
MCP call: analyze_competitive_landscape({ query: "CDK4/6 inhibitor breast cancer" })
          + search_drug_pipeline({ query: "CDK4/6 breast cancer", phase: "PHASE3" })
Returns: FDA approvals, active trial count, Pipeline Threat Score, ranked Phase 3 competitors
```

### Patent Cliff and Generic Entry Strategy
*Persona: Patent attorney assessing Keytruda patent expiry and generic threat*

```
AI agent: "When does Keytruda's patent estate expire and what is the generic entry risk?"
MCP call: track_patent_exclusivity({ query: "pembrolizumab" })
          + monitor_drug_recalls({ query: "pembrolizumab", classification: "Class I" })
Returns: patentCount: 23, earliestExpiry: 2033-06-15, yearsExclusivityRemaining: 7, FMA Score: 82, patent cliff warning
```

### Safety Signal Surveillance for Medical Affairs
*Persona: Medical affairs team monitoring emerging safety signals for new drug launch*

```
AI agent: "Are there emerging adverse event signals for our GLP-1 drug in the FDA database?"
MCP call: detect_adverse_event_signals({ query: "GLP-1", limit: 500 })
          + assess_literature_momentum({ query: "GLP-1 safety signals" })
Returns: divergenceScore: 45, divergenceLevel: ELEVATED, 23 death reports, seriousRatio: 0.31, top MedDRA reactions
```

### Regulatory Pathway Planning
*Persona: Regulatory affairs team planning market entry*

```
AI agent: "What is the FDA approval status and regulatory gap for PD-1 inhibitors?"
MCP call: compare_regulatory_pathways({ query: "PD-1 inhibitor" })
Returns: FDA approvals list, regulatoryGapMetric: null, note explaining EMA unavailability
```

---

## 9. How to Connect Pharma Pipeline Intelligence MCP Server to Your AI Client

### Step 1: Get your Apify API token (optional)

Sign up at [apify.com](https://apify.com) and copy your API token from the console. The MCP works without an API token for tool calls, but Apify authentication may be required by some MCP clients.

### Step 2: Add the MCP server to your client

**Claude Desktop:**
Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "pharma-pipeline-intelligence-mcp": {
      "url": "https://red-cars--pharma-pipeline-intelligence-mcp.apify.actor/mcp"
    }
  }
}
```

**Cursor/Windsurf:**
Add to MCP settings:
```json
{
  "mcpServers": {
    "pharma-pipeline-intelligence-mcp": {
      "url": "https://red-cars--pharma-pipeline-intelligence-mcp.apify.actor/mcp"
    }
  }
}
```

### Step 3: Start querying

```
AI agent: "Generate a pipeline threat report for Eli Lilly's tirzepatide in the obesity indication"
```

### Step 4: Retrieve results

The MCP returns structured JSON with composite scores, risk levels, sub-model breakdowns, and signal arrays.

---

## 10. MCP Tools

| Tool | Price | Description |
|------|-------|-------------|
| search_drug_pipeline | $0.05 | Search ClinicalTrials.gov for clinical trials by drug, condition, or therapeutic area |
| analyze_competitive_landscape | $0.08 | Side-by-side FDA analysis with Pipeline Threat Score |
| detect_adverse_event_signals | $0.06 | Analyze FDA FAERS reports for adverse event signals with Divergence Score |
| track_patent_exclusivity | $0.05 | USPTO patent portfolio analysis with First-Mover Advantage Score |
| compare_regulatory_pathways | $0.05 | FDA approval status and regulatory gap analysis (EMA unavailable) |
| monitor_drug_recalls | $0.04 | Search FDA drug recall database by drug, manufacturer, or classification |
| assess_literature_momentum | $0.05 | PubMed publication trend analysis with Literature Momentum Score |
| generate_pipeline_threat_report | $0.15 | Full composite report: 4 sub-model scores + composite Pipeline Threat Score (0-100) |

---

## 11. Tool Parameters

### search_drug_pipeline

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Drug name, condition, or therapeutic area |
| status | string | No | RECRUITING, ACTIVE_NOT_RECRUITING, COMPLETED |
| phase | string | No | PHASE1, PHASE2, PHASE3, PHASE4 |
| maxResults | integer | No | Maximum results (default: 50, max: 50) |

**When to call:** Persona: Biotech investor or business development analyst. Scenario: "Research the clinical trial landscape for a therapeutic area to assess competitive intensity."

**Example AI prompt:** "Find all Phase 3 trials for GLP-1 agonists that are currently recruiting, show sponsors, enrollment, and estimated completion dates."

---

### analyze_competitive_landscape

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Drug class, therapeutic area, or active ingredient |

**When to call:** Persona: Business development team or competitive intelligence analyst. Scenario: "Assess the competitive landscape for a drug class to identify threats and opportunities."

**Example AI prompt:** "Analyze the competitive landscape for CDK4/6 inhibitors in breast cancer — show FDA approvals, active trial count, and pipeline threat score."

---

### detect_adverse_event_signals

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Drug name or active ingredient |
| limit | integer | No | Max FAERS records (default: 100, max: 500) |

**When to call:** Persona: Medical affairs team or pharmacovigilance specialist. Scenario: "Monitor adverse event reports for emerging safety signals."

**Example AI prompt:** "Screen FDA FAERS for adverse event signals on semaglutide — show serious events, deaths, hospitalizations, and top MedDRA reactions. Limit to 500 most recent reports."

---

### track_patent_exclusivity

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Drug name, compound, mechanism, or assignee |

**When to call:** Persona: Patent attorney or regulatory affairs team. Scenario: "Assess patent cliff risk and exclusivity remaining for a drug."

**Example AI prompt:** "Track patent exclusivity for pembrolizumab — show patent count, filing dates, expiry dates, years of exclusivity remaining, and First-Mover Advantage score."

---

### compare_regulatory_pathways

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Drug name, active substance, or therapeutic area |

**When to call:** Persona: Regulatory affairs team or market access planner. Scenario: "Check FDA approval status for market entry planning."

**Example AI prompt:** "Compare regulatory status for GLP-1 drugs — show FDA approvals and note EMA unavailability."

---

### monitor_drug_recalls

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Drug name, manufacturer, or recall reason |
| classification | string | No | Class I, Class II, Class III |

**When to call:** Persona: Pharmacy manager or drug safety AI. Scenario: "Check for active recalls on a drug class before dispensing."

**Example AI prompt:** "Find all FDA Class I and II recalls for metformin in the last 3 years — show classification, reason, and recalling firm."

---

### assess_literature_momentum

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Drug name, condition, mechanism, or research topic |
| maxResults | integer | No | Maximum publications (default: 50) |

**When to call:** Persona: Research strategist or medical affairs team. Scenario: "Assess publication trends and emerging research momentum for a drug."

**Example AI prompt:** "Assess literature momentum for GLP-1 obesity therapeutics — show yearly publication counts, acceleration ratio, top journals, and Literature Momentum Score."

---

### generate_pipeline_threat_report

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| company | string | Yes | Company name |
| drug | string | Yes | Drug name |
| indication | string | No | Appended to ClinicalTrials.gov query |

**When to call:** Persona: Biotech investor or competitive intelligence analyst. Scenario: "Generate comprehensive competitive threat analysis for a drug franchise."

**Example AI prompt:** "Generate a full pipeline threat report for Novo Nordisk's semaglutide in obesity — include all 4 sub-model scores and composite threat score."

---

## 12. Connection Examples

### cURL

```bash
curl -X POST "https://red-cars--pharma-pipeline-intelligence-mcp.apify.actor/mcp" \
  -H "Authorization: Bearer YOUR_APIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "analyze_competitive_landscape",
    "params": { "query": "GLP-1 agonist obesity" }
  }'
```

### Node.js

```javascript
const response = await fetch('https://red-cars--pharma-pipeline-intelligence-mcp.apify.actor/mcp', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_APIFY_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    tool: 'generate_pipeline_threat_report',
    params: { company: 'Novo Nordisk', drug: 'semaglutide', indication: 'obesity' }
  })
});
const data = await response.json();
console.log(data.result.compositeScore, data.result.riskLevel);
```

### Python

```python
import httpx
import json

url = "https://red-cars--pharma-pipeline-intelligence-mcp.apify.actor/mcp"
payload = {
    "tool": "track_patent_exclusivity",
    "params": { "query": "pembrolizumab" }
}
headers = {"Authorization": "Bearer YOUR_APIFY_TOKEN"}
response = httpx.post(url, headers=headers, json=payload)
report = json.loads(response.json()["result"])
print(f"First-Mover Advantage: {report['firstMoverAdvantageScore']}")
```

---

## 13. Output Example

```json
{
  "status": "success",
  "result": {
    "company": "Novo Nordisk",
    "drug": "semaglutide",
    "reportDate": "2026-04-22",
    "compositeScore": 64,
    "riskLevel": "HIGH",
    "pipelineThreat": {
      "score": 72,
      "competitorCount": 8,
      "phaseDistribution": { "Phase 1": 23, "Phase 2": 45, "Phase 3": 34, "Phase 4": 25 },
      "sameIndicationTrials": 127,
      "recentApprovals": 4,
      "recentRecalls": 0,
      "threatLevel": "HIGH",
      "signals": [
        "8 Phase 3 competitors in same indication",
        "4 recent FDA approvals in drug class"
      ]
    },
    "firstMoverAdvantage": {
      "score": 78,
      "patentsCovering": 12,
      "earliestPatentExpiry": "2037-03-15",
      "yearsOfExclusivity": 11,
      "trialPhaseLead": 4,
      "approvalPathwayClear": true,
      "signals": [
        "11 years exclusivity remaining",
        "Phase 4 lead indicates established market position"
      ]
    },
    "adverseEventDivergence": {
      "score": 45,
      "totalReports": 2847,
      "seriousEvents": 892,
      "deathReports": 23,
      "hospitalizationReports": 341,
      "seriousRatio": 0.313,
      "divergenceLevel": "ELEVATED",
      "topReactions": [
        { "term": "NAUSEA", "count": 423 },
        { "term": "VOMITING", "count": 312 }
      ],
      "signals": [
        "Serious ratio exceeds 30% threshold"
      ]
    },
    "literatureMomentum": {
      "score": 68,
      "publicationCount": 234,
      "recentPublications": 89,
      "yearlyTrend": { "2022": 42, "2023": 58, "2024": 76, "2025": 58 },
      "accelerating": true,
      "topJournals": ["NEJM", "The Lancet", "JAMA", "BMJ", "Nature Medicine"],
      "signals": [
        "31% publication growth exceeds 20% threshold"
      ]
    },
    "allSignals": [
      "8 Phase 3 competitors in same indication",
      "4 recent FDA approvals in drug class",
      "11 years exclusivity remaining",
      "Serious ratio exceeds 30% threshold",
      "31% publication growth exceeds 20% threshold"
    ]
  }
}
```

---

## 14. Output Fields

| Field | Description |
|-------|-------------|
| compositeScore | Pipeline Threat Score 0-100 (weighted average of 4 sub-models) |
| riskLevel | LOW (0-25), MODERATE (26-50), HIGH (51-75), CRITICAL (76-100) |
| pipelineThreat | Sub-model score for competitive pressure (Phase 3 competitors, trial volume, approvals, recalls) |
| firstMoverAdvantage | Sub-model score for defensive position (patents, exclusivity, trial phase, approvals) |
| adverseEventDivergence | Sub-model score for safety signal intensity (deaths, serious ratio, hospitalizations) |
| literatureMomentum | Sub-model score for publication acceleration (volume, recency, acceleration, journal diversity) |
| threatLevel | Risk classification for pipeline threat sub-model |
| divergenceLevel | Safety signal classification: NORMAL, ELEVATED, CONCERNING, CRITICAL |
| accelerating | Boolean — true if publication growth exceeds 20% threshold |
| patentCliffWarning | Boolean — true if <2 years exclusivity remaining |
| signals | Array of human-readable intelligence signals from each sub-model |
| source | Data sources queried (ClinicalTrials.gov, FDA, USPTO, PubMed) |

---

## 15. How Much Does It Cost?

**PPE (Pay-Per-Event) pricing — $0.04 to $0.15 per tool call.**

| Tool | Price |
|------|-------|
| search_drug_pipeline | $0.05 |
| analyze_competitive_landscape | $0.08 |
| detect_adverse_event_signals | $0.06 |
| track_patent_exclusivity | $0.05 |
| compare_regulatory_pathways | $0.05 |
| monitor_drug_recalls | $0.04 |
| assess_literature_momentum | $0.05 |
| generate_pipeline_threat_report | $0.15 |

No subscription. No monthly fee. Pay only when AI agents use the tools.

**Monthly cost estimates:**

| Scenario | Calls | Cost |
|----------|-------|-------|
| Quick test (1 tool) | 1 | $0.04-$0.15 |
| Spot check (3 tools) | 3 | $0.12-$0.45 |
| Weekly landscape | 15 | $0.60-$2.25 |
| Monthly surveillance | 50 | $2.00-$7.50 |
| Daily monitoring | 200 | $8.00-$30.00 |

**Comparison:** Commercial platforms (Citeline, Cortellis, GlobalData) = $15,000-$50,000/year. Our MCP provides pharmaceutical competitive intelligence at under 0.02% of the cost.

---

## 16. How It Works

### Phase 1: Request parsing
AI agent sends tool call via MCP protocol. Server parses tool name and parameters.

### Phase 2: Parallel data fetching
For generate_pipeline_threat_report, the server fans out to all 6 data sources simultaneously:
- ClinicalTrials.gov (drug + indication query)
- openFDA Drug Approvals (drug class query)
- openFDA FAERS (drug, limit: 100)
- FDA Enforcement (drug)
- USPTO (drug)
- PubMed (drug)

Each source gets 120-second timeout. Promise.allSettled ensures graceful degradation — if any source fails, empty array is substituted and partial results are returned.

### Phase 3: Scoring and synthesis
4 sub-models score each dimension:
- **Pipeline Threat Score** (30% weight): Phase 3 competitors (8 pts each), trial volume (2 pts each), FDA approvals (5 pts each), competitor recalls (-5 pts each)
- **First-Mover Advantage** (inverted, 20% weight): Patent breadth (6 pts/patent), exclusivity duration (2.5 pts/year), trial phase lead (6.25 pts/phase), FDA approvals (10 pts/approval)
- **Adverse Event Divergence** (25% weight): Deaths (7 pts each), serious ratio (ratio x 50), hospitalizations (4 pts/report), log-volume (log2 x 3)
- **Literature Momentum** (25% weight): Volume (3 pts/pub), recency (5 pts/recent), acceleration ratio (25), journal diversity (3 pts/journal)

Composite score = round(pipelineThreat * 0.30 + adverseEventDivergence * 0.25 + literatureMomentum * 0.25 + (100 - firstMoverAdvantage) * 0.20)

### Phase 4: Response formatting
All results returned as structured JSON with normalized field names, signal arrays, and source attribution.

### Phase 5: Pricing
PPE charges applied via Apify Actor.charge() for cost tracking per tool.

---

## 17. Tips for Best Results

1. **Use specific drug names** — More specific queries (e.g., "pembrolizumab") return better results than generic ("PD-1 inhibitor")

2. **Include indication for threat reports** — Adding indication to generate_pipeline_threat_report improves ClinicalTrials.gov accuracy

3. **Filter by phase for competitive analysis** — Use phase filter to focus on Phase 3 competitors for imminent market entry threats

4. **Use limit parameter for signal detection** — Higher limits (500) give better divergence scores for detect_adverse_event_signals

5. **Check patent cliffs early** — track_patent_exclusivity flags patent cliff warnings when <2 years remain — use for generic entry planning

6. **Monitor adverse event divergence levels** — ELEVATED or higher triggers warrant medical affairs review

7. **Literature acceleration is a leading indicator** — Publication momentum often precedes clinical milestones

8. **Combine with drug-intelligence-mcp** — For FDA labeling and recall data on approved drugs, chain to drug-intelligence-mcp

9. **FAERS under-reporting is real** — Adverse event reports indicate suspicion, not confirmed causation

10. **Patent expiry estimates exclude PTEs/SPCs/pediatric exclusivity** — Actual exclusivity may be longer than USPTO filing dates suggest

---

## 18. Combine with Other Apify Actors

**For comprehensive pharma and healthcare intelligence:**

- **drug-intelligence-mcp** — FDA drug labels, adverse events, NDC codes, drug interactions, recalls
- **healthcare-compliance-mcp** — Medical device compliance, 510(k) clearances, MAUDE events
- **academic-research-mcp** — PubMed papers, NIH grants, institutional research
- **patent-search-mcp** — Patent landscape, FTO analysis, freedom to operate

**Research chain:**
```
pharma-pipeline-intelligence-mcp → drug-intelligence-mcp → healthcare-compliance-mcp
```

AI agents researching competitive threats can: (1) assess pipeline threat and safety signals, (2) verify FDA approval status and drug labeling, (3) check for overlapping device compliance issues.

**Cross-sell workflow examples:**

**Investment Due Diligence:**
1. pharma-pipeline: generate_pipeline_threat_report(company="Novo Nordisk", drug="semaglutide", indication="obesity")
2. drug-intelligence: search_drug_labels(drug_name="semaglutide")
3. academic-research: search_papers(topic="GLP-1 clinical outcomes")

**Patent Cliff Strategy:**
1. pharma-pipeline: track_patent_exclusivity(query="pembrolizumab")
2. patent-search: patent_landscape(drug_name="pembrolizumab")
3. pharma-pipeline: monitor_drug_recalls(query="pembrolizumab")

**Safety Signal Investigation:**
1. pharma-pipeline: detect_adverse_event_signals(query="drug X", limit=500)
2. academic-research: search_papers(topic="drug X adverse events")
3. healthcare-compliance: get_device_recalls(manufacturer="company X")

**Regulatory Planning:**
1. pharma-pipeline: compare_regulatory_pathways(query="PD-1 inhibitor")
2. drug-intelligence: search_drug_recalls(drug_name="pembrolizumab")
3. healthcare-compliance: search_clinical_trials(condition="oncology", sponsor="company X")

---

## Elevator Pitch

**For smithery.ai and mcp.so listings:** Pharma Pipeline Intelligence MCP gives AI agents real-time competitive intelligence on any drug or therapeutic area — composite Pipeline Threat Scores (0-100) built from 6 government databases (ClinicalTrials.gov, FDA, FAERS, USPTO, PubMed) queried simultaneously in under two minutes. Covers clinical trial landscapes, FDA approval status, adverse event signals with MedDRA reaction tracking, patent cliffs with exclusivity timelines, and literature momentum with acceleration scoring. Built for biotech investors validating theses, BD teams monitoring competitive landscapes, medical affairs tracking safety signals, and patent attorneys assessing generic entry risk. PPE pricing at $0.04-$0.15 per call vs $15,000-$50,000/year commercial platforms — no API key required, works immediately, public GitHub repo with llms.txt for AI agent discovery.

---

## Competitive Comparison

| Dimension | Our MCP | ApifyForge Version | Citeline | Cortellis | GlobalData |
|-----------|---------|-------------------|---------|-----------|------------|
| **Price** | $0.04-$0.15/call | $0.045/call (flat) | $15,000-$50,000/year | $15,000+/year | $20,000+/year |
| **API type** | MCP (AI-native) | MCP | REST (expensive) | REST | REST |
| **Access model** | Pay-per-call | Pay-per-call | Subscription required | Subscription required | Subscription required |
| **Tool count** | 8 tools | 8 tools | Full database access | Full database access | Full database access |
| **Data sources** | 6 government APIs | 7 (incl. EMA - unavailable) | Commercial + government | Commercial + government | Commercial |
| **Scoring models** | 4 sub-models (Pipeline Threat, FMA, AE Divergence, Literature Momentum) | 4 sub-models | Manual analysis | Manual analysis | Manual analysis |
| **Composite report** | Yes (threat report fans out to all sources) | Yes | Requires manual synthesis | Requires manual synthesis | Requires manual synthesis |
| **AI agent integration** | Native MCP protocol | Native MCP | No MCP support | No MCP support | No MCP support |
| **No API key required** | Yes (all free government APIs) | Yes | No (commercial data) | No | No |
| **Public GitHub repo** | Yes (with llms.txt for AI discovery) | No (private actor) | N/A | N/A | N/A |
| **LLM/AI agent SEO** | Yes (public + discoverable) | No | No | No | No |
| **Phase normalization** | Yes (Arabic + Roman numerals) | Yes | N/A | N/A | N/A |
| **Graceful degradation** | Yes (Promise.allSettled) | Yes | N/A | N/A | N/A |
| **Setup time** | 5 minutes | Unknown (private) | Days to weeks | Days to weeks | Days to weeks |
| **Composite threat score** | 0-100 with 4 sub-models | 0-100 with 4 sub-models | None | None | None |
| **Adverse event divergence** | NORMAL/ELEVATED/CONCERNING/CRITICAL | Same | None | None | None |
| **Patent cliff warning** | Yes (<2 years triggers) | Yes | None | None | None |
| **Literature acceleration** | 20% threshold detection | Same | None | None | None |

**Key differentiators vs ApifyForge:**
- Public GitHub + llms.txt = AI agents can discover us, ApifyForge cannot be found
- Tiered pricing ($0.04-$0.15) vs flat $0.045 — composite reports cost more, simple lookups cost less
- Value-based pricing aligned with tool complexity

**Key differentiators vs commercial platforms:**
- 99.99% cheaper ($0.04-$0.15 vs $15,000-$50,000/year)
- AI-native MCP integration vs REST API requiring custom integration
- Built-in scoring models vs manual analysis
- No approval process, no sales calls, no contracts
- Works immediately — no API key required

---

## SEO Keywords

pharma pipeline intelligence MCP, pharmaceutical competitive intelligence, clinical trials API, FDA drug approvals, adverse event signals, patent cliff monitoring, pipeline threat score, biotech investment AI, drug safety surveillance, no API key needed, AI agent MCP server, LLM drug pipeline, Claude pharma, Cursor biotech, pharmaceutical AI agent, ClinicalTrials.gov API, USPTO patent search, PubMed literature trends, FAERS adverse events, drug recall tracking, regulatory pathway analysis, pharma BD intelligence, medical affairs surveillance, generic entry strategy, First-Mover Advantage, Literature Momentum Score, Apify MCP, MCP server pharmaceutical, biotech due diligence AI, competitive landscape AI

---

## License

Apache 2.0
