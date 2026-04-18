export type SOPFormat = 'concise' | 'standard' | 'iso'

const FORMAT_INSTRUCTIONS: Record<SOPFormat, string> = {
  concise: `Use this format (aim for 400–600 words):

# [SOP Title]
**Doc #:** SOP-${'{clauseId}'}-001 | **Version:** 1.0 | **Effective:** [Month Year] | **Owner:** Quality Manager

---

## Purpose
[1–2 sentences]

## Scope
[1 short paragraph]

## Responsibilities
- **Quality Manager:** [key duty]
- **Production Supervisor:** [key duty]
- **[Third role]:** [key duty]

## Procedure
1. [Step]
2. [Step]
[6–8 numbered steps, high-level and actionable]

## Monitoring & Records
| Record | Frequency | Responsible |
|--------|-----------|-------------|
| [Form] | [Frequency] | [Role] |

## Corrective Actions
If [deviation]: [action]. Notify [role]. Document on [form]. Root cause within [timeframe].

## Revision History
| Ver | Date | Description |
|-----|------|-------------|
| 1.0 | [Month Year] | Initial release |`,

  standard: `Use this GFSI/BRCGS standard format (aim for 600–900 words):

# [SOP Title]

**Document Number:** SOP-${'{clauseId}'}-001
**Version:** 1.0
**Effective Date:** [Month Day, Year]
**Review Date:** [1 year from effective]
**Department:** Quality Assurance
**Approved By:** Quality Manager

---

## 1. Purpose
[2–3 sentences explaining the objective and regulatory basis]

## 2. Scope
[Who, what areas, what products/activities this covers]

## 3. Responsibilities

| Role | Responsibility |
|------|----------------|
| Quality Manager | [duty] |
| Production Supervisor | [duty] |
| [Role] | [duty] |

## 4. Procedure

### 4.1 [Sub-section name]
1. [Detailed step]
2. [Detailed step]

### 4.2 [Sub-section name]
1. [Detailed step]
2. [Detailed step]

## 5. Monitoring & Verification
| Activity | Frequency | Method | Responsible | Record |
|----------|-----------|--------|-------------|--------|
| [Activity] | [Freq] | [How] | [Who] | [Form #] |

## 6. Corrective Actions
| Deviation | Immediate Action | Root Cause | Documentation |
|-----------|-----------------|------------|---------------|
| [Deviation] | [Action] | [Investigation] | [Form] |

## 7. Related Documents
- [Referenced SOP or form]
- [Referenced SOP or form]

## 8. Revision History
| Version | Date | Description | Author |
|---------|------|-------------|--------|
| 1.0 | [Date] | Initial release | Quality Manager |`,

  iso: `Use this ISO/FSSC-aligned format with numbered sections (aim for 700–1000 words):

# [SOP Title]

**Document ID:** SOP-${'{clauseId}'}-001
**Issue No.:** 1 | **Revision:** 0
**Date of Issue:** [Month Year]
**Next Review:** [1 year]
**Process Owner:** Quality Management
**Distribution:** Controlled Copy

---

## 1.0 Objective
[2–3 sentences stating what this procedure achieves and which standard clause it satisfies]

## 2.0 Scope
[Precise boundary of applicability: facilities, product lines, processes, personnel]

## 3.0 References
- BRCGS Food Safety Issue 9, Clause [X.X]
- [Any related internal documents]

## 4.0 Definitions
| Term | Definition |
|------|------------|
| [Term] | [Definition] |

## 5.0 Responsibilities
| Function | Accountability |
|----------|---------------|
| Quality Manager | [specific accountability] |
| [Role] | [specific accountability] |

## 6.0 Procedure

### 6.1 [Phase/Activity]
6.1.1 [Step with precise requirement]
6.1.2 [Step with precise requirement]

### 6.2 [Phase/Activity]
6.2.1 [Step]
6.2.2 [Step]

## 7.0 Monitoring, Measurement & Records
| Parameter | Acceptance Criteria | Frequency | Record | Retention |
|-----------|-------------------|-----------|--------|-----------|
| [Parameter] | [Spec] | [Freq] | [Form ID] | [X years] |

## 8.0 Non-Conformance & Corrective Action
8.0.1 Any deviation from this procedure constitutes a non-conformance and must be recorded on NCR Form [X].
8.0.2 [Specific corrective action process]
8.0.3 Effectiveness verification required within [timeframe].

## 9.0 Document Control
| Version | Date | Amendment | Authorized By |
|---------|------|-----------|---------------|
| 1.0 | [Date] | Original issue | Quality Manager |`,
}

