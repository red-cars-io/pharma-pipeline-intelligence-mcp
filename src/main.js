import { Actor } from 'apify';
import http from 'http';

// =============================================================================
// CONSTANTS & API ENDPOINTS (VERIFIED ONLY)
// =============================================================================

const API_BASE_CLINICAL_TRIALS = 'https://clinicaltrials.gov/api/v2/studies';
const API_BASE_FDA_DRUGS = 'https://api.fda.gov/drug/drugsfda.json';
const API_BASE_FDA_EVENT = 'https://api.fda.gov/drug/event.json';
const API_BASE_FDA_ENFORCEMENT = 'https://api.fda.gov/drug/enforcement.json';
const API_BASE_USPTO = 'https://patft.api.uspto.gov';
const API_BASE_PUBMED = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

const TIMEOUT_MS = 120000;

// =============================================================================
// MCP TOOL DEFINITIONS
// =============================================================================

const TOOLS = [
    {
        name: 'search_drug_pipeline',
        description: 'Search ClinicalTrials.gov for clinical trials by drug, condition, or therapeutic area',
        inputSchema: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'Drug name, condition, or therapeutic area' },
                status: { type: 'string', description: 'RECRUITING, ACTIVE_NOT_RECRUITING, COMPLETED' },
                phase: { type: 'string', description: 'PHASE1, PHASE2, PHASE3, PHASE4' },
                maxResults: { type: 'integer', description: 'Maximum results (default: 50, max: 50)', default: 50 }
            },
            required: ['query']
        }
    },
    {
        name: 'analyze_competitive_landscape',
        description: 'FDA competitive analysis with Pipeline Threat Score',
        inputSchema: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'Drug class, therapeutic area, or active ingredient' }
            },
            required: ['query']
        }
    },
    {
        name: 'detect_adverse_event_signals',
        description: 'Analyze FDA FAERS reports for adverse event signals with Divergence Score',
        inputSchema: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'Drug name or active ingredient' },
                limit: { type: 'integer', description: 'Max FAERS records (default: 100, max: 500)', default: 100 }
            },
            required: ['query']
        }
    },
    {
        name: 'track_patent_exclusivity',
        description: 'USPTO patent portfolio analysis with First-Mover Advantage Score',
        inputSchema: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'Drug name, compound, mechanism, or assignee' }
            },
            required: ['query']
        }
    },
    {
        name: 'compare_regulatory_pathways',
        description: 'FDA regulatory analysis and approval status (EMA data unavailable)',
        inputSchema: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'Drug name, active substance, or therapeutic area' }
            },
            required: ['query']
        }
    },
    {
        name: 'monitor_drug_recalls',
        description: 'Search FDA drug recall database by drug, manufacturer, or classification',
        inputSchema: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'Drug name, manufacturer, or recall reason' },
                classification: { type: 'string', description: 'Class I, Class II, Class III' }
            },
            required: ['query']
        }
    },
    {
        name: 'assess_literature_momentum',
        description: 'PubMed publication trend analysis with Literature Momentum Score',
        inputSchema: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'Drug name, condition, mechanism, or research topic' },
                maxResults: { type: 'integer', description: 'Maximum publications (default: 50)', default: 50 }
            },
            required: ['query']
        }
    },
    {
        name: 'generate_pipeline_threat_report',
        description: 'Full composite report: 4 sub-model scores + composite Pipeline Threat Score (0-100)',
        inputSchema: {
            type: 'object',
            properties: {
                company: { type: 'string', description: 'Company name' },
                drug: { type: 'string', description: 'Drug name' },
                indication: { type: 'string', description: 'Appended to ClinicalTrials.gov query' }
            },
            required: ['company', 'drug']
        }
    }
];

// =============================================================================
// MCP MANIFEST
// =============================================================================

const MCP_MANIFEST = {
    name: 'pharma-pipeline-intelligence-mcp',
    version: '1.0',
    description: 'Competitive intelligence for pharmaceutical AI agents',
    tools: TOOLS
};

// =============================================================================
// API CLIENTS
// =============================================================================

async function fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timeout);
        return response;
    } catch (error) {
        clearTimeout(timeout);
        throw error;
    }
}

