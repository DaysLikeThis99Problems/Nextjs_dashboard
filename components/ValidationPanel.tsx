"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle, AlertCircle, X, Zap } from "lucide-react";
import type { ValidationError } from "@/types";

interface ValidationPanelProps {
  validationErrors: ValidationError[];
  summary: any;
  onErrorFix: (errorId: string) => void;
  onRevalidate: () => void;
}

export default function ValidationPanel({
  validationErrors,
  summary,
  onErrorFix,
  onRevalidate,
}: ValidationPanelProps) {
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());

  const toggleError = (errorId: string) => {
    const newExpanded = new Set(expandedErrors);
    if (newExpanded.has(errorId)) {
      newExpanded.delete(errorId);
    } else {
      newExpanded.add(errorId);
    }
    setExpandedErrors(newExpanded);
  };

  const criticalErrors = validationErrors.filter((e) => e.severity === "error");
  const warnings = validationErrors.filter((e) => e.severity === "warning");

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Validation Status
        </h3>
        <button onClick={onRevalidate} className="btn-secondary text-sm">
          Re-check
        </button>
      </div>

      {/* Summary */}
      <div className="space-y-3 mb-6">
        <div
          className={`p-3 rounded-lg ${
            criticalErrors.length === 0
              ? "validation-success"
              : "validation-error"
          }`}
        >
          <div className="flex items-center space-x-2">
            {criticalErrors.length === 0 ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600" />
            )}
            <span className="font-medium">
              {criticalErrors.length === 0
                ? "All validations passed!"
                : `${criticalErrors.length} critical error${
                    criticalErrors.length !== 1 ? "s" : ""
                  }`}
            </span>
          </div>
        </div>

        {warnings.length > 0 && (
          <div className="validation-warning p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <span className="font-medium">
                {warnings.length} warning{warnings.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Error List */}
      {validationErrors.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Issues Found:</h4>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {validationErrors.map((error) => (
              <div key={error.id} className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleError(error.id)}
                  className="w-full p-3 text-left hover:bg-gray-50 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2">
                      {error.severity === "error" ? (
                        <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {error.entity} • {error.entityId}
                        </p>
                        <p className="text-sm text-gray-600">{error.message}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">
                      {expandedErrors.has(error.id) ? "−" : "+"}
                    </span>
                  </div>
                </button>

                {expandedErrors.has(error.id) && (
                  <div className="px-3 pb-3 border-t border-gray-100">
                    <div className="pt-2 space-y-2">
                      <div className="text-xs text-gray-500">
                        <strong>Type:</strong> {error.type}
                      </div>
                      {error.field && (
                        <div className="text-xs text-gray-500">
                          <strong>Field:</strong> {error.field}
                        </div>
                      )}
                      {error.suggestion && (
                        <div className="text-xs text-green-600">
                          <strong>Suggestion:</strong> {error.suggestion}
                        </div>
                      )}
                      <div className="flex items-center space-x-2 pt-2">
                        {error.autoFixable && (
                          <button
                            onClick={() => onErrorFix(error.id)}
                            className="flex items-center space-x-1 text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded"
                          >
                            <Zap className="w-3 h-3" />
                            <span>Auto-fix</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {validationErrors.length === 0 && (
        <div className="text-center py-6">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
          <p className="text-gray-600">No validation issues found!</p>
        </div>
      )}
    </div>
  );
}
