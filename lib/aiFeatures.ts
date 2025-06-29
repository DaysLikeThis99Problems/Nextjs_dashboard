import type {
  AIParsingResult,
  ColumnMapping,
  DataGridState,
  NaturalLanguageQuery,
  AIRuleSuggestion,
  AIValidationSuggestion,
  ValidationError,
  BusinessRule,
} from "@/types";

import { ValidationErrorType, RuleType } from "@/types";

// ========================================
// MILESTONE 1: Natural Language Data Retrieval
// ========================================

export function processNaturalLanguageQuery(
  query: string,
  dataState: DataGridState
): NaturalLanguageQuery {
  const queryLower = query.toLowerCase();

  // Advanced query processing with multiple patterns
  let results: any[] = [];
  let parsedQuery: any = { entity: "clients", filters: [] };

  // High priority patterns
  if (
    queryLower.includes("high priority") ||
    queryLower.includes("priority 5")
  ) {
    parsedQuery = {
      entity: "clients",
      filters: [{ field: "PriorityLevel", operator: "equals", value: 5 }],
    };
    results = dataState.clients.filter((c) => c.PriorityLevel === 5);
  }
  // Worker skill patterns
  else if (queryLower.includes("javascript") && queryLower.includes("worker")) {
    parsedQuery = {
      entity: "workers",
      filters: [{ field: "Skills", operator: "contains", value: "JavaScript" }],
    };
    results = dataState.workers.filter((w) =>
      w.Skills?.some((skill) => skill.toLowerCase().includes("javascript"))
    );
  }
  // React skill patterns
  else if (queryLower.includes("react") && queryLower.includes("worker")) {
    parsedQuery = {
      entity: "workers",
      filters: [{ field: "Skills", operator: "contains", value: "React" }],
    };
    results = dataState.workers.filter((w) =>
      w.Skills?.some((skill) => skill.toLowerCase().includes("react"))
    );
  }
  // Task duration patterns
  else if (
    queryLower.match(/duration.*(\d+)/) ||
    queryLower.match(/(\d+).*phase/)
  ) {
    const match = queryLower.match(/(\d+)/);
    const number = match ? parseInt(match[1]) : 3;
    parsedQuery = {
      entity: "tasks",
      filters: [{ field: "Duration", operator: "greater_than", value: number }],
    };
    results = dataState.tasks.filter((t) => t.Duration > number);
  }
  // Category-based search
  else if (queryLower.includes("frontend") || queryLower.includes("backend")) {
    const category = queryLower.includes("frontend") ? "Frontend" : "Backend";
    parsedQuery = {
      entity: "tasks",
      filters: [{ field: "Category", operator: "equals", value: category }],
    };
    results = dataState.tasks.filter((t) => t.Category?.includes(category));
  }
  // Available workers
  else if (queryLower.includes("available") && queryLower.includes("worker")) {
    parsedQuery = {
      entity: "workers",
      filters: [
        { field: "AvailableSlots", operator: "not_empty", value: null },
      ],
    };
    results = dataState.workers.filter(
      (w) => w.AvailableSlots && w.AvailableSlots.length > 0
    );
  }
  // Client-specific searches
  else if (queryLower.includes("client")) {
    if (queryLower.includes("missing") && queryLower.includes("task")) {
      parsedQuery = {
        entity: "clients",
        filters: [
          { field: "RequestedTaskIDs", operator: "empty", value: null },
        ],
      };
      results = dataState.clients.filter(
        (c) => !c.RequestedTaskIDs || c.RequestedTaskIDs.length === 0
      );
    } else {
      parsedQuery = { entity: "clients", filters: [] };
      results = dataState.clients;
    }
  }
  // Worker-specific searches
  else if (queryLower.includes("worker")) {
    parsedQuery = { entity: "workers", filters: [] };
    results = dataState.workers;
  }
  // Default task search
  else {
    parsedQuery = { entity: "tasks", filters: [] };
    results = dataState.tasks;
  }

  return {
    query,
    parsedQuery,
    results: results.slice(0, 50), // Limit results for performance
  };
}

// ========================================
// MILESTONE 2: Natural Language to Rules Converter
// ========================================

