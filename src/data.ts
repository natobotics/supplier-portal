import type { Supplier, Invoice, PaymentBatch, Activity } from './types'

export const suppliers: Supplier[] = [
  {
    id: 'sup-01', name: 'Northwind Logistics', category: 'Freight & Logistics',
    contactName: 'Dana Whitfield', email: 'ar@northwindlogistics.com',
    paymentTerms: 'Net 30', discountTerms: '2/10 Net 30', paymentMethod: 'ACH',
    taxFormStatus: 'verified', bankVerified: true, riskLevel: 'low',
    onboarded: '2023-04-12', ytdSpend: 482300, openBalance: 86420, avgPayDays: 27, country: 'US',
  },
  {
    id: 'sup-02', name: 'Helix Cloud Services', category: 'Software & SaaS',
    contactName: 'Marcus Lee', email: 'billing@helixcloud.io',
    paymentTerms: 'Net 30', paymentMethod: 'Card',
    taxFormStatus: 'verified', bankVerified: true, riskLevel: 'low',
    onboarded: '2022-11-03', ytdSpend: 318900, openBalance: 54200, avgPayDays: 24, country: 'US',
  },
  {
    id: 'sup-03', name: 'Brightline Manufacturing', category: 'Raw Materials',
    contactName: 'Priya Raman', email: 'invoices@brightlinemfg.com',
    paymentTerms: 'Net 45', discountTerms: '1/15 Net 45', paymentMethod: 'ACH',
    taxFormStatus: 'verified', bankVerified: true, riskLevel: 'low',
    onboarded: '2021-06-22', ytdSpend: 1247800, openBalance: 312600, avgPayDays: 41, country: 'US',
  },
  {
    id: 'sup-04', name: 'Vega Office Solutions', category: 'Office & Facilities',
    contactName: 'Tom Okafor', email: 'accounts@vegaoffice.com',
    paymentTerms: 'Net 30', paymentMethod: 'ACH',
    taxFormStatus: 'verified', bankVerified: true, riskLevel: 'low',
    onboarded: '2023-09-18', ytdSpend: 96400, openBalance: 12880, avgPayDays: 29, country: 'US',
  },
  {
    id: 'sup-05', name: 'Quanta Components GmbH', category: 'Electronics',
    contactName: 'Anneke Voss', email: 'rechnungen@quanta-gmbh.de',
    paymentTerms: 'Net 60', paymentMethod: 'Wire',
    taxFormStatus: 'verified', bankVerified: true, riskLevel: 'medium',
    onboarded: '2022-02-14', ytdSpend: 689200, openBalance: 198400, avgPayDays: 55, country: 'DE',
  },
  {
    id: 'sup-06', name: 'Citrine Marketing Group', category: 'Marketing & Agencies',
    contactName: 'Sofia Mendez', email: 'finance@citrinegroup.com',
    paymentTerms: 'Net 15', paymentMethod: 'ACH',
    taxFormStatus: 'verified', bankVerified: true, riskLevel: 'low',
    onboarded: '2024-01-30', ytdSpend: 214700, openBalance: 38500, avgPayDays: 14, country: 'US',
  },
  {
    id: 'sup-07', name: 'Ironpeak Facilities', category: 'Office & Facilities',
    contactName: 'Gary Sutton', email: 'billing@ironpeakfm.com',
    paymentTerms: 'Net 30', paymentMethod: 'Check',
    taxFormStatus: 'pending', bankVerified: false, riskLevel: 'medium',
    onboarded: '2025-12-02', ytdSpend: 48200, openBalance: 22640, avgPayDays: 33, country: 'US',
  },
  {
    id: 'sup-08', name: 'Apex Legal Partners', category: 'Professional Services',
    contactName: 'Rachel Kim', email: 'ap@apexlegal.com',
    paymentTerms: 'Due on receipt', paymentMethod: 'ACH',
    taxFormStatus: 'verified', bankVerified: true, riskLevel: 'low',
    onboarded: '2020-08-11', ytdSpend: 156800, openBalance: 18400, avgPayDays: 6, country: 'US',
  },
  {
    id: 'sup-09', name: 'Meridian Packaging Co', category: 'Packaging',
    contactName: 'Luis Herrera', email: 'invoicing@meridianpkg.com',
    paymentTerms: 'Net 30', discountTerms: '2/10 Net 30', paymentMethod: 'ACH',
    taxFormStatus: 'verified', bankVerified: true, riskLevel: 'low',
    onboarded: '2021-03-09', ytdSpend: 402100, openBalance: 95300, avgPayDays: 26, country: 'US',
  },
  {
    id: 'sup-10', name: 'Stellar IT Hardware', category: 'Electronics',
    contactName: 'Jenny Park', email: 'ar@stellarit.com',
    paymentTerms: 'Net 30', paymentMethod: 'ACH',
    taxFormStatus: 'verified', bankVerified: false, riskLevel: 'high',
    onboarded: '2023-05-27', ytdSpend: 268500, openBalance: 73200, avgPayDays: 31, country: 'US',
  },
  {
    id: 'sup-11', name: 'GreenGrid Energy', category: 'Utilities',
    contactName: 'Omar Haddad', email: 'billing@greengrid.energy',
    paymentTerms: 'Net 21', paymentMethod: 'ACH',
    taxFormStatus: 'verified', bankVerified: true, riskLevel: 'low',
    onboarded: '2022-07-19', ytdSpend: 132600, openBalance: 11240, avgPayDays: 19, country: 'US',
  },
  {
    id: 'sup-12', name: 'Cobalt Staffing Agency', category: 'Professional Services',
    contactName: 'Maya Singh', email: 'payroll@cobaltstaffing.com',
    paymentTerms: 'Net 15', paymentMethod: 'ACH',
    taxFormStatus: 'missing', bankVerified: true, riskLevel: 'medium',
    onboarded: '2026-05-21', ytdSpend: 18400, openBalance: 18400, avgPayDays: 0, country: 'US',
  },
]

