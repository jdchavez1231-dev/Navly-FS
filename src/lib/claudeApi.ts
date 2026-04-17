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