export function convertNaturalLanguageToRule(
  naturalLanguageRule: string
): BusinessRule | null {
  const rule = naturalLanguageRule.toLowerCase().trim();

  // Co-run rules
  if (
    rule.includes("together") ||
    rule.includes("same time") ||
    rule.includes("co-run")
  ) {
    const taskMatches = rule.match(/task[s]?\s*([a-z0-9_\s,]+)/i);
    if (taskMatches) {
      const tasks = taskMatches[1].split(/[,\s]+/).filter((t) => t.length > 0);
      return {
        id: `corun-${Date.now()}`,
        name: `Co-run tasks: ${tasks.join(", ")}`,
        type: "coRun",
        description: `Tasks ${tasks.join(" and ")} must be assigned together`,
        conditions: { tasks },
        isActive: true,
      };
    }
  }

  // Load balancing rules - with skill specification
  if (
    rule.includes("max") &&
    (rule.includes("task") || rule.includes("concurrent"))
  ) {
    const numberMatch = rule.match(/(\d+)/);
    const skillMatch = rule.match(
      /(javascript|react|python|java|css|html|node)/i
    );

    if (numberMatch) {
      const maxTasks = parseInt(numberMatch[1]);
      const skill = skillMatch ? skillMatch[1] : null;

      return {
        id: `load-${Date.now()}`,
        name: skill
          ? `Load limit: ${skill} workers max ${maxTasks} tasks`
          : `Load limit: max ${maxTasks} tasks per worker`,
        type: "loadBalancing",
        description: skill
          ? `Workers with ${skill} skills cannot work on more than ${maxTasks} tasks simultaneously`
          : `Workers cannot work on more than ${maxTasks} tasks simultaneously`,
        conditions: {
          skill: skill,
          maxConcurrentTasks: maxTasks,
        },
        isActive: true,
      };
    }
  }

  // Skill requirement rules
  if (rule.includes("skill") && rule.includes("requir")) {
    const skillMatch = rule.match(
      /(javascript|react|python|java|css|html|node)/i
    );
    const taskMatch = rule.match(/task[s]?\s*([a-z0-9_]+)/i);

    if (skillMatch && taskMatch) {
      return {
        id: `skill-${Date.now()}`,
        name: `Skill requirement: ${taskMatch[1]} needs ${skillMatch[1]}`,
        type: "skillMatching",
        description: `Task ${taskMatch[1]} requires workers with ${skillMatch[1]} skills`,
        conditions: {
          taskId: taskMatch[1],
          requiredSkill: skillMatch[1],
        },
        isActive: true,
      };
    }
  }

  // Phase constraints
  if (
    rule.includes("phase") &&
    (rule.includes("slot") || rule.includes("limit"))
  ) {
    const phaseMatch = rule.match(/phase\s*(\d+)/i);
    const limitMatch = rule.match(/limit\s*(\d+)|max\s*(\d+)/i);

    if (phaseMatch && limitMatch) {
      const phase = parseInt(phaseMatch[1]);
      const limit = parseInt(limitMatch[1] || limitMatch[2]);

      return {
        id: `phase-${Date.now()}`,
        name: `Phase ${phase} slot limit: ${limit}`,
        type: "phaseConstraints",
        description: `Phase ${phase} can have maximum ${limit} concurrent tasks`,
        conditions: {
          phase,
          maxSlots: limit,
        },
        isActive: true,
      };
    }
  }

  // Priority-based rules
  if (rule.includes("priority") && rule.includes("first")) {
    const priorityMatch = rule.match(/priority\s*(\d+)/i);
    if (priorityMatch) {
      const priority = parseInt(priorityMatch[1]);
      return {
        id: `priority-${Date.now()}`,
        name: `Priority ${priority} first`,
        type: "priority",
        description: `Priority ${priority} tasks should be scheduled first`,
        conditions: {
          priorityLevel: priority,
          scheduling: "first",
        },
        isActive: true,
      };
    }
  }

  return null;
}

// ========================================
// MILESTONE 3: Advanced AI Features
// ========================================

