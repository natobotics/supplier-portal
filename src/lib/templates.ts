// PO & SOW template library — structure and language derived from N Consulting's
// real work orders and purchase orders (GmbH work-order format, contract-schedule
// PO format). Presets carry full scope language so a document drafts in seconds.

export interface ScopeSection {
  heading: string
  bullets: string[]
}

export interface ServicePreset {
  id: string
  label: string
  overview: string
  scopeSections: ScopeSection[]
  deliverables: string[]
  dependencies: string[]
  assumptions: string[]
}

export interface MilestoneRow {
  activity: string
  completion: string
  acceptance: string
  amount: number
}

// Legal identity per entity (registered address used in the document preamble).
export const ENTITY_LEGAL: Record<string, { legalName: string; address: string }> = {
  'ent-uk': { legalName: 'N Consulting Ltd', address: 'London, United Kingdom' },
  'ent-us': { legalName: 'N Consulting LLC', address: 'United States' },
  'ent-de': { legalName: 'N Consulting GmbH', address: '19 Königsallee, 40212 Düsseldorf, Germany' },
  'ent-es': { legalName: 'N Consulting España SL', address: 'Madrid, Spain' },
  'ent-nl': { legalName: 'N Consulting B.V.', address: 'Amsterdam, Netherlands' },
  'ent-pl': { legalName: 'N Consulting Sp. z o.o.', address: 'Warsaw, Poland' },
  'ent-ae': { legalName: 'N Consulting FZ-LLC', address: 'Dubai, UAE' },
  'ent-in': { legalName: 'Natobotics Technologies Pvt Ltd', address: 'Chennai, India' },
  'ent-sg': { legalName: 'N Cons Pte Ltd', address: 'Singapore' },
  'ent-se': { legalName: 'N Consulting AB', address: 'Stockholm, Sweden' },
}

// Jurisdiction-specific late-payment clause (verbatim pattern from real work orders).
export const PAYMENT_CLAUSES: Record<string, string> = {
  Germany:
    'If any amount due to the Supplier under this Agreement remains outstanding thirty (30) days after the Supplier has given notice that payment was not made within the agreed timescale, the Supplier shall be entitled to charge interest on the overdue amount at nine percentage points above the base rate of the European Central Bank, in accordance with § 288 Bürgerliches Gesetzbuch (BGB). This right shall not apply where there is a genuine dispute as to whether the invoice is properly payable; interest is waived until the dispute is resolved.',
  'United Kingdom':
    'If any undisputed amount remains outstanding beyond the agreed payment terms, the Supplier may charge statutory interest and compensation under the Late Payment of Commercial Debts (Interest) Act 1998. This right shall not apply where there is a genuine dispute as to whether the invoice is properly payable; interest is waived until the dispute is resolved.',
  default:
    'If any undisputed amount remains outstanding beyond the agreed payment terms, the Supplier may charge interest on the overdue amount at the maximum rate permitted by applicable law. This right shall not apply where there is a genuine dispute as to whether the invoice is properly payable.',
}

export const IP_CLAUSE =
  'The Service Provider Intellectual Property (IP) used in this engagement includes any proprietary software, tools, documentation, methodologies or processes developed by the Service Provider and used in delivering the Services under this Work Order. Any such IP remains the property of the Service Provider, and the Client shall not claim any rights or ownership over it.'

export const GOVERNING_CLAUSE = (masterRef: string, masterDate: string) =>
  `This Work Order is issued pursuant to and incorporates and is governed by the ${masterRef} between the parties dated ${masterDate}, and sets forth the specific terms and conditions relating to the provision of Services referred to in this Work Order. The combination of the terms of the ${masterRef} and the provisions of this Work Order shall together constitute the contract between the parties in respect of the Services ("the Agreement").`

// ---- Service presets (condensed from real engagements) ----

