const SOP_TEMPLATE = `Use this 14-section BRCGS/USDA standard format. Write 600–1000 words of fully completed content — no placeholders in brackets, every field filled with realistic specifics for the given facility type.

# [SOP Title]

| | |
|---|---|
| **SOP Number** | SOP-CLAUSEID-001 |
| **Department** | Quality Assurance / Food Safety |
| **Effective Date** | [Month Day, Year] |
| **Revision Number** | Rev. 1.0 |
| **Prepared By** | Quality Manager |
| **Approved By** | Facility Director |
| **Next Review Date** | [1 year from effective date] |

---

## 1. Purpose
[2–3 sentences stating the objective and which BRCGS clause this satisfies]

## 2. Scope
[Define which personnel, areas, products, and activities this SOP covers]

## 3. Regulatory Basis & References
- BRCGS Food Safety Issue 9, Clause CLAUSEID — CLAUSETITLE
- [Any related FDA/USDA regulation or internal cross-reference]

## 4. Definitions
| Term | Definition |
|------|------------|
| [Term] | [Plain-language definition relevant to this SOP] |

## 5. Responsibilities
| Role | Responsibility |
|------|----------------|
| Quality Manager | [Overall accountability for this procedure] |
| [Production Supervisor] | [Day-to-day execution responsibility] |
| [All Personnel] | [Compliance and reporting obligation] |

## 6. Materials, Equipment & Forms Required
- [Equipment or tool 1]
- [Equipment or tool 2]
- [Form ID / Record name]

## 7. Pre-Operational Requirements
[Checks or conditions that must be verified before starting this procedure]

## 8. Procedure
### 8.1 [First Phase or Activity]
1. [Specific, actionable step with measurable detail]
2. [Specific, actionable step]
3. [Specific, actionable step]

### 8.2 [Second Phase or Activity]
1. [Specific, actionable step]
2. [Specific, actionable step]

### 8.3 [Third Phase — if applicable]
1. [Step]
2. [Step]

## 9. Monitoring & Measurement
| Parameter | Acceptance Criteria | Frequency | Method | Responsible | Record |
|-----------|--------------------|-----------|---------|-----------  |--------|
| [Parameter] | [Spec/limit] | [Frequency] | [How measured] | [Role] | [Form ID] |

## 10. Corrective Actions
| Deviation | Immediate Action | Root Cause Investigation | Documentation |
|-----------|-----------------|--------------------------|---------------|
| [Deviation description] | [Immediate step to take] | [How to investigate] | [Form to complete] |

## 11. Verification
[Describe how the effectiveness of this SOP is verified — supervisor sign-off, internal audit schedule, test results review, etc.]

## 12. Training Requirements
| Who | Training Content | Frequency | Record |
|-----|-----------------|-----------|--------|
| [Role / All staff] | [What they must know and demonstrate] | [Initial + annual refresh] | [Training log location] |

## 13. Records & Documentation
| Record | Form # | Retention Period | Storage Location |
|--------|--------|-----------------|------------------|
| [Record name] | [Form ID] | [X years] | [Physical or digital location] |

## 14. Revision History
| Rev | Date | Description of Change | Authorized By |
|-----|------|-----------------------|---------------|
| 1.0 | [Effective Date] | Initial release | Quality Manager |`

export type SOPFormat = 'concise' | 'standard' | 'iso'

export async function generateSOPWithClaude(params: {
  clauseId: string
  clauseTitle: string
  clauseDescription: string
  sopType: string
  facilityType: string
  additionalContext: string
  onChunk?: (chunk: string) => void
}): Promise<string> {
  const { clauseId, clauseTitle, clauseDescription, sopType, facilityType, additionalContext, onChunk } = params

  const template = SOP_TEMPLATE
    .replace(/CLAUSEID/g, clauseId.replace(/\./g, '-'))
    .replace(/CLAUSETITLE/g, clauseTitle)

  const prompt = `You are a BRCGS-certified food safety consultant. Write a production-ready SOP — no placeholder text, realistic and immediately usable.

BRCGS Clause: ${clauseId} — ${clauseTitle}
Clause Requirement: ${clauseDescription}
SOP Type: ${sopType}
Facility Type: ${facilityType}${additionalContext ? `\nFacility Notes: ${additionalContext}` : ''}

${template}

IMPORTANT: Write realistic content for a ${facilityType}. Replace every [bracket] with actual specific content for this facility and SOP type. No generic placeholders. Every step must be specific and actionable. Output must be copy-paste ready for a real food safety audit.`

  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      stream: true,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) throw new Error(`Claude API error: ${res.status}`)

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let fullText = ''
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6)
      if (data === '[DONE]') continue
      try {
        const json = JSON.parse(data)
        if (json.type === 'content_block_delta' && json.delta?.type === 'text_delta') {
          const chunk = json.delta.text as string
          fullText += chunk
          onChunk?.(chunk)
        }
      } catch { /* skip malformed SSE lines */ }
    }
  }

  return fullText
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
        content: `You are editing an SOP document. Apply the following instruction to the SOP below. Return only the updated SOP — no explanation, no preamble.\n\nInstruction: ${instruction}\n\nSOP:\n${currentSOP}`,
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
        content: `You are a BRCGS Issue 9 auditor. Review this SOP against clause ${clauseId} — ${clauseTitle}.\n\nClause requirement: ${clauseDescription}\n\nReturn a concise audit report using this format:\n\n## Audit Result: [PASS / MINOR GAPS / MAJOR GAPS]\n\n### Strengths\n- [what the SOP does well against this clause]\n\n### Gaps\n- [specific missing or inadequate elements — reference clause requirements]\n\n### Recommendations\n- [concrete changes to close each gap]\n\nBe specific and direct. If the SOP fully meets requirements, say so clearly.\n\nSOP:\n${sopText.slice(0, 8000)}`,
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
  const prompt = `You are a certified food safety auditor with deep expertise in ${standard}.\n\nReview the following SOP document and compare it against the requirements of element ${elementCode}: ${elementName}.\n\nReturn ONLY a valid JSON array. No explanation, no markdown, no preamble. Each object in the array must have exactly these fields:\n- element_code: string (the standard element being evaluated)\n- requirement: string (the specific requirement from the standard)\n- gap_description: string (what is missing or non-compliant in the SOP)\n\nIf the SOP fully satisfies all requirements for this element, return: []\n\nSOP document text:\n${sopText.slice(0, 12000)}`

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
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  try {
    return JSON.parse(cleaned) as GapFinding[]
  } catch {
    throw new Error('Claude returned invalid JSON. Try again.')
  }
}