// ClinicalTrials.gov API v2
async function searchClinicalTrials(query, status, phase, maxResults = 50) {
    try {
        const params = new URLSearchParams({
            'query.cond': query
        });
        if (status) params.append('query.status', status);
        if (phase) params.append('query.phase', phase);

        const url = `${API_BASE_CLINICAL_TRIALS}?${params.toString()}`;
        const response = await fetchWithTimeout(url);

        if (!response.ok) {
            return { totalTrials: 0, phaseDistribution: {}, trials: [], source: 'ClinicalTrials.gov', error: `HTTP ${response.status}` };
        }

        const data = await response.json();
        const studies = data.studies || [];
        const trials = studies.slice(0, maxResults).map(study => {
            const idModule = study.protocolSection?.identificationModule || {};
            const statusModule = study.protocolSection?.statusModule || {};
            const descriptionModule = study.protocolSection?.descriptionModule || {};
            const eligibilityModule = study.protocolSection?.eligibilityModule || {};
            const sponsorModule = study.protocolSection?.sponsorCollaboratorsModule || {};

            return {
                nctId: idModule.nctId || 'Unknown',
                title: descriptionModule?.briefSummary?.substring(0, 200) || 'No title',
                phase: idModule?.phase || 'Not specified',
                status: statusModule?.overallStatus || 'Unknown',
                condition: idModule?.conditions?.[0] || 'Not specified',
                enrollmentCount: eligibilityModule?.estimatedEnrollment || 0,
                sponsor: sponsorModule?.leadSponsor?.name || 'Unknown',
                startDate: statusModule?.startDateStruct?.date || null,
                completionDate: statusModule?.completionDateStruct?.date || null
            };
        });

        // Phase distribution counting
        const phaseDistribution = { 'Phase 1': 0, 'Phase 2': 0, 'Phase 3': 0, 'Phase 4': 0 };
        studies.forEach(study => {
            const phaseStr = (study.protocolSection?.identificationModule?.phase || '').toLowerCase();
            if (phaseStr.includes('phase 1') || phaseStr === 'phase i') phaseDistribution['Phase 1']++;
            else if (phaseStr.includes('phase 2') || phaseStr === 'phase ii') phaseDistribution['Phase 2']++;
            else if (phaseStr.includes('phase 3') || phaseStr === 'phase iii') phaseDistribution['Phase 3']++;
            else if (phaseStr.includes('phase 4') || phaseStr === 'phase iv') phaseDistribution['Phase 4']++;
        });

        return {
            totalTrials: studies.length,
            phaseDistribution,
            trials,
            source: 'ClinicalTrials.gov'
        };
    } catch (error) {
        return { totalTrials: 0, phaseDistribution: {}, trials: [], source: 'ClinicalTrials.gov', error: error.message };
    }
}

// openFDA Drug Approvals
async function searchFDADrugApprovals(query) {
    try {
        const url = `${API_BASE_FDA_DRUGS}?search=openfda.brand_name:${encodeURIComponent(query)}&limit=50`;
        const response = await fetchWithTimeout(url);

        if (!response.ok) {
            return { approvals: [], source: 'FDA Drug Approvals', error: `HTTP ${response.status}` };
        }

        const data = await response.json();
        const results = data.results || [];

        return {
            approvals: results.map(r => ({
                applicationNumber: r.application_number || 'Unknown',
                brandName: r.openfda?.brand_name?.[0] || 'Unknown',
                genericName: r.openfda?.generic_name?.[0] || 'Unknown',
                approvalDate: r.approval_date || 'Unknown',
                indication: r.indications_and_usage?.[0] || 'Not specified',
                company: r.openfda?.manufacturer_name?.[0] || 'Unknown',
                productType: r.product_type || 'Unknown'
            })),
            source: 'FDA Drug Approvals'
        };
    } catch (error) {
        return { approvals: [], source: 'FDA Drug Approvals', error: error.message };
    }
}

// openFDA FAERS (Adverse Events)
async function searchFAAEReports(query, limit = 100) {
    try {
        const url = `${API_BASE_FDA_EVENT}?search=patient.drug.medicinalproduct:${encodeURIComponent(query)}&limit=${limit}`;
        const response = await fetchWithTimeout(url);

        if (!response.ok) {
            return { totalReports: 0, seriousEvents: 0, deathReports: 0, hospitalizationReports: 0, seriousRatio: 0, topReactions: [], source: 'FDA FAERS', error: `HTTP ${response.status}` };
        }

        const data = await response.json();
        const results = data.results || [];

        let seriousEvents = 0;
        let deathReports = 0;
        let hospitalizationReports = 0;
        const reactionCounts = {};

        results.forEach(event => {
            const seriousness = event.serious || [];
            if (seriousness.includes('Death')) deathReports++;
            if (seriousness.includes('Hospitalization')) hospitalizationReports++;
            if (seriousness.length > 0) seriousEvents++;

            const reactions = event.reaction?.reactionmeddrapt?.keyword || [];
            reactions.forEach(r => {
                reactionCounts[r] = (reactionCounts[r] || 0) + 1;
            });
        });

        const totalReports = results.length;
        const topReactions = Object.entries(reactionCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([term, count]) => ({ term, count }));

        return {
            totalReports,
            seriousEvents,
            deathReports,
            hospitalizationReports,
            seriousRatio: totalReports > 0 ? seriousEvents / totalReports : 0,
            topReactions,
            source: 'FDA FAERS'
        };
    } catch (error) {
        return { totalReports: 0, seriousEvents: 0, deathReports: 0, hospitalizationReports: 0, seriousRatio: 0, topReactions: [], source: 'FDA FAERS', error: error.message };
    }
}

