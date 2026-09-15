/**
 * Centralized Google Drive Folder Registry and Officer Guidelines.
 *
 * Implements Single Responsibility Principle (SRP) per committee wing.
 * Adheres strictly to the 80-character line limit.
 */

export interface DriveFolderEntry {
  key: string;
  wingNumber: string;
  wingName: string;
  folderName: string;
  path: string;
  responsibleRoles: string[];
  namingConvention: string;
  acceptedFormats: string;
  instructions: string;
  driveUrl?: string;
  defaultDriveUrl?: string;
}

export interface WingDefinition {
  wingNumber: string;
  name: string;
  shortLabel: string;
}

/**
 * Root Google Drive URL for the council workspace.
 * Paste your main Google Drive link here (e.g. Shared Drive root).
 */
export const ROOT_DRIVE_URL = "";

export const WING_DEFINITIONS: WingDefinition[] = [
  {
    wingNumber: "all",
    name: "All Council Wings",
    shortLabel: "All Folders",
  },
  {
    wingNumber: "00",
    name: "00_EXECUTIVE_GOVERNANCE",
    shortLabel: "00 Governance",
  },
  {
    wingNumber: "01",
    name: "01_RECORDS_&_INTERNAL_AFFAIRS",
    shortLabel: "01 Records",
  },
  {
    wingNumber: "02",
    name: "02_FINANCE_&_AUDIT",
    shortLabel: "02 Finance",
  },
  {
    wingNumber: "03",
    name: "03_EXTERNAL_AFFAIRS_&_COMMS",
    shortLabel: "03 External",
  },
  {
    wingNumber: "04",
    name: "04_CREATIVES_&_BRANDING",
    shortLabel: "04 Creatives",
  },
  {
    wingNumber: "05",
    name: "05_ACADEMICS_&_RESEARCH",
    shortLabel: "05 Academics",
  },
  {
    wingNumber: "06",
    name: "06_SPORTS_&_WELLNESS",
    shortLabel: "06 Sports",
  },
  {
    wingNumber: "07",
    name: "07_LOGISTICS_&_PROPERTY",
    shortLabel: "07 Logistics",
  },
  {
    wingNumber: "08",
    name: "08_GPOA_EVENTS_&_PROJECTS",
    shortLabel: "08 Events",
  },
];

