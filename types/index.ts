// Core Data Entities
export interface Client {
  ClientID: string;
  ClientName: string;
  PriorityLevel: number; // 1-5
  RequestedTaskIDs: string[];
  GroupTag: string;
  AttributesJSON: Record<string, any>;
}

export interface Worker {
  WorkerID: string;
  WorkerName: string;
  Skills: string[];
  AvailableSlots: number[];
  MaxLoadPerPhase: number;
  WorkerGroup: string;
  QualificationLevel: number;
  HourlyRate?: number;
}

export interface Task {
  TaskID: string;
  TaskName: string;
  Category: string;
  Duration: number;
  RequiredSkills: string[];
  PreferredPhases: number[] | string;
  MaxConcurrent: number;
}

// Validation Types
export interface ValidationError {
  id: string;
  type: ValidationErrorType;
  entity: "clients" | "workers" | "tasks";
  entityId: string;
  field?: string;
  message: string;
  severity: "error" | "warning";
  suggestion?: string;
  autoFixable?: boolean;
}

export enum ValidationErrorType {
  MISSING_REQUIRED_COLUMN = "missing_required_column",
  DUPLICATE_ID = "duplicate_id",
  MALFORMED_LIST = "malformed_list",
  OUT_OF_RANGE = "out_of_range",
  BROKEN_JSON = "broken_json",
  UNKNOWN_REFERENCE = "unknown_reference",
  CIRCULAR_CORUN = "circular_corun",
  CONFLICTING_RULES = "conflicting_rules",
  OVERLOADED_WORKER = "overloaded_worker",
  PHASE_SLOT_SATURATION = "phase_slot_saturation",
  SKILL_COVERAGE = "skill_coverage",
  MAX_CONCURRENCY_FEASIBILITY = "max_concurrency_feasibility",
  INCONSISTENT_DATA = "inconsistent_data",
}

// Rule System Types
export interface BaseRule {
  id: string;
  type: RuleType;
  name: string;
  description?: string;
  enabled: boolean;
  priority: number;
}

export enum RuleType {
  CO_RUN = "coRun",
  SLOT_RESTRICTION = "slotRestriction",
  LOAD_LIMIT = "loadLimit",
  PHASE_WINDOW = "phaseWindow",
  PATTERN_MATCH = "patternMatch",
  PRECEDENCE_OVERRIDE = "precedenceOverride",
  SKILL_REQUIREMENT = "skillMatching",
  PRIORITY_FIRST = "priority",
}

export interface CoRunRule extends BaseRule {
  type: RuleType.CO_RUN;
  tasks: string[];
}

export interface SlotRestrictionRule extends BaseRule {
  type: RuleType.SLOT_RESTRICTION;
  targetGroup: string;
  groupType: "client" | "worker";
  minCommonSlots: number;
}

export interface LoadLimitRule extends BaseRule {
  type: RuleType.LOAD_LIMIT;
  workerGroup: string;
  maxSlotsPerPhase: number;
}

export interface PhaseWindowRule extends BaseRule {
  type: RuleType.PHASE_WINDOW;
  taskId: string;
  allowedPhases: number[];
}

export interface PatternMatchRule extends BaseRule {
  type: RuleType.PATTERN_MATCH;
  pattern: string;
  template: string;
  parameters: Record<string, any>;
}

export interface PrecedenceOverrideRule extends BaseRule {
  type: RuleType.PRECEDENCE_OVERRIDE;
  globalRules: string[];
  specificRules: string[];
  priorityOrder: string[];
}

export interface SkillRequirementRule extends BaseRule {
  type: RuleType.SKILL_REQUIREMENT;
  taskId: string;
  requiredSkill: string;
}

export interface PriorityFirstRule extends BaseRule {
  type: RuleType.PRIORITY_FIRST;
  priorityLevel: number;
  scheduling: "first" | "last";
}

export type Rule =
  | CoRunRule
  | SlotRestrictionRule
  | LoadLimitRule
  | PhaseWindowRule
  | PatternMatchRule
  | PrecedenceOverrideRule
  | SkillRequirementRule
  | PriorityFirstRule;