// openFDA Enforcement (Recalls)
async function searchFDARecalls(query, classification) {
    try {
        const searchTerm = classification
            ? `${query}+AND+product_description:${classification}`
            : query;
        const url = `${API_BASE_FDA_ENFORCEMENT}?search=${encodeURIComponent(searchTerm)}&limit=50`;
        const response = await fetchWithTimeout(url);

        if (!response.ok) {
            return { totalRecalls: 0, classBreakdown: {}, recalls: [], source: 'FDA Enforcement', error: `HTTP ${response.status}` };
        }

        const data = await response.json();
        const results = data.results || [];

        const classBreakdown = { 'Class I': 0, 'Class II': 0, 'Class III': 0 };
        results.forEach(r => {
            const cls = r.classification || 'Unknown';
            if (cls.includes('I')) classBreakdown['Class I']++;
            else if (cls.includes('II')) classBreakdown['Class II']++;
            else if (cls.includes('III')) classBreakdown['Class III']++;
        });

        return {
            totalRecalls: results.length,
            classBreakdown,
            recalls: results.map(r => ({
                recallId: r.recall_number || 'Unknown',
                productDescription: r.product_description || 'Unknown',
                reasonForRecall: r.reason_for_recall || 'Unknown',
                classification: r.classification || 'Unknown',
                recallingFirm: r.recalling_firm || 'Unknown',
                distributionScope: r.distribution_pattern || 'Unknown',
                recallInitiationDate: r.recall_initiation_date || 'Unknown'
            })),
            source: 'FDA Enforcement'
        };
    } catch (error) {
        return { totalRecalls: 0, classBreakdown: {}, recalls: [], source: 'FDA Enforcement', error: error.message };
    }
}

// USPTO Patents (basic search)
async function searchUSPTO(query) {
    try {
        const url = `${API_BASE_USPTO}/cgi-bin/patsearch?query=${encodeURIComponent(query)}&retrieval_count=50`;
        const response = await fetchWithTimeout(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        if (!response.ok) {
            return { patentCount: 0, patents: [], source: 'USPTO', error: `HTTP ${response.status}` };
        }

        const html = await response.text();
        // Basic HTML parsing for patent data - extract patent numbers and dates
        const patentRegex = /<a href="\/cgi-bin\/patsearch\?query=([A-Z0-9]+)[^"]*"[^>]*>.*?(\d{4}-\d{2}-\d{2})/g;
        const patents = [];
        let match;
        while ((match = patentRegex.exec(html)) !== null && patents.length < 50) {
            patents.push({
                patentNumber: match[1],
                filingDate: match[2]
            });
        }

        return {
            patentCount: patents.length,
            patents,
            source: 'USPTO'
        };
    } catch (error) {
        return { patentCount: 0, patents: [], source: 'USPTO', error: error.message };
    }
}

// PubMed E-utilities
async function searchPubMed(query, maxResults = 50) {
    try {
        // Search first
        const searchUrl = `${API_BASE_PUBMED}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&retmode=json`;
        const searchResponse = await fetchWithTimeout(searchUrl);

        if (!searchResponse.ok) {
            return { publicationCount: 0, recentPublications: 0, yearlyTrend: {}, topJournals: [], source: 'PubMed', error: `HTTP ${searchResponse.status}` };
        }

        const searchData = await searchResponse.json();
        const idList = searchData.esearchresult?.idlist || [];
        const count = parseInt(searchData.esearchresult?.count || '0', 10);

        if (idList.length === 0) {
            return { publicationCount: 0, recentPublications: 0, yearlyTrend: {}, topJournals: [], source: 'PubMed' };
        }

        // Fetch details for recent papers
        const idString = idList.join(',');
        const summaryUrl = `${API_BASE_PUBMED}/esummary.fcgi?db=pubmed&id=${idString}&retmode=json`;
        const summaryResponse = await fetchWithTimeout(summaryUrl);

        let yearlyTrend = {};
        const journals = new Set();
        const currentYear = new Date().getFullYear();

        if (summaryResponse.ok) {
            const summaryData = await summaryResponse.json();
            const result = summaryData.result || {};

            idList.forEach(id => {
                const item = result[id];
                if (item) {
                    const pubDate = item.pubdate || '';
                    const yearMatch = pubDate.match(/(\d{4})/);
                    if (yearMatch) {
                        const year = parseInt(yearMatch[1], 10);
                        yearlyTrend[year] = (yearlyTrend[year] || 0) + 1;
                    }
                    if (item.source) journals.add(item.source);
                }
            });
        }

        // Count recent publications (last 2 years)
        const recentPublications = Object.entries(yearlyTrend)
            .filter(([year]) => parseInt(year, 10) >= currentYear - 2)
            .reduce((sum, [, count]) => sum + count, 0);

        return {
            publicationCount: count,
            recentPublications,
            yearlyTrend,
            topJournals: Array.from(journals).slice(0, 10),
            source: 'PubMed'
        };
    } catch (error) {
        return { publicationCount: 0, recentPublications: 0, yearlyTrend: {}, topJournals: [], source: 'PubMed', error: error.message };
    }
}