export const DRIVE_REGISTRY: Record<string, DriveFolderEntry> = {
  // ==========================================
  // WING 00: EXECUTIVE GOVERNANCE
  // ==========================================
  constitution: {
    key: "constitution",
    wingNumber: "00",
    wingName: "00_EXECUTIVE_GOVERNANCE",
    folderName: "01_Constitution_&_ByLaws",
    path: "00_EXECUTIVE_GOVERNANCE/01_Constitution_&_ByLaws",
    responsibleRoles: ["President", "VP for Internal Affairs"],
    namingConvention: "CONST_2026_Revised_Constitution.pdf",
    acceptedFormats: "PDF, Google Docs",
    instructions: "General Access must be set to Anyone with link (Viewer).",
    driveUrl:
      "https://drive.google.com/drive/folders/1WM0VZ-DrQgH2i6SVzeOhjEKW_doCRZk2?usp=drive_link",
  },
  executiveDirectives: {
    key: "executiveDirectives",
    wingNumber: "00",
    wingName: "00_EXECUTIVE_GOVERNANCE",
    folderName: "02_Executive_Directives",
    path: "00_EXECUTIVE_GOVERNANCE/02_Executive_Directives",
    responsibleRoles: ["President"],
    namingConvention: "EO_2026_001_Committee_Appointments.pdf",
    acceptedFormats: "PDF, Signed Scans",
    instructions: "Official appointments, executive orders, mandates.",
    driveUrl:
      "https://drive.google.com/drive/folders/1U50u81OOEjkbi8o2Y16f269CttYQNlTL?usp=drive_link",
  },
  councilAppraisals: {
    key: "councilAppraisals",
    wingNumber: "00",
    wingName: "00_EXECUTIVE_GOVERNANCE",
    folderName: "03_Council_Appraisals",
    path: "00_EXECUTIVE_GOVERNANCE/03_Council_Appraisals",
    responsibleRoles: ["President", "VP for Internal Affairs"],
    namingConvention: "APPRAISAL_AY2627_MidYear_Report.xlsx",
    acceptedFormats: "Google Sheets, XLSX",
    instructions: "Mid-year and year-end 360 officer evaluation forms.",
    driveUrl:
      "https://drive.google.com/drive/folders/1dLk2QLq9uWRdj1U3pdd3Op9uep-1oJYS?usp=drive_link",
  },

  // ==========================================
  // WING 01: RECORDS & INTERNAL AFFAIRS
  // ==========================================
  resolutions: {
    key: "resolutions",
    wingNumber: "01",
    wingName: "01_RECORDS_&_INTERNAL_AFFAIRS",
    folderName: "01_Resolutions",
    path: "01_RECORDS_&_INTERNAL_AFFAIRS/01_Resolutions",
    responsibleRoles: ["VP for Records", "AVP for Records"],
    namingConvention: "RES-2026-XXX_[Short_Title].pdf",
    acceptedFormats: "PDF, Google Docs",
    instructions: "Official passed council resolution document.",
    driveUrl:
      "https://drive.google.com/drive/folders/1CIZI-om2LyqVCS9Y3DdLe1Td4csfyTbx?usp=drive_link",
  },
  memorandums: {
    key: "memorandums",
    wingNumber: "01",
    wingName: "01_RECORDS_&_INTERNAL_AFFAIRS",
    folderName: "02_Memorandums",
    path: "01_RECORDS_&_INTERNAL_AFFAIRS/02_Memorandums",
    responsibleRoles: ["VP for Records", "AVP for Records"],
    namingConvention: "MEMO-2026-XXX_[Subject].pdf",
    acceptedFormats: "PDF, Google Docs",
    instructions: "Council directives and committee operational memos.",
    driveUrl:
      "https://drive.google.com/drive/folders/1v3TwnWkIHXUdfRj4kFB3t9lY2X9CP3AO?usp=drive_link",
  },
  meetingMinutes: {
    key: "meetingMinutes",
    wingNumber: "01",
    wingName: "01_RECORDS_&_INTERNAL_AFFAIRS",
    folderName: "03_Meeting_Minutes",
    path: "01_RECORDS_&_INTERNAL_AFFAIRS/03_Meeting_Minutes",
    responsibleRoles: ["VP for Records", "AVP for Records"],
    namingConvention: "MIN-2026-XXX_YYYYMMDD_[Meeting_Type].pdf",
    acceptedFormats: "PDF, Google Docs",
    instructions: "Transcripts of regular, executive, or GA sessions.",
    driveUrl:
      "https://drive.google.com/drive/folders/1kZUvSe1DNnf-RjOojsUIK1GXIUo7Qjrf?usp=drive_link",
  },
  policyGuidelines: {
    key: "policyGuidelines",
    wingNumber: "01",
    wingName: "01_RECORDS_&_INTERNAL_AFFAIRS",
    folderName: "04_Policy_Guidelines",
    path: "01_RECORDS_&_INTERNAL_AFFAIRS/04_Policy_Guidelines",
    responsibleRoles: ["VP for Internal Affairs", "VP for Records"],
    namingConvention: "POL-2026-XXX_[Policy_Name].pdf",
    acceptedFormats: "PDF, Google Docs",
    instructions: "Operating manuals, code of conduct, committee SOPs.",
    driveUrl:
      "https://drive.google.com/drive/folders/12XexYQ707UB-_gmFExnUYdeDNK5pPZMg?usp=drive_link",
  },

  // ==========================================
  // WING 02: FINANCE & AUDIT
  // ==========================================
  budgetProposals: {
    key: "budgetProposals",
    wingNumber: "02",
    wingName: "02_FINANCE_&_AUDIT",
    folderName: "01_Budget_Proposals",
    path: "02_FINANCE_&_AUDIT/01_Budget_Proposals",
    responsibleRoles: ["VP for Finance", "AVP for Finance"],
    namingConvention: "BUDGET_2026_[Semester]_Allocation.xlsx",
    acceptedFormats: "Google Sheets, XLSX, PDF",
    instructions: "Annual GPOA budget matrix and per-event fund requests.",
    driveUrl:
      "https://drive.google.com/drive/folders/1H_ilqiD0lMG2IrOr3pUc9ZTUsqdfPtn7?usp=drive_link",
  },
  ledgersCashFlow: {
    key: "ledgersCashFlow",
    wingNumber: "02",
    wingName: "02_FINANCE_&_AUDIT",
    folderName: "02_Ledgers_&_Cash_Flow",
    path: "02_FINANCE_&_AUDIT/02_Ledgers_&_Cash_Flow",
    responsibleRoles: ["VP for Finance", "VP for Audit"],
    namingConvention: "LEDGER_2026_Monthly_CashFlow.xlsx",
    acceptedFormats: "Google Sheets, XLSX",
    instructions: "Inflow/outflow balance sheets and petty cash logs.",
    driveUrl:
      "https://drive.google.com/drive/folders/1C3XR45KHEnv_eddls1BDrIFEm8oxtUg5?usp=drive_link",
  },
  financeReceipts: {
    key: "financeReceipts",
    wingNumber: "02",
    wingName: "02_FINANCE_&_AUDIT",
    folderName: "03_Receipts_&_Invoices",
    path: "02_FINANCE_&_AUDIT/03_Receipts_&_Invoices",
    responsibleRoles: ["VP for Finance", "AVP for Finance"],
    namingConvention: "OR_YYYYMMDD_[Merchant]_[Amount].pdf",
    acceptedFormats: "PNG, JPG, PDF",
    instructions: "Clear photo or scanned receipt for ledger audits.",
    driveUrl:
      "https://drive.google.com/drive/folders/1KbYC3vamrnuieiHUdruDJWmuabHfqeXi?usp=drive_link",
  },
  financeLiquidation: {
    key: "financeLiquidation",
    wingNumber: "02",
    wingName: "02_FINANCE_&_AUDIT",
    folderName: "04_Liquidation_Reports",
    path: "02_FINANCE_&_AUDIT/04_Liquidation_Reports",
    responsibleRoles: ["VP for Finance", "VP for Audit"],
    namingConvention: "LIQ-2026-XXX_[Event]_AuditReport.pdf",
    acceptedFormats: "PDF, Google Sheets",
    instructions: "Full expense liquidation package signed by Auditor.",
    driveUrl:
      "https://drive.google.com/drive/folders/1z1CF0KVKbyCHVhaJ5ZFitYTB62pcQu_9?usp=drive_link",
  },

  // ==========================================
  // WING 03: EXTERNAL AFFAIRS & COMMS
  // ==========================================
  partnershipsMoU: {
    key: "partnershipsMoU",
    wingNumber: "03",
    wingName: "03_EXTERNAL_AFFAIRS_&_COMMS",
    folderName: "01_Partnerships_&_MoU",
    path: "03_EXTERNAL_AFFAIRS_&_COMMS/01_Partnerships_&_MoU",
    responsibleRoles: ["VP for External Affairs", "AVP External"],
    namingConvention: "MOU_2026_[PartnerCompany]_[Scope].pdf",
    acceptedFormats: "PDF, Signed Scans",
    instructions: "Signed Memoranda of Understanding and partner contracts.",
    driveUrl:
      "https://drive.google.com/drive/folders/1WYGLN0Xy8d7NpjVGysjXUWg3Qswzz7Hm?usp=drive_link",
  },
  officialDispatches: {
    key: "officialDispatches",
    wingNumber: "03",
    wingName: "03_EXTERNAL_AFFAIRS_&_COMMS",
    folderName: "02_Official_Dispatches",
    path: "03_EXTERNAL_AFFAIRS_&_COMMS/02_Official_Dispatches",
    responsibleRoles: ["VP for External Affairs", "VP for Comms"],
    namingConvention: "DISPATCH_YYYYMMDD_[Recipient]_[Subject].pdf",
    acceptedFormats: "PDF, Google Docs",
    instructions: "Formal endorsement letters, Dean requests, invitations.",
    driveUrl:
      "https://drive.google.com/drive/folders/1FbxVIyv2j2mS-j9lXAJ8c3TwhmokCnLQ?usp=drive_link",
  },
  pressReleases: {
    key: "pressReleases",
    wingNumber: "03",
    wingName: "03_EXTERNAL_AFFAIRS_&_COMMS",
    folderName: "03_Press_Releases_&_Copy",
    path: "03_EXTERNAL_AFFAIRS_&_COMMS/03_Press_Releases_&_Copy",
    responsibleRoles: ["VP for Comms", "AVP for Comms"],
    namingConvention: "COPY_YYYYMMDD_[Announcement_Topic].docx",
    acceptedFormats: "Google Docs, DOCX",
    instructions: "Official captions, press statements, and copywriting.",
    driveUrl:
      "https://drive.google.com/drive/folders/1eKqJwKSRuaWo63AyfW5ECV9tYb_K_ZzD?usp=drive_link",
  },

  // ==========================================
  // WING 04: CREATIVES & BRANDING
  // ==========================================
  brandKit: {
    key: "brandKit",
    wingNumber: "04",
    wingName: "04_CREATIVES_&_BRANDING",
    folderName: "01_Brand_Kit_&_Guidelines",
    path: "04_CREATIVES_&_BRANDING/01_Brand_Kit_&_Guidelines",
    responsibleRoles: ["Director of Creatives", "Co-Director"],
    namingConvention: "CS_Brand_Kit_2026_Official.pdf",
    acceptedFormats: "AI, PSD, SVG, PNG, PDF",
    instructions: "Vector logos, typography files, color palettes.",
    driveUrl:
      "https://drive.google.com/drive/folders/1AH8nyIDSS_KR8SFmcP9idevfWqEGLCqs?usp=drive_link",
  },
  pubmatsSourceFiles: {
    key: "pubmatsSourceFiles",
    wingNumber: "04",
    wingName: "04_CREATIVES_&_BRANDING",
    folderName: "02_Pubmats_&_Source_Files",
    path: "04_CREATIVES_&_BRANDING/02_Pubmats_&_Source_Files",
    responsibleRoles: ["Director of Creatives", "Co-Director"],
    namingConvention: "PUB_YYYYMMDD_[Event]_[Format].psd",
    acceptedFormats: "PSD, AI, FIG, PNG",
    instructions: "Raw design files, editable templates, and exports.",
    driveUrl:
      "https://drive.google.com/drive/folders/1lugimSMEpbA8vt3qJ8fgK9Qagg6658YW?usp=drive_link",
  },
  mediaCoverage: {
    key: "mediaCoverage",
    wingNumber: "04",
    wingName: "04_CREATIVES_&_BRANDING",
    folderName: "03_Media_Coverage_Archive",
    path: "04_CREATIVES_&_BRANDING/03_Media_Coverage_Archive",
    responsibleRoles: ["Creatives & Media Committee"],
    namingConvention: "YYYYMMDD_[Event]_Photos/",
    acceptedFormats: "RAW, JPG, MP4, MOV",
    instructions: "Event coverage photo reels, b-rolls, and interviews.",
    driveUrl:
      "https://drive.google.com/drive/folders/19-M_KL1bDniHPw-qmOUZEcFf__gt_HGm?usp=drive_link",
  },

  // ==========================================
  // WING 05: ACADEMICS & RESEARCH
  // ==========================================
  courseReviewers: {
    key: "courseReviewers",
    wingNumber: "05",
    wingName: "05_ACADEMICS_&_RESEARCH",
    folderName: "01_Course_Reviewers",
    path: "05_ACADEMICS_&_RESEARCH/01_Course_Reviewers",
    responsibleRoles: ["Director of Academics", "Co-Director"],
    namingConvention: "REV_[CourseCode]_[Term]_AY2627.pdf",
    acceptedFormats: "PDF, Google Docs",
    instructions: "Curated mock exams, study guides, and lecture notes.",
    driveUrl:
      "https://drive.google.com/drive/folders/15OrSOa4V4_gGb-gkvqP-Kj91JWZ7VIVw?usp=drive_link",
  },
  workshopDecks: {
    key: "workshopDecks",
    wingNumber: "05",
    wingName: "05_ACADEMICS_&_RESEARCH",
    folderName: "02_Workshop_Decks",
    path: "05_ACADEMICS_&_RESEARCH/02_Workshop_Decks",
    responsibleRoles: ["Director of Academics", "Speakers"],
    namingConvention: "DECK_YYYYMMDD_[WorkshopTitle].pdf",
    acceptedFormats: "PDF, PPTX, Google Slides",
    instructions: "Seminar slides, coding bootcamp code files, handouts.",
    driveUrl:
      "https://drive.google.com/drive/folders/186Fy2ZXC0GQj7uiT0LtbA8DC_jxLkgC1?usp=drive_link",
  },
  researchArchive: {
    key: "researchArchive",
    wingNumber: "05",
    wingName: "05_ACADEMICS_&_RESEARCH",
    folderName: "03_Research_&_Capstones",
    path: "05_ACADEMICS_&_RESEARCH/03_Research_&_Capstones",
    responsibleRoles: ["VP for Research and Docs", "AVP for Research and Docs"],
    namingConvention: "RESEARCH_2026_[Topic]_[Author].pdf",
    acceptedFormats: "PDF",
    instructions: "Student thesis papers, tech journals, research digests.",
    driveUrl:
      "https://drive.google.com/drive/folders/18M8VXYlP_BLOJFRuuexPgkKE7oEmB_PG?usp=drive_link",
  },

  // ==========================================
  // WING 06: SPORTS & WELLNESS
  // ==========================================
  sportsTournaments: {
    key: "sportsTournaments",
    wingNumber: "06",
    wingName: "06_SPORTS_&_WELLNESS",
    folderName: "01_Esports_Tournaments",
    path: "06_SPORTS_&_WELLNESS/01_Esports_Tournaments",
    responsibleRoles: ["Director of Sports", "Co-Director of Sports"],
    namingConvention: "ESPORTS_2026_[GameTitle]_Rulebook.pdf",
    acceptedFormats: "PDF, Google Sheets",
    instructions: "Tournament rulebooks, match schedules, brackets.",
    driveUrl:
      "https://drive.google.com/drive/folders/1Ld7B3FYL1DIq1yMgppCr-sJrQzyu5L-I?usp=drive_link",
  },
  intramuralsAthletics: {
    key: "intramuralsAthletics",
    wingNumber: "06",
    wingName: "06_SPORTS_&_WELLNESS",
    folderName: "02_Intramurals_&_Athletics",
    path: "06_SPORTS_&_WELLNESS/02_Intramurals_&_Athletics",
    responsibleRoles: ["Director of Sports", "Co-Director of Sports"],
    namingConvention: "ATHLETICS_2026_[Sport]_Roster.xlsx",
    acceptedFormats: "PDF, Google Sheets",
    instructions: "Player waivers, department rosters, tally boards.",
    driveUrl:
      "https://drive.google.com/drive/folders/19j5AFY8JRq49R0Izx9dGhxnxTMJnLVQl?usp=drive_link",
  },
  studentWellness: {
    key: "studentWellness",
    wingNumber: "06",
    wingName: "06_SPORTS_&_WELLNESS",
    folderName: "03_Student_Wellness",
    path: "06_SPORTS_&_WELLNESS/03_Student_Wellness",
    responsibleRoles: ["Director of Sports"],
    namingConvention: "WELLNESS_2026_[Program_Handout].pdf",
    acceptedFormats: "PDF, Google Slides",
    instructions: "Mental health seminars, fitness challenge tracking.",
    driveUrl:
      "https://drive.google.com/drive/folders/1rvob9TraH-5kxnsCrYyS3zJRc-Id5aWr?usp=drive_link",
  },

  // ==========================================
  // WING 07: LOGISTICS & PROPERTY
  // ==========================================
  assetInventoryMaster: {
    key: "assetInventoryMaster",
    wingNumber: "07",
    wingName: "07_LOGISTICS_&_PROPERTY",
    folderName: "01_Asset_Inventory_Master",
    path: "07_LOGISTICS_&_PROPERTY/01_Asset_Inventory_Master",
    responsibleRoles: ["Delegates Representative", "VP for Audit"],
    namingConvention: "INVENTORY_2026_Master_Equipment_Log.xlsx",
    acceptedFormats: "Google Sheets, XLSX",
    instructions: "Master registry of org assets, serials, and status.",
    driveUrl:
      "https://drive.google.com/drive/folders/1P8kW6ml5fF5ocZ7O3O3OwZgShvPrqZZ9?usp=drive_link",
  },
  inventoryCustody: {
    key: "inventoryCustody",
    wingNumber: "07",
    wingName: "07_LOGISTICS_&_PROPERTY",
    folderName: "02_Borrower_Custody_Slips",
    path: "07_LOGISTICS_&_PROPERTY/02_Borrower_Custody_Slips",
    responsibleRoles: ["Delegates Representative", "VP for Audit"],
    namingConvention: "SLIP_YYYYMMDD_[Item]_[Borrower].pdf",
    acceptedFormats: "Signed PDF",
    instructions: "Signed property accountability and return slips.",
    driveUrl:
      "https://drive.google.com/drive/folders/1g2_6kMLCKPD-uvF1J5TgGdPr80esEXVs?usp=drive_link",
  },
  inventoryAudit: {
    key: "inventoryAudit",
    wingNumber: "07",
    wingName: "07_LOGISTICS_&_PROPERTY",
    folderName: "03_Physical_Audit_Inspection",
    path: "07_LOGISTICS_&_PROPERTY/03_Physical_Audit_Inspection",
    responsibleRoles: ["VP for Audit"],
    namingConvention: "AUDIT_2026_Physical_Inventory_Report.pdf",
    acceptedFormats: "PDF, Google Sheets",
    instructions: "Semester physical asset count and missing/damaged logs.",
    driveUrl:
      "https://drive.google.com/drive/folders/1mE4r1R6lMlp9Yw5GEnFNygzTsl7zL-7K?usp=drive_link",
  },
  venueEquipmentPermits: {
    key: "venueEquipmentPermits",
    wingNumber: "07",
    wingName: "07_LOGISTICS_&_PROPERTY",
    folderName: "04_Venue_&_Equipment_Permits",
    path: "07_LOGISTICS_&_PROPERTY/04_Venue_&_Equipment_Permits",
    responsibleRoles: ["VP for Internal Affairs", "Delegates Representative"],
    namingConvention: "PERMIT_YYYYMMDD_[Venue]_[Status].pdf",
    acceptedFormats: "Signed PDF",
    instructions: "Approved campus permits, AVR, audio passes.",
    driveUrl:
      "https://drive.google.com/drive/folders/13ccZ1OzbLQ4aKA6Wr2FUZwxujlGexJrt?usp=drive_link",
  },

  // ==========================================
  // WING 08: GPOA EVENTS & PROJECTS
  // ==========================================
  eventFolderTemplate: {
    key: "eventFolderTemplate",
    wingNumber: "08",
    wingName: "08_GPOA_EVENTS_&_PROJECTS",
    folderName: "_EVENT_FOLDER_TEMPLATE",
    path: "08_GPOA_EVENTS_&_PROJECTS/_EVENT_FOLDER_TEMPLATE",
    responsibleRoles: [
      "Project Head",
      "VP for Internal Affairs",
      "Docs Committee",
    ],
    namingConvention: "[Event_Name]_Template_Package",
    acceptedFormats: "Folder Structure",
    instructions: "Duplicate this entire folder for every GPOA event.",
    driveUrl:
      "https://drive.google.com/drive/folders/1z2h8XlTKVRTMiJEvolzvlK9Uhqp8lGAC?usp=drive_link",
  },
  eventProposals: {
    key: "eventProposals",
    wingNumber: "08",
    wingName: "08_GPOA_EVENTS_&_PROJECTS",
    folderName: "01_Proposals_&_Permits",
    path: "08_GPOA_EVENTS_&_PROJECTS/[Event]/01_Proposals_&_Permits",
    responsibleRoles: ["Project Head", "VP for Internal Affairs"],
    namingConvention: "PROPOSAL_2026_[Event]_Approved.pdf",
    acceptedFormats: "PDF, Signed Scans",
    instructions: "Admin approvals, budget proposals, campus permits.",
    driveUrl:
      "https://drive.google.com/drive/folders/1EOWrD9WmEHcc8ma3dYJ0f1d_jxV9EPzN?usp=drive_link",
  },
  eventProgramMaterials: {
    key: "eventProgramMaterials",
    wingNumber: "08",
    wingName: "08_GPOA_EVENTS_&_PROJECTS",
    folderName: "02_Program_&_Materials",
    path: "08_GPOA_EVENTS_&_PROJECTS/[Event]/02_Program_&_Materials",
    responsibleRoles: ["Project Head", "Director of Academics"],
    namingConvention: "PROGRAM_[Event]_Sequence_Script.docx",
    acceptedFormats: "PDF, DOCX, Slides",
    instructions: "Emcee scripts, participant handouts, slide decks.",
    driveUrl:
      "https://drive.google.com/drive/folders/1-yJycnbInrwtLDov-rhCeXL2EUKB530j?usp=drive_link",
  },
  eventDocumentation: {
    key: "eventDocumentation",
    wingNumber: "08",
    wingName: "08_GPOA_EVENTS_&_PROJECTS",
    folderName: "03_Documentation",
    path: "08_GPOA_EVENTS_&_PROJECTS/[Event]/03_Documentation",
    responsibleRoles: [
      "VP for Research and Docs",
      "Creatives & Media Committee",
    ],
    namingConvention: "DOCS_[Event]_Narrative_Photos.pdf",
    acceptedFormats: "PDF, Photos, Videos",
    instructions: "Event narrative summary and photo/video highlights.",
    driveUrl:
      "https://drive.google.com/drive/folders/1g0qXSXrbW6wTqe8pgg2Q7z2g_wv-VkFy?usp=drive_link",
  },
  eventEvaluations: {
    key: "eventEvaluations",
    wingNumber: "08",
    wingName: "08_GPOA_EVENTS_&_PROJECTS",
    folderName: "04_Evaluations",
    path: "08_GPOA_EVENTS_&_PROJECTS/[Event]/04_Evaluations",
    responsibleRoles: [
      "VP for Research and Docs",
      "AVP for Research and Docs",
      "Project Head",
    ],
    namingConvention: "[Event_Name]_Evaluation_Responses.xlsx",
    acceptedFormats: "Google Forms, Google Sheets",
    instructions: "Live feedback spreadsheet and survey analytics export.",
    driveUrl:
      "https://drive.google.com/drive/folders/1HEXWa2idRXnKloZRR4OgkPLCugwC4DB9?usp=drive_link",
  },
  eventTerminalReport: {
    key: "eventTerminalReport",
    wingNumber: "08",
    wingName: "08_GPOA_EVENTS_&_PROJECTS",
    folderName: "05_Terminal_Report",
    path: "08_GPOA_EVENTS_&_PROJECTS/[Event]/05_Terminal_Report",
    responsibleRoles: [
      "Project Head",
      "VP for Research and Docs",
      "VP for Internal Affairs",
    ],
    namingConvention: "TR_2026_[Event]_Final_Signed.pdf",
    acceptedFormats: "Signed PDF",
    instructions: "Comprehensive terminal report for OSA/Dean.",
    driveUrl:
      "https://drive.google.com/drive/folders/1tNt41dUXbYerG1eIkOHHil8MSy1y2vMR?usp=drive_link",
  },
};
