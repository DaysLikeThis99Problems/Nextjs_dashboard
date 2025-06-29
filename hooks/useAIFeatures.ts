import { useState, useCallback } from "react";
import type {
  DataGridState,
  NaturalLanguageQuery,
  AIRuleSuggestion,
  AIValidationSuggestion,
  ValidationError,
  BusinessRule,
} from "@/types";
import {
  processNaturalLanguageQuery as processQuery,
  convertNaturalLanguageToRule,
  processNaturalLanguageDataModification,
  generateAIRuleRecommendations,
  generateAIErrorCorrections,
  enhancedAIValidation,
} from "@/lib/aiFeatures";

export function useAIFeatures() {
  const [isProcessing, setIsProcessing] = useState(false);

  const processNaturalLanguageQuery = useCallback(
    async (
      query: string,
      dataState: DataGridState
    ): Promise<NaturalLanguageQuery> => {
      setIsProcessing(true);

      try {
        // Simulate processing delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Use enhanced AI processing
        return processQuery(query, dataState);
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  const generateRuleSuggestions = useCallback(
    async (dataState: DataGridState): Promise<AIRuleSuggestion[]> => {
      setIsProcessing(true);

      try {
        // Simulate processing delay
        await new Promise((resolve) => setTimeout(resolve, 600));

        return generateAIRuleRecommendations(dataState);
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  const getDataCorrections = useCallback(
    async (validationErrors: any[]): Promise<AIValidationSuggestion[]> => {
      setIsProcessing(true);

      try {
        // Simulate processing delay
        await new Promise((resolve) => setTimeout(resolve, 400));

        return generateAIErrorCorrections(validationErrors);
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  // New AI features for Milestone 3
  const convertTextToRule = useCallback(
    async (naturalLanguageRule: string): Promise<BusinessRule | null> => {
      setIsProcessing(true);

      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return convertNaturalLanguageToRule(naturalLanguageRule);
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  const processDataModification = useCallback(
    async (command: string, dataState: DataGridState) => {
      setIsProcessing(true);

      try {
        await new Promise((resolve) => setTimeout(resolve, 600));
        return processNaturalLanguageDataModification(command, dataState);
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  const performAIValidation = useCallback(
    async (dataState: DataGridState): Promise<ValidationError[]> => {
      setIsProcessing(true);

      try {
        await new Promise((resolve) => setTimeout(resolve, 700));
        return enhancedAIValidation(dataState);
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  return {
    isProcessing,
    processNaturalLanguageQuery,
    generateRuleSuggestions,
    getDataCorrections,
    // Milestone 2 & 3 features
    convertTextToRule,
    processDataModification,
    performAIValidation,
  };
}

// Mock functions - in real implementation, these would call actual AI services

function mockNaturalLanguageSearch(query: string, dataState: DataGridState) {
  const queryLower = query.toLowerCase();

  // Simple keyword matching for demo
  if (
    queryLower.includes("high priority") ||
    queryLower.includes("priority 5")
  ) {
    return {
      parsedQuery: {
        entity: "clients" as const,
        filters: [
          { field: "PriorityLevel", operator: "equals" as const, value: 5 },
        ],
      },
      data: dataState.clients.filter((c) => c.PriorityLevel === 5),
    };
  }

  if (queryLower.includes("javascript") && queryLower.includes("workers")) {
    return {
      parsedQuery: {
        entity: "workers" as const,
        filters: [
          {
            field: "Skills",
            operator: "contains" as const,
            value: "JavaScript",
          },
        ],
      },
      data: dataState.workers.filter(
        (w) =>
          w.Skills &&
          w.Skills.some((skill) => skill.toLowerCase().includes("javascript"))
      ),
    };
  }

  if (queryLower.includes("duration") && queryLower.includes("3")) {
    return {
      parsedQuery: {
        entity: "tasks" as const,
        filters: [
          { field: "Duration", operator: "greater_than" as const, value: 3 },
        ],
      },
      data: dataState.tasks.filter((t) => t.Duration > 3),
    };
  }

  // Default: return all data from the most relevant entity
  if (queryLower.includes("client")) {
    return {
      parsedQuery: { entity: "clients" as const, filters: [] },
      data: dataState.clients,
    };
  }

  if (queryLower.includes("worker")) {
    return {
      parsedQuery: { entity: "workers" as const, filters: [] },
      data: dataState.workers,
    };
  }

  return {
    parsedQuery: { entity: "tasks" as const, filters: [] },
    data: dataState.tasks,
  };
}

function mockRuleSuggestions(dataState: DataGridState): AIRuleSuggestion[] {
  const suggestions: AIRuleSuggestion[] = [];

  // Look for co-run patterns (tasks frequently requested together)
  const taskPairs = new Map<string, number>();
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

  // Suggest co-run rules for frequently paired tasks
  taskPairs.forEach((count, pair) => {
    if (count >= 2) {
      const [task1, task2] = pair.split("-");
      suggestions.push({
        id: `corun-${pair}`,
        type: "coRun" as any,
        confidence: Math.min(0.9, count * 0.2),
        reasoning: `Tasks ${task1} and ${task2} are requested together by ${count} clients`,
        suggestedRule: {
          type: "coRun" as any,
          name: `Co-run ${task1} and ${task2}`,
          tasks: [task1, task2],
        },
        affectedEntities: [task1, task2],
      });
    }
  });

  // Look for overloaded worker groups
  const groupLoads = new Map<string, number>();
  dataState.workers.forEach((worker) => {
    const load = worker.AvailableSlots?.length || 0;
    groupLoads.set(
      worker.WorkerGroup,
      (groupLoads.get(worker.WorkerGroup) || 0) + load
    );
  });

  // Suggest load limits for groups with high capacity
  groupLoads.forEach((totalLoad, group) => {
    if (totalLoad > 10) {
      suggestions.push({
        id: `load-limit-${group}`,
        type: "loadLimit" as any,
        confidence: 0.75,
        reasoning: `${group} group has high total capacity (${totalLoad} slots)`,
        suggestedRule: {
          type: "loadLimit" as any,
          name: `Load limit for ${group}`,
          workerGroup: group,
          maxSlotsPerPhase: Math.ceil(totalLoad / 2),
        },
        affectedEntities: dataState.workers
          .filter((w) => w.WorkerGroup === group)
          .map((w) => w.WorkerID),
      });
    }
  });

  return suggestions;
}

function mockDataCorrections(
  validationErrors: any[]
): AIValidationSuggestion[] {
  return validationErrors.map((error) => ({
    id: `ai-fix-${error.id}`,
    errorId: error.id,
    suggestedFix: generateMockFix(error),
    confidence: 0.8,
    reasoning: `AI analysis suggests this fix based on data patterns`,
    impact: error.severity === "error" ? "high" : "medium",
  }));
}

function generateMockFix(error: any): string {
  switch (error.type) {
    case "out_of_range":
      if (error.field === "PriorityLevel") {
        return "Set to priority level 3 (medium priority)";
      }
      if (error.field === "Duration") {
        return "Set duration to 1 phase (minimum)";
      }
      break;
    case "malformed_list":
      return "Parse and validate array format, remove invalid entries";
    case "broken_json":
      return "Fix JSON syntax or reset to empty object {}";
    default:
      return "Review and correct the data manually";
  }
  return "AI suggests manual review of this field";
}