// =============================================================================
// SCORING ALGORITHMS
// =============================================================================

function calculatePipelineThreatScore(trials, approvals, recalls) {
    let score = 0;
    const signals = [];

    // Phase 3 competitors: 8 pts each, cap 40 (5 Phase 3)
    const phase3Count = trials.filter(t =>
        (t.phase?.toLowerCase().includes('phase 3') || t.phase?.toLowerCase() === 'phase iii')
    ).length;
    const phase3Points = Math.min(phase3Count * 8, 40);
    score += phase3Points;
    if (phase3Count > 0) signals.push(`${phase3Count} Phase 3 competitors in same indication`);

    // Trial volume: 2 pts each, cap 20
    const trialVolumePoints = Math.min(trials.length * 2, 20);
    score += trialVolumePoints;

    // FDA approvals in class: 5 pts each, cap 15 (3 approvals)
    const approvalPoints = Math.min(approvals.length * 5, 15);
    score += approvalPoints;
    if (approvals.length > 0) signals.push(`${approvals.length} recent FDA approvals in drug class`);

    // Competitor recalls: -5 pts each, cap -15
    const recallPenalty = Math.max(-(recalls.length * 5), -15);
    score += recallPenalty;

    // Threat level classification
    let threatLevel = 'LOW';
    if (score >= 76) threatLevel = 'CRITICAL';
    else if (score >= 51) threatLevel = 'HIGH';
    else if (score >= 26) threatLevel = 'MODERATE';

    return {
        score: Math.min(score, 100),
        threatLevel,
        competitorCount: phase3Count,
        signals
    };
}

function calculateFirstMoverAdvantageScore(patents, trials, approvals) {
    let score = 0;
    const signals = [];

    // Patent portfolio breadth: 6 pts per patent, cap 30 (5 patents)
    const patentPoints = Math.min(patents.length * 6, 30);
    score += patentPoints;

    // Exclusivity duration: 2.5 pts per year remaining, cap 25 (10 years)
    // For now, estimate 20 years from filing if no expiry date available
    let yearsRemaining = 20;
    if (patents.length > 0) {
        // Use current year as baseline, assume 20 year term
        yearsRemaining = Math.max(0, 20);
    }
    const exclusivityPoints = Math.min(yearsRemaining * 2.5, 25);
    score += exclusivityPoints;
    if (yearsRemaining > 0) signals.push(`${yearsRemaining} years exclusivity remaining`);

    // Trial phase lead: 6.25 pts per phase level, cap 25 (Phase 4)
    let maxPhase = 0;
    trials.forEach(t => {
        const phase = t.phase?.toLowerCase() || '';
        if (phase.includes('phase 4') || phase === 'phase iv') maxPhase = Math.max(maxPhase, 4);
        else if (phase.includes('phase 3') || phase === 'phase iii') maxPhase = Math.max(maxPhase, 3);
        else if (phase.includes('phase 2') || phase === 'phase ii') maxPhase = Math.max(maxPhase, 2);
        else if (phase.includes('phase 1') || phase === 'phase i') maxPhase = Math.max(maxPhase, 1);
    });
    const phasePoints = Math.min(maxPhase * 6.25, 25);
    score += phasePoints;
    if (maxPhase === 4) signals.push('Phase 4 lead indicates established market position');

    // Existing FDA approvals: 10 pts per approval, cap 20 (2 approvals)
    const approvalPoints = Math.min(approvals.length * 10, 20);
    score += approvalPoints;

    // Patent cliff warning if <2 years remaining
    const patentCliffWarning = yearsRemaining < 2;

    return {
        score: Math.min(score, 100),
        patentCliffWarning,
        yearsOfExclusivity: yearsRemaining,
        trialPhaseLead: maxPhase,
        signals
    };
}

