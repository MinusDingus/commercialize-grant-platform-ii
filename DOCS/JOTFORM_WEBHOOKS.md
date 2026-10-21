# Jotform Webhook Integration Guide

This guide explains how to connect Jotform forms to the Commercialize Grant Management Platform (Dana Pengkomersialan), including field mapping, file upload handling, and sample payloads.

---

## 1. Overview

By using Jotform as an intake front-end:
1. Applicants complete your branded grant application form in Jotform.
2. Jotform sends an HTTP `POST` request with the form submission payload as multipart form-data or JSON to your platform webhook endpoint.
3. The platform parses the payload, validates required fields, maps company and technology attributes, stores the application in the CRM, and dispatches a confirmation email to the applicant.

---

## 2. Setting Up the Webhook in Jotform

Follow these steps in your Jotform account:

1. **Open Your Form**: Log in to Jotform and click **Edit Form** on your Commercialize Grant application form.
2. **Access Settings**: Click the **Settings** tab in the top navigation bar.
3. **Select Integrations**: In the left sidebar, click **Integrations**.
4. **Search for WebHooks**: Type `WebHooks` in the search bar and click on the WebHooks tile.
5. **Add Webhook URL**:
   - For local development: Use a tunnel service like ngrok (`https://[subdomain].ngrok-free.app/api/jotform-webhook`) or use the built-in **Webhook Simulator** inside the platform.
   - For production: Enter `https://[YOUR_PRODUCTION_DOMAIN]/api/jotform-webhook`
6. **Save Integration**: Click **Complete Integration**.

---

## 3. Field Mapping Reference

When designing your form in Jotform, name your fields or question labels to match these keys for automatic property extraction:

| Jotform Field / Question Unique Name | CRM Data Entity Property | Type | Sample Value |
| :--- | :--- | :--- | :--- |
| `company_name` or `companyName` | `company.name` | String | `BioHarvest Dynamics Sdn Bhd` |
| `ssm_number` or `ssmNumber` | `company.ssmNumber` | String | `202101034821 (1428930-T)` |
| `state` | `company.state` | MalaysianState | `Selangor` |
| `annual_turnover` or `turnover` | `company.annualTurnover` | Number (MYR) | `1850000` |
| `sector` or `industry` | `company.sector` | IndustrySector | `AgriTech & Food Security` |
| `applicant_name` or `fullName` | `applicant.fullName` | String | `Dr. Syahril Nizam` |
| `email` | `applicant.email` | String | `syahril@bioharvestdynamics.my` |
| `phone` | `applicant.phone` | String | `+60 12-384 9912` |
| `product_name` or `innovationTitle` | `technology.productName` | String | `PrecisionPulse Smart Harvester` |
| `trl` or `readinessLevel` | `technology.trlLevel` | Number (6-9) | `7` |
| `description` | `technology.productDescription`| String | `AI-driven optical sorting sensor...` |
| `funding_requested` or `grantAmount` | `market.fundingRequested` | Number (MYR) | `750000` |
| `pitch_deck` (File Upload) | `documents[]` | File Attachment | `Pitch_Deck.pdf` |
| `ssm_certificate` (File Upload) | `documents[]` | File Attachment | `SSM_Cert.pdf` |

---

## 4. Sample JSON Webhook Payload

When Jotform fires a webhook, it transmits data structured as follows:

```json
{
  "submissionID": "5849203912847291",
  "formID": "24098234821901",
  "ip": "175.143.28.19",
  "rawRequest": {
    "company_name": "NanoCarbon Membrane Systems Sdn Bhd",
    "ssm_number": "202301048920 (1489021-T)",
    "sector": "Clean Energy & Mobility",
    "state": "Penang",
    "annual_turnover": 1450000,
    "funding_requested": 800000,
    "trl": 7,
    "applicant_name": "Dr. Raymond Tan Choo Hock",
    "email": "raymond.tan@nanocarbon.my",
    "phone": "+60 12-482 9910",
    "product_name": "Graphene-Oxide Electrodialysis Water Desalination Cartridge",
    "description": "Ultra-low energy capacitive deionization membrane cartridge for industrial zero-liquid discharge (ZLD) semiconductor wastewater treatment.",
    "attachment_pitch_deck": "https://files.jotform.com/uploads/NanoCarbon_Pitch_Deck_2026.pdf",
    "attachment_ssm": "https://files.jotform.com/uploads/SSM_Form_9_Cert.pdf"
  }
}
```

---

## 5. Testing Without Real Submissions

Use the built-in **Webhook Simulator** located in the **Jotform Sync** tab of this platform:
1. Navigate to the **Jotform Sync** tab in the top navigation.
2. The interactive simulator displays an editable JSON sample.
3. Edit the company name, funding amount, or sector as desired.
4. Click **Simulate Inbound Jotform Webhook**.
5. The application is created instantly, appears in the Kanban pipeline, and an applicant confirmation email is recorded in the Email Notification Center!
