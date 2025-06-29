import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { Client, Worker, Task, FileProcessingResult } from "@/types";

export async function parseCSVFile(
  file: File,
  entityType: "clients" | "workers" | "tasks"
): Promise<FileProcessingResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        try {
          const processedData = processRawData(
            results.data as any[],
            entityType
          );
          const metadata = {
            rowsProcessed: results.data.length,
            columnsDetected: results.meta.fields || [],
            dataQualityScore: calculateDataQuality(
              results.data as any[],
              entityType
            ),
          };

          resolve({
            ...processedData,
            parsingMetadata: metadata,
          });
        } catch (error) {
          resolve({
            errors: [
              error instanceof Error ? error.message : "Unknown parsing error",
            ],
            warnings: [],
            parsingMetadata: {
              rowsProcessed: 0,
              columnsDetected: [],
              dataQualityScore: 0,
            },
          });
        }
      },
      error: (error) => {
        resolve({
          errors: [error.message],
          warnings: [],
          parsingMetadata: {
            rowsProcessed: 0,
            columnsDetected: [],
            dataQualityScore: 0,
          },
        });
      },
    });
  });
}

export async function parseXLSXFile(
  file: File,
  entityType: "clients" | "workers" | "tasks"
): Promise<FileProcessingResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Convert to objects with headers
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1).map((row) => {
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = (row as any[])[index] || "";
          });
          return obj;
        });

        const processedData = processRawData(rows, entityType);
        const metadata = {
          rowsProcessed: rows.length,
          columnsDetected: headers,
          dataQualityScore: calculateDataQuality(rows, entityType),
        };

        resolve({
          ...processedData,
          parsingMetadata: metadata,
        });
      } catch (error) {
        resolve({
          errors: [
            error instanceof Error ? error.message : "Unknown parsing error",
          ],
          warnings: [],
          parsingMetadata: {
            rowsProcessed: 0,
            columnsDetected: [],
            dataQualityScore: 0,
          },
        });
      }
    };

    reader.onerror = () => {
      resolve({
        errors: ["Failed to read file"],
        warnings: [],
        parsingMetadata: {
          rowsProcessed: 0,
          columnsDetected: [],
          dataQualityScore: 0,
        },
      });
    };

    reader.readAsArrayBuffer(file);
  });
}

function processRawData(
  rawData: any[],
  entityType: "clients" | "workers" | "tasks"
): Omit<FileProcessingResult, "parsingMetadata"> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const processedData: any[] = [];

  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];

    try {
      let processedRow: any;

      switch (entityType) {
        case "clients":
          processedRow = processClientRow(row, i + 1);
          break;
        case "workers":
          processedRow = processWorkerRow(row, i + 1);
          break;
        case "tasks":
          processedRow = processTaskRow(row, i + 1);
          break;
        default:
          throw new Error(`Unknown entity type: ${entityType}`);
      }

      if (processedRow) {
        processedData.push(processedRow);
      }
    } catch (error) {
      errors.push(
        `Row ${i + 1}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  const result: any = { errors, warnings };
  result[entityType] = processedData;

  return result;
}

function processClientRow(row: any, rowIndex: number): Client | null {
  if (!row.ClientID) return null;

  return {
    ClientID: String(row.ClientID).trim(),
    ClientName: String(row.ClientName || "").trim(),
    PriorityLevel: parseFloat(row.PriorityLevel) || 1,
    RequestedTaskIDs: parseArrayField(row.RequestedTaskIDs),
    GroupTag: String(row.GroupTag || "").trim(),
    AttributesJSON: parseJSONField(row.AttributesJSON),
  };
}

function processWorkerRow(row: any, rowIndex: number): Worker | null {
  if (!row.WorkerID) return null;

  return {
    WorkerID: String(row.WorkerID).trim(),
    WorkerName: String(row.WorkerName || "").trim(),
    Skills: parseArrayField(row.Skills),
    AvailableSlots: parseArrayField(row.AvailableSlots, "number"),
    MaxLoadPerPhase: parseFloat(row.MaxLoadPerPhase) || 0,
    WorkerGroup: String(row.WorkerGroup || "").trim(),
    QualificationLevel: parseFloat(row.QualificationLevel) || 1,
  };
}

function processTaskRow(row: any, rowIndex: number): Task | null {
  if (!row.TaskID) return null;

  return {
    TaskID: String(row.TaskID).trim(),
    TaskName: String(row.TaskName || "").trim(),
    Category: String(row.Category || "").trim(),
    Duration: parseFloat(row.Duration) || 1,
    RequiredSkills: parseArrayField(row.RequiredSkills),
    PreferredPhases: parseArrayField(row.PreferredPhases, "mixed"),
    MaxConcurrent: parseFloat(row.MaxConcurrent) || 1,
  };
}

function parseArrayField(
  value: any,
  type: "string" | "number" | "mixed" = "string"
): any[] {
  if (!value) return [];

  let arrayValue: any[];

  if (typeof value === "string") {
    // Handle JSON array format like "[1,2,3]"
    if (value.startsWith("[") && value.endsWith("]")) {
      try {
        arrayValue = JSON.parse(value);
      } catch {
        // If JSON parsing fails, treat as comma-separated
        arrayValue = value
          .slice(1, -1)
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item);
      }
    } else {
      // Comma-separated values
      arrayValue = value
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item);
    }
  } else if (Array.isArray(value)) {
    arrayValue = value;
  } else {
    return [value];
  }

  // Convert types if needed
  if (type === "number") {
    return arrayValue
      .map((item) => parseFloat(item))
      .filter((item) => !isNaN(item));
  } else if (type === "mixed") {
    return arrayValue.map((item) => {
      const num = parseFloat(item);
      return isNaN(num) ? item : num;
    });
  }

  return arrayValue.map((item) => String(item));
}

function parseJSONField(value: any): Record<string, any> {
  if (!value) return {};

  if (typeof value === "object") return value;

  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return { originalValue: value };
    }
  }

  return { value };
}

function calculateDataQuality(data: any[], entityType: string): number {
  if (data.length === 0) return 0;

  const requiredFields = getRequiredFields(entityType);
  let totalFields = 0;
  let validFields = 0;

  data.forEach((row) => {
    requiredFields.forEach((field) => {
      totalFields++;
      if (row[field] && String(row[field]).trim()) {
        validFields++;
      }
    });
  });

  return totalFields > 0 ? validFields / totalFields : 0;
}

function getRequiredFields(entityType: string): string[] {
  switch (entityType) {
    case "clients":
      return ["ClientID", "ClientName", "PriorityLevel"];
    case "workers":
      return ["WorkerID", "WorkerName", "Skills", "AvailableSlots"];
    case "tasks":
      return ["TaskID", "TaskName", "Duration", "RequiredSkills"];
    default:
      return [];
  }
}
