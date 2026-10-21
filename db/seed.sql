-- ==============================================================================
-- Commercialize Grant Management Platform (Dana Pengkomersialan)
-- PostgreSQL Initial Seed Data
-- Run this in Supabase SQL Editor after running db/schema.sql
-- ==============================================================================

-- 1. Insert Companies
INSERT INTO companies (id, name, ssm_number, incorporation_year, state, city, annual_turnover, turnover_tier, paid_up_capital, employee_count, sector, website, address)
VALUES
(1, 'Aerodyne Robotics Sdn Bhd', '201801045231', 2018, 'Selangor', 'Cyberjaya', 3800000.00, 'RM2M - RM5M', 500000.00, 42, 'Deep Tech & AI', 'https://aerodyne-robotics.my', 'Persiaran APEC, 63000 Cyberjaya, Selangor'),
(2, 'AgroBio Precision Systems', '202001019842', 2020, 'Johor', 'Kulai', 1200000.00, 'RM500K - RM2M', 250000.00, 18, 'AgriTech & Food Security', 'https://agrobioprecision.com', 'Kulai Senai Innovation Hub, 81400 Kulai, Johor'),
(3, 'NanoShield Nanomaterials Sdn Bhd', '201901032114', 2019, 'Penang', 'Bayan Lepas', 4950000.00, 'RM2M - RM5M', 750000.00, 31, 'Smart Manufacturing & Materials', 'https://nanoshield.com.my', 'Phase 4, Free Industrial Zone, 11900 Bayan Lepas, Penang'),
(4, 'VoltaCell Energy Solutions', '202101008745', 2021, 'Sarawak', 'Kuching', 420000.00, '< RM500K', 150000.00, 12, 'Clean Energy & Greentech', 'https://voltacellenergy.my', 'Samariang Eco-Tech Park, 93050 Kuching, Sarawak'),
(5, 'CardioSense BioMed Diagnostics', '202201011234', 2022, 'Kuala Lumpur', 'Bangsar South', 850000.00, 'RM500K - RM2M', 300000.00, 15, 'Digital Health & MedTech', 'https://cardiosense.health', 'The Horizon, Bangsar South, 59200 Kuala Lumpur')
ON CONFLICT (id) DO NOTHING;

-- Reset sequence for companies id
SELECT setval('companies_id_seq', (SELECT MAX(id) FROM companies));

