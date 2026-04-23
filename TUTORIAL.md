# Add Pharma Pipeline Intelligence to Your AI Agent in 5 Minutes

A practical guide for AI agent developers (LangChain, AutoGen, CrewAI) to add pharmaceutical competitive intelligence — clinical trials, FDA approvals, adverse event signals, patent cliffs, and pipeline threat scoring — to their agents in minutes. No API keys required beyond your Apify token.

## What We're Building

An AI agent that can:
1. Search clinical trials by drug, condition, or therapeutic area
2. Analyze competitive landscapes with Pipeline Threat Scores (0-100)
3. Detect adverse event signals in FDA FAERS reports
4. Track patent cliffs with First-Mover Advantage scores
5. Compare regulatory pathways (FDA-only; EMA unavailable)
6. Monitor drug recalls by classification
7. Assess literature momentum via PubMed publication trends
8. Generate full composite Pipeline Threat Reports fanning out to 6 sources simultaneously

## Prerequisites

- Node.js 18+
- An Apify API token ([free account works](https://console.apify.com/settings/integrations))
- An AI agent framework: LangChain, AutoGen, or CrewAI

## The MCPs We're Using

| MCP | Purpose | Cost | Endpoint |
|-----|---------|------|----------|
| `pharma-pipeline-intelligence-mcp` | Clinical trials, FDA approvals, FAERS, USPTO, PubMed, pipeline threat scoring | $0.04-0.15/call | `red-cars--pharma-pipeline-intelligence-mcp.apify.actor` |
| `drug-intelligence-mcp` | FDA drug labels, adverse events, drug interactions, recalls | $0.03-0.08/call | `red-cars--drug-intelligence-mcp.apify.actor` |
| `healthcare-compliance-mcp` | Medical device approvals, MAUDE, 510(k), clinical trials | $0.03-0.15/call | `red-cars--healthcare-compliance-mcp.apify.actor` |
| `academic-research-mcp` | Paper search, clinical trial publications | $0.01-0.10/call | `academic-research-mcp.apify.actor` |
| `patent-search-mcp` | Patent landscape, FTO analysis | $0.05-0.10/call | `patent-search-mcp.apify.actor` |

**Note:** Chain `pharma-pipeline-intelligence-mcp` with `drug-intelligence-mcp` for approved drug labeling data, `healthcare-compliance-mcp` for device trial overlap, `academic-research-mcp` for publication deep-dives, and `patent-search-mcp` for freedom-to-operate analysis.

---

## Step 1: Add the MCP Servers

### MCP Server Configuration

```json
{
  "mcpServers": {
    "pharma-pipeline": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-apify", "red-cars--pharma-pipeline-intelligence-mcp"],
      "env": {
        "APIFY_API_TOKEN": "${APIFY_API_TOKEN}"
      }
    },
    "drug-intelligence": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-apify", "red-cars--drug-intelligence-mcp"],
      "env": {
        "APIFY_API_TOKEN": "${APIFY_API_TOKEN}"
      }
    },
    "healthcare-compliance": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-apify", "red-cars--healthcare-compliance-mcp"],
      "env": {
        "APIFY_API_TOKEN": "${APIFY_API_TOKEN}"
      }
    },
    "academic-research": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-apify", "academic-research-mcp"],
      "env": {
        "APIFY_API_TOKEN": "${APIFY_API_TOKEN}"
      }
    },
    "patent-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-apify", "patent-search-mcp"],
      "env": {
        "APIFY_API_TOKEN": "${APIFY_API_TOKEN}"
      }
    }
  }
}
```

### LangChain Configuration

```javascript
import { ApifyAdapter } from "@langchain/community/tools/apify";
import { ChatOpenAI } from "@langchain/openai";
import { initializeAgentExecutorWithOptions } from "langchain/agents";

const tools = [
  new ApifyAdapter({
    token: process.env.APIFY_API_TOKEN,
    actorId: "red-cars--pharma-pipeline-intelligence-mcp",
  }),
  new ApifyAdapter({
    token: process.env.APIFY_API_TOKEN,
    actorId: "red-cars--drug-intelligence-mcp",
  }),
  new ApifyAdapter({
    token: process.env.APIFY_API_TOKEN,
    actorId: "red-cars--healthcare-compliance-mcp",
  }),
  new ApifyAdapter({
    token: process.env.APIFY_API_TOKEN,
    actorId: "academic-research-mcp",
  }),
  new ApifyAdapter({
    token: process.env.APIFY_API_TOKEN,
    actorId: "patent-search-mcp",
  }),
];

const agent = await initializeAgentExecutorWithOptions(tools, new ChatOpenAI({
  model: "gpt-4",
  temperature: 0
}), { agentType: "openai-functions" });
```

### AutoGen Configuration

```javascript
import { MCPAgent } from "autogen-mcp";

const pharmaAgent = new MCPAgent({
  name: "pharma-pipeline",
  mcpServers: [
    {
      name: "pharma-pipeline",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-apify", "red-cars--pharma-pipeline-intelligence-mcp"],
    },
    {
      name: "drug-intelligence",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-apify", "red-cars--drug-intelligence-mcp"],
    },
    {
      name: "healthcare-compliance",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-apify", "red-cars--healthcare-compliance-mcp"],
    },
    {
      name: "academic-research",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-apify", "academic-research-mcp"],
    },
    {
      name: "patent-search",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-apify", "patent-search-mcp"],
    }
  ]
});
```

### CrewAI Configuration

```yaml
# crewai.yaml
tools:
  - name: pharma_pipeline
    type: apify
    actor_id: red-cars--pharma-pipeline-intelligence-mcp
    api_token: ${APIFY_API_TOKEN}

  - name: drug_intelligence
    type: apify
    actor_id: red-cars--drug-intelligence-mcp
    api_token: ${APIFY_API_TOKEN}

  - name: healthcare_compliance
    type: apify
    actor_id: red-cars--healthcare-compliance-mcp
    api_token: ${APIFY_API_TOKEN}

  - name: academic_research
    type: apify
    actor_id: academic-research-mcp
    api_token: ${APIFY_API_TOKEN}

  - name: patent_search
    type: apify
    actor_id: patent-search-mcp
    api_token: ${APIFY_API_TOKEN}
```

---

## Step 2: Pharma Pipeline Queries

### Search Clinical Trials

```javascript
const result = await pharmaAgent.execute({
  action: "search_drug_pipeline",
  query: "semaglutide",
  status: "RECRUITING",
  phase: "PHASE3",
  maxResults: 10
});

console.log(result);
// Returns: clinical trials with nct_id, title, phase,
// status, condition, enrollment, sponsor, dates
```

### Analyze Competitive Landscape

```javascript
const result = await pharmaAgent.execute({
  action: "analyze_competitive_landscape",
  query: "GLP-1 agonist obesity"
});

console.log(result);
// Returns: fdaApprovals, activeTrialCount,
// pipelineThreatScore (0-100), threatLevel, competitors
```

### Detect Adverse Event Signals

```javascript
const result = await pharmaAgent.execute({
  action: "detect_adverse_event_signals",
  query: "semaglutide",
  limit: 500
});

console.log(result);
// Returns: totalReports, seriousEvents, deathReports,
// divergenceScore (0-100), divergenceLevel (NORMAL/ELEVATED/
// CONCERNING/CRITICAL), topReactions (MedDRA terms)
```

### Track Patent Exclusivity

```javascript
const result = await pharmaAgent.execute({
  action: "track_patent_exclusivity",
  query: "semaglutide"
});

console.log(result);
// Returns: patentCount, filingDates, expiryDates,
// yearsOfExclusivityRemaining, firstMoverAdvantageScore,
// patentCliffWarning (boolean)
```

### Compare Regulatory Pathways

```javascript
const result = await pharmaAgent.execute({
  action: "compare_regulatory_pathways",
  query: "GLP-1"
});

console.log(result);
// Returns: fdaApprovals list, regulatoryGapMetric null,
// note explaining EMA is unavailable via public API
```

### Monitor Drug Recalls

```javascript
const result = await pharmaAgent.execute({
  action: "monitor_drug_recalls",
  query: "metformin",
  classification: "Class I"
});

console.log(result);
// Returns: totalRecalls, classBreakdown,
// recalls with recallId, classification, reason,
// recallingFirm, recallInitiationDate
```

### Assess Literature Momentum

```javascript
const result = await pharmaAgent.execute({
  action: "assess_literature_momentum",
  query: "GLP-1 obesity",
  maxResults: 50
});

console.log(result);
// Returns: publicationCount, yearlyTrend, accelerationRatio,
// accelerating (boolean), literatureMomentumScore (0-100),
// topJournals, signals
```

### Generate Pipeline Threat Report

```javascript
const result = await pharmaAgent.execute({
  action: "generate_pipeline_threat_report",
  company: "Novo Nordisk",
  drug: "semaglutide",
  indication: "obesity"
});

console.log(result);
// Returns: compositeScore (0-100), riskLevel (LOW/MODERATE/
// HIGH/CRITICAL), all 4 sub-model scores with signals,
// allSignals array
```

---

## Step 3: Cross-MCP Chaining

### Full Example: Biotech Investment Due Diligence

Chain `pharma-pipeline-intelligence-mcp` with `drug-intelligence-mcp`, `academic-research-mcp`, and `patent-search-mcp` for comprehensive drug franchise analysis.

```javascript
import { ApifyClient } from 'apify';

const apify = new ApifyClient({ token: process.env.APIFY_API_TOKEN });

async function buildPharmaThreatAnalysis(company, drug, indication) {
  console.log(`\n=== Pharma Pipeline Threat Analysis: ${drug} (${company}) ===\n`);

  // Step 1: Generate composite Pipeline Threat Report
  // Fans out to all 6 sources simultaneously
  console.log('[1/5] Generating composite Pipeline Threat Report...');
  const threatReport = await apify.call('red-cars--pharma-pipeline-intelligence-mcp', {
    action: 'generate_pipeline_threat_report',
    company,
    drug,
    indication
  });

  // Step 2: Search drug labels via drug-intelligence-mcp
  console.log('[2/5] Fetching FDA drug labeling data...');
  const drugLabels = await apify.call('red-cars--drug-intelligence-mcp', {
    action: 'search_drug_labels',
    drug_name: drug
  });

  // Step 3: Track patent landscape via patent-search-mcp
  console.log('[3/5] Analyzing patent landscape...');
  const patentLandscape = await apify.call('patent-search-mcp', {
    action: 'patent_landscape',
    drug_name: drug
  });

  // Step 4: Assess literature momentum via pharma-pipeline
  console.log('[4/5] Measuring literature momentum...');
  const literature = await apify.call('red-cars--pharma-pipeline-intelligence-mcp', {
    action: 'assess_literature_momentum',
    query: `${drug} ${indication}`,
    maxResults: 50
  });

  // Step 5: Detect adverse event signals via pharma-pipeline
  console.log('[5/5] Screening adverse event signals...');
  const adverseSignals = await apify.call('red-cars--pharma-pipeline-intelligence-mcp', {
    action: 'detect_adverse_event_signals',
    query: drug,
    limit: 500
  });

  // Build synthesis report
  const report = {
    drug,
    company,
    indication,
    analyzedAt: new Date().toISOString().split('T')[0],
    compositeScore: threatReport.data?.compositeScore ?? null,
    riskLevel: threatReport.data?.riskLevel ?? 'UNKNOWN',
    pipelineThreat: threatReport.data?.pipelineThreat ?? null,
    firstMoverAdvantage: threatReport.data?.firstMoverAdvantage ?? null,
    adverseEventDivergence: threatReport.data?.adverseEventDivergence ?? null,
    literatureMomentum: threatReport.data?.literatureMomentum ?? null,
    literatureAcceleration: literature.data?.accelerating ?? null,
    literatureScore: literature.data?.literatureMomentumScore ?? null,
    adverseDivergenceLevel: adverseSignals.data?.divergenceLevel ?? 'UNKNOWN',
    adverseDivergenceScore: adverseSignals.data?.divergenceScore ?? null,
    patentCliffWarning: threatReport.data?.firstMoverAdvantage?.patentCliffWarning ?? false,
    yearsOfExclusivity: threatReport.data?.firstMoverAdvantage?.yearsOfExclusivity ?? null,
    patentLandscape: patentLandscape.data ?? null,
    signals: [
      ...(threatReport.data?.allSignals ?? []),
      literature.data?.accelerating ? `Literature accelerating: ${literature.data.accelerationRatio}% growth` : null,
      adverseSignals.data?.divergenceLevel !== 'NORMAL' ? `Adverse event divergence: ${adverseSignals.data.divergenceLevel}` : null
    ].filter(Boolean)
  };

  console.log('\n=== THREAT ANALYSIS SUMMARY ===');
  console.log(`Drug: ${report.drug}`);
  console.log(`Company: ${report.company}`);
  console.log(`Indication: ${report.indication}`);
  console.log(`Pipeline Threat Score: ${report.compositeScore}/100 (${report.riskLevel})`);
  console.log(`First-Mover Advantage: ${report.firstMoverAdvantage?.score}/100`);
  console.log(`Years of Exclusivity: ${report.yearsOfExclusivity ?? 'unknown'}`);
  console.log(`Patent Cliff Warning: ${report.patentCliffWarning ? 'YES' : 'No'}`);
  console.log(`Adverse Event Divergence: ${report.adverseDivergenceLevel} (${report.adverseDivergenceScore}/100)`);
  console.log(`Literature Momentum: ${report.literatureAcceleration ? 'ACCELERATING' : 'STABLE'} (${report.literatureScore}/100)`);
  console.log(`\nSignals (${report.signals.length}):`);
  report.signals.forEach(s => console.log(`  - ${s}`));

  return report;
}

buildPharmaThreatAnalysis('Novo Nordisk', 'semaglutide', 'obesity').catch(console.error);
```

### Expected Output

```
=== Pharma Pipeline Threat Analysis: semaglutide (Novo Nordisk) ===

[1/5] Generating composite Pipeline Threat Report...
[2/5] Fetching FDA drug labeling data...
[3/5] Analyzing patent landscape...
[4/5] Measuring literature momentum...
[5/5] Screening adverse event signals...

=== THREAT ANALYSIS SUMMARY ===
Drug: semaglutide
Company: Novo Nordisk
Indication: obesity
Pipeline Threat Score: 64/100 (HIGH)
First-Mover Advantage: 78/100
Years of Exclusivity: 11
Patent Cliff Warning: No
Adverse Event Divergence: ELEVATED (45/100)
Literature Momentum: ACCELERATING (68/100)

Signals (7):
  - 8 Phase 3 competitors in same indication
  - 4 recent FDA approvals in drug class
  - 11 years exclusivity remaining
  - Phase 4 lead indicates established market position
  - Serious ratio exceeds 30% threshold
  - Literature accelerating: 31% growth
  - Adverse event divergence: ELEVATED
```

### Cross-MCP Chain: Patent Cliff Risk Assessment

```javascript
async function assessPatentCliffRisk(drug) {
  console.log(`\n=== Patent Cliff Risk: ${drug} ===\n`);

  // Step 1: Get patent exclusivity data from pharma-pipeline
  const exclusivity = await apify.call('red-cars--pharma-pipeline-intelligence-mcp', {
    action: 'track_patent_exclusivity',
    query: drug
  });

  // Step 2: Get patent landscape from patent-search-mcp
  const landscape = await apify.call('patent-search-mcp', {
    action: 'patent_landscape',
    drug_name: drug
  });

  // Step 3: Check for drug recalls
  const recalls = await apify.call('red-cars--pharma-pipeline-intelligence-mcp', {
    action: 'monitor_drug_recalls',
    query: drug
  });

  // Step 4: Generate pipeline threat report
  const threat = await apify.call('red-cars--pharma-pipeline-intelligence-mcp', {
    action: 'generate_pipeline_threat_report',
    company: exclusivity.data?.assignee || 'Unknown',
    drug: drug,
    indication: ''
  });

  const report = {
    drug,
    fmaScore: exclusivity.data?.firstMoverAdvantageScore ?? null,
    yearsRemaining: exclusivity.data?.yearsOfExclusivityRemaining ?? null,
    earliestExpiry: exclusivity.data?.earliestPatentExpiry ?? null,
    patentCliffWarning: exclusivity.data?.patentCliffWarning ?? false,
    recallCount: recalls.data?.totalRecalls ?? 0,
    compositeThreatScore: threat.data?.compositeScore ?? null,
    riskLevel: threat.data?.riskLevel ?? 'UNKNOWN'
  };

  console.log('=== PATENT CLIFF SUMMARY ===');
  console.log(`Drug: ${report.drug}`);
  console.log(`First-Mover Advantage Score: ${report.fmaScore}/100`);
  console.log(`Years of Exclusivity Remaining: ${report.yearsRemaining}`);
  console.log(`Earliest Patent Expiry: ${report.earliestExpiry}`);
  console.log(`Patent Cliff Warning: ${report.patentCliffWarning ? 'YES (<2 years)' : 'No'}`);
  console.log(`Recall Count: ${report.recallCount}`);
  console.log(`Composite Threat Score: ${report.compositeThreatScore}/100 (${report.riskLevel})`);

  return report;
}

assessPatentCliffRisk('pembrolizumab').catch(console.error);
```

### Cross-MCP Chain: Safety Signal Investigation

```javascript
async function investigateSafetySignals(drug) {
  console.log(`\n=== Safety Signal Investigation: ${drug} ===\n`);

  // Step 1: Detect adverse event signals via pharma-pipeline
  const signals = await apify.call('red-cars--pharma-pipeline-intelligence-mcp', {
    action: 'detect_adverse_event_signals',
    query: drug,
    limit: 500
  });

  // Step 2: Search academic literature via academic-research-mcp
  const papers = await apify.call('academic-research-mcp', {
    action: 'search_papers',
    query: `${drug} adverse events safety`,
    max_results: 20
  });

  // Step 3: Check drug recalls via pharma-pipeline
  const recalls = await apify.call('red-cars--pharma-pipeline-intelligence-mcp', {
    action: 'monitor_drug_recalls',
    query: drug
  });

  // Step 4: Check drug labels via drug-intelligence-mcp
  const labels = await apify.call('red-cars--drug-intelligence-mcp', {
    action: 'search_drug_labels',
    drug_name: drug
  });

  const report = {
    drug,
    divergenceScore: signals.data?.divergenceScore ?? null,
    divergenceLevel: signals.data?.divergenceLevel ?? 'UNKNOWN',
    totalReports: signals.data?.totalReports ?? 0,
    seriousRatio: signals.data?.seriousRatio ?? null,
    deathReports: signals.data?.deathReports ?? 0,
    topReactions: signals.data?.topReactions ?? [],
    recallCount: recalls.data?.totalRecalls ?? 0,
    recentPapers: papers.data?.total || 0,
    blackBoxWarning: labels.data?.labels?.[0]?.blackBoxWarning ?? false
  };

  console.log('=== SAFETY SIGNAL SUMMARY ===');
  console.log(`Drug: ${report.drug}`);
  console.log(`Divergence Score: ${report.divergenceScore}/100 (${report.divergenceLevel})`);
  console.log(`Total FAERS Reports: ${report.totalReports}`);
  console.log(`Serious Event Ratio: ${(report.seriousRatio * 100).toFixed(1)}%`);
  console.log(`Death Reports: ${report.deathReports}`);
  console.log(`Top MedDRA Reactions: ${report.topReactions.map(r => r.term).join(', ')}`);
  console.log(`Drug Recalls: ${report.recallCount}`);
  console.log(`Recent Safety Papers: ${report.recentPapers}`);
  console.log(`Black Box Warning: ${report.blackBoxWarning ? 'YES' : 'No'}`);

  if (report.divergenceLevel === 'CONCERNING' || report.divergenceLevel === 'CRITICAL') {
    console.log('\n[ALERT] Elevated safety signals detected — warrant medical affairs review');
  }

  return report;
}

investigateSafetySignals('semaglutide').catch(console.error);
```

---

## MCP Tool Reference

### Pharma Pipeline Intelligence MCP

**Endpoint:** `red-cars--pharma-pipeline-intelligence-mcp.apify.actor`

| Tool | Price | Description | Key Parameters |
|------|-------|-------------|----------------|
| `search_drug_pipeline` | $0.05 | Search ClinicalTrials.gov | `query`, `status`, `phase`, `maxResults` |
| `analyze_competitive_landscape` | $0.08 | FDA analysis with threat score | `query` |
| `detect_adverse_event_signals` | $0.06 | FDA FAERS screening | `query`, `limit` |
| `track_patent_exclusivity` | $0.05 | USPTO patent portfolio | `query` |
| `compare_regulatory_pathways` | $0.05 | FDA approval status | `query` |
| `monitor_drug_recalls` | $0.04 | FDA recall database | `query`, `classification` |
| `assess_literature_momentum` | $0.05 | PubMed publication trends | `query`, `maxResults` |
| `generate_pipeline_threat_report` | $0.15 | Full composite report (6 sources) | `company`, `drug`, `indication` |

### Drug Intelligence MCP

**Endpoint:** `red-cars--drug-intelligence-mcp.apify.actor`

| Tool | Price | Description | Key Parameters |
|------|-------|-------------|----------------|
| `search_drug_labels` | $0.03 | FDA drug label database | `drug_name`, `indication` |
| `get_drug_adverse_events` | $0.08 | FDA adverse event reports | `drug_name`, `seriousness`, `date_from` |
| `search_drug_recalls` | $0.03 | FDA drug recalls | `drug_name` |
| `get_drug_interactions` | $0.05 | Drug-drug interactions | `drug1`, `drug2` |

### Healthcare Compliance MCP

**Endpoint:** `red-cars--healthcare-compliance-mcp.apify.actor`

| Tool | Price | Description | Key Parameters |
|------|-------|-------------|----------------|
| `search_fda_approvals` | $0.03 | FDA device approvals | `searchTerm`, `deviceState`, `dateFrom` |
| `search_maude_reports` | $0.05 | FDA adverse event reports | `manufacturer`, `deviceName`, `dateFrom` |
| `search_510k` | $0.03 | 510(k) premarket clearances | `searchTerm`, `productCode`, `dateFrom` |
| `search_clinical_trials` | $0.05 | ClinicalTrials.gov | `condition`, `phase`, `status` |
| `assess_medical_device_risk` | $0.15 | Risk assessment with scoring | `device_name`, `manufacturer`, `risk_factors` |
| `search_udi_database` | $0.03 | Unique Device Identification | `device_name`, `company_name` |
| `search_recalls` | $0.05 | FDA device recalls | `recalling_firm`, `classification`, `dateFrom` |

### Academic Research MCP

**Endpoint:** `academic-research-mcp.apify.actor`

| Tool | Price | Description | Key Parameters |
|------|-------|-------------|----------------|
| `search_papers` | $0.02 | Search 600M+ papers | `query`, `max_results` |
| `find_grants` | $0.03 | NIH/NSF grants | `query` |

### Patent Search MCP

**Endpoint:** `patent-search-mcp.apify.actor`

| Tool | Price | Description | Key Parameters |
|------|-------|-------------|----------------|
| `patent_landscape` | $0.10 | Full patent landscape | `drug_name` |
| `get_patent` | $0.05 | Single patent lookup | `patent_number` |

---

## Cost Summary

| MCP | Typical Query | Est. Cost |
|-----|---------------|-----------|
| pharma-pipeline-intelligence-mcp | Clinical trials search | ~$0.05 |
| pharma-pipeline-intelligence-mcp | Competitive landscape | ~$0.08 |
| pharma-pipeline-intelligence-mcp | Adverse event signals | ~$0.06 |
| pharma-pipeline-intelligence-mcp | Pipeline threat report | ~$0.15 |
| drug-intelligence-mcp | Drug label search | ~$0.03 |
| academic-research-mcp | Paper search | ~$0.02 |
| patent-search-mcp | Patent landscape | ~$0.10 |

Full biotech due diligence (5 MCP calls): ~$0.44 per analysis

---

## Next Steps

1. Clone the [pharma-pipeline-intelligence-mcp](https://github.com/red-cars-io/pharma-pipeline-intelligence-mcp) repo
2. Copy `.env.example` to `.env` and add your `APIFY_API_TOKEN`
3. Run `npm install`
4. Try the examples: `node examples/pharma-threat-analysis.js`

## Related Repositories

- [Drug Intelligence MCP](https://github.com/red-cars-io/drug-intelligence-mcp) - FDA drug labels, adverse events, drug interactions
- [Healthcare Compliance MCP](https://github.com/red-cars-io/healthcare-compliance-mcp) - Medical device approvals, MAUDE, 510(k) clearances
- [Academic Research MCP](https://github.com/red-cars-io/academic-research-mcp) - 600M+ papers, citations, NIH grants
- [Patent Search MCP](https://github.com/red-cars-io/patent-search-mcp) - Patent landscape, FTO analysis
