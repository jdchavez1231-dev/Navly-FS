import type { BrcgsSection } from '../types'

export const BRCGS_SECTIONS: BrcgsSection[] = [
  {
    id: '1',
    title: 'Senior Management Commitment',
    clauses: [
      {
        id: '1.1',
        title: 'Senior management commitment and continual improvement',
        description:
          'Senior management must demonstrate commitment to food safety and quality through a documented policy, regular management reviews, and resource allocation. The site must have a programme of planned objectives and a culture where all staff understand their role in food safety.',
        rating: 'major',
      },
      {
        id: '1.2',
        title: 'Organisational structure, responsibilities, and management authority',
        description:
          'An organisational chart must define reporting relationships. Responsibilities for food safety and quality activities must be clearly assigned, and deputies must be nominated for key roles covering absence.',
        rating: 'major',
      },
    ],
  },
  {
    id: '2',
    title: 'The Food Safety Plan – HACCP',
    clauses: [
      {
        id: '2.1',
        title: 'The HACCP food safety team',
        description:
          'A multidisciplinary HACCP team must be assembled with documented competency in food safety hazard analysis. The team must cover the full scope of the HACCP plan and be led by a qualified HACCP coordinator.',
        rating: 'fundamental',
      },
      {
        id: '2.2',
        title: 'Prerequisite programmes (PRPs)',
        description:
          'PRPs covering cleaning, pest control, personal hygiene, allergen management, maintenance, and other GMP foundations must be documented, implemented, and reviewed as part of the food safety system.',
        rating: 'major',
      },
      {
        id: '2.3',
        title: 'Describe the product',
        description:
          'Full product descriptions must be documented, including raw material composition, packaging type, shelf life, storage and distribution conditions, and any processing methods applied.',
        rating: 'major',
      },
      {
        id: '2.4',
        title: 'Identify intended use',
        description:
          'The intended use of each product and any known potential for consumer misuse must be defined and documented, with special consideration for vulnerable groups such as infants, the elderly, or allergy sufferers.',
        rating: 'major',
      },
      {
        id: '2.5',
        title: 'Construct a flow diagram',
        description:
          'A detailed process flow diagram covering all steps from receipt of raw materials through production, packing, storage, and dispatch must be documented for each product or product group.',
        rating: 'major',
      },
      {
        id: '2.6',
        title: 'Validate the flow diagram',
        description:
          'The flow diagram must be verified on-site by the HACCP team to confirm it accurately reflects current production practices. Verification must be documented and repeated after process changes.',
        rating: 'major',
      },
      {
        id: '2.7',
        title: 'List all potential hazards and conduct a hazard analysis',
        description:
          'All physical, chemical, biological, and radiological hazards at each process step must be identified and assessed for likelihood and severity. Control measures for each significant hazard must be defined.',
        rating: 'fundamental',
      },
      {
        id: '2.8',
        title: 'Determine the critical control points (CCPs)',
        description:
          'CCPs must be identified using a systematic approach such as a decision tree, applied to each hazard identified in the hazard analysis. The rationale for all CCP determinations must be documented.',
        rating: 'fundamental',
      },
      {
        id: '2.9',
        title: 'Establish validated critical limits for each CCP',
        description:
          'Critical limits for each CCP must be defined, documented, and scientifically validated. Validation records must demonstrate that the critical limit reliably controls the identified hazard.',
        rating: 'fundamental',
      },
      {
        id: '2.10',
        title: 'Establish a monitoring system for each CCP',
        description:
          'Monitoring procedures, frequencies, responsible persons, and recording methods must be defined for each CCP. Monitoring must provide timely detection of loss of control.',
        rating: 'fundamental',
      },
      {
        id: '2.11',
        title: 'Establish a corrective action plan for CCP deviations',
        description:
          'Documented corrective actions must exist for each CCP covering actions to take when a deviation occurs, disposition of affected product, root cause investigation, and prevention of recurrence.',
        rating: 'fundamental',
      },
      {
        id: '2.12',
        title: 'Validate the HACCP plan and establish verification procedures',
        description:
          'The HACCP plan must be validated to confirm it effectively controls identified hazards. A verification schedule must include CCP monitoring review, internal audits, and product testing.',
        rating: 'fundamental',
      },
      {
        id: '2.13',
        title: 'HACCP documentation and record keeping',
        description:
          'All HACCP records including hazard analysis, CCP monitoring logs, deviation records, and verification activities must be maintained, legible, and available for review during audit.',
        rating: 'major',
      },
      {
        id: '2.14',
        title: 'Review of the HACCP plan',
        description:
          'The HACCP plan must be reviewed following new product introductions, ingredient changes, process changes, customer complaints, or at minimum annually, and the review documented.',
        rating: 'major',
      },
    ],
  },
  {
    id: '3',
    title: 'Food Safety and Quality Management System',
    clauses: [
      {
        id: '3.1',
        title: 'Food safety and quality manual',
        description:
          'A documented food safety and quality manual must define the scope of the management system, reference all relevant procedures, and be available to relevant personnel.',
        rating: 'major',
      },
      {
        id: '3.2',
        title: 'Document control',
        description:
          'A document control system must ensure all documents are version-controlled, authorised, and accessible. Obsolete documents must be removed from point of use. Changes must be communicated.',
        rating: 'major',
      },
      {
        id: '3.3',
        title: 'Record completion and maintenance',
        description:
          'Records must be legible, accurate, and completed at the time of the activity. A records retention schedule must define minimum retention periods. Records must be protected from loss or damage.',
        rating: 'major',
      },
      {
        id: '3.4',
        title: 'Internal audits',
        description:
          'A risk-based internal audit programme must cover all activities affecting product safety, legality, and quality. Audits must be conducted by trained, independent auditors and findings closed within defined timeframes.',
        rating: 'fundamental',
      },
      {
        id: '3.5',
        title: 'Supplier and raw material approval and performance monitoring',
        description:
          'All suppliers of raw materials, packaging, and services must be approved through a risk assessment process. Supplier performance must be monitored and reviewed regularly against defined criteria.',
        rating: 'major',
      },
      {
        id: '3.6',
        title: 'Specifications',
        description:
          'Documented specifications must exist for all raw materials, packaging materials, finished products, and contracted services. Specifications must be reviewed and agreed with relevant parties.',
        rating: 'major',
      },
      {
        id: '3.7',
        title: 'Corrective action and preventive action (CAPA)',
        description:
          'A CAPA system must ensure root causes of non-conformances are investigated and corrective actions implemented and verified for effectiveness within defined timeframes.',
        rating: 'major',
      },
      {
        id: '3.8',
        title: 'Control of non-conforming product',
        description:
          'Non-conforming raw materials and finished products must be identified, quarantined, and dispositioned by authorised personnel. Disposition records must be maintained.',
        rating: 'major',
      },
      {
        id: '3.9',
        title: 'Traceability',
        description:
          'Full traceability must be maintained from raw material receipt through production to dispatch. A mock recall exercise must be conducted at least annually and demonstrate complete trace within 4 hours.',
        rating: 'fundamental',
      },
      {
        id: '3.10',
        title: 'Complaint handling',
        description:
          'Customer and consumer complaints must be recorded, investigated, and trended. Root cause analysis must be conducted for significant or recurring complaints, with results driving continual improvement.',
        rating: 'major',
      },
      {
        id: '3.11',
        title: 'Management of incidents, product withdrawal, and product recall',
        description:
          'A documented incident management and product recall procedure must be in place, communicated to relevant staff, and tested at least annually. The procedure must include escalation to relevant authorities.',
        rating: 'fundamental',
      },
      {
        id: '3.12',
        title: 'Management of allergens within the food safety management system',
        description:
          'An allergen risk assessment must be completed for all products. Controls to prevent unintended allergen cross-contact during production must be documented, implemented, and verified.',
        rating: 'major',
      },
    ],
  },
  {
    id: '4',
    title: 'Site Standards',
    clauses: [
      {
        id: '4.1',
        title: 'External standards',
        description:
          'The external site environment, including grounds, car parks, and neighbouring activities, must not pose a contamination risk to products, materials, or personnel.',
        rating: 'minor',
      },
      {
        id: '4.2',
        title: 'Building fabric – production and storage areas',
        description:
          'Floors, walls, ceilings, doors, windows, and drainage in food production and storage areas must be maintained in good repair to prevent pest entry, condensation, and product contamination.',
        rating: 'major',
      },
      {
        id: '4.3',
        title: 'Utilities – water, ice, air, and other gases',
        description:
          'Water used in food production must meet potable water standards. Compressed air, steam, and other gases in contact with product must not pose a contamination risk. Water quality must be tested.',
        rating: 'major',
      },
      {
        id: '4.4',
        title: 'Equipment',
        description:
          'Equipment must be designed and constructed to be cleanable and prevent product contamination. Food contact surfaces must be of suitable materials. Equipment must be maintained in good repair.',
        rating: 'major',
      },
      {
        id: '4.5',
        title: 'Maintenance',
        description:
          'A planned preventive maintenance (PPM) programme must cover all equipment and infrastructure critical to product safety and quality. Emergency repairs must not compromise food safety.',
        rating: 'major',
      },
      {
        id: '4.6',
        title: 'Calibration and control of measuring and monitoring devices',
        description:
          'All measuring and monitoring devices used for critical control points and product safety checks must be calibrated at defined intervals and results recorded. Out-of-calibration devices must trigger a product safety review.',
        rating: 'major',
      },
      {
        id: '4.7',
        title: 'Pest control',
        description:
          'A pest management programme must cover all areas of the site, including external perimeter. Proofing, monitoring, and treatments must be documented. Pest activity must trigger investigation and corrective action.',
        rating: 'major',
      },
      {
        id: '4.8',
        title: 'Storage facilities',
        description:
          'Storage areas must be maintained to prevent contamination, cross-contact, and deterioration of raw materials and finished goods. Temperature-controlled storage must be monitored and records kept.',
        rating: 'major',
      },
      {
        id: '4.9',
        title: 'Dispatch and transport',
        description:
          'Vehicles and loading areas used for despatch must be clean, in good repair, and controlled to prevent product contamination. Vehicle checks must be documented before loading.',
        rating: 'minor',
      },
      {
        id: '4.10',
        title: 'Cleaning and hygiene',
        description:
          'Documented cleaning schedules must define methods, chemicals, concentrations, frequencies, and responsible persons for all areas and equipment. Cleaning effectiveness must be verified.',
        rating: 'major',
      },
      {
        id: '4.11',
        title: 'Waste and waste disposal',
        description:
          'Waste must be identified, collected frequently, and removed from production areas to prevent accumulation and contamination. Waste contractors must be approved and documentation maintained.',
        rating: 'minor',
      },
      {
        id: '4.12',
        title: 'Management of surplus food and products for animal feed',
        description:
          'Products or by-products intended for animal feed must be controlled, stored separately, and documented to ensure they do not create food safety risks and meet relevant regulations.',
        rating: 'minor',
      },
      {
        id: '4.13',
        title: 'Environmental monitoring programme',
        description:
          'A risk-based environmental monitoring programme (EMP) must be in place for relevant product categories (particularly RTE and high-care environments), with defined sampling plans, targets, and corrective actions.',
        rating: 'major',
      },
    ],
  },
  {
    id: '5',
    title: 'Product Control',
    clauses: [
      {
        id: '5.1',
        title: 'Product design and development',
        description:
          'New product development must follow a documented process that includes hazard analysis, validation of processing parameters, shelf-life determination, and sign-off before commercial launch.',
        rating: 'major',
      },
      {
        id: '5.2',
        title: 'Product labelling',
        description:
          'All product labels must comply with relevant legislation and accurately declare ingredients, allergens, nutritional information, and storage conditions. Label approval processes must be documented.',
        rating: 'major',
      },
      {
        id: '5.3',
        title: 'Management of allergens',
        description:
          'Allergen controls must prevent unintended cross-contact through segregation, scheduling, and cleaning validation. Allergen claims (e.g., "free from") must be validated by testing. Labelling must be verified.',
        rating: 'fundamental',
      },
      {
        id: '5.4',
        title: 'Provenance, assured status, and identity-preserved materials',
        description:
          'Any product claims relating to origin, certification (e.g., organic, Halal, Kosher), or identity preservation must be fully documented and traceable through the supply chain.',
        rating: 'major',
      },
      {
        id: '5.5',
        title: 'Product inspection and laboratory testing',
        description:
          'A product testing programme must verify safety, legality, and quality against defined specifications. Testing methods must be validated and laboratories must be accredited or proficiency-tested.',
        rating: 'major',
      },
      {
        id: '5.6',
        title: 'Product release',
        description:
          'A defined product release procedure must ensure all products meet specifications and required checks are completed before release to customers or into stock.',
        rating: 'major',
      },
      {
        id: '5.7',
        title: 'Pet food and animal feed',
        description:
          'Products intended for pet food or animal feed must be controlled with appropriate labelling, documentation, and storage segregation to prevent adulteration and meet applicable regulations.',
        rating: 'minor',
      },
      {
        id: '5.8',
        title: 'Food fraud vulnerability assessment and control',
        description:
          'A documented food fraud vulnerability assessment (FFVA) must identify risks of economically motivated adulteration in the supply chain. A food fraud mitigation plan must be implemented and reviewed annually.',
        rating: 'fundamental',
      },
    ],
  },
  {
    id: '6',
    title: 'Process Control',
    clauses: [
      {
        id: '6.1',
        title: 'Control of operations',
        description:
          'Process parameters critical to product safety and quality must be defined in process control documents, communicated to operators, and monitored at appropriate frequencies with records maintained.',
        rating: 'major',
      },
      {
        id: '6.2',
        title: 'Quantity – weight, volume, and number control',
        description:
          'Product quantity control systems must ensure compliance with legal average quantity requirements and customer specifications. Statistical sampling plans and records must be maintained.',
        rating: 'minor',
      },
      {
        id: '6.3',
        title: 'Calibration and control of measuring and monitoring devices (process)',
        description:
          'Process measuring devices used to control product safety and quality must be calibrated and verified at defined intervals. Devices found out of calibration must trigger a product safety assessment.',
        rating: 'major',
      },
      {
        id: '6.4',
        title: 'Equipment suitability, cleaning, and maintenance',
        description:
          'Production equipment must be fit for purpose, maintained in a clean and hygienic condition, and maintained to prevent contamination of product. Changeover and cleaning records must be maintained.',
        rating: 'major',
      },
    ],
  },
  {
    id: '7',
    title: 'Personnel',
    clauses: [
      {
        id: '7.1',
        title: 'Training – raw material handling, preparation, processing, packing, and storage',
        description:
          'All personnel must receive documented induction training before working unsupervised. Role-specific ongoing training must be provided and competency assessed. Training records must be maintained for all staff.',
        rating: 'fundamental',
      },
      {
        id: '7.2',
        title: 'Personal hygiene',
        description:
          'Personal hygiene rules covering hand washing, jewellery, nail polish, eating, drinking, and mobile phone use must be documented, communicated at induction, and enforced consistently. Compliance must be monitored.',
        rating: 'major',
      },
      {
        id: '7.3',
        title: 'Medical screening',
        description:
          'A process must ensure staff, contractors, and visitors with symptoms of illness that could affect food safety (e.g., gastrointestinal illness, skin infections, jaundice) are identified and excluded from food handling areas.',
        rating: 'major',
      },
      {
        id: '7.4',
        title: 'Protective clothing',
        description:
          'Appropriate protective clothing must be provided, maintained in good condition, and laundered at a frequency that prevents contamination. Colour-coding or zoning must segregate high-risk from low-risk areas.',
        rating: 'major',
      },
    ],
  },
]

export function getSectionStats(
  section: BrcgsSection,
  data: Record<string, { status: string }>
) {
  const total = section.clauses.length
  const compliant = section.clauses.filter(c => data[c.id]?.status === 'compliant').length
  const gaps = section.clauses.filter(c => data[c.id]?.status === 'gap').length
  const assessed = section.clauses.filter(
    c => data[c.id]?.status && data[c.id].status !== 'not_assessed'
  ).length
  return { total, compliant, gaps, assessed }
}

export function getAllStats(data: Record<string, { status: string }>) {
  const all = BRCGS_SECTIONS.flatMap(s => s.clauses)
  const total = all.length
  const compliant = all.filter(c => data[c.id]?.status === 'compliant').length
  const gaps = all.filter(c => data[c.id]?.status === 'gap').length
  const assessed = all.filter(
    c => data[c.id]?.status && data[c.id].status !== 'not_assessed'
  ).length
  const notAssessed = total - assessed
  return { total, compliant, gaps, assessed, notAssessed }
}
