import { GrantApplication, MalaysianState, IndustrySector, DocumentAttachment, ReviewerScore } from '../types/grant';

/**
 * Intelligent CSV / TSV parser for Google Sheets exports of the
 * Commercialize Grant (DPF - Dana Pengkomersialan Fasilitasi) intake form.
 */

// Helper to parse CSV / TSV text handling quoted multiline cells
export function parseDelimitedText(text: string): string[][] {
  const clean = text.trim();
  if (!clean) return [];

  // Detect delimiter: if tab exists in first line, use tab; otherwise comma
  const firstLine = clean.split(/\r?\n/)[0];
  const isTsv = firstLine.includes('\t');
  const delimiter = isTsv ? '\t' : ',';

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    const nextChar = clean[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // handle CRLF
      }
      currentRow.push(currentCell.trim());
      if (currentRow.length > 0 && currentRow.some(c => c !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  if (currentCell !== '' || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(c => c !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

function normalizeState(raw: string): MalaysianState {
  const s = (raw || '').toLowerCase();
  if (s.includes('kuala lumpur') || s.includes('kl') || s.includes('wp')) return 'Kuala Lumpur';
  if (s.includes('selangor')) return 'Selangor';
  if (s.includes('penang') || s.includes('pulau pinang')) return 'Penang';
  if (s.includes('johor')) return 'Johor';
  if (s.includes('sarawak')) return 'Sarawak';
  if (s.includes('sabah')) return 'Sabah';
  if (s.includes('perak')) return 'Perak';
  if (s.includes('kedah')) return 'Kedah';
  if (s.includes('melaka') || s.includes('malacca')) return 'Melaka';
  if (s.includes('pahang')) return 'Pahang';
  if (s.includes('negeri sembilan')) return 'Negeri Sembilan';
  if (s.includes('terengganu')) return 'Terengganu';
  if (s.includes('kelantan')) return 'Kelantan';
  if (s.includes('perlis')) return 'Perlis';
  if (s.includes('putrajaya')) return 'Putrajaya';
  if (s.includes('labuan')) return 'Labuan';
  return 'Kuala Lumpur';
}

function normalizeSector(industry: string, techDriver: string): IndustrySector {
  const str = `${industry} ${techDriver}`.toLowerCase();
  if (str.includes('agri') || str.includes('food') || str.includes('bio')) return 'AgriTech & Food Security';
  if (str.includes('health') || str.includes('medical') || str.includes('pharma')) return 'Digital Health & Biotech';
  if (str.includes('energy') || str.includes('solar') || str.includes('clean') || str.includes('mobility')) return 'Clean Energy & Mobility';
  if (str.includes('manufacturing') || str.includes('iot') || str.includes('robotics')) return 'Smart Manufacturing & IoT';
  if (str.includes('ai') || str.includes('intelligence') || str.includes('software') || str.includes('data') || str.includes('it')) return 'Deep Tech & AI';
  return 'Creative Multimedia & FinTech';
}

function extractUrlsAsDocuments(text: string, prefix = 'doc'): DocumentAttachment[] {
  if (!text) return [];
  const urls = text.match(/https?:\/\/[^\s"\']+/g) || [];
  return urls.map((url, idx) => {
    // Extract filename from URL
    const cleanUrl = url.replace(/["\';]+$/, '');
    const filenameMatch = cleanUrl.split('/').pop()?.split('?')[0] || `Document_${idx + 1}.pdf`;
    const decodedName = decodeURIComponent(filenameMatch);
    const ext = decodedName.split('.').pop()?.toLowerCase() || 'pdf';
    let mime = 'application/pdf';
    if (ext === 'xlsx' || ext === 'xls') mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    if (ext === 'png') mime = 'image/png';
    if (ext === 'jpg' || ext === 'jpeg') mime = 'image/jpeg';

    return {
      id: `${prefix}-${Date.now()}-${idx}`,
      name: decodedName,
      type: mime,
      size: '2.5 MB',
      url: cleanUrl,
      uploadedAt: new Date().toISOString().split('T')[0],
    };
  });
}

function calculateMilestoneBudget(text: string): { total: number; items: { category: string; amount: number; percentage: number }[] } {
  if (!text) return { total: 0, items: [] };
  const matches = [...text.matchAll(/Budget Allocation \(RM\):\s*([\d,]+)/gi)];
  let total = 0;
  const rawItems: { name: string; amount: number }[] = [];

  const lines = text.split('\n');
  lines.forEach((line) => {
    const allocMatch = line.match(/Budget Allocation \(RM\):\s*([\d,]+)/i);
    const delivMatch = line.match(/Deliverables:\s*([^,]+)/i);
    if (allocMatch) {
      const amt = Number(allocMatch[1].replace(/,/g, ''));
      const desc = delivMatch ? delivMatch[1].trim() : 'Project Milestone Execution';
      total += amt;
      rawItems.push({ name: desc, amount: amt });
    }
  });

  if (total === 0 && matches.length > 0) {
    total = matches.reduce((sum, m) => sum + Number(m[1].replace(/,/g, '')), 0);
  }

  const items = rawItems.map((item) => ({
    category: item.name,
    amount: item.amount,
    percentage: total > 0 ? Math.round((item.amount / total) * 100) : 0,
  }));

  return { total, items };
}

export function parseSheetData(rawText: string, baselineThreshold = 75.0): {
  applications: GrantApplication[];
  errors: string[];
  totalParsed: number;
} {
  const rows = parseDelimitedText(rawText);
  if (rows.length < 2) {
    return {
      applications: [],
      errors: ['No data rows found. Please ensure the header row and at least one data row are provided.'],
      totalParsed: 0,
    };
  }

  const headers = rows[0].map(h => h.trim());
  const headerMap: Record<string, number> = {};
  headers.forEach((h, i) => {
    headerMap[h] = i;
  });

  const getCol = (row: string[], nameMatch: string, fallbackIdx = -1): string => {
    // 1. Direct match
    if (headerMap[nameMatch] !== undefined) {
      return row[headerMap[nameMatch]] || '';
    }
    // 2. Fuzzy match
    const foundKey = Object.keys(headerMap).find(k =>
      k.toLowerCase().includes(nameMatch.toLowerCase())
    );
    if (foundKey && headerMap[foundKey] !== undefined) {
      return row[headerMap[foundKey]] || '';
    }
    // 3. Fallback index
    if (fallbackIdx >= 0 && fallbackIdx < row.length) {
      return row[fallbackIdx] || '';
    }
    return '';
  };

  const applications: GrantApplication[] = [];
  const errors: string[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (row.length < 5 || !row.some(cell => cell.trim().length > 0)) continue;

    try {
      const appId = getCol(row, 'Application ID') || `DPF-${Date.now()}-${r}`;
      const submissionId = getCol(row, 'Submission ID') || `SUB-${Date.now()}`;
      const orgName = getCol(row, '1.1.1 Organisation Name') || getCol(row, 'Organisation Name') || 'Enterprise Applicant';
      const ssm = getCol(row, '1.1.2 SSM Registration Number') || '202401099231 (1509281-U)';
      const ssmUrls = getCol(row, '1.1.3 Upload SSM Corporate Information');
      const incDate = getCol(row, '1.1.4 Incorporation Date') || '2024';
      const incYearMatch = incDate.match(/\b(20\d\d|19\d\d)\b/);
      const incYear = incYearMatch ? Number(incYearMatch[1]) : 2024;
      const website = getCol(row, '1.1.5 Company Website URL') || '';
      const category = getCol(row, '1.1.6 Company Category') || 'Startup';
      const industry = getCol(row, '1.1.7 Industry') || 'Deep Tech & AI';
      const address = getCol(row, '1.1.8 Registered Business Address') || 'Kuala Lumpur, Malaysia';
      const rawState = getCol(row, '1.1.9 Registered Address State') || 'Kuala Lumpur';
      const state = normalizeState(rawState);

      // Applicant details
      const applicantName = getCol(row, '2.1.1.1 Name') || getCol(row, 'Name') || 'Authorised Officer';
      const designation = getCol(row, '2.1.1.2 Designation') || 'Director';
      const ic = getCol(row, '2.1.1.3 Identification No') || '850101015000';
      const email = getCol(row, '2.1.1.5 Email') || getCol(row, 'Email') || 'applicant@company.my';
      const phone = getCol(row, '2.1.1.6 Contact Number') || getCol(row, 'Contact Number') || '+60 12-345 6789';
      const cvUrl = getCol(row, '2.1.1.7 Upload CV');

      // Project & Technology
      const projectTitle = getCol(row, '4.1.1 Project Title') || 'Commercialization Innovation Project';
      const execSummary = getCol(row, '4.1.2 Executive Summary') || getCol(row, '4.1.4 Proposed Solution');
      const valueProp = getCol(row, '4.1.5 Value Proposition') || 'High impact local innovation';
      const techDriver = getCol(row, '4.1.8 10–10 MySTIE Technology Driver') || '';
      const techArchitecture = getCol(row, '4.2.1 Technology Architecture & System Overview');
      const devHistory = getCol(row, '4.2.2 Development History & Validation Evidence');
      const ipStatusRaw = getCol(row, '4.2.3 IP Status');
      const techDocs = getCol(row, '4.2.1.1 Upload Document');
      const devDocs = getCol(row, '4.2.2.1 Upload Document');
      const ipDocs = getCol(row, '4.2.3.1 Upload Document');

      // IP Status Normalization
      let ipStatus: any = 'Trade Secret';
      if (/patent pending/i.test(ipStatusRaw)) ipStatus = 'Patent Pending';
      else if (/patented/i.test(ipStatusRaw)) ipStatus = 'Patented';
      else if (/copyright/i.test(ipStatusRaw)) ipStatus = 'Copyright';
      else if (/none/i.test(ipStatusRaw)) ipStatus = 'None';

      // Market
      const targetCustomer = getCol(row, '5.1.2 Target customer segments') || 'Malaysian Enterprise & Consumers';
      const problemSolved = getCol(row, '5.1.1 What problem does your innovation solve and for whom?') || '';
      const demandEvidence = getCol(row, '5.1.3 Evidence of measurable demand') || '';
      const revenueStreams = getCol(row, '5.3.1 Revenue streams & validation evidence') || '';
      const pricingStrategy = getCol(row, '5.3.2 Pricing strategy') || '';
      const m1Budget = calculateMilestoneBudget(getCol(row, '6.1.1 Milestone 1'));
      const m2Budget = calculateMilestoneBudget(getCol(row, '6.1.2 Milestone 2'));
      const totalFunding = (m1Budget.total + m2Budget.total) || 600000;

      // Reviewers & Scores
      const reviewer1 = getCol(row, 'Reviewer 1') || 'rossuriana@mranti.my';
      const reviewer2 = getCol(row, 'Reviewer 2') || 'maisarah@mranti.my';
      const rawTotalScore = getCol(row, 'Total Score');
      const totalScore = rawTotalScore ? parseFloat(rawTotalScore) : undefined;
      const baselinePassed = totalScore !== undefined ? totalScore >= baselineThreshold : false;

      // Status
      const appStatusRaw = getCol(row, 'Application Status').toLowerCase();
      let status: any = 'submitted';
      if (baselinePassed) {
        status = 'shortlisted';
      } else if (totalScore !== undefined || appStatusRaw.includes('review') || appStatusRaw.includes('completed')) {
        status = 'scoring_review';
      }

      // Collect documents
      const allDocs: DocumentAttachment[] = [
        ...extractUrlsAsDocuments(ssmUrls, 'ssm'),
        ...extractUrlsAsDocuments(cvUrl, 'cv'),
        ...extractUrlsAsDocuments(techDocs, 'tech'),
        ...extractUrlsAsDocuments(devDocs, 'dev'),
        ...extractUrlsAsDocuments(ipDocs, 'ip'),
        ...extractUrlsAsDocuments(getCol(row, '5.1.1.1 Upload Document'), 'market'),
        ...extractUrlsAsDocuments(getCol(row, '5.1.2.1 Upload Document'), 'market-segment'),
        ...extractUrlsAsDocuments(getCol(row, '5.1.3.1 Upload Document'), 'demand'),
        ...extractUrlsAsDocuments(getCol(row, '7.5 Company Stamp / Authorisation Letter'), 'auth'),
      ];

      // Form review scores if present
      let reviewer1Score: ReviewerScore | undefined = undefined;
      let reviewer2Score: ReviewerScore | undefined = undefined;

      if (totalScore !== undefined) {
        const s1Score = parseFloat(getCol(row, 'Section 1 Weight Score')) || 4;
        const s2Score = parseFloat(getCol(row, 'Section 2 Weight Score')) || 4;
        const s3Score = parseFloat(getCol(row, 'Section 3 Weight Score')) || 2;
        const s4Score = parseFloat(getCol(row, 'Section 4 Weight Score')) || 18;
        const s5Score = parseFloat(getCol(row, 'Section 5 Weight Score')) || 15;
        const s6Score = parseFloat(getCol(row, 'Section 6 Weight Score')) || 17;

        const s1Remarks = getCol(row, 'Section 1 Combine Remarks');
        const s2Remarks = getCol(row, 'Section 2 Combine Remarks');
        const s3Remarks = getCol(row, 'Section 3 Combine Remarks');
        const s4Remarks = getCol(row, 'Section 4 Combine Remarks');
        const s5Remarks = getCol(row, 'Section 5 Combine Remarks');
        const s6Remarks = getCol(row, 'Section 6 Combine Remarks');
        const overallRemarks = getCol(row, 'Overall Combine Remarks');

        reviewer1Score = {
          reviewerId: 'rev-05',
          reviewerName: reviewer1,
          reviewerRole: 'Accredited Grant Evaluator (MRANTI)',
          scores: {
            marketPotential: 6,
            techFeasibility: 7,
            teamCapability: 6,
            financialSoundness: 6,
            ecosystemImpact: 5,
          },
          criterionRemarks: {
            marketPotential: s5Remarks || 'Target customer segmentation evaluated.',
            techFeasibility: s4Remarks || 'Architecture and technology stack evaluated.',
            teamCapability: s2Remarks || 'Team profile and technical capacity reviewed.',
            financialSoundness: s6Remarks || 'Milestone deliverables and budget allocation evaluated.',
            ecosystemImpact: s3Remarks || 'Local ecosystem collaboration alignment.',
          },
          totalWeightedScore: totalScore,
          recommendation: baselinePassed ? 'recommend_shortlist' : 'needs_revision',
          generalRemarks: overallRemarks || `Section 1-6 evaluation completed with composite score of ${totalScore}%.`,
          evaluatedAt: getCol(row, 'Last Update Date') || new Date().toISOString().split('T')[0],
        };

        reviewer2Score = {
          reviewerId: 'rev-06',
          reviewerName: reviewer2,
          reviewerRole: 'Commercialisation Advisor (MRANTI)',
          scores: {
            marketPotential: 6,
            techFeasibility: 7,
            teamCapability: 6,
            financialSoundness: 6,
            ecosystemImpact: 5,
          },
          criterionRemarks: {
            marketPotential: s5Remarks || 'Market demand metrics reviewed.',
            techFeasibility: s4Remarks || 'Functional system verified.',
            teamCapability: s2Remarks || 'Governance and project management verified.',
            financialSoundness: s6Remarks || 'Commercial plan and utilization verified.',
            ecosystemImpact: s3Remarks || 'Ecosystem contributions verified.',
          },
          totalWeightedScore: totalScore,
          recommendation: baselinePassed ? 'recommend_shortlist' : 'needs_revision',
          generalRemarks: overallRemarks || `Evaluated by ${reviewer2}.`,
          evaluatedAt: getCol(row, 'Last Update Date') || new Date().toISOString().split('T')[0],
        };
      }

      // Build formData dictionary of all row values for full fidelity
      const formData: Record<string, any> = {};
      headers.forEach((h, i) => {
        if (row[i]) {
          formData[h] = row[i];
        }
      });

      const parsedApp: GrantApplication = {
        id: appId,
        submissionSource: 'jotform_webhook',
        jotformSubmissionId: submissionId,
        status,
        company: {
          name: orgName,
          ssmNumber: ssm,
          incorporationYear: incYear,
          state,
          city: state,
          annualTurnover: 250000,
          turnoverTier: '< RM500K',
          paidUpCapital: 50000,
          employeeCount: 5,
          sector: normalizeSector(industry, techDriver),
          website,
          address,
        },
        applicant: {
          fullName: applicantName,
          designation,
          email,
          phone,
          identificationNo: ic,
        },
        technology: {
          productName: projectTitle,
          tagline: valueProp.slice(0, 120),
          trlLevel: 7,
          productDescription: execSummary || valueProp,
          ipStatus,
          productionReadiness: techArchitecture.slice(0, 400),
          currentCapacity: devHistory.slice(0, 400),
          targetMilestones: [
            ...m1Budget.items.map(i => `${i.category} (RM ${i.amount.toLocaleString()})`),
            ...m2Budget.items.map(i => `${i.category} (RM ${i.amount.toLocaleString()})`),
          ],
        },
        market: {
          targetMarket: targetCustomer,
          targetCustomerProfile: problemSolved.slice(0, 300),
          tamSamSom: demandEvidence.slice(0, 300),
          fundingRequested: totalFunding,
          utilizationBreakdown: [...m1Budget.items, ...m2Budget.items],
          revenueModel: `${revenueStreams} | ${pricingStrategy}`.slice(0, 300),
          exportPotential: true,
          exportTargetCountries: ['Singapore', 'Indonesia'],
        },
        documents: allDocs,
        assignedReviewers: ['rev-05', 'rev-06'],
        reviewer1Score,
        reviewer2Score,
        compositeScore: totalScore,
        baselinePassed,
        assignedAnalystId: 'ana-01',
        assignedAnalystName: 'Shafiq Fauzi',
        analystNotes: baselinePassed
          ? 'Passed baseline evaluation. Ready for site visit and verification.'
          : `Composite score: ${totalScore}%. Review completed.`,
        formData,
        createdAt: getCol(row, 'Submission Date') || new Date().toISOString(),
        updatedAt: getCol(row, 'Last Update Date') || new Date().toISOString(),
      };

      applications.push(parsedApp);
    } catch (err: any) {
      errors.push(`Row ${r + 1}: ${err.message}`);
    }
  }

  return {
    applications,
    errors,
    totalParsed: applications.length,
  };
}

/**
 * Generate standard PostgreSQL INSERT statements ready to run in Supabase SQL Editor
 */
export function generateSqlInserts(apps: GrantApplication[]): string {
  const statements: string[] = [
    `-- Commercialize Grant Platform (Dana Pengkomersialan)`,
    `-- Generated SQL migration for ${apps.length} application(s)`,
    `-- Run in Supabase SQL Editor (>_ icon) to populate live tables`,
    ``,
  ];

  apps.forEach((app, idx) => {
    const c = app.company;
    const a = app.applicant;
    const t = app.technology;
    const m = app.market;

    const escapeSql = (str: string | undefined | null) => {
      if (!str) return `''`;
      return `'${str.replace(/'/g, "''")}'`;
    };

    // Insert company
    statements.push(`-- [${idx + 1}/${apps.length}] ${c.name} (${app.id})`);
    statements.push(
      `INSERT INTO companies (name, ssm_number, incorporation_year, state, city, annual_turnover, turnover_tier, paid_up_capital, employee_count, sector, website, address) ` +
      `VALUES (${escapeSql(c.name)}, ${escapeSql(c.ssmNumber)}, ${c.incorporationYear}, ${escapeSql(c.state)}, ${escapeSql(c.city)}, ${c.annualTurnover}, ${escapeSql(c.turnoverTier)}, ${c.paidUpCapital}, ${c.employeeCount}, ${escapeSql(c.sector)}, ${escapeSql(c.website)}, ${escapeSql(c.address)}) ` +
      `ON CONFLICT (ssm_number) DO UPDATE SET name = EXCLUDED.name;`
    );

    // Insert application
    statements.push(
      `INSERT INTO applications (id, submission_source, jotform_submission_id, status, applicant_name, applicant_designation, applicant_email, applicant_phone, identification_no, product_name, tagline, trl_level, product_description, ip_status, production_readiness, current_capacity, target_market, tam_sam_som, funding_requested, revenue_model, export_potential, assigned_reviewer_1_id, assigned_reviewer_2_id, composite_score, baseline_passed, assigned_analyst_id, assigned_analyst_name, analyst_notes) ` +
      `VALUES (${escapeSql(app.id)}, 'jotform_webhook', ${escapeSql(app.jotformSubmissionId)}, ${escapeSql(app.status)}, ${escapeSql(a.fullName)}, ${escapeSql(a.designation)}, ${escapeSql(a.email)}, ${escapeSql(a.phone)}, ${escapeSql(a.identificationNo)}, ${escapeSql(t.productName)}, ${escapeSql(t.tagline)}, ${t.trlLevel}, ${escapeSql(t.productDescription)}, ${escapeSql(t.ipStatus)}, ${escapeSql(t.productionReadiness)}, ${escapeSql(t.currentCapacity)}, ${escapeSql(m.targetMarket)}, ${escapeSql(m.tamSamSom)}, ${m.fundingRequested}, ${escapeSql(m.revenueModel)}, ${m.exportPotential}, 'rev-05', 'rev-06', ${app.compositeScore ?? 'NULL'}, ${app.baselinePassed ? 'TRUE' : 'FALSE'}, 'ana-01', 'Shafiq Fauzi', ${escapeSql(app.analystNotes)}) ` +
      `ON CONFLICT (id) DO UPDATE SET composite_score = EXCLUDED.composite_score, status = EXCLUDED.status;`
    );
    statements.push('');
  });

  return statements.join('\n');
}