export const invoices: Invoice[] = [
  // ---- Needs review (AI captured, low-confidence fields) ----
  {
    id: 'inv-001', number: 'NWL-20488', supplierId: 'sup-01',
    issueDate: '2026-06-08', dueDate: '2026-07-08', receivedDate: '2026-06-10',
    amount: 18642.5, currency: 'USD', status: 'review', poNumber: 'PO-7741',
    matchStatus: 'pending', source: 'email',
    lines: [
      { description: 'FTL freight — Chicago to Dallas (12 loads)', qty: 12, unitPrice: 1385, amount: 16620, glCode: '5200 · Freight Out', glConfidence: 0.97 },
      { description: 'Fuel surcharge', qty: 1, unitPrice: 1622.5, amount: 1622.5, glCode: '5210 · Fuel Surcharges', glConfidence: 0.88 },
      { description: 'Liftgate service fee', qty: 4, unitPrice: 100, amount: 400, glCode: '5200 · Freight Out', glConfidence: 0.74 },
    ],
    extraction: [
      { field: 'Supplier', value: 'Northwind Logistics', confidence: 0.99 },
      { field: 'Invoice #', value: 'NWL-20488', confidence: 0.98 },
      { field: 'Issue date', value: '2026-06-08', confidence: 0.97 },
      { field: 'Due date', value: '2026-07-08', confidence: 0.95 },
      { field: 'Total', value: '$18,642.50', confidence: 0.99 },
      { field: 'PO number', value: 'PO-7741', confidence: 0.68 },
    ],
    approvals: [
      { approver: 'Sarah Chen', role: 'AP Manager', status: 'waiting' },
      { approver: 'David Osei', role: 'Controller', status: 'waiting' },
    ],
    anomalies: [],
    discount: { terms: '2/10 Net 30', amount: 372.85, deadline: '2026-06-18' },
  },
  {
    id: 'inv-002', number: 'CSA-2026-118', supplierId: 'sup-12',
    issueDate: '2026-06-09', dueDate: '2026-06-24', receivedDate: '2026-06-10',
    amount: 18400, currency: 'USD', status: 'review',
    matchStatus: 'no_po', source: 'email',
    lines: [
      { description: 'Contract staffing — wk 22 & 23 (2 engineers)', qty: 160, unitPrice: 115, amount: 18400, glCode: '6420 · Contract Labor', glConfidence: 0.91 },
    ],
    extraction: [
      { field: 'Supplier', value: 'Cobalt Staffing Agency', confidence: 0.97 },
      { field: 'Invoice #', value: 'CSA-2026-118', confidence: 0.99 },
      { field: 'Issue date', value: '2026-06-09', confidence: 0.96 },
      { field: 'Due date', value: '2026-06-24', confidence: 0.94 },
      { field: 'Total', value: '$18,400.00', confidence: 0.99 },
      { field: 'Bank account', value: '****6612 (new)', confidence: 0.93 },
    ],
    approvals: [
      { approver: 'Sarah Chen', role: 'AP Manager', status: 'waiting' },
      { approver: 'David Osei', role: 'Controller', status: 'waiting' },
    ],
    anomalies: [
      { type: 'new_supplier', severity: 'medium', message: 'Supplier onboarded 21 days ago — first invoice. W-9 still missing.' },
      { type: 'round_amount', severity: 'low', message: 'Round invoice total on a new supplier account.' },
    ],
  },
  // ---- Exceptions ----
  {
    id: 'inv-003', number: 'QC-88412', supplierId: 'sup-05',
    issueDate: '2026-05-28', dueDate: '2026-07-27', receivedDate: '2026-06-02',
    amount: 64880, currency: 'USD', status: 'exception', poNumber: 'PO-7689',
    matchStatus: 'price_variance', source: 'edi',
    lines: [
      { description: 'MCU-740 microcontroller (5,000 units)', qty: 5000, unitPrice: 11.2, amount: 56000, glCode: '5010 · Raw Materials', glConfidence: 0.98 },
      { description: 'Conformal coating service', qty: 5000, unitPrice: 1.4, amount: 7000, glCode: '5015 · Outside Processing', glConfidence: 0.92 },
      { description: 'Expedite fee', qty: 1, unitPrice: 1880, amount: 1880, glCode: '5200 · Freight Out', glConfidence: 0.61 },
    ],
    extraction: [
      { field: 'Supplier', value: 'Quanta Components GmbH', confidence: 0.99 },
      { field: 'Invoice #', value: 'QC-88412', confidence: 0.99 },
      { field: 'Total', value: '$64,880.00', confidence: 0.99 },
      { field: 'PO number', value: 'PO-7689', confidence: 0.97 },
    ],
    approvals: [
      { approver: 'Sarah Chen', role: 'AP Manager', status: 'waiting' },
      { approver: 'David Osei', role: 'Controller', status: 'waiting' },
    ],
    anomalies: [
      { type: 'price_drift', severity: 'high', message: 'MCU-740 unit price $11.20 vs $9.85 PO price and $9.70 trailing 6-mo average (+15.5%).' },
    ],
  },
  {
    id: 'inv-004', number: 'SIH-5521', supplierId: 'sup-10',
    issueDate: '2026-06-04', dueDate: '2026-07-04', receivedDate: '2026-06-06',
    amount: 23150, currency: 'USD', status: 'exception', poNumber: 'PO-7702',
    matchStatus: 'matched', source: 'upload',
    lines: [
      { description: 'Laptop refresh — 14" developer spec (10 units)', qty: 10, unitPrice: 2150, amount: 21500, glCode: '1510 · Computer Equipment', glConfidence: 0.96 },
      { description: 'Extended warranty 3-yr', qty: 10, unitPrice: 165, amount: 1650, glCode: '6310 · Equipment Maintenance', glConfidence: 0.89 },
    ],
    extraction: [
      { field: 'Supplier', value: 'Stellar IT Hardware', confidence: 0.99 },
      { field: 'Invoice #', value: 'SIH-5521', confidence: 0.98 },
      { field: 'Total', value: '$23,150.00', confidence: 0.99 },
      { field: 'Bank account', value: '****9923 (changed from ****4471)', confidence: 0.96 },
    ],
    approvals: [
      { approver: 'Sarah Chen', role: 'AP Manager', status: 'waiting' },
      { approver: 'David Osei', role: 'Controller', status: 'waiting' },
    ],
    anomalies: [
      { type: 'bank_change', severity: 'high', message: 'Remit-to bank account changed 3 days before payment was due to release. Change request came via email, not portal. Verify by phone before paying.' },
    ],
  },
  {
    id: 'inv-005', number: 'IPF-1107', supplierId: 'sup-07',
    issueDate: '2026-05-30', dueDate: '2026-06-29', receivedDate: '2026-06-01',
    amount: 11320, currency: 'USD', status: 'exception',
    matchStatus: 'no_po', source: 'email',
    lines: [
      { description: 'HVAC quarterly maintenance — HQ', qty: 1, unitPrice: 6820, amount: 6820, glCode: '6300 · Building Maintenance', glConfidence: 0.94 },
      { description: 'Emergency chiller repair (parts + labor)', qty: 1, unitPrice: 4500, amount: 4500, glCode: '6300 · Building Maintenance', glConfidence: 0.9 },
    ],
    extraction: [
      { field: 'Supplier', value: 'Ironpeak Facilities', confidence: 0.98 },
      { field: 'Invoice #', value: 'IPF-1107', confidence: 0.97 },
      { field: 'Total', value: '$11,320.00', confidence: 0.99 },
    ],
    approvals: [
      { approver: 'Sarah Chen', role: 'AP Manager', status: 'waiting' },
      { approver: 'David Osei', role: 'Controller', status: 'waiting' },
    ],
    anomalies: [
      { type: 'duplicate', severity: 'high', message: 'Possible duplicate of IPF-1103 ($11,320, received May 18, paid Jun 2). Same amount, same service period referenced.' },
    ],
  },
  // ---- In approval ----
  {
    id: 'inv-006', number: 'BLM-30771', supplierId: 'sup-03',
    issueDate: '2026-06-01', dueDate: '2026-07-16', receivedDate: '2026-06-03',
    amount: 148200, currency: 'USD', status: 'approval', poNumber: 'PO-7715',
    matchStatus: 'matched', source: 'edi',
    lines: [
      { description: 'Cold-rolled steel coil — Grade 1008 (60 tons)', qty: 60, unitPrice: 2120, amount: 127200, glCode: '5010 · Raw Materials', glConfidence: 0.99 },
      { description: 'Slitting service', qty: 60, unitPrice: 290, amount: 17400, glCode: '5015 · Outside Processing', glConfidence: 0.95 },
      { description: 'Freight', qty: 1, unitPrice: 3600, amount: 3600, glCode: '5200 · Freight Out', glConfidence: 0.93 },
    ],
    extraction: [
      { field: 'Supplier', value: 'Brightline Manufacturing', confidence: 0.99 },
      { field: 'Invoice #', value: 'BLM-30771', confidence: 0.99 },
      { field: 'Total', value: '$148,200.00', confidence: 0.99 },
      { field: 'PO number', value: 'PO-7715', confidence: 0.98 },
    ],
    approvals: [
      { approver: 'Sarah Chen', role: 'AP Manager', status: 'approved', date: '2026-06-05', comment: '3-way match clean, within PO tolerance.' },
      { approver: 'David Osei', role: 'Controller', status: 'pending' },
      { approver: 'Ingrid Olsen', role: 'CFO', status: 'waiting' },
    ],
    anomalies: [],
    discount: { terms: '1/15 Net 45', amount: 1482, deadline: '2026-06-16' },
  },
  {
    id: 'inv-007', number: 'HCS-INV-9034', supplierId: 'sup-02',
    issueDate: '2026-06-05', dueDate: '2026-07-05', receivedDate: '2026-06-05',
    amount: 27100, currency: 'USD', status: 'approval', poNumber: 'PO-7720',
    matchStatus: 'matched', source: 'portal',
    lines: [
      { description: 'Compute cluster — May usage', qty: 1, unitPrice: 19400, amount: 19400, glCode: '6510 · Cloud Infrastructure', glConfidence: 0.99 },
      { description: 'Object storage — May usage', qty: 1, unitPrice: 4300, amount: 4300, glCode: '6510 · Cloud Infrastructure', glConfidence: 0.99 },
      { description: 'Premium support plan', qty: 1, unitPrice: 3400, amount: 3400, glCode: '6520 · Software Subscriptions', glConfidence: 0.96 },
    ],
    extraction: [
      { field: 'Supplier', value: 'Helix Cloud Services', confidence: 0.99 },
      { field: 'Invoice #', value: 'HCS-INV-9034', confidence: 0.99 },
      { field: 'Total', value: '$27,100.00', confidence: 0.99 },
    ],
    approvals: [
      { approver: 'Sarah Chen', role: 'AP Manager', status: 'approved', date: '2026-06-06' },
      { approver: 'David Osei', role: 'Controller', status: 'pending' },
    ],
    anomalies: [],
  },
  {
    id: 'inv-008', number: 'CMG-2271', supplierId: 'sup-06',
    issueDate: '2026-06-06', dueDate: '2026-06-21', receivedDate: '2026-06-07',
    amount: 38500, currency: 'USD', status: 'approval', poNumber: 'PO-7733',
    matchStatus: 'matched', source: 'email',
    lines: [
      { description: 'Q3 campaign creative production', qty: 1, unitPrice: 26000, amount: 26000, glCode: '6110 · Advertising', glConfidence: 0.97 },
      { description: 'Paid media management fee — June', qty: 1, unitPrice: 12500, amount: 12500, glCode: '6115 · Media Buying', glConfidence: 0.95 },
    ],
    extraction: [
      { field: 'Supplier', value: 'Citrine Marketing Group', confidence: 0.99 },
      { field: 'Invoice #', value: 'CMG-2271', confidence: 0.98 },
      { field: 'Total', value: '$38,500.00', confidence: 0.99 },
    ],
    approvals: [
      { approver: 'Sarah Chen', role: 'AP Manager', status: 'approved', date: '2026-06-08' },
      { approver: 'Nina Petrova', role: 'VP Marketing', status: 'pending' },
      { approver: 'David Osei', role: 'Controller', status: 'waiting' },
    ],
    anomalies: [],
  },
  // ---- Scheduled ----
  {
    id: 'inv-009', number: 'MPC-77105', supplierId: 'sup-09',
    issueDate: '2026-05-26', dueDate: '2026-06-25', receivedDate: '2026-05-27',
    amount: 52300, currency: 'USD', status: 'scheduled', poNumber: 'PO-7677',
    matchStatus: 'matched', source: 'edi',
    lines: [
      { description: 'Corrugated cartons — SKU C-200 (40,000)', qty: 40000, unitPrice: 1.08, amount: 43200, glCode: '5020 · Packaging Materials', glConfidence: 0.99 },
      { description: 'Custom print plates', qty: 4, unitPrice: 2275, amount: 9100, glCode: '5020 · Packaging Materials', glConfidence: 0.87 },
    ],
    extraction: [
      { field: 'Supplier', value: 'Meridian Packaging Co', confidence: 0.99 },
      { field: 'Invoice #', value: 'MPC-77105', confidence: 0.99 },
      { field: 'Total', value: '$52,300.00', confidence: 0.99 },
    ],
    approvals: [
      { approver: 'Sarah Chen', role: 'AP Manager', status: 'approved', date: '2026-05-29' },
      { approver: 'David Osei', role: 'Controller', status: 'approved', date: '2026-05-30' },
    ],
    anomalies: [],
    discount: { terms: '2/10 Net 30', amount: 1046, deadline: '2026-06-05' },
  },
  {
    id: 'inv-010', number: 'GGE-202606-A', supplierId: 'sup-11',
    issueDate: '2026-06-02', dueDate: '2026-06-23', receivedDate: '2026-06-02',
    amount: 11240, currency: 'USD', status: 'scheduled',
    matchStatus: 'no_po', source: 'edi',
    lines: [
      { description: 'Electricity — HQ campus, May', qty: 1, unitPrice: 8740, amount: 8740, glCode: '6210 · Utilities', glConfidence: 0.99 },
      { description: 'Solar net metering credit', qty: 1, unitPrice: -1100, amount: -1100, glCode: '6210 · Utilities', glConfidence: 0.97 },
      { description: 'Electricity — Warehouse 2, May', qty: 1, unitPrice: 3600, amount: 3600, glCode: '6210 · Utilities', glConfidence: 0.99 },
    ],
    extraction: [
      { field: 'Supplier', value: 'GreenGrid Energy', confidence: 0.99 },
      { field: 'Invoice #', value: 'GGE-202606-A', confidence: 0.98 },
      { field: 'Total', value: '$11,240.00', confidence: 0.99 },
    ],
    approvals: [
      { approver: 'Sarah Chen', role: 'AP Manager', status: 'approved', date: '2026-06-03' },
    ],
    anomalies: [],
  },
  {
    id: 'inv-011', number: 'NWL-20419', supplierId: 'sup-01',
    issueDate: '2026-05-22', dueDate: '2026-06-21', receivedDate: '2026-05-24',
    amount: 21480, currency: 'USD', status: 'scheduled', poNumber: 'PO-7660',
    matchStatus: 'matched', source: 'email',
    lines: [
      { description: 'LTL freight — May consolidated', qty: 38, unitPrice: 520, amount: 19760, glCode: '5200 · Freight Out', glConfidence: 0.98 },
      { description: 'Fuel surcharge', qty: 1, unitPrice: 1720, amount: 1720, glCode: '5210 · Fuel Surcharges', glConfidence: 0.95 },
    ],
    extraction: [
      { field: 'Supplier', value: 'Northwind Logistics', confidence: 0.99 },
      { field: 'Invoice #', value: 'NWL-20419', confidence: 0.99 },
      { field: 'Total', value: '$21,480.00', confidence: 0.99 },
    ],
    approvals: [
      { approver: 'Sarah Chen', role: 'AP Manager', status: 'approved', date: '2026-05-26' },
      { approver: 'David Osei', role: 'Controller', status: 'approved', date: '2026-05-27' },
    ],
    anomalies: [],
  },
  // ---- Overdue (approval stage but past due) ----
  {
    id: 'inv-012', number: 'QC-88317', supplierId: 'sup-05',
    issueDate: '2026-04-02', dueDate: '2026-06-01', receivedDate: '2026-04-08',
    amount: 88600, currency: 'USD', status: 'approval', poNumber: 'PO-7588',
    matchStatus: 'qty_variance', source: 'edi',
    lines: [
      { description: 'PCB assemblies — rev C (2,200 units)', qty: 2200, unitPrice: 38.5, amount: 84700, glCode: '5010 · Raw Materials', glConfidence: 0.99 },
      { description: 'Tooling amortization', qty: 1, unitPrice: 3900, amount: 3900, glCode: '5015 · Outside Processing', glConfidence: 0.84 },
    ],
    extraction: [
      { field: 'Supplier', value: 'Quanta Components GmbH', confidence: 0.99 },
      { field: 'Invoice #', value: 'QC-88317', confidence: 0.99 },
      { field: 'Total', value: '$88,600.00', confidence: 0.99 },
    ],
    approvals: [
      { approver: 'Sarah Chen', role: 'AP Manager', status: 'approved', date: '2026-04-12', comment: 'Qty variance: invoiced 2,200 vs 2,000 received. Waiting on receiving report for final 200.' },
      { approver: 'David Osei', role: 'Controller', status: 'pending' },
    ],
    anomalies: [],
  },
  {
    id: 'inv-013', number: 'VOS-4418', supplierId: 'sup-04',
    issueDate: '2026-05-04', dueDate: '2026-06-03', receivedDate: '2026-05-06',
    amount: 6440, currency: 'USD', status: 'approval',
    matchStatus: 'no_po', source: 'upload',
    lines: [
      { description: 'Ergonomic chairs (8 units)', qty: 8, unitPrice: 645, amount: 5160, glCode: '6320 · Office Furniture', glConfidence: 0.96 },
      { description: 'Standing desk converter (4 units)', qty: 4, unitPrice: 320, amount: 1280, glCode: '6320 · Office Furniture', glConfidence: 0.94 },
    ],
    extraction: [
      { field: 'Supplier', value: 'Vega Office Solutions', confidence: 0.99 },
      { field: 'Invoice #', value: 'VOS-4418', confidence: 0.98 },
      { field: 'Total', value: '$6,440.00', confidence: 0.99 },
    ],
    approvals: [
      { approver: 'Sarah Chen', role: 'AP Manager', status: 'pending' },
    ],
    anomalies: [],
  },
  {
    id: 'inv-014', number: 'BLM-30684', supplierId: 'sup-03',
    issueDate: '2026-03-18', dueDate: '2026-05-02', receivedDate: '2026-03-22',
    amount: 96800, currency: 'USD', status: 'exception', poNumber: 'PO-7544',
    matchStatus: 'price_variance', source: 'edi',
    lines: [
      { description: 'Aluminum extrusion 6061 (24 tons)', qty: 24, unitPrice: 3850, amount: 92400, glCode: '5010 · Raw Materials', glConfidence: 0.99 },
      { description: 'Heat treatment', qty: 24, unitPrice: 183.33, amount: 4400, glCode: '5015 · Outside Processing', glConfidence: 0.91 },
    ],
    extraction: [
      { field: 'Supplier', value: 'Brightline Manufacturing', confidence: 0.99 },
      { field: 'Invoice #', value: 'BLM-30684', confidence: 0.99 },
      { field: 'Total', value: '$96,800.00', confidence: 0.99 },
    ],
    approvals: [
      { approver: 'Sarah Chen', role: 'AP Manager', status: 'waiting' },
      { approver: 'David Osei', role: 'Controller', status: 'waiting' },
    ],
    anomalies: [
      { type: 'price_drift', severity: 'medium', message: 'Aluminum unit price $3,850 vs $3,610 PO price (+6.6%). Supplier cites LME index escalation clause — contract review needed.' },
    ],
  },
  // ---- Captured (just arrived, AI processing done, awaiting queue) ----
  {
    id: 'inv-015', number: 'ALP-2026-0231', supplierId: 'sup-08',
    issueDate: '2026-06-10', dueDate: '2026-06-10', receivedDate: '2026-06-11',
    amount: 18400, currency: 'USD', status: 'captured',
    matchStatus: 'no_po', source: 'email',
    lines: [
      { description: 'Legal services — May retainer', qty: 1, unitPrice: 12000, amount: 12000, glCode: '6410 · Legal Fees', glConfidence: 0.98 },
      { description: 'Contract review — supplier MSAs (16 hrs)', qty: 16, unitPrice: 400, amount: 6400, glCode: '6410 · Legal Fees', glConfidence: 0.97 },
    ],
    extraction: [
      { field: 'Supplier', value: 'Apex Legal Partners', confidence: 0.99 },
      { field: 'Invoice #', value: 'ALP-2026-0231', confidence: 0.99 },
      { field: 'Total', value: '$18,400.00', confidence: 0.99 },
    ],
    approvals: [
      { approver: 'Sarah Chen', role: 'AP Manager', status: 'waiting' },
    ],
    anomalies: [],
  },
  {
    id: 'inv-016', number: 'SIH-5544', supplierId: 'sup-10',
    issueDate: '2026-06-09', dueDate: '2026-07-09', receivedDate: '2026-06-11',
    amount: 50050, currency: 'USD', status: 'captured', poNumber: 'PO-7748',
    matchStatus: 'pending', source: 'upload',
    lines: [
      { description: 'Network switches — 48-port PoE (14 units)', qty: 14, unitPrice: 3250, amount: 45500, glCode: '1510 · Computer Equipment', glConfidence: 0.97 },
      { description: 'SFP+ transceivers (28 units)', qty: 28, unitPrice: 162.5, amount: 4550, glCode: '1510 · Computer Equipment', glConfidence: 0.92 },
    ],
    extraction: [
      { field: 'Supplier', value: 'Stellar IT Hardware', confidence: 0.99 },
      { field: 'Invoice #', value: 'SIH-5544', confidence: 0.98 },
      { field: 'Total', value: '$50,050.00', confidence: 0.99 },
      { field: 'PO number', value: 'PO-7748', confidence: 0.95 },
    ],
    approvals: [
      { approver: 'Sarah Chen', role: 'AP Manager', status: 'waiting' },
      { approver: 'David Osei', role: 'Controller', status: 'waiting' },
    ],
    anomalies: [],
  },
  // ---- Paid ----
  {
    id: 'inv-017', number: 'HCS-INV-8911', supplierId: 'sup-02',
    issueDate: '2026-05-05', dueDate: '2026-06-04', receivedDate: '2026-05-05',
    amount: 27100, currency: 'USD', status: 'paid', poNumber: 'PO-7625',
    matchStatus: 'matched', source: 'portal', paidDate: '2026-06-02',
    lines: [
      { description: 'Compute cluster — April usage', qty: 1, unitPrice: 19400, amount: 19400, glCode: '6510 · Cloud Infrastructure', glConfidence: 0.99 },
      { description: 'Object storage — April usage', qty: 1, unitPrice: 4300, amount: 4300, glCode: '6510 · Cloud Infrastructure', glConfidence: 0.99 },
      { description: 'Premium support plan', qty: 1, unitPrice: 3400, amount: 3400, glCode: '6520 · Software Subscriptions', glConfidence: 0.96 },
    ],
    extraction: [
      { field: 'Supplier', value: 'Helix Cloud Services', confidence: 0.99 },
      { field: 'Invoice #', value: 'HCS-INV-8911', confidence: 0.99 },
      { field: 'Total', value: '$27,100.00', confidence: 0.99 },
    ],
    approvals: [
      { approver: 'Sarah Chen', role: 'AP Manager', status: 'approved', date: '2026-05-07' },
      { approver: 'David Osei', role: 'Controller', status: 'approved', date: '2026-05-08' },
    ],
    anomalies: [],
  },
  {
    id: 'inv-018', number: 'MPC-76982', supplierId: 'sup-09',
    issueDate: '2026-04-28', dueDate: '2026-05-28', receivedDate: '2026-04-29',
    amount: 43000, currency: 'USD', status: 'paid', poNumber: 'PO-7601',
    matchStatus: 'matched', source: 'edi', paidDate: '2026-05-08',
    lines: [
      { description: 'Corrugated cartons — SKU C-180 (40,000)', qty: 40000, unitPrice: 1.075, amount: 43000, glCode: '5020 · Packaging Materials', glConfidence: 0.99 },
    ],
    extraction: [
      { field: 'Supplier', value: 'Meridian Packaging Co', confidence: 0.99 },
      { field: 'Invoice #', value: 'MPC-76982', confidence: 0.99 },
      { field: 'Total', value: '$43,000.00', confidence: 0.99 },
    ],
    approvals: [
      { approver: 'Sarah Chen', role: 'AP Manager', status: 'approved', date: '2026-05-01' },
      { approver: 'David Osei', role: 'Controller', status: 'approved', date: '2026-05-02' },
    ],
    anomalies: [],
    discount: { terms: '2/10 Net 30', amount: 860, deadline: '2026-05-08' },
  },
  {
    id: 'inv-019', number: 'NWL-20355', supplierId: 'sup-01',
    issueDate: '2026-04-20', dueDate: '2026-05-20', receivedDate: '2026-04-22',
    amount: 24300, currency: 'USD', status: 'paid', poNumber: 'PO-7590',
    matchStatus: 'matched', source: 'email', paidDate: '2026-05-18',
    lines: [
      { description: 'FTL freight — April lanes', qty: 16, unitPrice: 1400, amount: 22400, glCode: '5200 · Freight Out', glConfidence: 0.98 },
      { description: 'Detention charges', qty: 1, unitPrice: 1900, amount: 1900, glCode: '5200 · Freight Out', glConfidence: 0.85 },
    ],
    extraction: [
      { field: 'Supplier', value: 'Northwind Logistics', confidence: 0.99 },
      { field: 'Invoice #', value: 'NWL-20355', confidence: 0.99 },
      { field: 'Total', value: '$24,300.00', confidence: 0.99 },
    ],
    approvals: [
      { approver: 'Sarah Chen', role: 'AP Manager', status: 'approved', date: '2026-04-24' },
      { approver: 'David Osei', role: 'Controller', status: 'approved', date: '2026-04-25' },
    ],
    anomalies: [],
  },
  {
    id: 'inv-020', number: 'CMG-2204', supplierId: 'sup-06',
    issueDate: '2026-05-08', dueDate: '2026-05-23', receivedDate: '2026-05-09',
    amount: 31200, currency: 'USD', status: 'paid', poNumber: 'PO-7633',
    matchStatus: 'matched', source: 'email', paidDate: '2026-05-21',
    lines: [
      { description: 'Brand refresh sprint — phase 2', qty: 1, unitPrice: 31200, amount: 31200, glCode: '6110 · Advertising', glConfidence: 0.96 },
    ],
    extraction: [
      { field: 'Supplier', value: 'Citrine Marketing Group', confidence: 0.99 },
      { field: 'Invoice #', value: 'CMG-2204', confidence: 0.99 },
      { field: 'Total', value: '$31,200.00', confidence: 0.99 },
    ],
    approvals: [
      { approver: 'Sarah Chen', role: 'AP Manager', status: 'approved', date: '2026-05-11' },
      { approver: 'Nina Petrova', role: 'VP Marketing', status: 'approved', date: '2026-05-12' },
    ],
    anomalies: [],
  },
  {
    id: 'inv-021', number: 'BLM-30598', supplierId: 'sup-03',
    issueDate: '2026-04-06', dueDate: '2026-05-21', receivedDate: '2026-04-09',
    amount: 134600, currency: 'USD', status: 'paid', poNumber: 'PO-7561',
    matchStatus: 'matched', source: 'edi', paidDate: '2026-04-21',
    lines: [
      { description: 'Cold-rolled steel coil — Grade 1008 (55 tons)', qty: 55, unitPrice: 2095, amount: 115225, glCode: '5010 · Raw Materials', glConfidence: 0.99 },
      { description: 'Slitting service', qty: 55, unitPrice: 290, amount: 15950, glCode: '5015 · Outside Processing', glConfidence: 0.95 },
      { description: 'Freight', qty: 1, unitPrice: 3425, amount: 3425, glCode: '5200 · Freight Out', glConfidence: 0.94 },
    ],
    extraction: [
      { field: 'Supplier', value: 'Brightline Manufacturing', confidence: 0.99 },
      { field: 'Invoice #', value: 'BLM-30598', confidence: 0.99 },
      { field: 'Total', value: '$134,600.00', confidence: 0.99 },
    ],
    approvals: [
      { approver: 'Sarah Chen', role: 'AP Manager', status: 'approved', date: '2026-04-11' },
      { approver: 'David Osei', role: 'Controller', status: 'approved', date: '2026-04-12' },
      { approver: 'Ingrid Olsen', role: 'CFO', status: 'approved', date: '2026-04-13' },
    ],
    anomalies: [],
    discount: { terms: '1/15 Net 45', amount: 1346, deadline: '2026-04-21' },
  },
  {
    id: 'inv-022', number: 'GGE-202605-A', supplierId: 'sup-11',
    issueDate: '2026-05-02', dueDate: '2026-05-23', receivedDate: '2026-05-02',
    amount: 10980, currency: 'USD', status: 'paid',
    matchStatus: 'no_po', source: 'edi', paidDate: '2026-05-20',
    lines: [
      { description: 'Electricity — HQ campus, April', qty: 1, unitPrice: 8420, amount: 8420, glCode: '6210 · Utilities', glConfidence: 0.99 },
      { description: 'Electricity — Warehouse 2, April', qty: 1, unitPrice: 2560, amount: 2560, glCode: '6210 · Utilities', glConfidence: 0.99 },
    ],
    extraction: [
      { field: 'Supplier', value: 'GreenGrid Energy', confidence: 0.99 },
      { field: 'Invoice #', value: 'GGE-202605-A', confidence: 0.99 },
      { field: 'Total', value: '$10,980.00', confidence: 0.99 },
    ],
    approvals: [
      { approver: 'Sarah Chen', role: 'AP Manager', status: 'approved', date: '2026-05-04' },
    ],
    anomalies: [],
  },
  {
    id: 'inv-023', number: 'VOS-4377', supplierId: 'sup-04',
    issueDate: '2026-04-14', dueDate: '2026-05-14', receivedDate: '2026-04-16',
    amount: 6440, currency: 'USD', status: 'paid',
    matchStatus: 'no_po', source: 'upload', paidDate: '2026-05-12',
    lines: [
      { description: 'Office supplies — Q2 replenishment', qty: 1, unitPrice: 6440, amount: 6440, glCode: '6330 · Office Supplies', glConfidence: 0.97 },
    ],
    extraction: [
      { field: 'Supplier', value: 'Vega Office Solutions', confidence: 0.99 },
      { field: 'Invoice #', value: 'VOS-4377', confidence: 0.98 },
      { field: 'Total', value: '$6,440.00', confidence: 0.99 },
    ],
    approvals: [
      { approver: 'Sarah Chen', role: 'AP Manager', status: 'approved', date: '2026-04-18' },
    ],
    anomalies: [],
  },
  {
    id: 'inv-024', number: 'IPF-1103', supplierId: 'sup-07',
    issueDate: '2026-05-12', dueDate: '2026-06-11', receivedDate: '2026-05-18',
    amount: 11320, currency: 'USD', status: 'paid',
    matchStatus: 'no_po', source: 'email', paidDate: '2026-06-02',
    lines: [
      { description: 'HVAC quarterly maintenance — HQ', qty: 1, unitPrice: 6820, amount: 6820, glCode: '6300 · Building Maintenance', glConfidence: 0.95 },
      { description: 'Emergency chiller repair (parts + labor)', qty: 1, unitPrice: 4500, amount: 4500, glCode: '6300 · Building Maintenance', glConfidence: 0.92 },
    ],
    extraction: [
      { field: 'Supplier', value: 'Ironpeak Facilities', confidence: 0.98 },
      { field: 'Invoice #', value: 'IPF-1103', confidence: 0.96 },
      { field: 'Total', value: '$11,320.00', confidence: 0.99 },
    ],
    approvals: [
      { approver: 'Sarah Chen', role: 'AP Manager', status: 'approved', date: '2026-05-22' },
      { approver: 'David Osei', role: 'Controller', status: 'approved', date: '2026-05-26' },
    ],
    anomalies: [],
  },
  {
    id: 'inv-025', number: 'ALP-2026-0198', supplierId: 'sup-08',
    issueDate: '2026-05-09', dueDate: '2026-05-09', receivedDate: '2026-05-10',
    amount: 14200, currency: 'USD', status: 'paid',
    matchStatus: 'no_po', source: 'email', paidDate: '2026-05-13',
    lines: [
      { description: 'Legal services — April retainer', qty: 1, unitPrice: 12000, amount: 12000, glCode: '6410 · Legal Fees', glConfidence: 0.98 },
      { description: 'IP filing fees', qty: 1, unitPrice: 2200, amount: 2200, glCode: '6410 · Legal Fees', glConfidence: 0.93 },
    ],
    extraction: [
      { field: 'Supplier', value: 'Apex Legal Partners', confidence: 0.99 },
      { field: 'Invoice #', value: 'ALP-2026-0198', confidence: 0.99 },
      { field: 'Total', value: '$14,200.00', confidence: 0.99 },
    ],
    approvals: [
      { approver: 'Sarah Chen', role: 'AP Manager', status: 'approved', date: '2026-05-11' },
    ],
    anomalies: [],
  },
  {
    id: 'inv-026', number: 'QC-88195', supplierId: 'sup-05',
    issueDate: '2026-02-20', dueDate: '2026-04-21', receivedDate: '2026-02-26',
    amount: 45000, currency: 'USD', status: 'paid', poNumber: 'PO-7488',
    matchStatus: 'matched', source: 'edi', paidDate: '2026-04-20',
    lines: [
      { description: 'MCU-740 microcontroller (4,600 units)', qty: 4600, unitPrice: 9.7, amount: 44620, glCode: '5010 · Raw Materials', glConfidence: 0.99 },
      { description: 'Packing', qty: 1, unitPrice: 380, amount: 380, glCode: '5020 · Packaging Materials', glConfidence: 0.9 },
    ],
    extraction: [
      { field: 'Supplier', value: 'Quanta Components GmbH', confidence: 0.99 },
      { field: 'Invoice #', value: 'QC-88195', confidence: 0.99 },
      { field: 'Total', value: '$45,000.00', confidence: 0.99 },
    ],
    approvals: [
      { approver: 'Sarah Chen', role: 'AP Manager', status: 'approved', date: '2026-03-02' },
      { approver: 'David Osei', role: 'Controller', status: 'approved', date: '2026-03-03' },
    ],
    anomalies: [],
  },
]

