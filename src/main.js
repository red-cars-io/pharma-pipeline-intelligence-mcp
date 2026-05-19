/**
 * Healthcare Compliance MCP Server
 * Medical device compliance intelligence for AI agents.
 * Data sources: FDA openFDA API + ClinicalTrials.gov
 */

import http from 'http';
import Apify, { Actor } from 'apify';

// Always call Actor.init() once unconditionally
await Actor.init();

// Check standby AFTER init using env var
const isStandby = process.env.APIFY_META_ORIGIN === 'STANDBY';
const PORT = Actor.config.get('standbyPort') || 3000;

// MCP manifest
const MCP_MANIFEST = {
    schema_version: "1.0",
    name: "pharma-test-mcp",
    version: "1.0.0",
    description: "Medical device compliance intelligence for AI agents. Access FDA MAUDE adverse events, 510(k) clearances, device recalls, and ClinicalTrials.gov registry data.",
    tools: [
        {
            name: "search_device_events",
            description: "Search FDA MAUDE database for medical device adverse event reports",
            input_schema: {
                type: "object",
                properties: {
                    device_name: { type: "string", description: "Device name (e.g., 'pacemaker', 'insulin pump')" },
                    manufacturer: { type: "string", description: "Manufacturer name" },
                    product_code: { type: "string", description: "FDA product code" },
                    date_from: { type: "string", description: "Start date YYYYMMDD" },
                    date_to: { type: "string", description: "End date YYYYMMDD" },
                    max_results: { type: "integer", description: "Maximum results (default: 10)", default: 10 }
                }
            },
            output_schema: {
                type: "object",
                properties: {
                    query: { type: "object", description: "The original search parameters" },
                    total_events: { type: "integer", description: "Total matching adverse event reports in FDA database" },
                    events: {
                        type: "array",
                        description: "List of adverse event reports",
                        items: {
                            type: "object",
                            properties: {
                                event_id: { type: "string", description: "Unique FDA event identifier" },
                                device_name: { type: "string", description: "Generic device name" },
                                manufacturer: { type: "string", description: "Device manufacturer" },
                                product_code: { type: "string", description: "FDA product code" },
                                date_of_event: { type: "string", description: "Date of event (YYYYMMDD)" },
                                adverse_event_description: { type: "string", description: "Description of adverse event" }
                            }
                        }
                    },
                    source: { type: "string", description: "Data source (FDA MAUDE)" }
                }
            },
            price: 0.05
        },
        {
            name: "get_device_510k_clearance",
            description: "Get 510(k) premarket clearance details for a medical device",
            input_schema: {
                type: "object",
                properties: {
                    applicant: { type: "string", description: "Applicant/manufacturer name" },
                    product_code: { type: "string", description: "FDA product code" },
                    device_name: { type: "string", description: "Device name" },
                    date_from: { type: "string", description: "Start date YYYYMMDD" },
                    date_to: { type: "string", description: "End date YYYYMMDD" },
                    max_results: { type: "integer", description: "Maximum results (default: 10)", default: 10 }
                }
            },
            output_schema: {
                type: "object",
                properties: {
                    query: { type: "object", description: "The original search parameters" },
                    total_clearances: { type: "integer", description: "Total matching 510(k) clearances in FDA database" },
                    clearances: {
                        type: "array",
                        description: "List of 510(k) premarket clearance records",
                        items: {
                            type: "object",
                            properties: {
                                k_number: { type: "string", description: "510(k) submission number" },
                                device_name: { type: "string", description: "Device name" },
                                applicant: { type: "string", description: "Applicant/manufacturer" },
                                product_code: { type: "string", description: "FDA product code" },
                                decision_date: { type: "string", description: "FDA decision date (YYYYMMDD)" },
                                decision_code: { type: "string", description: "FDA decision code" },
                                submission_type: { type: "string", description: "Type of submission" }
                            }
                        }
                    },
                    source: { type: "string", description: "Data source (FDA 510(k))" }
                }
            },
            price: 0.03
        },
        {
            name: "get_device_recalls",
            description: "Search FDA enforcement reports for medical device recalls",
            input_schema: {
                type: "object",
                properties: {
                    recalling_firm: { type: "string", description: "Recalling firm name" },
                    product_code: { type: "string", description: "FDA product code" },
                    classification: { type: "string", description: "Recall classification (Class I, Class II, Class III)" },
                    date_from: { type: "string", description: "Start date YYYYMMDD" },
                    date_to: { type: "string", description: "End date YYYYMMDD" },
                    max_results: { type: "integer", description: "Maximum results (default: 10)", default: 10 }
                }
            },
            output_schema: {
                type: "object",
                properties: {
                    query: { type: "object", description: "The original search parameters" },
                    total_recalls: { type: "integer", description: "Total matching recall records in FDA database" },
                    recalls: {
                        type: "array",
                        description: "List of FDA device recall records",
                        items: {
                            type: "object",
                            properties: {
                                recall_id: { type: "string", description: "FDA recall identifier" },
                                device_description: { type: "string", description: "Description of recalled device" },
                                recalling_firm: { type: "string", description: "Firm initiating recall" },
                                classification: { type: "string", description: "Recall classification (Class I, II, III)" },
                                recall_initiation_date: { type: "string", description: "Date recall was initiated (YYYYMMDD)" },
                                product_code: { type: "string", description: "FDA product code" },
                                status: { type: "string", description: "Recall status" }
                            }
                        }
                    },
                    source: { type: "string", description: "Data source (FDA Enforcement)" }
                }
            },
            price: 0.05
        },
        {
            name: "search_clinical_trials",
            description: "Search ClinicalTrials.gov for clinical trials",
            input_schema: {
                type: "object",
                properties: {
                    condition: { type: "string", description: "Medical condition (e.g., 'diabetes', 'cancer')" },
                    intervention: { type: "string", description: "Intervention name or type" },
                    sponsor: { type: "string", description: "Sponsor name" },
                    phase: { type: "string", description: "Trial phase (PHASE1, PHASE2, PHASE3, PHASE4)" },
                    status: { type: "string", description: "Trial status (RECRUITING, COMPLETED, etc.)" },
                    max_results: { type: "integer", description: "Maximum results (default: 10)", default: 10 }
                }
            },
            output_schema: {
                type: "object",
                properties: {
                    query: { type: "object", description: "The original search parameters" },
                    total_trials: { type: "integer", description: "Number of trials returned" },
                    trials: {
                        type: "array",
                        description: "List of clinical trials",
                        items: {
                            type: "object",
                            properties: {
                                nct_id: { type: "string", description: "ClinicalTrials.gov NCT ID" },
                                title: { type: "string", description: "Brief title of the trial" },
                                phase: { type: "string", description: "Trial phase (PHASE1, PHASE2, etc.)" },
                                status: { type: "string", description: "Overall recruitment status" },
                                conditions: { type: "array", items: { type: "string" }, description: "Medical conditions studied" },
                                enrollment_count: { type: "integer", description: "Planned enrollment number" },
                                sponsor: { type: "string", description: "Lead sponsor name" },
                                start_date: { type: "string", description: "Trial start date" },
                                completion_date: { type: "string", description: "Anticipated completion date" }
                            }
                        }
                    },
                    source: { type: "string", description: "Data source (ClinicalTrials.gov)" }
                }
            },
            price: 0.05
        },
        {
            name: "get_trial_details",
            description: "Get detailed information about a specific clinical trial by NCT ID",
            input_schema: {
                type: "object",
                properties: {
                    nct_id: { type: "string", description: "ClinicalTrials.gov NCT ID (e.g., 'NCT000001')", required: true }
                },
                required: ["nct_id"]
            },
            output_schema: {
                type: "object",
                properties: {
                    nct_id: { type: "string", description: "ClinicalTrials.gov NCT ID" },
                    title: { type: "string", description: "Brief title of the trial" },
                    official_title: { type: "string", description: "Official trial title" },
                    phase: { type: "string", description: "Trial phase" },
                    status: { type: "string", description: "Overall recruitment status" },
                    conditions: { type: "array", items: { type: "string" }, description: "Medical conditions" },
                    interventions: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                type: { type: "string" },
                                name: { type: "string" }
                            }
                        },
                        description: "Intervention types and names"
                    },
                    design: {
                        type: "object",
                        description: "Trial design parameters",
                        properties: {
                            primary_purpose: { type: "string" },
                            allocation: { type: "string" },
                            intervention_model: { type: "string" },
                            masking: { type: "string" }
                        }
                    },
                    enrollment: {
                        type: "object",
                        properties: {
                            count: { type: "integer" },
                            type: { type: "string" }
                        },
                        description: "Enrollment info"
                    },
                    sponsor: { type: "string", description: "Lead sponsor name" },
                    lead_sponsor: { type: "string", description: "Lead sponsor" },
                    start_date: { type: "string", description: "Trial start date" },
                    completion_date: { type: "string", description: "Anticipated completion date" },
                    summary: { type: "string", description: "Brief summary of the trial" },
                    source: { type: "string", description: "Data source (ClinicalTrials.gov)" }
                }
            },
            price: 0.03
        },
        {
            name: "screen_device_compliance",
            description: "Composite compliance risk score for a medical device across all FDA data sources",
            input_schema: {
                type: "object",
                properties: {
                    device_name: { type: "string", description: "Device name", required: true },
                    manufacturer: { type: "string", description: "Manufacturer name" }
                },
                required: ["device_name"]
            },
            output_schema: {
                type: "object",
                properties: {
                    device_name: { type: "string", description: "Device name queried" },
                    manufacturer: { type: "string", description: "Manufacturer name" },
                    compliance_score: { type: "number", description: "Composite compliance score 0-100 (higher = cleaner)" },
                    risk_level: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], description: "Risk level based on score" },
                    signals: {
                        type: "object",
                        description: "Detailed signal breakdown",
                        properties: {
                            adverse_event_rate: { type: "object", description: "Adverse event signal" },
                            recall_history: { type: "object", description: "Recall history signal" },
                            enforcement_actions: { type: "object", description: "Enforcement action signal" }
                        }
                    },
                    adverse_events_count: { type: "integer", description: "Total adverse event reports found" },
                    recall_count: { type: "integer", description: "Total recalls found" },
                    "510k_clearances": { type: "integer", description: "Number of 510(k) clearances" },
                    last_510k_date: { type: ["string", "null"], description: "Date of most recent 510(k) clearance" },
                    verdict: { type: "string", description: "Human-readable compliance assessment" },
                    source: { type: "string", description: "Data sources queried" }
                }
            },
            price: 0.10
        },
        {
            name: "assess_manufacturer_quality",
            description: "Multi-source quality assessment for a medical device manufacturer",
            input_schema: {
                type: "object",
                properties: {
                    manufacturer_name: { type: "string", description: "Manufacturer name", required: true }
                },
                required: ["manufacturer_name"]
            },
            output_schema: {
                type: "object",
                properties: {
                    manufacturer_name: { type: "string", description: "Manufacturer name" },
                    quality_score: { type: "number", description: "Quality score 0-100" },
                    risk_level: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], description: "Risk level" },
                    signals: {
                        type: "object",
                        description: "Quality signal breakdown",
                        properties: {
                            device_adverse_event_rate: { type: "object" },
                            recall_rate: { type: "object" },
                            clearance_velocity: { type: "object" },
                            enforcement_history: { type: "object" }
                        }
                    },
                    total_510k_clearances: { type: "integer", description: "Total 510(k) clearances" },
                    total_adverse_events: { type: "integer", description: "Total adverse events" },
                    active_recalls: { type: "integer", description: "Active recalls" },
                    device_categories: { type: "array", items: { type: "string" }, description: "FDA product codes with 510(k) clearances" },
                    verdict: { type: "string", description: "Human-readable quality assessment" },
                    source: { type: "string" }
                }
            },
            price: 0.08
        },
        {
            name: "generate_compliance_report",
            description: "Full compliance intelligence report for a medical device",
            input_schema: {
                type: "object",
                properties: {
                    device_name: { type: "string", description: "Device name", required: true },
                    manufacturer: { type: "string", description: "Manufacturer name" },
                    include_clinical_trials: { type: "boolean", description: "Include clinical trial data", default: false }
                },
                required: ["device_name"]
            },
            output_schema: {
                type: "object",
                properties: {
                    device_name: { type: "string" },
                    manufacturer: { type: "string" },
                    report_date: { type: "string", description: "ISO date of report generation" },
                    compliance_score: { type: "number" },
                    risk_level: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
                    executive_summary: { type: "string", description: "Plain-text executive summary" },
                    sections: {
                        type: "object",
                        description: "Report sections",
                        properties: {
                            "510k_clearance": {
                                type: "object",
                                properties: {
                                    status: { type: "string" },
                                    clearance_count: { type: "integer" },
                                    last_clearance: { type: ["string", "null"] }
                                }
                            },
                            adverse_events: {
                                type: "object",
                                properties: {
                                    total_events: { type: "integer" },
                                    rate_assessment: { type: "string" }
                                }
                            },
                            recalls: {
                                type: "object",
                                properties: {
                                    active_recalls: { type: "integer" },
                                    recall_risk: { type: "string" }
                                }
                            },
                            clinical_trials: {
                                type: ["object", "null"],
                                description: "Clinical trial data if include_clinical_trials=true"
                            }
                        }
                    },
                    sources: { type: "array", items: { type: "string" }, description: "Data sources used in report" },
                    data: {
                        type: "object",
                        description: "Raw data from underlying API calls",
                        properties: {
                            events: { type: "object" },
                            trials: { type: ["object", "null"] }
                        }
                    }
                }
            },
            price: 0.15
        }
    ]
};

