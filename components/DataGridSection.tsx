"use client";

import { useState, useMemo } from "react";
import {
  Table,
  AlertTriangle,
  Search,
  Edit3,
  Save,
  X,
  Plus,
  Trash2,
  MoreVertical,
  Download,
  RotateCcw,
} from "lucide-react";
import type { DataGridState, ValidationError } from "@/types";

interface DataGridSectionProps {
  dataState: DataGridState;
  validationErrors: ValidationError[];
  onDataUpdate?: (
    entityType: "clients" | "workers" | "tasks",
    entityId: string,
    field: string,
    value: any
  ) => void;
  onValidationRun?: () => void;
  onValidationFix?: (errorId: string) => void;
  onDeleteRow?: (
    entityType: "clients" | "workers" | "tasks",
    entityId: string
  ) => void;
  onDeleteColumn?: (
    entityType: "clients" | "workers" | "tasks",
    columnKey: string
  ) => void;
}

export default function DataGridSection({
  dataState,
  validationErrors,
  onDataUpdate,
  onValidationRun,
  onValidationFix,
  onDeleteRow,
  onDeleteColumn,
}: DataGridSectionProps) {
  const [activeEntity, setActiveEntity] = useState<
    "clients" | "workers" | "tasks"
  >("clients");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showColumnMenu, setShowColumnMenu] = useState<string | null>(null);

  // Default handlers
  const handleDataUpdate =
    onDataUpdate ||
    ((entityType: any, entityId: string, field: string, value: any) => {
      console.log(`Update ${entityType}.${entityId}.${field} = ${value}`);
    });

  const handleDeleteRow =
    onDeleteRow ||
    ((entityType: any, entityId: string) => {
      console.log(`Delete row ${entityType}.${entityId}`);
    });

  const handleDeleteColumn =
    onDeleteColumn ||
    ((entityType: any, columnKey: string) => {
      console.log(`Delete column ${entityType}.${columnKey}`);
    });

  const entityErrors = useMemo(() => {
    return validationErrors.filter((error) => error.entity === activeEntity);
  }, [validationErrors, activeEntity]);

  const filteredData = useMemo(() => {
    let data: any[] = dataState[activeEntity] as any[];
    if (searchTerm) {
      data = data.filter((item) => {
        return Object.values(item).some((value) => {
          return String(value).toLowerCase().includes(searchTerm.toLowerCase());
        });
      });
    }
    return data;
  }, [dataState, activeEntity, searchTerm]);

  const getEntityId = (entity: any): string => {
    return entity.ClientID || entity.WorkerID || entity.TaskID || "";
  };

  const getColumns = (entityType: string) => {
    switch (entityType) {
      case "clients":
        return [
          { key: "ClientID", label: "ID", editable: true, type: "text" },
          { key: "Name", label: "Name", editable: true, type: "text" },
          {
            key: "PriorityLevel",
            label: "Priority",
            editable: true,
            type: "number",
          },
          {
            key: "RequestedTaskIDs",
            label: "Tasks",
            editable: true,
            type: "array",
          },
          { key: "GroupTag", label: "Group", editable: true, type: "text" },
          {
            key: "AttributesJSON",
            label: "Attributes",
            editable: true,
            type: "json",
          },
        ];
      case "workers":
        return [
          { key: "WorkerID", label: "ID", editable: true, type: "text" },
          { key: "Name", label: "Name", editable: true, type: "text" },
          { key: "Skills", label: "Skills", editable: true, type: "array" },
          {
            key: "AvailableSlots",
            label: "Slots",
            editable: true,
            type: "array",
          },
          {
            key: "MaxLoadPerPhase",
            label: "Max Load",
            editable: true,
            type: "number",
          },
          { key: "WorkerGroup", label: "Group", editable: true, type: "text" },
          { key: "HourlyRate", label: "Rate", editable: true, type: "number" },
        ];
      case "tasks":
        return [
          { key: "TaskID", label: "ID", editable: true, type: "text" },
          { key: "Name", label: "Name", editable: true, type: "text" },
          { key: "Category", label: "Category", editable: true, type: "text" },
          {
            key: "Duration",
            label: "Duration",
            editable: true,
            type: "number",
          },
          {
            key: "RequiredSkills",
            label: "Skills",
            editable: true,
            type: "array",
          },
          {
            key: "MaxConcurrent",
            label: "Max Concurrent",
            editable: true,
            type: "number",
          },
        ];
      default:
        return [];
    }
  };

  const hasError = (entityId: string, field: string) => {
    return entityErrors.some(
      (error) => error.entityId === entityId && error.field === field
    );
  };

  const formatValue = (value: any, type: string) => {
    if (value === null || value === undefined) return "";

    switch (type) {
      case "array":
        return Array.isArray(value) ? value.join(", ") : String(value);
      case "json":
        return typeof value === "object"
          ? JSON.stringify(value)
          : String(value);
      case "number":
        return String(value);
      default:
        return String(value);
    }
  };

  const parseValue = (input: string, type: string) => {
    switch (type) {
      case "array":
        return input
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item);
      case "json":
        try {
          return JSON.parse(input);
        } catch {
          return input;
        }
      case "number":
        const num = Number(input);
        return isNaN(num) ? 0 : num;
      default:
        return input;
    }
  };

  const startEdit = (
    entityId: string,
    field: string,
    currentValue: any,
    type: string
  ) => {
    const cellId = `${entityId}-${field}`;
    setEditingCell(cellId);
    setEditValue(formatValue(currentValue, type));
  };

  const saveEdit = (entityId: string, field: string, type: string) => {
    const parsedValue = parseValue(editValue, type);
    handleDataUpdate(activeEntity, entityId, field, parsedValue);
    setEditingCell(null);
    setEditValue("");
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue("");
  };

  const addNewRow = () => {
    const newId = `new-${Date.now()}`;
    let newEntity: any = {};

    switch (activeEntity) {
      case "clients":
        newEntity = {
          ClientID: newId,
          Name: "New Client",
          PriorityLevel: 3,
          RequestedTaskIDs: [],
          GroupTag: "",
          AttributesJSON: {},
        };
        break;
      case "workers":
        newEntity = {
          WorkerID: newId,
          Name: "New Worker",
          Skills: [],
          AvailableSlots: [],
          MaxLoadPerPhase: 5,
          WorkerGroup: "",
          HourlyRate: 50,
        };
        break;
      case "tasks":
        newEntity = {
          TaskID: newId,
          Name: "New Task",
          Category: "",
          Duration: 1,
          RequiredSkills: [],
          MaxConcurrent: 1,
        };
        break;
    }

    handleDataUpdate(activeEntity, newId, "create", newEntity);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Data Manager</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={addNewRow}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Row
          </button>
          <button
            onClick={onValidationRun}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Validate
          </button>
        </div>
      </div>

      {/* Entity Tabs */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        {(["clients", "workers", "tasks"] as const).map((entity) => (
          <button
            key={entity}
            onClick={() => setActiveEntity(entity)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeEntity === entity
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {entity.charAt(0).toUpperCase() + entity.slice(1)} (
            {dataState[entity].length})
            {entityErrors.filter((e) => e.entity === entity).length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-4 h-4 text-xs bg-red-500 text-white rounded-full">
                {entityErrors.filter((e) => e.entity === entity).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search data..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Data Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {getColumns(activeEntity).map((column) => (
                  <th
                    key={column.key}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                  >
                    <div className="flex items-center justify-between group">
                      <div className="flex items-center gap-1">
                        <span>{column.label}</span>
                        {column.editable && (
                          <Edit3 className="w-3 h-3 text-gray-400" />
                        )}
                      </div>
                      {column.editable && (
                        <div className="relative">
                          <button
                            onClick={() =>
                              setShowColumnMenu(
                                showColumnMenu === column.key
                                  ? null
                                  : column.key
                              )
                            }
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all"
                          >
                            <MoreVertical className="w-3 h-3 text-gray-400" />
                          </button>
                          {showColumnMenu === column.key && (
                            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                              <button
                                onClick={() => {
                                  handleDeleteColumn(activeEntity, column.key);
                                  setShowColumnMenu(null);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <Trash2 className="w-3 h-3" />
                                Delete Column
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-20">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredData.map((entity) => {
                const entityId = getEntityId(entity);
                const rowErrors = entityErrors.filter(
                  (e) => e.entityId === entityId
                );

                return (
                  <tr
                    key={entityId}
                    className={`${
                      rowErrors.length > 0 ? "bg-red-50" : "hover:bg-gray-50"
                    } transition-colors`}
                  >
                    {getColumns(activeEntity).map((column) => {
                      const value = entity[column.key];
                      const cellHasError = hasError(entityId, column.key);
                      const cellId = `${entityId}-${column.key}`;
                      const isEditing = editingCell === cellId;

                      return (
                        <td
                          key={column.key}
                          className={`px-4 py-3 text-sm ${
                            cellHasError ? "bg-red-100" : ""
                          }`}
                        >
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <input
                                type={
                                  column.type === "number" ? "number" : "text"
                                }
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    saveEdit(entityId, column.key, column.type);
                                  } else if (e.key === "Escape") {
                                    cancelEdit();
                                  }
                                }}
                                className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                autoFocus
                              />
                              <button
                                onClick={() =>
                                  saveEdit(entityId, column.key, column.type)
                                }
                                className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                              >
                                <Save className="w-3 h-3" />
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between group">
                              <span
                                className={`${
                                  column.editable
                                    ? "cursor-pointer hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                                    : ""
                                } flex-1 truncate`}
                                onClick={() =>
                                  column.editable &&
                                  startEdit(
                                    entityId,
                                    column.key,
                                    value,
                                    column.type
                                  )
                                }
                                title={formatValue(value, column.type)}
                              >
                                {formatValue(value, column.type) || (
                                  <span className="text-gray-400 italic">
                                    Click to edit
                                  </span>
                                )}
                              </span>
                              {cellHasError && (
                                <AlertTriangle className="w-4 h-4 text-red-500 ml-2" />
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-1">
                        {rowErrors.length > 0 && (
                          <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                            {rowErrors.length}
                          </span>
                        )}
                        <button
                          onClick={() =>
                            handleDeleteRow(activeEntity, entityId)
                          }
                          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Delete row"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Bar */}
      <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 px-4 py-3 rounded-lg">
        <span>
          {filteredData.length} records
          {searchTerm && ` (filtered from ${dataState[activeEntity].length})`}
        </span>
        <span
          className={
            entityErrors.length > 0 ? "text-red-600" : "text-green-600"
          }
        >
          {entityErrors.length === 0
            ? "✓ All valid"
            : `⚠ ${entityErrors.length} errors`}
        </span>
      </div>

      {/* Click outside to close column menu */}
      {showColumnMenu && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowColumnMenu(null)}
        />
      )}
    </div>
  );
}