// AI-compatible Business Rule interface
export interface BusinessRule {
  id: string;
  name: string;
  type: string;
  description: string;
  conditions: Record<string, any>;
  isActive: boolean;
}

// Prioritization Types
export interface PrioritizationWeights {
  priorityLevel: number;
  taskFulfillment: number;
  fairnessConstraints: number;
  workloadBalance: number;
  skillUtilization: number;
  phaseOptimization: number;
}

export interface PriorityProfile {
  id: string;
  name: string;
  description: string;
  weights: PrioritizationWeights;
}

// AI Types
export interface AIParsingResult {
  suggestions: ColumnMapping[];
  confidence: number;
  warnings: string[];
}

export interface ColumnMapping {
  originalColumn: string;
  suggestedField: string;
  confidence: number;
  reasoning: string;
}

export interface NaturalLanguageQuery {
  query: string;
  parsedQuery: ParsedQuery;
  results: any[];
}

export interface ParsedQuery {
  entity: "clients" | "workers" | "tasks";
  filters: FilterCondition[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface FilterCondition {
  field: string;
  operator:
    | "equals"
    | "contains"
    | "greater_than"
    | "less_than"
    | "in"
    | "between";
  value: any;
}

export interface AIRuleSuggestion {
  id: string;
  type: RuleType;
  confidence: number;
  reasoning: string;
  suggestedRule: Partial<Rule>;
  affectedEntities: string[];
}

export interface AIValidationSuggestion {
  id: string;
  errorId: string;
  confidence: number;
  suggestedFix: string;
  reasoning: string;
  impact: "low" | "medium" | "high";
}

// UI State Types
export interface DataGridState {
  clients: Client[];
  workers: Worker[];
  tasks: Task[];
  validationErrors: ValidationError[];
  selectedRows: Record<string, boolean>;
  editingCell: { entityType: string; entityId: string; field: string } | null;
}

export interface RuleBuilderState {
  rules: Rule[];
  activeRule: Rule | null;
  ruleTemplates: Record<RuleType, Partial<Rule>>;
}

export interface ExportConfiguration {
  includeValidationReport: boolean;
  includeCleanedData: boolean;
  includeRulesConfig: boolean;
  includePrioritization: boolean;
  format: "csv" | "xlsx" | "json";
}

// File Processing Types
export interface FileProcessingResult {
  clients?: Client[];
  workers?: Worker[];
  tasks?: Task[];
  errors: string[];
  warnings: string[];
  parsingMetadata: {
    rowsProcessed: number;
    columnsDetected: string[];
    dataQualityScore: number;
  };
}

export interface UploadedFile {
  file: File;
  type: "clients" | "workers" | "tasks";
  status: "pending" | "processing" | "completed" | "error";
  result?: FileProcessingResult;
  progress: number;
}

// Search and Filter Types
export interface SearchState {
  query: string;
  entity: "all" | "clients" | "workers" | "tasks";
  filters: FilterCondition[];
  results: SearchResult[];
}

export interface SearchResult {
  entity: "clients" | "workers" | "tasks";
  item: Client | Worker | Task;
  matchedFields: string[];
  relevanceScore: number;
}

// Configuration Types
export interface AppConfiguration {
  aiProviderSettings: {
    apiKey?: string;
    model: string;
    maxTokens: number;
    temperature: number;
  };
  validationSettings: {
    enabledValidators: ValidationErrorType[];
    strictMode: boolean;
    autoFixEnabled: boolean;
  };
  uiSettings: {
    theme: "light" | "dark";
    compactMode: boolean;
    showAdvancedFeatures: boolean;
  };
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ValidationResponse extends ApiResponse {
  data: {
    errors: ValidationError[];
    summary: {
      totalErrors: number;
      errorsByType: Record<ValidationErrorType, number>;
      criticalErrors: number;
      warnings: number;
    };
  };
}

export interface AIProcessingResponse extends ApiResponse {
  data: {
    suggestions: any[];
    confidence: number;
    processingTime: number;
  };
}