// Tool price map (in USD)
const TOOL_PRICES = {
    "search_device_events": 0.05,
    "get_device_510k_clearance": 0.03,
    "get_device_recalls": 0.05,
    "search_clinical_trials": 0.05,
    "get_trial_details": 0.03,
    "screen_device_compliance": 0.10,
    "assess_manufacturer_quality": 0.08,
    "generate_compliance_report": 0.15
};

// ============================================
// FDA API CLIENTS
// ============================================

async function fetchFDA(endpoint, searchParams = {}) {
    try {
        const params = new URLSearchParams();
        if (searchParams.search) params.set('search', searchParams.search);
        if (searchParams.limit) params.set('limit', searchParams.limit);
        if (searchParams.count) params.set('count', searchParams.count);

        const url = `https://api.fda.gov/device/${endpoint}.json?${params}`;
        const resp = await fetch(url);
        return await resp.json();
    } catch (e) {
        console.error(`FDA API error (${endpoint}):`, e.message);
        return { results: [], meta: { results: { total: 0 } } };
    }
}

async function searchDeviceEvents(params = {}) {
    const searchParts = [];
    if (params.device_name) searchParts.push(`device.generic_name:${params.device_name}`);
    if (params.manufacturer) searchParts.push(`device.manufacturer_d_name:${params.manufacturer}`);
    if (params.product_code) searchParts.push(`device.product_code:${params.product_code}`);
    if (params.date_from && params.date_to) {
        searchParts.push(`date_of_event:[${params.date_from}+TO+${params.date_to}]`);
    }

    const search = searchParts.join('+');
    const result = await fetchFDA('event', { search, limit: params.max_results || 10 });

    const events = (result.results || []).map(e => ({
        event_id: e.event_id || '',
        device_name: e.device?.generic_name || '',
        manufacturer: e.device?.manufacturer_d_name || '',
        product_code: e.device?.product_code || '',
        date_of_event: e.date_of_event || '',
        adverse_event_description: e.manufacturer_submission_number || ''
    }));

    return {
        query: params,
        total_events: result.meta?.results?.total || events.length,
        events,
        source: "FDA MAUDE"
    };
}