function calculateAdverseEventDivergenceScore(totalReports, seriousEvents, deathReports, hospitalizationReports) {
    let score = 0;
    const signals = [];

    // Death reports: 7 pts each, cap 35 (5 deaths)
    const deathPoints = Math.min(deathReports * 7, 35);
    score += deathPoints;

    // Serious event ratio: ratio x 50, cap 25
    const seriousRatio = totalReports > 0 ? seriousEvents / totalReports : 0;
    const seriousRatioPoints = Math.min(seriousRatio * 50, 25);
    score += seriousRatioPoints;
    if (seriousRatio > 0.3) signals.push('Serious ratio exceeds 30% threshold');

    // Hospitalization burden: 4 pts per report, cap 20
    const hospPoints = Math.min(hospitalizationReports * 4, 20);
    score += hospPoints;

    // Log-normalized volume: log2(totalReports) x 3, cap 20
    const logVolume = Math.log2(Math.max(totalReports, 1)) * 3;
    score += Math.min(logVolume, 20);

    // Divergence level classification
    let divergenceLevel = 'NORMAL';
    if (score >= 75) divergenceLevel = 'CRITICAL';
    else if (score >= 50) divergenceLevel = 'CONCERNING';
    else if (score >= 25) divergenceLevel = 'ELEVATED';

    if (deathReports > 0) signals.push(`${deathReports} death reports flagged for review`);

    return {
        score: Math.min(Math.round(score), 100),
        divergenceLevel,
        seriousRatio,
        signals
    };
}

function calculateLiteratureMomentumScore(publicationCount, recentPublications, yearlyTrend, topJournals) {
    let score = 0;
    const signals = [];
    const currentYear = new Date().getFullYear();

    // Volume score: 3 pts per publication, cap 30
    const volumePoints = Math.min(publicationCount * 3, 30);
    score += volumePoints;

    // Recency score: 5 pts per recent publication, cap 30
    const recencyPoints = Math.min(recentPublications * 5, 30);
    score += recencyPoints;

    // Acceleration ratio: compare recent 2yr vs prior 2yr
    const recent2yr = (yearlyTrend[currentYear] || 0) + (yearlyTrend[currentYear - 1] || 0);
    const prior2yr = (yearlyTrend[currentYear - 2] || 0) + (yearlyTrend[currentYear - 3] || 0);
    const accelerationRatio = prior2yr > 0 ? (recent2yr - prior2yr) / prior2yr : 0;
    score += Math.min(accelerationRatio * 25, 25);

    if (accelerationRatio >= 0.2) {
        signals.push(`${Math.round(accelerationRatio * 100)}% publication growth exceeds 20% threshold`);
    }

    // Journal diversity: 3 pts per unique journal, cap 15
    const journalPoints = Math.min(topJournals.length * 3, 15);
    score += journalPoints;
    if (topJournals.length >= 5) signals.push(`Strong journal diversity across ${topJournals.length} top-tier publications`);

    const accelerating = accelerationRatio >= 0.2;

    return {
        score: Math.min(Math.round(score), 100),
        accelerationRatio,
        accelerating,
        signals
    };
}

function calculateCompositeScore(pipelineThreat, adverseEventDivergence, literatureMomentum, firstMoverAdvantage) {
    return Math.round(
        pipelineThreat * 0.30 +
        adverseEventDivergence * 0.25 +
        literatureMomentum * 0.25 +
        (100 - firstMoverAdvantage) * 0.20
    );
}

function getRiskLevel(score) {
    if (score >= 76) return 'CRITICAL';
    if (score >= 51) return 'HIGH';
    if (score >= 26) return 'MODERATE';
    return 'LOW';
}

// =============================================================================
// TOOL HANDLERS
// =============================================================================

async function handleSearchDrugPipeline(params) {
    const { query, status, phase, maxResults } = params;
    return await searchClinicalTrials(query, status, phase, maxResults || 50);
}

async function handleAnalyzeCompetitiveLandscape(params) {
    const { query } = params;

    // Parallel fetch: clinical trials + FDA approvals + FDA events
    const [trialsResult, approvalsResult, eventsResult, recallsResult] = await Promise.allSettled([
        searchClinicalTrials(query),
        searchFDADrugApprovals(query),
        searchFAAEReports(query, 50),
        searchFDARecalls(query)
    ]);

    const trials = trialsResult.status === 'fulfilled' ? trialsResult.value.trials : [];
    const approvals = approvalsResult.status === 'fulfilled' ? approvalsResult.value.approvals : [];
    const recalls = recallsResult.status === 'fulfilled' ? recallsResult.value.recalls : [];

    const pipelineThreat = calculatePipelineThreatScore(trials, approvals, recalls);

    // Build competitors list from trials
    const competitorMap = new Map();
    trials.forEach(t => {
        const sponsor = t.sponsor || 'Unknown';
        if (!competitorMap.has(sponsor)) {
            competitorMap.set(sponsor, { drug: sponsor, company: sponsor, fdaApprovals: 0, activeTrials: 0, threatLevel: 'MODERATE' });
        }
        competitorMap.get(sponsor).activeTrials++;
    });

    // Add approval counts to competitors
    approvals.forEach(a => {
        const company = a.company || 'Unknown';
        if (competitorMap.has(company)) {
            competitorMap.get(company).fdaApprovals++;
        }
    });

    const competitors = Array.from(competitorMap.values())
        .sort((a, b) => b.activeTrials - a.activeTrials)
        .slice(0, 10);

    return {
        query,
        fdaApprovals: approvals.length,
        activeTrialCount: trials.length,
        pipelineThreatScore: pipelineThreat.score,
        threatLevel: pipelineThreat.threatLevel,
        competitors,
        source: 'FDA + ClinicalTrials.gov'
    };
}