export async function generateSOPWithClaude(params: {
  clauseId: string
  clauseTitle: string
  clauseDescription: string
  sopType: string
  facilityType: string
  additionalContext: string
  format?: SOPFormat
}): Promise<string> {
  const { clauseId, clauseTitle, clauseDescription, sopType, facilityType, additionalContext, format = 'standard' } = params

  const formatInstructions = FORMAT_INSTRUCTIONS[format].replace(/\$\{'{clauseId}'\}/g, clauseId.replace(/\./g, '-'))

  const prompt = `You are a BRCGS-certified food safety consultant. Write a production-ready SOP — no placeholder text, realistic and immediately usable.

BRCGS Clause: ${clauseId} — ${clauseTitle}
Clause Requirement: ${clauseDescription}
SOP Type: ${sopType}
Facility Type: ${facilityType}${additionalContext ? `\nFacility Notes: ${additionalContext}` : ''}

${formatInstructions}

IMPORTANT: Write realistic content for a ${facilityType}. Replace every [bracket] with actual content. No placeholders. Every step must be specific and actionable. The output must be copy-paste ready for a real food safety audit.`

  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) throw new Error(`Claude API error: ${res.status}`)

  const json = await res.json()
  return json.content?.[0]?.text ?? ''
}

export async function editSOPWithClaude(currentSOP: string, instruction: string): Promise<string> {
  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `You are editing an SOP document. Apply the following instruction to the SOP below. Return only the updated SOP — no explanation, no preamble.

Instruction: ${instruction}

SOP:
${currentSOP}`,
      }],
    }),
  })
  if (!res.ok) throw new Error(`Claude API error: ${res.status}`)
  const json = await res.json()
  return json.content?.[0]?.text ?? ''
}

export async function auditSOPWithClaude(sopText: string, clauseId: string, clauseTitle: string, clauseDescription: string): Promise<string> {
  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `You are a BRCGS Issue 9 auditor. Review this SOP against clause ${clauseId} — ${clauseTitle}.

Clause requirement: ${clauseDescription}

Return a concise audit report using this format:

## Audit Result: [PASS / MINOR GAPS / MAJOR GAPS]

### Strengths
- [what the SOP does well against this clause]

### Gaps
- [specific missing or inadequate elements — reference clause requirements]

### Recommendations
- [concrete changes to close each gap]

Be specific and direct. If the SOP fully meets requirements, say so clearly.

SOP:
${sopText.slice(0, 8000)}`,
      }],
    }),
  })
  if (!res.ok) throw new Error(`Claude API error: ${res.status}`)
  const json = await res.json()
  return json.content?.[0]?.text ?? ''
}

export type GapFinding = {
  element_code: string
  requirement: string
  gap_description: string
}

export async function analyzeSOPWithClaude(
  sopText: string,
  standard: string,
  elementCode: string,
  elementName: string
): Promise<GapFinding[]> {
  const prompt = `You are a certified food safety auditor with deep expertise in ${standard}.

Review the following SOP document and compare it against the requirements of element ${elementCode}: ${elementName}.

Return ONLY a valid JSON array. No explanation, no markdown, no preamble. Each object in the array must have exactly these fields:
- element_code: string (the standard element being evaluated)
- requirement: string (the specific requirement from the standard)
- gap_description: string (what is missing or non-compliant in the SOP)

If the SOP fully satisfies all requirements for this element, return: []

SOP document text:
${sopText.slice(0, 12000)}`

  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Claude API error: ${err}`)
  }

  const json = await res.json()
  const content = json.content?.[0]?.text ?? ''

  // Strip any accidental markdown fences
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  try {
    return JSON.parse(cleaned) as GapFinding[]
  } catch {
    throw new Error('Claude returned invalid JSON. Try again.')
  }
}