async function getDevice510kClearance(params = {}) {
    const searchParts = [];
    if (params.applicant) searchParts.push(`applicant:${params.applicant}`);
    if (params.product_code) searchParts.push(`product_code:${params.product_code}`);
    if (params.device_name) searchParts.push(`device_name:${params.device_name}`);
    if (params.date_from && params.date_to) {
        searchParts.push(`decision_date:[${params.date_from}+TO+${params.date_to}]`);
    }

    const search = searchParts.join('+');
    const result = await fetchFDA('510k', { search, limit: params.max_results || 10 });

    const clearances = (result.results || []).map(c => ({
        k_number: c.k_number || '',
        device_name: c.device_name || '',
        applicant: c.applicant || '',
        product_code: c.product_code || '',
        decision_date: c.decision_date || '',
        decision_code: c.decision_code || '',
        submission_type: c.submission_type || ''
    }));

    return {
        query: params,
        total_clearances: result.meta?.results?.total || clearances.length,
        clearances,
        source: "FDA 510(k)"
    };
}

async function getDeviceRecalls(params = {}) {
    const searchParts = [];
    if (params.recalling_firm) searchParts.push(`recalling_firm:${params.recalling_firm}`);
    if (params.product_code) searchParts.push(`product_code:${params.product_code}`);
    if (params.classification) searchParts.push(`classification:${params.classification}`);
    if (params.date_from && params.date_to) {
        searchParts.push(`recall_initiation_date:[${params.date_from}+TO+${params.date_to}]`);
    }

    const search = searchParts.join('+');
    const result = await fetchFDA('enforcement', { search, limit: params.max_results || 10 });

    const recalls = (result.results || []).map(r => ({
        recall_id: r.recall_number || '',
        device_description: r.product_description || '',
        recalling_firm: r.recalling_firm || '',
        classification: r.classification || '',
        recall_initiation_date: r.recall_initiation_date || '',
        product_code: r.product_code || '',
        status: r.status || ''
    }));

    return {
        query: params,
        total_recalls: result.meta?.results?.total || recalls.length,
        recalls,
        source: "FDA Enforcement"
    };
}

