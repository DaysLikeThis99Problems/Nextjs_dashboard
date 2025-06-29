"use client";

import { useState } from "react";
import { AlertTriangle, AlertCircle, Info, Zap } from "lucide-react";
import type { ValidationError } from "@/types";

interface ValidationTooltipProps {
  errors: ValidationError[];
  onFix?: (errorId: string) => void;
}

export default function ValidationTooltip({
  errors,
  onFix,
}: ValidationTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (errors.length === 0) return null;

  const criticalErrors = errors.filter((e) => e.severity === "error");
  const warnings = errors.filter((e) => e.severity === "warning");

  return (
    <div className="relative">
      <button
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-5 h-5 rounded-full hover:bg-gray-100"
      >
        {criticalErrors.length > 0 ? (
          <AlertTriangle className="w-4 h-4 text-red-500" />
        ) : (
          <AlertCircle className="w-4 h-4 text-yellow-500" />
        )}
      </button>

      {isOpen && (
        <div className="absolute z-50 top-6 left-0 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <div className="space-y-3">
            {errors.map((error) => (
              <div key={error.id} className="space-y-2">
                <div className="flex items-start space-x-2">
                  {error.severity === "error" ? (
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {error.message}
                    </p>

                    <div className="text-xs text-gray-500 mt-1 space-y-1">
                      <div>
                        <strong>Type:</strong> {error.type.replace(/_/g, " ")}
                      </div>
                      {error.field && (
                        <div>
                          <strong>Field:</strong> {error.field}
                        </div>
                      )}
                    </div>

                    {error.suggestion && (
                      <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
                        <div className="flex items-start space-x-1">
                          <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>{error.suggestion}</span>
                        </div>
                      </div>
                    )}

                    {error.autoFixable && onFix && (
                      <div className="mt-2">
                        <button
                          onClick={() => onFix(error.id)}
                          className="flex items-center space-x-1 text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded hover:bg-primary-200 transition-colors"
                        >
                          <Zap className="w-3 h-3" />
                          <span>Auto-fix</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {error !== errors[errors.length - 1] && (
                  <div className="border-t border-gray-100" />
                )}
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
            {criticalErrors.length > 0 && (
              <div className="text-red-600">
                {criticalErrors.length} error
                {criticalErrors.length !== 1 ? "s" : ""}
              </div>
            )}
            {warnings.length > 0 && (
              <div className="text-yellow-600">
                {warnings.length} warning{warnings.length !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