export const SERVICE_PRESETS: ServicePreset[] = [
  {
    id: 'network-design',
    label: 'Network Solution & Design',
    overview:
      'The objective of this engagement is to design, plan, and provide a scalable, secure, and high-performance wired and wireless network infrastructure to support business operations across the client’s locations.',
    scopeSections: [
      {
        heading: 'Requirement Gathering & Assessment',
        bullets: [
          'Conduct stakeholder meetings to understand business and technical requirements',
          'Assess existing network infrastructure (LAN/WAN/Wi-Fi)',
          'Perform site surveys (physical and RF survey for wireless coverage)',
          'Identify current gaps, risks, and performance bottlenecks',
          'Review bandwidth usage, security posture, and compliance needs',
        ],
      },
      {
        heading: 'Network Architecture & Design',
        bullets: [
          'LAN architecture design (core, distribution, access layers)',
          'VLAN segmentation and IP addressing scheme design',
          'Redundancy planning (HSRP/VRRP, link aggregation, failover)',
          'RF planning, heatmap analysis and access-point placement',
          'Controller-based or cloud-managed Wi-Fi design',
        ],
      },
      {
        heading: 'Security & WAN Design',
        bullets: [
          'Firewall architecture and rule-base design',
          'Network segmentation and access control policies',
          'VPN (site-to-site / remote access) and NAC design',
          'Wireless security (WPA3, 802.1X authentication)',
          'SD-WAN / MPLS topology, ISP link evaluation and failover planning',
        ],
      },
    ],
    deliverables: [
      'High-Level Design (HLD) document',
      'Low-Level Design (LLD) document',
      'Network topology diagrams (logical and physical)',
      'IP addressing plan',
      'Bill of Materials (BoM)',
      'Implementation roadmap with risk and mitigation plan',
    ],
    dependencies: [
      'Access to the client ticketing system to log, track, and close incidents/requests',
      'Proper Active Directory, VPN, and domain accounts with required privileges',
      'IDs, building access, and security approvals for onsite staff',
      'Timely communication and collaboration with the client',
    ],
    assumptions: [
      'The client will provide necessary information about specific requirements and standards',
      'Required software and equipment will be available',
      'The client will provide necessary access and permissions for on-site work',
      'Any additional scope or changes will be discussed and agreed by both parties',
    ],
  },
  {
    id: 'warehouse-ops',
    label: 'Warehouse Support / Managed Operations',
    overview:
      'End-to-end warehouse management services ensuring secure, compliant, and efficient handling of inventory, logistics, and value-added warehouse activities — covering operations, process execution, performance management, compliance, and backup continuity coverage.',
    scopeSections: [
      {
        heading: 'Inbound & Outbound Operations',
        bullets: [
          'Receipt, unloading, and verification of inbound shipments against POs',
          'Goods Receipt Note (GRN) creation; barcoding, labeling, and tagging',
          'Order picking, packing, staging, and dispatch coordination',
          'Shipment documentation (packing lists, delivery notes)',
          'WMS/ERP updates for all movements',
        ],
      },
      {
        heading: 'Inventory & Equipment Management',
        bullets: [
          'Operational stock updates with weekly and monthly cycle counts',
          'Inventory reconciliation and variance reporting',
          'Handling of damaged, quarantined, and returned goods',
          'Operation of forklifts, scanners, pallet jacks in line with safety standards',
          'Secure disk-wipe and disposal services where required',
        ],
      },
    ],
    deliverables: [
      'Verified GRNs against purchase orders',
      'Records of damages, shortages, or discrepancies',
      'Updated WMS/ERP entries for all received materials',
      'Accuracy logs for order fulfillment',
      'Daily/weekly equipment usage and condition reports',
    ],
    dependencies: [
      'Access to sites, equipment, and systems whenever required',
      'Availability of required software, licenses and user accounts',
      'Compliance with health and safety regulations at the work locations',
    ],
    assumptions: [
      'Trained backup coverage is chargeable within the agreed rate card',
      'The client provides physical access, seating, and secure storage',
      'Changes to locations or volumes will be re-quoted via change request',
    ],
  },
  {
    id: 'smart-hands',
    label: 'Smart Hands / Field Engineering',
    overview:
      'On-site and remote smart-hands engineering support covering installations, moves, additions and changes, hardware break-fix, and datacentre support activities, delivered to agreed SLAs.',
    scopeSections: [
      {
        heading: 'Field Engineering Services',
        bullets: [
          'Rack, stack, cabling and labelling of network and server equipment',
          'Hardware installation, swap-out and RMA handling',
          'Structured cabling patching and cable management',
          'Smart-hands support under remote guidance from client engineers',
          'Site audits and asset verification',
        ],
      },
    ],
    deliverables: [
      'Completed work orders with photographic evidence where applicable',
      'Updated asset and cabling records',
      'Incident and ticket closure notes in the client system',
    ],
    dependencies: [
      'Site access, security clearance and escorts where required',
      'Client ticketing system access for assignment and closure',
      'Spare parts and consumables availability',
    ],
    assumptions: [
      'Out-of-hours work is chargeable at the agreed uplift where specified on the PO',
      'Travel beyond the named locations is re-charged at cost',
    ],
  },
  {
    id: 'recruitment',
    label: 'Recruitment / Contract Staffing',
    overview:
      'Provision of contract staffing services: sourcing, screening, onboarding and ongoing management of contract personnel placed with the client, including timesheet administration and compliance.',
    scopeSections: [
      {
        heading: 'Staffing Services',
        bullets: [
          'Role definition and candidate sourcing against the agreed specification',
          'Screening, right-to-work and reference checks',
          'Onboarding, contract administration, and IR35/AÜG compliance handling',
          'Weekly timesheet collection and approval administration',
          'Replacement cover for absence subject to availability',
        ],
      },
    ],
    deliverables: [
      'Placed candidates per the agreed role specifications',
      'Compliance file per contractor (right-to-work, status determination where applicable)',
      'Approved timesheets supporting each invoice',
    ],
    dependencies: [
      'Timely interview feedback and selection decisions from the client',
      'Client approval of timesheets within the agreed window',
    ],
    assumptions: [
      'Rates are per the agreed rate card; out-of-scope roles are quoted separately',
      'Notice periods per the master agreement apply to early termination of placements',
    ],
  },
]

// Reference numbering: SOW-NCONSGB-2606-001 style (entity short, YYMM, sequence).
export function makeReference(kind: 'SOW' | 'PO', entityId: string, seq: number): string {
  const short =
    {
      'ent-uk': 'NCONSUK',
      'ent-us': 'NCONSUS',
      'ent-de': 'NCONSDE',
      'ent-es': 'NCONSES',
      'ent-nl': 'NCONSNL',
      'ent-pl': 'NCONSPL',
      'ent-ae': 'NCONSAE',
      'ent-in': 'NCONSIN',
      'ent-sg': 'NCONSSG',
      'ent-se': 'NCONSSE',
    }[entityId] ?? 'NCONS'
  return `${kind}-${short}-2606-${String(seq).padStart(3, '0')}`
}