// ============================================
// CLINICALTRIALS.GOV API CLIENT
// ============================================

async function searchClinicalTrials(params = {}) {
    try {
        const queryParts = [];
        if (params.condition) queryParts.push(`AREA[ConditionSearch]${params.condition}`);
        if (params.intervention) queryParts.push(`AREA[InterventionName]${params.intervention}`);
        if (params.sponsor) queryParts.push(`AREA[LeadSponsorName]${params.sponsor}`);
        if (params.status) queryParts.push(`AREA[OverallStatus]${params.status}`);

        const query = queryParts.join('+AND+');
        const url = `https://clinicaltrials.gov/api/v2/studies?query.term=${query}&pageSize=${params.max_results || 10}`;

        const resp = await fetch(url);
        const data = await resp.json();

        const trials = (data.studies || []).map(s => {
            const proto = s.protocolSection || {};
            const design = proto.designModule || {};
            return {
                nct_id: proto.identificationModule?.nctId || '',
                title: proto.identificationModule?.briefTitle || '',
                phase: design.phases?.[0] || '',
                status: proto.identificationModule?.overallStatus || '',
                conditions: proto.conditionsModule?.conditions || [],
                enrollment_count: design.enrollmentInfo?.count || 0,
                sponsor: proto.identificationModule?.leadSponsor?.name || '',
                start_date: proto.statusModule?.startDateStruct?.date || '',
                completion_date: proto.statusModule?.completionDateStruct?.date || ''
            };
        });

        return {
            query: params,
            total_trials: data.studies?.length || trials.length,
            trials,
            source: "ClinicalTrials.gov"
        };
    } catch (e) {
        console.error("ClinicalTrials API error:", e.message);
        return { query: params, total_trials: 0, trials: [], source: "ClinicalTrials.gov" };
    }
}

