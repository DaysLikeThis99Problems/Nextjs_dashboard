"use client";

import { useState } from "react";
import { Settings, Plus, Trash2, Edit, Save, Sparkles } from "lucide-react";
import type { DataGridState, Rule } from "@/types";
import { RuleType } from "@/types";
import { convertNaturalLanguageToRule } from "@/lib/aiFeatures";

interface RuleBuilderSectionProps {
  dataState: DataGridState;
}

export default function RuleBuilderSection({
  dataState,
}: RuleBuilderSectionProps) {
  const [activeRuleType, setActiveRuleType] = useState<RuleType>(
    RuleType.CO_RUN
  );
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [rules, setRules] = useState<Rule[]>([]);
  const [naturalLanguageRule, setNaturalLanguageRule] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const ruleTypes = [
    {
      type: RuleType.CO_RUN,
      label: "Co-run Tasks",
      description: "Tasks that must run together",
    },
    {
      type: RuleType.SLOT_RESTRICTION,
      label: "Slot Restrictions",
      description: "Limit worker availability",
    },
    {
      type: RuleType.LOAD_LIMIT,
      label: "Load Limits",
      description: "Maximum workload per worker group",
    },
    {
      type: RuleType.PHASE_WINDOW,
      label: "Phase Windows",
      description: "Restrict tasks to specific phases",
    },
  ];

  const handleCreateRule = () => {
    const newRule: Partial<Rule> = {
      id: `rule-${Date.now()}`,
      type: activeRuleType,
      name: `New ${activeRuleType} Rule`,
      enabled: true,
      priority: 1,
    };
    setRules((prev) => [...prev, newRule as Rule]);
    setShowCreateForm(false);
  };

  const handleGenerateRule = async () => {
    if (!naturalLanguageRule.trim()) return;

    setIsGenerating(true);
    try {
      const generatedRule = convertNaturalLanguageToRule(
        naturalLanguageRule.trim()
      );

      if (generatedRule) {
        const newRule: Rule = {
          id: generatedRule.id,
          type:
            generatedRule.type === "coRun"
              ? RuleType.CO_RUN
              : generatedRule.type === "loadBalancing"
              ? RuleType.LOAD_LIMIT
              : generatedRule.type === "skillMatching"
              ? RuleType.SKILL_REQUIREMENT
              : generatedRule.type === "phaseConstraints"
              ? RuleType.PHASE_WINDOW
              : generatedRule.type === "priority"
              ? RuleType.PRIORITY_FIRST
              : RuleType.CO_RUN,
          name: generatedRule.name,
          enabled: generatedRule.isActive,
          priority: 1,
          description: generatedRule.description,
          // Map conditions to specific rule properties
          ...(generatedRule.type === "loadBalancing" && {
            workerGroup: generatedRule.conditions?.skill || "default",
            maxSlotsPerPhase: generatedRule.conditions?.maxConcurrentTasks || 1,
          }),
          ...(generatedRule.type === "skillMatching" && {
            taskId: generatedRule.conditions?.taskId || "",
            requiredSkill: generatedRule.conditions?.requiredSkill || "",
          }),
          ...(generatedRule.type === "phaseConstraints" && {
            taskId: generatedRule.conditions?.taskId || "",
            allowedPhases: [generatedRule.conditions?.phase || 1],
          }),
          ...(generatedRule.type === "priority" && {
            priorityLevel: generatedRule.conditions?.priorityLevel || 1,
            scheduling: generatedRule.conditions?.scheduling || "first",
          }),
          ...(generatedRule.type === "coRun" && {
            tasks: generatedRule.conditions?.tasks || [],
          }),
        } as Rule;

        setRules((prev) => [...prev, newRule]);
        setNaturalLanguageRule("");

        // Show success message or visual feedback
        console.log("Generated rule:", newRule);
      } else {
        console.warn(
          "Could not parse the natural language rule. Please try rephrasing."
        );
      }
    } catch (error) {
      console.error("Error generating rule:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const CoRunRuleForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rule Name
        </label>
        <input
          type="text"
          placeholder="e.g., Frontend-Backend Co-run"
          className="input-field"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Tasks
        </label>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {dataState.tasks.map((task) => (
            <label key={task.TaskID} className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" />
              <span className="text-sm">
                {task.TaskID} - {task.TaskName}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const SlotRestrictionForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Target Group
        </label>
        <select className="input-field">
          <option>Select a group...</option>
          {Array.from(new Set(dataState.workers.map((w) => w.WorkerGroup))).map(
            (group) => (
              <option key={group} value={group}>
                {group}
              </option>
            )
          )}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Minimum Common Slots
        </label>
        <input type="number" min="1" placeholder="2" className="input-field" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Business Rules</h2>
          <p className="text-gray-600">
            Define constraints and requirements for task allocation
          </p>
        </div>

        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Rule</span>
        </button>
      </div>

      {/* Rule Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {ruleTypes.map((ruleType) => (
          <button
            key={ruleType.type}
            onClick={() => setActiveRuleType(ruleType.type)}
            className={`p-4 rounded-lg border text-left transition-all ${
              activeRuleType === ruleType.type
                ? "border-primary-300 bg-primary-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <h3 className="font-medium text-gray-900 mb-1">{ruleType.label}</h3>
            <p className="text-sm text-gray-600">{ruleType.description}</p>
          </button>
        ))}
      </div>

      {/* Create Rule Form */}
      {showCreateForm && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Create {ruleTypes.find((rt) => rt.type === activeRuleType)?.label}
            </h3>
            <button
              onClick={() => setShowCreateForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          {activeRuleType === RuleType.CO_RUN && <CoRunRuleForm />}
          {activeRuleType === RuleType.SLOT_RESTRICTION && (
            <SlotRestrictionForm />
          )}

          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
            <button
              onClick={() => setShowCreateForm(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button onClick={handleCreateRule} className="btn-primary">
              Create Rule
            </button>
          </div>
        </div>
      )}

      {/* Existing Rules */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Existing Rules</h3>

        {rules.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No rules created yet</p>
            <p className="text-sm text-gray-500">
              Create your first business rule to get started
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map((rule) => (
              <div key={rule.id} className="card-hover">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{rule.name}</h4>
                    <p className="text-sm text-gray-600">{rule.type}</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        rule.enabled
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {rule.enabled ? "Active" : "Inactive"}
                    </span>

                    <button className="text-gray-400 hover:text-gray-600">
                      <Edit className="w-4 h-4" />
                    </button>

                    <button className="text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Natural Language Rule Input */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            AI Rule Creator
          </h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Describe your business rule in plain English, and AI will create it
          for you.
        </p>

        <div className="space-y-4">
          <textarea
            value={naturalLanguageRule}
            onChange={(e) => setNaturalLanguageRule(e.target.value)}
            placeholder="e.g., Tasks T001 and T002 should run together&#10;JavaScript workers can work on max 2 tasks&#10;Task T003 requires React skill&#10;Priority 5 clients should be scheduled first"
            className="input-field h-24 resize-none"
            disabled={isGenerating}
          />

          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={() =>
                setNaturalLanguageRule(
                  "Tasks T001 and T002 should run together"
                )
              }
              className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 px-2 py-1 rounded-full transition-colors"
            >
              Co-run Example
            </button>
            <button
              onClick={() =>
                setNaturalLanguageRule(
                  "JavaScript workers can work on max 2 tasks"
                )
              }
              className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 px-2 py-1 rounded-full transition-colors"
            >
              Load Limit Example
            </button>
            <button
              onClick={() =>
                setNaturalLanguageRule("Task T001 requires React skill")
              }
              className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 px-2 py-1 rounded-full transition-colors"
            >
              Skill Requirement
            </button>
            <button
              onClick={() =>
                setNaturalLanguageRule(
                  "Priority 5 tasks should be scheduled first"
                )
              }
              className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 px-2 py-1 rounded-full transition-colors"
            >
              Priority Rule
            </button>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleGenerateRule}
              disabled={!naturalLanguageRule.trim() || isGenerating}
              className="btn-accent flex items-center space-x-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Rule</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