// 3.1: Natural Language Data Modification
export function processNaturalLanguageDataModification(
  command: string,
  dataState: DataGridState
): {
  success: boolean;
  changes: any[];
  affectedEntities: string[];
  previewChanges: string[];
} {
  const cmd = command.toLowerCase();
  const changes: any[] = [];
  const affectedEntities: string[] = [];
  const previewChanges: string[] = [];

  // Increase percentage patterns
  if (cmd.includes("increase") && cmd.includes("%")) {
    const percentMatch = cmd.match(/(\d+)%/);
    const percentage = percentMatch ? parseInt(percentMatch[1]) : 0;

    if (cmd.includes("rate") && cmd.includes("senior")) {
      dataState.workers.forEach((worker) => {
        if (
          worker.Skills?.some((skill) => skill.toLowerCase().includes("senior"))
        ) {
          const oldRate = worker.HourlyRate || 50;
          const newRate = Math.round(oldRate * (1 + percentage / 100));
          changes.push({
            entity: "workers",
            id: worker.WorkerID,
            field: "HourlyRate",
            oldValue: oldRate,
            newValue: newRate,
          });
          previewChanges.push(
            `${worker.WorkerName}: ${oldRate} → ${newRate} (${percentage}% increase)`
          );
          affectedEntities.push(worker.WorkerID);
        }
      });
    }
  }

  return {
    success: changes.length > 0,
    changes,
    affectedEntities,
    previewChanges,
  };
}

// 3.2: AI Rule Recommendations
export function generateAIRuleRecommendations(
  dataState: DataGridState
): AIRuleSuggestion[] {
  const suggestions: AIRuleSuggestion[] = [];
  const taskPairs = new Map<string, number>();
  const totalClients = dataState.clients.length;

  // Analyze co-run patterns
  dataState.clients.forEach((client) => {
    if (client.RequestedTaskIDs && client.RequestedTaskIDs.length > 1) {
      for (let i = 0; i < client.RequestedTaskIDs.length; i++) {
        for (let j = i + 1; j < client.RequestedTaskIDs.length; j++) {
          const pair = [client.RequestedTaskIDs[i], client.RequestedTaskIDs[j]]
            .sort()
            .join("-");
          taskPairs.set(pair, (taskPairs.get(pair) || 0) + 1);
        }
      }
    }
  });

  taskPairs.forEach((count, pair) => {
    const frequency = Math.round((count / totalClients) * 100);
    const confidence = Math.min(0.95, frequency / 30);

    if (frequency >= 20) {
      const tasks = pair.split("-");
      suggestions.push({
        id: `ai-corun-${pair}`,
        type: RuleType.CO_RUN,
        confidence,
        reasoning: `Tasks ${tasks.join(
          " and "
        )} appear together in ${frequency}% of client requests`,
        suggestedRule: {
          type: RuleType.CO_RUN,
          name: `Recommended: Co-run ${tasks.join(" + ")}`,
          tasks,
        },
        affectedEntities: tasks,
      });
    }
  });

  return suggestions;
}

// 3.3: AI-Based Error Correction
export function generateAIErrorCorrections(
  validationErrors: ValidationError[]
): AIValidationSuggestion[] {
  return validationErrors
    .filter((error) => error.autoFixable)
    .map((error) => ({
      id: `ai-fix-${error.id}`,
      errorId: error.id,
      confidence: calculateFixConfidence(error),
      suggestedFix: generateIntelligentFix(error),
      reasoning: generateFixReasoning(error),
      impact: assessFixImpact(error),
    }));
}

// 3.4: AI-Based Validator
export function enhancedAIValidation(
  dataState: DataGridState
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Detect anomalies in worker skills
  dataState.workers.forEach((worker) => {
    const skillCount = worker.Skills?.length || 0;
    const avgSkills =
      dataState.workers.reduce((sum, w) => sum + (w.Skills?.length || 0), 0) /
      dataState.workers.length;

    if (skillCount > avgSkills * 2.5) {
      errors.push({
        id: `ai-anomaly-${worker.WorkerID}`,
        type: ValidationErrorType.INCONSISTENT_DATA,
        entity: "workers",
        entityId: worker.WorkerID,
        message: `Worker has unusually high number of skills (${skillCount} vs avg ${Math.round(
          avgSkills
        )})`,
        severity: "warning",
        suggestion: "Verify skill list accuracy",
        autoFixable: false,
      });
    }
  });

  // Context-aware validation for high-priority clients
  dataState.clients.forEach((client) => {
    if (
      client.PriorityLevel === 5 &&
      (!client.RequestedTaskIDs || client.RequestedTaskIDs.length === 0)
    ) {
      errors.push({
        id: `ai-context-priority-${client.ClientID}`,
        type: ValidationErrorType.INCONSISTENT_DATA,
        entity: "clients",
        entityId: client.ClientID,
        message: "High-priority client has no requested tasks",
        severity: "warning",
        suggestion: "Add tasks for high-priority client",
        autoFixable: false,
      });
    }
  });

  return errors;
}