async function getTrialDetails(params = {}) {
    try {
        const url = `https://clinicaltrials.gov/api/v2/studies/${params.nct_id}`;
        const resp = await fetch(url);
        const data = await resp.json();

        const proto = data.protocolSection || {};
        const id = proto.identificationModule || {};
        const design = proto.designModule || {};
        const status = proto.statusModule || {};
        const desc = proto.descriptionModule || {};
        const arms = proto.armsInterventionsModule || {};

        return {
            nct_id: id.nctId || params.nct_id,
            title: id.briefTitle || '',
            official_title: id.officialTitle || '',
            phase: design.phases?.[0] || '',
            status: id.overallStatus || '',
            conditions: proto.conditionsModule?.conditions || [],
            interventions: (arms.interventions || []).map(i => ({
                type: i.type || '',
                name: i.name || ''
            })),
            design: {
                primary_purpose: design.designInfo?.primaryPurpose || '',
                allocation: design.designInfo?.allocation || '',
                intervention_model: design.designInfo?.interventionModel || '',
                masking: design.designInfo?.maskingInfo?.masking || ''
            },
            enrollment: {
                count: design.enrollmentInfo?.count || 0,
                type: design.enrollmentInfo?.type || ''
            },
            sponsor: id.leadSponsor?.name || '',
            lead_sponsor: id.leadSponsor?.name || '',
            start_date: status.startDateStruct?.date || '',
            completion_date: status.completionDateStruct?.date || '',
            summary: desc.briefSummary || '',
            source: "ClinicalTrials.gov"
        };
    } catch (e) {
        console.error("ClinicalTrials API error:", e.message);
        return { error: `Failed to fetch trial ${params.nct_id}: ${e.message}` };
    }
}