-- 2. Insert Grant Applications
INSERT INTO applications (
    id, company_id, submission_source, status,
    applicant_name, applicant_designation, applicant_email, applicant_phone, identification_no,
    product_name, tagline, trl_level, product_description, ip_status, production_readiness, current_capacity,
    target_market, tam_sam_som, funding_requested, revenue_model, export_potential,
    assigned_reviewer_1_id, assigned_reviewer_2_id, composite_score, baseline_passed,
    assigned_analyst_id, assigned_analyst_name, analyst_notes
)
VALUES
(
    'CRG-2026-0101', 1, 'portal', 'analyst_due_diligence',
    'Ir. Kamarul Bahrin', 'Chief Technology Officer', 'kamarul@aerodyne-robotics.my', '+6012-3849102', '840912-10-5541',
    'VertiScan Autonomous LiDAR Drone', 'Sub-millimeter aerial structural inspection for power transmission grid corridors.', 7,
    'High-altitude autonomous UAS equipped with edge-AI computing for real-time corridor defect classification and live digital twin synchronization.', 'Granted Patent',
    'Pilot batch produced (15 units field deployed across Tenaga Nasional grid lines).', '50 units / month capacity with local contract manufacturer in Shah Alam.',
    'ASEAN utility operators, civil engineering asset owners, and high-voltage transmission authorities.',
    'TAM: RM 1.4B ASEAN | SAM: RM 320M Malaysia/Indonesia | SOM: RM 45M within 36 months.',
    500000.00, 'Hardware unit sales (RM120k/drone) plus recurring SaaS subscription for anomaly detection platform.', TRUE,
    'rev-01', 'rev-02', 88.00, TRUE,
    'ana-01', 'Farah Hanim Mohd (Lead Analyst)', 'Site inspection completed on 12 Oct. Factory pilot certified ISO9001. Reviewing audited accounts for 2024-2025.'
),
(
    'CRG-2026-0102', 2, 'portal', 'shortlisted',
    'Dr. Sivakumar Ramanathan', 'Founding Director', 'siva@agrobioprecision.com', '+6019-7128345', '781105-01-6323',
    'BioEnzyme Soil Vitality Enhancer', 'Biological soil microbial formulation reducing synthetic fertilizer dependency by 40%.', 8,
    'Proprietary bacterial consortia isolated from virgin tropical peat forests, stabilized into granular dissolvable micro-pellets.', 'Patent Pending',
    'Full industrial batch test completed in collaboration with MPOB and FELDA smallholders (120 hectares trial).', '10 tons formulation / month.',
    'Oil palm plantations, durian commercial estates, and smallholder vegetable collectives across Malaysia & Indonesia.',
    'TAM: RM 950M Malaysia | SAM: RM 280M plantation estates | SOM: RM 28M year 1-2.',
    350000.00, 'Direct B2B bulk distribution through agricultural cooperatives at RM 45/hectare application rate.', TRUE,
    'rev-01', 'rev-02', 77.50, TRUE,
    'ana-02', 'Muhammad Danial (Investment Analyst)', 'Passed scoring baseline threshold (77.5% > 75.0%). Scheduled for financial solvency audit.'
),
(
    'CRG-2026-0103', 3, 'portal', 'scoring_review',
    'Wong Chee Kong', 'Managing Director', 'ckwong@nanoshield.com.my', '+6016-4491029', '810324-07-5291',
    'ThermalBarrier Graphene Coating', 'Sub-micron graphene thermal dissipation barrier for automotive electric battery enclosures.', 6,
    'Sprayable nanostructured carbon formulation dissipating thermal spikes up to 45% faster than standard copper heat spreaders.', 'Trade Secret',
    'Lab prototypes tested in climatic chambers up to 250C with Proton R&D engineers.', 'Lab scale (500 liters/batch). Seeking capex grant for 5,000L continuous mixing reactor.',
    'Tier-1 automotive component suppliers and battery pack assemblers in Malaysia, Thailand, and Vietnam.',
    'TAM: RM 2.1B Regional EV Supply Chain | SAM: RM 450M | SOM: RM 60M.',
    750000.00, 'Volume chemical coating supply contracts with Tier-1 OEMs under 3-year supply agreements.', TRUE,
    'rev-01', 'rev-02', NULL, FALSE,
    NULL, NULL, NULL
),
(
    'CRG-2026-0104', 4, 'jotform_webhook', 'submitted',
    'Grace Dayang Anak Henry', 'Lead Engineer & Co-Founder', 'grace@voltacellenergy.my', '+6013-8023910', '920614-13-5892',
    'HydroFlow Micro-Kinetic River Turbine', 'Sub-surface river generator providing 24/7 baseline electrification for remote Borneo settlements.', 6,
    'Ultra-low flow kinetic hydro turbine operating at water velocities down to 0.8 m/s with zero damming requirements.', 'Patent Pending',
    'Demonstration prototype functioning continuously for 9 months in Upper Baram, Sarawak.', '3 units custom assembled.',
    'Off-grid indigenous communities, rural eco-resorts, and remote agricultural research stations.',
    'TAM: RM 180M East Malaysia | SAM: RM 65M | SOM: RM 12M.',
    280000.00, 'Government rural electrification turnkey contracts and NGO utility procurement grants.', FALSE,
    NULL, NULL, NULL, FALSE,
    NULL, NULL, NULL
),
(
    'CRG-2026-0105', 5, 'portal', 'analyst_due_diligence',
    'Nurul Izzati Zakaria', 'Chief Executive Officer', 'izzati@cardiosense.health', '+6012-9018442', '891018-14-6104',
    'AI-ECG 12-Lead Point-of-Care Patch', 'Wearable wireless 12-lead ECG monitor with embedded on-chip arrhythmia predictive neural network.', 8,
    'Medical-grade disposable adhesive patch with 7-day battery life, continuously streaming to hospital cardiology monitoring portals.', 'Granted Patent',
    'MDA (Medical Device Authority Malaysia) Class B certification achieved; clinical trial completed at Hospital Canselor Tuanku Muhriz.', '5,000 patches/month contract manufacturing partner in Penang.',
    'Private hospital networks, government health clinics (Klinik Kesihatan), and home cardiology rehabilitation clinics.',
    'TAM: RM 820M ASEAN | SAM: RM 210M Malaysia & Singapore | SOM: RM 35M within 24 months.',
    600000.00, 'Per-patient monitoring kit fee (RM 180) + hospital cloud analysis dashboard subscription (RM 1,200/month).', TRUE,
    'rev-01', 'rev-02', 91.00, TRUE,
    'ana-01', 'Farah Hanim Mohd (Lead Analyst)', 'Clinical MDA approval validated. Pitch deck ready for Board Commercialization Committee on 24 October.'
)
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Reviewer Scoring Evaluations
INSERT INTO reviews (
    application_id, reviewer_id, reviewer_name, reviewer_role,
    score_market_potential, score_tech_feasibility, score_team_capability, score_financial_soundness, score_ecosystem_impact,
    total_weighted_score, recommendation,
    remarks_market_potential, remarks_tech_feasibility, remarks_team_capability, remarks_financial_soundness, remarks_ecosystem_impact, general_remarks
)
VALUES
(
    'CRG-2026-0101', 'rev-01', 'Dr. Aiman Razak', 'Technical Reviewer (Engineering & Robotics)',
    9, 9, 8, 8, 9, 86.50, 'recommend_shortlist',
    'Clear commercial traction with national grid operator.', 'Robust autonomous navigation system, TRL 7 validated in field.', 'Experienced technical leadership with UAV aerospace background.', 'Prudent budget allocation across sensor upgrades.', 'High impact on national infrastructure resilience.', 'Exemplary project. Recommend immediate progression.'
),
(
    'CRG-2026-0101', 'rev-02', 'Ir. Tan Mei Ling', 'Commercial Reviewer (Market & Investment)',
    9, 9, 9, 9, 9, 89.50, 'recommend_shortlist',
    'Strong market pull with verified letters of intent.', 'Solid defensibility through granted patent.', 'Proven track record of scaling technology companies.', 'Sound financial unit economics.', 'High value job creation for local drone pilots and data analysts.', 'Highly recommended for shortlist and analyst audit.'
),
(
    'CRG-2026-0102', 'rev-01', 'Dr. Aiman Razak', 'Technical Reviewer (AgriTech & Bio)',
    8, 8, 7, 7, 8, 76.50, 'recommend_shortlist',
    'Demonstrated demand among smallholders seeking yield boost.', 'Good formulation stability, TRL 8 verified.', 'Strong agronomic expertise.', 'Capex allocation for pelletizing equipment is realistic.', 'Substantial environmental benefit via reduced chemical runoff.', 'Meets technical threshold comfortably.'
),
(
    'CRG-2026-0102', 'rev-02', 'Ir. Tan Mei Ling', 'Commercial Reviewer (Market & Investment)',
    8, 8, 8, 7, 8, 78.50, 'recommend_shortlist',
    'Huge addressable market across Malaysian palm oil estates.', 'Field trial data is convincing.', 'Co-founders have deep relationships with agricultural cooperatives.', 'Financial projections are modest and achievable.', 'Supports National Agrofood Policy 2021-2030.', 'Score surpasses 75% baseline. Recommend analyst review.'
),
(
    'CRG-2026-0105', 'rev-01', 'Dr. Aiman Razak', 'Technical Reviewer (MedTech & BioMed)',
    9, 9, 9, 9, 9, 90.00, 'recommend_shortlist',
    'Crucial medical necessity for remote cardiac screening.', 'MDA Class B registration is a decisive competitive barrier.', 'Experienced cardiology advisors and biomedical engineers.', 'Financial model shows clear route to profitability.', 'Direct socio-economic impact in rural healthcare delivery.', 'Outstanding candidate for grant award.'
),
(
    'CRG-2026-0105', 'rev-02', 'Ir. Tan Mei Ling', 'Commercial Reviewer (Market & Investment)',
    9, 9, 9, 9, 10, 92.00, 'recommend_shortlist',
    'Verified export interest in Singapore and Indonesia hospitals.', 'Medical device regulatory moats protect market share.', 'Exceptional executive team.', 'High gross margins (>65%) on disposable patches.', 'Reduces public hospital cardiac bed occupancy.', 'One of the best commercialization proposals evaluated.'
)
ON CONFLICT (application_id, reviewer_id) DO NOTHING;

-- 4. Insert Global Baseline Threshold
INSERT INTO grant_settings (key, baseline_threshold)
VALUES ('global', 75.0)
ON CONFLICT (key) DO UPDATE SET baseline_threshold = 75.0;