// Helper functions
function calculateFixConfidence(error: ValidationError): number {
  const confidenceMap: Record<string, number> = {
    [ValidationErrorType.OUT_OF_RANGE]: 0.95,
    [ValidationErrorType.BROKEN_JSON]: 0.85,
    [ValidationErrorType.MALFORMED_LIST]: 0.9,
    [ValidationErrorType.DUPLICATE_ID]: 0.7,
    [ValidationErrorType.UNKNOWN_REFERENCE]: 0.6,
  };
  return confidenceMap[error.type] || 0.7;
}

function generateIntelligentFix(error: ValidationError): string {
  switch (error.type) {
    case ValidationErrorType.OUT_OF_RANGE:
      if (error.field === "PriorityLevel") {
        return "Set priority level to 3 (medium priority)";
      }
      return "Adjust value to valid range";
    case ValidationErrorType.BROKEN_JSON:
      return "Convert to valid JSON format: {}";
    case ValidationErrorType.MALFORMED_LIST:
      return "Convert to properly formatted array";
    default:
      return "Apply recommended correction";
  }
}

function generateFixReasoning(error: ValidationError): string {
  switch (error.type) {
    case ValidationErrorType.OUT_OF_RANGE:
      return "Value falls outside acceptable range based on business rules";
    case ValidationErrorType.BROKEN_JSON:
      return "JSON parsing failed, suggesting structural issues";
    case ValidationErrorType.MALFORMED_LIST:
      return "List format doesn't match expected structure";
    default:
      return "Standard validation rule violation detected";
  }
}

function assessFixImpact(error: ValidationError): "low" | "medium" | "high" {
  const highImpactTypes = [
    ValidationErrorType.DUPLICATE_ID,
    ValidationErrorType.UNKNOWN_REFERENCE,
  ];
  const mediumImpactTypes = [
    ValidationErrorType.OUT_OF_RANGE,
    ValidationErrorType.BROKEN_JSON,
  ];

  if (highImpactTypes.includes(error.type)) return "high";
  if (mediumImpactTypes.includes(error.type)) return "medium";
  return "low";
}

// ========================================
// COLUMN MAPPING FUNCTIONALITY
// ========================================

export async function aiColumnMapper(
  detectedColumns: string[],
  entityType: "clients" | "workers" | "tasks"
): Promise<AIParsingResult> {
  const expectedColumns = getExpectedColumns(entityType);
  const requiredColumns = getRequiredColumns(entityType);
  const mappings: ColumnMapping[] = [];
  const unmapped: string[] = [];
  const confidence = 0.85;

  // Map detected columns to expected columns
  detectedColumns.forEach((detectedCol) => {
    const match = findBestColumnMatch(detectedCol, expectedColumns);
    if (match && match.confidence > 0.6) {
      mappings.push({
        originalColumn: detectedCol,
        suggestedField: match.field,
        confidence: match.confidence,
        reasoning: match.reasoning,
      });
    } else {
      unmapped.push(detectedCol);
    }
  });

  // Check for missing required columns
  const mappedFields = mappings.map((m) => m.suggestedField);
  const missingRequired = requiredColumns.filter(
    (req) => !mappedFields.includes(req)
  );

  return {
    suggestions: [
      ...mappings,
      ...missingRequired.map((field) => ({
        originalColumn: "",
        suggestedField: field,
        confidence: 0.0,
        reasoning: `Missing required field: ${field}`,
      })),
    ],
    confidence,
    warnings: unmapped.map((col) => `Column '${col}' could not be mapped`),
  };
}