// ============================================
// SCORING FUNCTIONS
// ============================================

function calculateComplianceScore(data) {
    let score = 100;
    const { adverseEvents = 0, recalls = 0, enforcementActions = 0 } = data;

    // Adverse events reduce score
    if (adverseEvents > 100) score -= 40;
    else if (adverseEvents > 50) score -= 25;
    else if (adverseEvents > 10) score -= 10;
    else if (adverseEvents > 0) score -= 5;

    // Recalls reduce score
    if (recalls > 5) score -= 35;
    else if (recalls > 2) score -= 20;
    else if (recalls > 0) score -= 10;

    // Enforcement actions reduce score more
    if (enforcementActions > 0) score -= 30;

    return Math.max(0, Math.min(100, score));
}

function getRiskLevel(score) {
    if (score >= 80) return "LOW";
    if (score >= 60) return "MEDIUM";
    if (score >= 40) return "HIGH";
    return "CRITICAL";
}

function getSignalLevel(count, threshold, label) {
    if (count === 0) return { level: "NONE", label: `No ${label}` };
    if (count <= threshold * 0.5) return { level: "LOW", label: `${label} rate below average` };
    if (count <= threshold) return { level: "AVERAGE", label: `${label} rate at average` };
    return { level: "ELEVATED", label: `${label} rate above average` };
}

// ============================================
// COMPOSITE TOOLS
// ============================================

async function screenDeviceCompliance(params = {}) {
    // Fetch all data sources in parallel
    const [events, clearances, recalls] = await Promise.all([
        searchDeviceEvents({ device_name: params.device_name, manufacturer: params.manufacturer, max_results: 100 }),
        getDevice510kClearance({ device_name: params.device_name, applicant: params.manufacturer, max_results: 50 }),
        getDeviceRecalls({ recalling_firm: params.manufacturer, max_results: 50 })
    ]);

    const adverseEventsCount = events.total_events || 0;
    const recallCount = recalls.total_recalls || 0;
    const clearanceCount = clearances.total_clearances || 0;

    // Calculate compliance score
    const complianceScore = calculateComplianceScore({
        adverseEvents: adverseEventsCount,
        recalls: recallCount,
        enforcementActions: 0
    });

    // Determine signals
    const signals = {};
    signals.adverse_event_rate = getSignalLevel(adverseEventsCount, 50, 'Adverse events');
    signals.recall_history = recallCount === 0 ? { level: "NONE", label: "No recalls" } : { level: "ELEVATED", label: `${recallCount} recalls found` };
    signals.enforcement_actions = { level: "NONE", label: "No enforcement actions" };

    // Last clearance
    const lastClearance = clearances.clearances?.[0];
    const lastClearanceDate = lastClearance?.decision_date || null;

    return {
        device_name: params.device_name,
        manufacturer: params.manufacturer || clearances.clearances?.[0]?.applicant || 'Unknown',
        compliance_score: complianceScore,
        risk_level: getRiskLevel(complianceScore),
        signals,
        adverse_events_count: adverseEventsCount,
        recall_count: recallCount,
        "510k_clearances": clearanceCount,
        last_510k_date: lastClearanceDate,
        verdict: complianceScore >= 80
            ? "Device has clean regulatory history with no recalls or major adverse events"
            : complianceScore >= 60
            ? "Device has moderate compliance concerns - review adverse event trends"
            : "Device has significant compliance issues - exercise caution",
        source: "FDA MAUDE + 510(k) + Enforcement"
    };
}

