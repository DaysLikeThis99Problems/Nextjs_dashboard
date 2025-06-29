"use client";

import { useState, useEffect, useRef } from "react";
import { Save, X, AlertCircle } from "lucide-react";

interface EditableCellProps {
  value: any;
  type?: "text" | "number" | "array" | "json";
  editable?: boolean;
  isEditing?: boolean;
  hasError?: boolean;
  onEdit?: () => void;
  onSave?: (value: any) => void;
  onCancel?: () => void;
  placeholder?: string;
  className?: string;
}

export default function EditableCell({
  value,
  type = "text",
  editable = true,
  isEditing = false,
  hasError = false,
  onEdit,
  onSave,
  onCancel,
  placeholder = "Click to edit",
  className = "",
}: EditableCellProps) {
  const [editValue, setEditValue] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select();
      }
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(formatDisplayValue(value));
    setValidationError(null);
  }, [value, isEditing]);

  const formatDisplayValue = (val: any) => {
    if (val === null || val === undefined) return "";
    if (Array.isArray(val)) return val.join(", ");
    if (typeof val === "object") return JSON.stringify(val);
    return String(val);
  };

  const validateValue = (val: string): string | null => {
    if (!val.trim() && type !== "text") return null; // Allow empty values
    
    if (type === "number") {
      const num = parseFloat(val);
      if (isNaN(num)) return "Invalid number";
    } else if (type === "json") {
      try {
        JSON.parse(val);
      } catch {
        return "Invalid JSON format";
      }
    }
    return null;
  };

  const processValue = (val: string) => {
    if (!val.trim()) return "";
    
    switch (type) {
      case "number":
        return parseFloat(val) || 0;
      case "array":
        return val.split(",").map(item => item.trim()).filter(item => item);
      case "json":
        try {
          return JSON.parse(val);
        } catch {
          return val;
        }
      default:
        return val;
    }
  };

  const handleSave = () => {
    const error = validateValue(editValue);
    if (error) {
      setValidationError(error);
      return;
    }

    const processedValue = processValue(editValue);
    setValidationError(null);
    onSave?.(processedValue);
  };

  const handleCancel = () => {
    setEditValue(formatDisplayValue(value));
    setValidationError(null);
    onCancel?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (!isEditing) {
    return (
      <div
        className={`${
          editable ? "cursor-pointer hover:bg-blue-50 rounded px-2 py-1" : ""
        } transition-colors ${className} ${hasError ? "text-red-600" : ""}`}
        onClick={() => editable && onEdit?.()}
      >
        <span className="truncate">
          {formatDisplayValue(value) || (
            <span className="text-gray-400 italic">{placeholder}</span>
          )}
        </span>
        {hasError && <AlertCircle className="w-4 h-4 text-red-500 ml-2 inline" />}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg p-2">
      <div className="flex-1">
        {type === "json" || (type === "array" && editValue.length > 20) ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={editValue}
            onChange={(e) => {
              setEditValue(e.target.value);
              setValidationError(null);
            }}
            onKeyDown={handleKeyDown}
            className={`w-full px-2 py-1 text-sm border rounded resize-none focus:outline-none focus:ring-1 ${
              validationError
                ? "border-red-300 focus:ring-red-500 bg-red-50"
                : "border-blue-300 focus:ring-blue-500 bg-white"
            }`}
            rows={3}
            placeholder={`Enter ${type === "json" ? "JSON" : "comma-separated values"}...`}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type={type === "number" ? "number" : "text"}
            value={editValue}
            onChange={(e) => {
              setEditValue(e.target.value);
              setValidationError(null);
            }}
            onKeyDown={handleKeyDown}
            className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 ${
              validationError
                ? "border-red-300 focus:ring-red-500 bg-red-50"
                : "border-blue-300 focus:ring-blue-500 bg-white"
            }`}
            placeholder={
              type === "array"
                ? "Enter comma-separated values..."
                : type === "number"
                ? "Enter number..."
                : "Enter text..."
            }
          />
        )}

        {validationError && (
          <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
            <AlertCircle className="w-3 h-3" />
            <span>{validationError}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={handleSave}
          disabled={!!validationError}
          className={`p-1 rounded transition-colors ${
            validationError
              ? "text-gray-400 cursor-not-allowed"
              : "text-green-600 hover:text-green-700 hover:bg-green-100"
          }`}
          title="Save (Enter)"
        >
          <Save className="w-3 h-3" />
        </button>

        <button
          onClick={handleCancel}
          className="p-1 text-red-600 hover:text-red-700 hover:bg-red-100 rounded transition-colors"
          title="Cancel (Escape)"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