function getExpectedColumns(entityType: string): string[] {
  switch (entityType) {
    case "clients":
      return [
        "ClientID",
        "ClientName",
        "PriorityLevel",
        "RequestedTaskIDs",
        "Budget",
        "Deadline",
        "ContactEmail",
        "ProjectDescription",
        "SpecialRequirements",
      ];
    case "workers":
      return [
        "WorkerID",
        "WorkerName",
        "Skills",
        "HourlyRate",
        "AvailableSlots",
        "ExperienceLevel",
        "Location",
        "MaxHoursPerWeek",
        "Certifications",
      ];
    case "tasks":
      return [
        "TaskID",
        "TaskName",
        "Category",
        "Duration",
        "RequiredSkills",
        "Priority",
        "Phase",
        "Dependencies",
        "EstimatedCost",
        "Complexity",
      ];
    default:
      return [];
  }
}

function getRequiredColumns(entityType: string): string[] {
  switch (entityType) {
    case "clients":
      return ["ClientID", "ClientName", "PriorityLevel"];
    case "workers":
      return ["WorkerID", "WorkerName", "Skills"];
    case "tasks":
      return ["TaskID", "TaskName", "Category"];
    default:
      return [];
  }
}

function findBestColumnMatch(
  detectedCol: string,
  expectedColumns: string[]
): {
  field: string;
  confidence: number;
  reasoning: string;
} | null {
  const detectedLower = detectedCol.toLowerCase().replace(/[_\s-]/g, "");
  let bestMatch = null;
  let highestScore = 0;

  expectedColumns.forEach((expected) => {
    const expectedLower = expected.toLowerCase().replace(/[_\s-]/g, "");

    // Exact match
    if (detectedLower === expectedLower) {
      return {
        field: expected,
        confidence: 1.0,
        reasoning: "Exact match",
      };
    }

    // Check aliases
    const aliases = getColumnAliases(expected);
    const aliasMatch = aliases.find(
      (alias) => alias.toLowerCase().replace(/[_\s-]/g, "") === detectedLower
    );

    if (aliasMatch) {
      return {
        field: expected,
        confidence: 0.95,
        reasoning: `Matches known alias: ${aliasMatch}`,
      };
    }

    // Similarity-based matching
    const similarity = calculateStringSimilarity(detectedLower, expectedLower);
    if (similarity > highestScore && similarity > 0.6) {
      highestScore = similarity;
      bestMatch = {
        field: expected,
        confidence: similarity,
        reasoning: `Similar to ${expected} (${Math.round(
          similarity * 100
        )}% match)`,
      };
    }

    // Substring matching
    if (
      detectedLower.includes(expectedLower) ||
      expectedLower.includes(detectedLower)
    ) {
      const score = 0.8;
      if (score > highestScore) {
        highestScore = score;
        bestMatch = {
          field: expected,
          confidence: score,
          reasoning: `Partial match with ${expected}`,
        };
      }
    }
  });

  return bestMatch;
}

function getColumnAliases(columnName: string): string[] {
  const aliasMap: Record<string, string[]> = {
    ClientID: ["client_id", "id", "clientid", "customer_id", "cid"],
    ClientName: [
      "client_name",
      "name",
      "clientname",
      "customer_name",
      "company",
    ],
    PriorityLevel: [
      "priority",
      "priority_level",
      "prio",
      "importance",
      "urgency",
    ],
    RequestedTaskIDs: ["tasks", "task_ids", "requested_tasks", "task_list"],
    WorkerID: ["worker_id", "id", "workerid", "employee_id", "wid"],
    WorkerName: [
      "worker_name",
      "name",
      "workername",
      "employee_name",
      "full_name",
    ],
    Skills: ["skills", "skill_set", "abilities", "expertise", "technologies"],
    HourlyRate: ["rate", "hourly_rate", "cost", "price", "wage"],
    AvailableSlots: [
      "availability",
      "available_slots",
      "schedule",
      "time_slots",
    ],
    TaskID: ["task_id", "id", "taskid", "tid"],
    TaskName: ["task_name", "name", "taskname", "title", "description"],
    Category: ["category", "type", "kind", "classification"],
    Duration: ["duration", "time", "hours", "estimate", "length"],
    RequiredSkills: [
      "required_skills",
      "skills",
      "requirements",
      "needed_skills",
    ],
  };

  return aliasMap[columnName] || [];
}

function calculateStringSimilarity(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  return maxLength === 0 ? 1 : 1 - distance / maxLength;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + cost
      );
    }
  }

  return matrix[str2.length][str1.length];
}