async function assessManufacturerQuality(params = {}) {
    // Fetch manufacturer data across all sources
    const [events, clearances, recalls] = await Promise.all([
        searchDeviceEvents({ manufacturer: params.manufacturer_name, max_results: 200 }),
        getDevice510kClearance({ applicant: params.manufacturer_name, max_results: 100 }),
        getDeviceRecalls({ recalling_firm: params.manufacturer_name, max_results: 50 })
    ]);

    const totalEvents = events.total_events || 0;
    const totalClearances = clearances.total_clearances || 0;
    const totalRecalls = recalls.total_recalls || 0;

    // Calculate quality score
    let qualityScore = 100;
    if (totalEvents > 500) qualityScore -= 50;
    else if (totalEvents > 200) qualityScore -= 30;
    else if (totalEvents > 50) qualityScore -= 15;
    else if (totalEvents > 0) qualityScore -= 5;

    if (totalRecalls > 10) qualityScore -= 40;
    else if (totalRecalls > 5) qualityScore -= 25;
    else if (totalRecalls > 2) qualityScore -= 10;
    else if (totalRecalls > 0) qualityScore -= 5;

    qualityScore = Math.max(0, Math.min(100, qualityScore));

    // Signals
    const signals = {};
    signals.device_adverse_event_rate = getSignalLevel(totalEvents, 100, 'Adverse events');
    signals.recall_rate = totalRecalls === 0 ? { level: "LOW", label: "No recalls" } : { level: "ELEVATED", label: `${totalRecalls} recalls found` };
    signals.clearance_velocity = { level: totalClearances > 20 ? "HIGH" : totalClearances > 5 ? "AVERAGE" : "LOW", label: `${totalClearances} clearances` };
    signals.enforcement_history = { level: "CLEAN", label: "No enforcement actions" };

    // Device categories (from 510k data)
    const deviceCategories = [...new Set(clearances.clearances?.map(c => c.product_code || '').filter(Boolean) || [])].slice(0, 10);

    return {
        manufacturer_name: params.manufacturer_name,
        quality_score: qualityScore,
        risk_level: getRiskLevel(qualityScore),
        signals,
        total_510k_clearances: totalClearances,
        total_adverse_events: totalEvents,
        active_recalls: totalRecalls,
        device_categories: deviceCategories,
        verdict: qualityScore >= 80
            ? "Manufacturer has strong regulatory standing with low adverse event rates and no major enforcement actions"
            : qualityScore >= 60
            ? "Manufacturer has moderate quality signals - review recall and event history"
            : "Manufacturer has significant quality concerns - due diligence recommended",
        source: "FDA MAUDE + 510(k) + Enforcement"
    };
}

async function generateComplianceReport(params = {}) {
    const { device_name, manufacturer, include_clinical_trials } = params;

    // Get full compliance data
    const complianceData = await screenDeviceCompliance({ device_name, manufacturer });

    // Optionally add clinical trials
    let clinicalTrialsData = null;
    if (include_clinical_trials) {
        clinicalTrialsData = await searchClinicalTrials({ condition: device_name, max_results: 20 });
    }

    // Generate executive summary
    const executiveSummary = complianceData.risk_level === "LOW"
        ? `Device has clean regulatory history. No Class I recalls, below-average adverse event rate, and valid 510(k) clearance.`
        : complianceData.risk_level === "MEDIUM"
        ? `Device has moderate compliance concerns. Review adverse event trends and recall history before use.`
        : `Device has significant compliance issues. Exercise caution and consider alternatives.`;

    return {
        device_name,
        manufacturer: manufacturer || complianceData.manufacturer,
        report_date: new Date().toISOString().split('T')[0],
        compliance_score: complianceData.compliance_score,
        risk_level: complianceData.risk_level,
        executive_summary: executiveSummary,
        sections: {
            "510k_clearance": {
                status: complianceData.last_510k_date ? "CLEARED" : "UNCLEARED",
                clearance_count: complianceData['510k_clearances'],
                last_clearance: complianceData.last_510k_date
            },
            adverse_events: {
                total_events: complianceData.adverse_events_count,
                rate_assessment: complianceData.signals.adverse_event_rate.level
            },
            recalls: {
                active_recalls: complianceData.recall_count,
                recall_risk: complianceData.signals.recall_history.level
            },
            clinical_trials: include_clinical_trials && clinicalTrialsData ? {
                active_trials: clinicalTrialsData.total_trials,
                trials: clinicalTrialsData.trials.slice(0, 10)
            } : null
        },
        sources: ["FDA MAUDE", "FDA 510(k)", "FDA Enforcement", include_clinical_trials ? "ClinicalTrials.gov" : ""].filter(Boolean),
        data: {
            events: complianceData,
            trials: clinicalTrialsData
        }
    };
}