export const paymentBatches: PaymentBatch[] = [
  { id: 'bat-061226', runDate: '2026-06-12', method: 'ACH', invoiceCount: 6, total: 96420, status: 'pending_release', savings: 1418 },
  { id: 'bat-061926', runDate: '2026-06-19', method: 'ACH', invoiceCount: 4, total: 85020, status: 'draft', savings: 372 },
  { id: 'bat-061526', runDate: '2026-06-15', method: 'Wire', invoiceCount: 1, total: 88600, status: 'draft', savings: 0 },
  { id: 'bat-060526', runDate: '2026-06-05', method: 'ACH', invoiceCount: 8, total: 104300, status: 'settled', savings: 1906 },
  { id: 'bat-052926', runDate: '2026-05-29', method: 'ACH', invoiceCount: 11, total: 167900, status: 'settled', savings: 2240 },
]

export const activities: Activity[] = [
  { id: 'act-1', actor: 'Aprio AI', action: 'flagged possible duplicate', target: 'IPF-1107 vs IPF-1103 — same amount, same service period', time: '8 min ago', kind: 'ai' },
  { id: 'act-2', actor: 'Aprio AI', action: 'captured + coded invoice', target: 'SIH-5544 from Stellar IT Hardware — 97% avg field confidence', time: '24 min ago', kind: 'ai' },
  { id: 'act-3', actor: 'Sarah Chen', action: 'approved', target: 'CMG-2271 — Citrine Marketing Group, $38,500', time: '1 hr ago', kind: 'user' },
  { id: 'act-4', actor: 'Aprio AI', action: 'detected bank account change', target: 'Stellar IT Hardware — remit-to changed via email request', time: '2 hrs ago', kind: 'ai' },
  { id: 'act-5', actor: 'System', action: 'payment batch settled', target: 'BAT-060526 — 8 invoices, $104,300 via ACH', time: '3 hrs ago', kind: 'system' },
  { id: 'act-6', actor: 'Aprio AI', action: 'price drift alert', target: 'QC-88412 — MCU-740 +15.5% vs trailing average', time: '5 hrs ago', kind: 'ai' },
  { id: 'act-7', actor: 'David Osei', action: 'requested receiving report', target: 'QC-88317 — qty variance 2,200 invoiced vs 2,000 received', time: 'Yesterday', kind: 'user' },
  { id: 'act-8', actor: 'Aprio AI', action: 'suggested early-pay discount', target: 'BLM-30771 — capture $1,482 by paying before Jun 16', time: 'Yesterday', kind: 'ai' },
]

// 6-month trend for dashboard charts
export const monthlyTrend = [
  { month: 'Jan', processed: 182, touchless: 118, spend: 1284000 },
  { month: 'Feb', processed: 174, touchless: 121, spend: 1192000 },
  { month: 'Mar', processed: 201, touchless: 149, spend: 1420000 },
  { month: 'Apr', processed: 196, touchless: 153, spend: 1356000 },
  { month: 'May', processed: 214, touchless: 176, spend: 1488000 },
  { month: 'Jun', processed: 96, touchless: 83, spend: 642000 },
]

export const cashForecast = [
  { week: 'Jun 8–14', scheduled: 96420, projected: 28000 },
  { week: 'Jun 15–21', scheduled: 173620, projected: 41000 },
  { week: 'Jun 22–28', scheduled: 48240, projected: 86000 },
  { week: 'Jun 29–Jul 5', scheduled: 11320, projected: 124000 },
  { week: 'Jul 6–12', scheduled: 68692, projected: 92000 },
  { week: 'Jul 13–19', scheduled: 0, projected: 158000 },
]

export const supplierById = (id: string) => suppliers.find((s) => s.id === id)!