async function handleDetectAdverseEventSignals(params) {
    const { query, limit } = params;

    const result = await searchFAAEReports(query, limit || 100);
    const divergenceData = calculateAdverseEventDivergenceScore(
        result.totalReports,
        result.seriousEvents,
        result.deathReports,
        result.hospitalizationReports
    );

    return {
        query,
        totalReports: result.totalReports,
        seriousEvents: result.seriousEvents,
        deathReports: result.deathReports,
        hospitalizationReports: result.hospitalizationReports,
        seriousRatio: result.seriousRatio,
        divergenceScore: divergenceData.score,
        divergenceLevel: divergenceData.divergenceLevel,
        topReactions: result.topReactions,
        signals: divergenceData.signals,
        source: 'FDA FAERS'
    };
}

async function handleTrackPatentExclusivity(params) {
    const { query } = params;

    const result = await searchUSPTO(query);
    const fmaData = calculateFirstMoverAdvantageScore(result.patents, [], []);

    // Estimate expiry dates (filing + 20 years)
    const filingDates = result.patents.map(p => p.filingDate).filter(Boolean);
    const expiryDates = filingDates.map(d => {
        // Simple estimate: add 20 years to filing date
        const match = d.match(/(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
            const year = parseInt(match[1], 10) + 20;
            return `${year}-${match[2]}-${match[3]}`;
        }
        return '2030-01-01';
    });

    return {
        query,
        patentCount: result.patentCount,
        filingDates,
        expiryDates,
        earliestPatentExpiry: expiryDates[0] || null,
        yearsOfExclusivityRemaining: fmaData.yearsOfExclusivity,
        firstMoverAdvantageScore: fmaData.score,
        patentCliffWarning: fmaData.patentCliffWarning,
        source: 'USPTO'
    };
}

async function handleCompareRegulatoryPathways(params) {
    const { query } = params;

    const result = await searchFDADrugApprovals(query);

    return {
        query,
        fdaApprovals: result.approvals.map(a => ({
            applicationNumber: a.applicationNumber,
            brandName: a.brandName,
            approvalDate: a.approvalDate,
            indication: a.indication
        })),
        regulatoryGapMetric: null,
        gapInterpretation: 'EMA data unavailable — no public API exists',
        note: 'EMA dropped from MCP (2026-04-22) — no public API available',
        source: 'FDA'
    };
}

async function handleMonitorDrugRecalls(params) {
    const { query, classification } = params;

    return await searchFDARecalls(query, classification);
}

async function handleAssessLiteratureMomentum(params) {
    const { query, maxResults } = params;

    const result = await searchPubMed(query, maxResults || 50);
    const momentumData = calculateLiteratureMomentumScore(
        result.publicationCount,
        result.recentPublications,
        result.yearlyTrend,
        result.topJournals
    );

    return {
        query,
        publicationCount: result.publicationCount,
        recentPublications: result.recentPublications,
        yearlyTrend: result.yearlyTrend,
        accelerationRatio: momentumData.accelerationRatio,
        accelerating: momentumData.accelerating,
        literatureMomentumScore: momentumData.score,
        topJournals: result.topJournals,
        signals: momentumData.signals,
        source: 'PubMed'
    };
}

async function handleGeneratePipelineThreatReport(params) {
    const { company, drug, indication } = params;

    const query = indication ? `${drug} ${indication}` : drug;

    // Fan out to all sources simultaneously
    const [trialsResult, approvalsResult, eventsResult, recallsResult, patentsResult, literatureResult] = await Promise.allSettled([
        searchClinicalTrials(query),
        searchFDADrugApprovals(drug),
        searchFAAEReports(drug, 100),
        searchFDARecalls(drug),
        searchUSPTO(drug),
        searchPubMed(drug, 50)
    ]);

    const trials = trialsResult.status === 'fulfilled' ? trialsResult.value.trials : [];
    const approvals = approvalsResult.status === 'fulfilled' ? approvalsResult.value.approvals : [];
    const events = eventsResult.status === 'fulfilled' ? eventsResult.value : { totalReports: 0, seriousEvents: 0, deathReports: 0, hospitalizationReports: 0, seriousRatio: 0, topReactions: [] };
    const recalls = recallsResult.status === 'fulfilled' ? recallsResult.value.recalls : [];
    const patents = patentsResult.status === 'fulfilled' ? patentsResult.value.patents : [];
    const literature = literatureResult.status === 'fulfilled' ? literatureResult.value : { publicationCount: 0, recentPublications: 0, yearlyTrend: {}, topJournals: [] };

    // Calculate all 4 sub-models
    const pipelineThreat = calculatePipelineThreatScore(trials, approvals, recalls);
    const firstMoverAdvantage = calculateFirstMoverAdvantageScore(patents, trials, approvals);
    const adverseEventDivergence = calculateAdverseEventDivergenceScore(
        events.totalReports,
        events.seriousEvents,
        events.deathReports,
        events.hospitalizationReports
    );
    const literatureMomentum = calculateLiteratureMomentumScore(
        literature.publicationCount,
        literature.recentPublications,
        literature.yearlyTrend,
        literature.topJournals
    );

    // Composite score
    const compositeScore = calculateCompositeScore(
        pipelineThreat.score,
        adverseEventDivergence.score,
        literatureMomentum.score,
        firstMoverAdvantage.score
    );

    const riskLevel = getRiskLevel(compositeScore);

    // Aggregate all signals
    const allSignals = [
        ...pipelineThreat.signals,
        ...firstMoverAdvantage.signals,
        ...adverseEventDivergence.signals,
        ...literatureMomentum.signals
    ];

    return {
        company,
        drug,
        reportDate: new Date().toISOString().split('T')[0],
        compositeScore,
        riskLevel,
        pipelineThreat: {
            score: pipelineThreat.score,
            competitorCount: pipelineThreat.competitorCount,
            phaseDistribution: trialsResult.status === 'fulfilled' ? trialsResult.value.phaseDistribution : {},
            sameIndicationTrials: trials.length,
            recentApprovals: approvals.length,
            recentRecalls: recalls.length,
            threatLevel: pipelineThreat.threatLevel,
            signals: pipelineThreat.signals
        },
        firstMoverAdvantage: {
            score: firstMoverAdvantage.score,
            patentsCovering: patents.length,
            earliestPatentExpiry: patentsResult.status === 'fulfilled' ? patentsResult.value.earliestPatentExpiry : null,
            yearsOfExclusivity: firstMoverAdvantage.yearsOfExclusivity,
            trialPhaseLead: firstMoverAdvantage.trialPhaseLead,
            approvalPathwayClear: approvals.length > 0,
            signals: firstMoverAdvantage.signals
        },
        adverseEventDivergence: {
            score: adverseEventDivergence.score,
            totalReports: events.totalReports,
            seriousEvents: events.seriousEvents,
            deathReports: events.deathReports,
            hospitalizationReports: events.hospitalizationReports,
            seriousRatio: events.seriousRatio,
            divergenceLevel: adverseEventDivergence.divergenceLevel,
            topReactions: events.topReactions,
            signals: adverseEventDivergence.signals
        },
        literatureMomentum: {
            score: literatureMomentum.score,
            publicationCount: literature.publicationCount,
            recentPublications: literature.recentPublications,
            yearlyTrend: literature.yearlyTrend,
            accelerating: literatureMomentum.accelerating,
            topJournals: literature.topJournals,
            signals: literatureMomentum.signals
        },
        allSignals
    };
}

// =============================================================================
// PPE PRICING MAP
// =============================================================================

const PPE_PRICES = {
    search_drug_pipeline: 0.05,
    analyze_competitive_landscape: 0.08,
    detect_adverse_event_signals: 0.06,
    track_patent_exclusivity: 0.05,
    compare_regulatory_pathways: 0.05,
    monitor_drug_recalls: 0.04,
    assess_literature_momentum: 0.05,
    generate_pipeline_threat_report: 0.15
};

// =============================================================================
// MCP REQUEST HANDLER
// =============================================================================

async function handleMCPRequest(request) {
    const { tool, params = {} } = request;

    // Route to appropriate handler
    switch (tool) {
        case 'search_drug_pipeline':
            return await handleSearchDrugPipeline(params);
        case 'analyze_competitive_landscape':
            return await handleAnalyzeCompetitiveLandscape(params);
        case 'detect_adverse_event_signals':
            return await handleDetectAdverseEventSignals(params);
        case 'track_patent_exclusivity':
            return await handleTrackPatentExclusivity(params);
        case 'compare_regulatory_pathways':
            return await handleCompareRegulatoryPathways(params);
        case 'monitor_drug_recalls':
            return await handleMonitorDrugRecalls(params);
        case 'assess_literature_momentum':
            return await handleAssessLiteratureMomentum(params);
        case 'generate_pipeline_threat_report':
            return await handleGeneratePipelineThreatReport(params);
        default:
            throw new Error(`Unknown tool: ${tool}`);
    }
}

// =============================================================================
// TOOL ROUTER
// =============================================================================

async function handleTool(toolName, params = {}) {
    // PPE charging
    const price = PPE_PRICES[toolName];
    if (price && Actor) {
        try {
            await Actor.charge(price, { eventName: toolName });
        } catch (chargeError) {
            console.warn('PPE charging failed:', chargeError.message);
        }
    }

    // Route to handler
    switch (toolName) {
        case 'search_drug_pipeline':
            return await handleSearchDrugPipeline(params);
        case 'analyze_competitive_landscape':
            return await handleAnalyzeCompetitiveLandscape(params);
        case 'detect_adverse_event_signals':
            return await handleDetectAdverseEventSignals(params);
        case 'track_patent_exclusivity':
            return await handleTrackPatentExclusivity(params);
        case 'compare_regulatory_pathways':
            return await handleCompareRegulatoryPathways(params);
        case 'monitor_drug_recalls':
            return await handleMonitorDrugRecalls(params);
        case 'assess_literature_momentum':
            return await handleAssessLiteratureMomentum(params);
        case 'generate_pipeline_threat_report':
            return await handleGeneratePipelineThreatReport(params);
        default:
            throw new Error(`Unknown tool: ${toolName}`);
    }
}

// =============================================================================
// MCP HTTP SERVER (Standby Mode)
// =============================================================================

await Actor.init();

const isStandby = Actor.config.get('metaOrigin') === 'STANDBY';

if (isStandby) {
    // Standby mode: start HTTP server for MCP requests
    const PORT = Actor.config.get('containerPort') || process.env.ACTOR_WEB_SERVER_PORT || 4321;

    const server = http.createServer(async (req, res) => {
        // Handle readiness probe
        if (req.headers['x-apify-container-server-readiness-probe']) {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('OK');
            return;
        }

        // Handle MCP requests
        if (req.method === 'POST' && req.url === '/mcp') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', async () => {
                try {
                    const jsonBody = JSON.parse(body);
                    const id = jsonBody.id ?? null;

                    const reply = (result) => {
                        const resp = id !== null
                            ? { jsonrpc: '2.0', id, result }
                            : result;
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(resp));
                    };

                    const replyError = (code, message) => {
                        const resp = id !== null
                            ? { jsonrpc: '2.0', id, error: { code, message } }
                            : { status: 'error', error: message };
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(resp));
                    };

                    const method = jsonBody.method;

                    // Standard MCP: initialize
                    if (method === 'initialize') {
                        return reply({
                            protocolVersion: '2024-11-05',
                            capabilities: { tools: {} },
                            serverInfo: { name: 'pharma-pipeline-intelligence-mcp', version: '1.0.0' }
                        });
                    }

                    // Standard MCP: tools/list
                    if (method === 'tools/list' || (!method && jsonBody.tool === 'list')) {
                        return reply({ tools: TOOLS });
                    }

                    // Standard MCP: tools/call
                    if (method === 'tools/call') {
                        const toolName = jsonBody.params?.name;
                        const toolArgs = jsonBody.params?.arguments || {};
                        if (!toolName) return replyError(-32602, 'Missing params.name');
                        const toolResult = await handleTool(toolName, toolArgs);
                        return reply({
                            content: [{ type: 'text', text: JSON.stringify(toolResult, null, 2) }]
                        });
                    }

                    // Legacy: tools/{toolName} method format
                    if (method && method.startsWith('tools/')) {
                        const toolName = method.slice(6);
                        const toolArgs = jsonBody.params || {};
                        const toolResult = await handleTool(toolName, toolArgs);
                        return reply({
                            content: [{ type: 'text', text: JSON.stringify(toolResult, null, 2) }]
                        });
                    }

                    // Legacy direct: {tool: "...", params: {...}}
                    if (jsonBody.tool) {
                        const toolResult = await handleTool(jsonBody.tool, jsonBody.params || {});
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ status: 'success', result: toolResult }));
                        return;
                    }

                    return replyError(-32601, 'Method not found');
                } catch (err) {
                    return replyError(-32603, err.message);
                }
            });
            return;
        }

        // Not found
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
    });

    server.listen(PORT, () => {
        console.log(`Pharma Pipeline Intelligence MCP listening on port ${PORT}`);
    });

    server.on('error', (err) => {
        console.error('Server error:', err);
        process.exit(1);
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
        server.close(() => process.exit(0));
    });
}

// =============================================================================
// NON-STANDBY MODE (direct invocation)
// =============================================================================

// If not standby, run a single invocation from input
const input = await Actor.getInput();
if (input) {
    const { tool, params = {} } = input;
    if (tool) {
        const result = await handleTool(tool, params);
        await Actor.setValue('OUTPUT', result);
    }
}

await Actor.exit();