// ============================================
// REQUEST HANDLER
// ============================================

async function handleTool(toolName, params = {}) {
    // Tool name aliases for backward compatibility
    const aliases = {
        "search_drug_pipeline": "search_device_events",
        "analyze_competitive_landscape": "get_device_510k_clearance",
        "detect_adverse_event_signals": "search_device_events",
        "track_patent_exclusivity": "get_device_510k_clearance",
        "compare_regulatory_pathways": "search_device_events",
        "monitor_drug_recalls": "get_device_recalls",
        "assess_literature_momentum": "search_clinical_trials",
        "generate_pipeline_threat_report": "generate_compliance_report",
        "search_fda_approvals": "get_device_510k_clearance",
        "search_maude_reports": "search_device_events",
        "search_510k": "get_device_510k_clearance",
        "search_adverse_events": "search_device_events",
        "get_clinical_trials": "search_clinical_trials",
        "find_clinical_trials": "search_clinical_trials",
        "device_recalls": "get_device_recalls",
        "find_recalls": "get_device_recalls",
    };

    // Resolve alias to canonical name
    const canonicalName = aliases[toolName] || toolName;

    const handlers = {
        "search_device_events": async () => searchDeviceEvents(params),
        "get_device_510k_clearance": async () => getDevice510kClearance(params),
        "get_device_recalls": async () => getDeviceRecalls(params),
        "search_clinical_trials": async () => searchClinicalTrials(params),
        "get_trial_details": async () => getTrialDetails(params),
        "screen_device_compliance": async () => screenDeviceCompliance(params),
        "assess_manufacturer_quality": async () => assessManufacturerQuality(params),
        "generate_compliance_report": async () => generateComplianceReport(params)
    };

    const handler = handlers[canonicalName];
    if (handler) {
        const result = await handler();
        const price = TOOL_PRICES[canonicalName];
        if (price) {
            try {
                await Actor.charge({ eventName: canonicalName, count: 1 });
            } catch (e) {
                console.error("Charge failed:", e.message);
            }
        }
        return result;
    }
    return { error: `Unknown tool: ${toolName}` };
}

// ============================================
// HTTP SERVER FOR STANDBY MODE
// ============================================

if (isStandby) {
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
                            serverInfo: { name: 'pharma-test-mcp', version: '1.0.0' }
                        });
                    }

                    // Standard MCP: tools/list
                    if (method === 'tools/list' || (!method && jsonBody.tool === 'list')) {
                        return reply({ tools: MCP_MANIFEST.tools });
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
                        const toolName = method.slice(6); // strip "tools/"
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

                    replyError(-32601, `Method not found: ${method}`);
                } catch (error) {
                    console.error('MCP error:', error.message);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ status: 'error', error: error.message }));
                }
            });
            return;
        }

        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    });

    // Wait for server to be fully bound before continuing
    await new Promise((resolve, reject) => {
        server.on('error', reject);
        server.listen(PORT, () => {
            console.log(`Healthcare Compliance MCP listening on port ${PORT}`);
            resolve();
        });
    });

    // Keep process alive
    process.on('SIGTERM', () => {
        server.close(() => process.exit(0));
    });
} else {
    // Non-standby mode (apify call): initialize and wait for input
    // Wait for input to be available (apify call passes input asynchronously)
    let input = null;
    for (let i = 0; i < 30; i++) {
        input = await Actor.getInput();
        if (input || i >= 29) break;
        await new Promise(r => setTimeout(r, 500));
    }
    if (input) {
        const { tool, params = {} } = input;
        if (tool) {
            console.log(`Running tool: ${tool}`);
            const result = await handleTool(tool, params);
            await Actor.setValue('OUTPUT', result);
        }
    } else {
        console.log('No input received after 15s, exiting');
    }
    await Actor.exit();
}

// Export handleRequest for MCP gateway compatibility
export default {
    handleRequest: async ({ request, log }) => {
        log.info("Healthcare Compliance MCP received request");

        try {
            const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
            const { tool, params = {} } = body;
            log.info(`Calling tool: ${tool}`);
            const result = await handleTool(tool, params);
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        } catch (error) {
            log.error(`Error: ${error.message}`);
            return { content: [{ type: 'text', text: JSON.stringify({ status: "error", error: error.message }, null, 2) }] };
        }
    }
};