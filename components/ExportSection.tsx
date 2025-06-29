"use client";

import { useState } from "react";
import {
  Download,
  FileText,
  Database,
  Settings,
  CheckCircle,
  Package,
  Archive,
} from "lucide-react";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import type { DataGridState, ExportConfiguration } from "@/types";

interface ExportSectionProps {
  dataState: DataGridState;
  validationSummary: any;
  rules: any[];
  prioritization: any;
}

export default function ExportSection({
  dataState,
  validationSummary,
  rules,
  prioritization,
}: ExportSectionProps) {
  const [exportConfig, setExportConfig] = useState<ExportConfiguration>({
    includeValidationReport: true,
    includeCleanedData: true,
    includeRulesConfig: true,
    includePrioritization: true,
    format: "csv",
  });

  const [isExporting, setIsExporting] = useState(false);
  const [exportAsZip, setExportAsZip] = useState(true);

  const handleConfigChange = (key: keyof ExportConfiguration, value: any) => {
    setExportConfig((prev) => ({ ...prev, [key]: value }));
  };

  const generateCSV = (data: any[], filename: string) => {
    if (data.length === 0) return null;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            if (Array.isArray(value)) return `"${value.join(";")}"`;
            if (typeof value === "object")
              return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
            return `"${String(value).replace(/"/g, '""')}"`;
          })
          .join(",")
      ),
    ].join("\n");

    return new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  };

  const generateExcelWorkbook = (dataState: DataGridState) => {
    // For future enhancement - Excel export with multiple sheets
    return null;
  };

  const generateSummaryReport = () => {
    const dataStats = {
      clients: dataState.clients.length,
      workers: dataState.workers.length,
      tasks: dataState.tasks.length,
      totalRecords:
        dataState.clients.length +
        dataState.workers.length +
        dataState.tasks.length,
    };

    const summaryReport = {
      exportInfo: {
        exportDate: new Date().toISOString(),
        exportedBy: "Dashboard",
        version: "1.0.0",
      },
      dataStatistics: dataStats,
      validationSummary: validationSummary || {
        totalErrors: 0,
        criticalErrors: 0,
        warnings: 0,
        errorsByType: {},
      },
      rulesInfo: {
        totalRules: rules.length,
        activeRules: rules.filter((r) => r.enabled).length,
        ruleTypes: [...new Set(rules.map((r) => r.type))],
      },
      prioritizationInfo: prioritization
        ? {
            hasCustomPrioritization: true,
            weightSum: Object.values(prioritization).reduce(
              (sum: number, weight: any) => sum + (Number(weight) || 0),
              0
            ),
          }
        : {
            hasCustomPrioritization: false,
          },
    };

    return new Blob([JSON.stringify(summaryReport, null, 2)], {
      type: "application/json;charset=utf-8;",
    });
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const exports: { filename: string; blob: Blob }[] = [];

      // Export cleaned data
      if (exportConfig.includeCleanedData) {
        if (dataState.clients.length > 0) {
          const clientsBlob = generateCSV(dataState.clients, "clients");
          if (clientsBlob)
            exports.push({
              filename: "data/cleaned_clients.csv",
              blob: clientsBlob,
            });
        }

        if (dataState.workers.length > 0) {
          const workersBlob = generateCSV(dataState.workers, "workers");
          if (workersBlob)
            exports.push({
              filename: "data/cleaned_workers.csv",
              blob: workersBlob,
            });
        }

        if (dataState.tasks.length > 0) {
          const tasksBlob = generateCSV(dataState.tasks, "tasks");
          if (tasksBlob)
            exports.push({
              filename: "data/cleaned_tasks.csv",
              blob: tasksBlob,
            });
        }
      }

      // Export rules configuration
      if (exportConfig.includeRulesConfig && rules.length > 0) {
        const rulesConfig = {
          rules: rules,
          metadata: {
            exportDate: new Date().toISOString(),
            totalRules: rules.length,
            activeRules: rules.filter((r) => r.enabled).length,
            ruleTypes: [...new Set(rules.map((r) => r.type))],
          },
        };

        const rulesBlob = new Blob([JSON.stringify(rulesConfig, null, 2)], {
          type: "application/json;charset=utf-8;",
        });
        exports.push({ filename: "config/rules_config.json", blob: rulesBlob });
      }

      // Export prioritization settings
      if (exportConfig.includePrioritization && prioritization) {
        const prioritizationConfig = {
          prioritization,
          metadata: {
            exportDate: new Date().toISOString(),
            totalWeight: Object.values(prioritization).reduce(
              (sum: number, weight: any) => sum + (Number(weight) || 0),
              0
            ),
          },
        };

        const prioritizationBlob = new Blob(
          [JSON.stringify(prioritizationConfig, null, 2)],
          {
            type: "application/json;charset=utf-8;",
          }
        );
        exports.push({
          filename: "config/prioritization_config.json",
          blob: prioritizationBlob,
        });
      }

      // Export validation report
      if (exportConfig.includeValidationReport) {
        const validationReport = {
          validationSummary: validationSummary || {
            totalErrors: 0,
            criticalErrors: 0,
            warnings: 0,
            errorsByType: {},
          },
          validationErrors: dataState.validationErrors || [],
          metadata: {
            exportDate: new Date().toISOString(),
            totalEntitiesValidated:
              dataState.clients.length +
              dataState.workers.length +
              dataState.tasks.length,
          },
        };

        const reportBlob = new Blob(
          [JSON.stringify(validationReport, null, 2)],
          {
            type: "application/json;charset=utf-8;",
          }
        );
        exports.push({
          filename: "reports/validation_report.json",
          blob: reportBlob,
        });
      }

      // Add summary report
      const summaryBlob = generateSummaryReport();
      exports.push({ filename: "EXPORT_SUMMARY.json", blob: summaryBlob });

      // Add README file
      const readmeContent = `# Dashboard Export

## Export Information
- Export Date: ${new Date().toLocaleString()}
- Total Files: ${exports.length}
- Data Records: ${
        dataState.clients.length +
        dataState.workers.length +
        dataState.tasks.length
      }

## Folder Structure
- /data/ - Cleaned data files (CSV format)
- /config/ - Business rules and prioritization settings
- /reports/ - Validation reports and analysis
- EXPORT_SUMMARY.json - Complete export metadata

## Files Included
${exports.map((exp) => `- ${exp.filename}`).join("\n")}

## Usage
Import these files into your resource allocation system or use them for further analysis.
Generated by Dashboard v1.0.0
`;

      const readmeBlob = new Blob([readmeContent], {
        type: "text/plain;charset=utf-8;",
      });
      exports.push({ filename: "README.md", blob: readmeBlob });

      if (exportAsZip) {
        // Create ZIP file
        const zip = new JSZip();

        // Add all files to ZIP
        for (const { filename, blob } of exports) {
          const arrayBuffer = await blob.arrayBuffer();
          zip.file(filename, arrayBuffer);
        }

        // Generate ZIP file
        const zipBlob = await zip.generateAsync({
          type: "blob",
          compression: "DEFLATE",
          compressionOptions: { level: 6 },
        });

        const timestamp = new Date()
          .toISOString()
          .slice(0, 19)
          .replace(/[:-]/g, "");
        saveAs(zipBlob, `digitalyz-export-${timestamp}.zip`);
      } else {
        // Download individual files
        exports.forEach(({ filename, blob }) => {
          const cleanFilename = filename.replace(/\//g, "_");
          saveAs(blob, cleanFilename);
        });
      }
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const dataStats = {
    clients: dataState.clients.length,
    workers: dataState.workers.length,
    tasks: dataState.tasks.length,
    totalRecords:
      dataState.clients.length +
      dataState.workers.length +
      dataState.tasks.length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Export Data</h2>
        <p className="text-gray-600">
          Download your cleaned data, validation reports, and configuration
          files
        </p>
      </div>

      {/* Data Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <Database className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">
            {dataStats.clients}
          </p>
          <p className="text-sm text-gray-600">Clients</p>
        </div>

        <div className="card text-center">
          <Database className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">
            {dataStats.workers}
          </p>
          <p className="text-sm text-gray-600">Workers</p>
        </div>

        <div className="card text-center">
          <Database className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{dataStats.tasks}</p>
          <p className="text-sm text-gray-600">Tasks</p>
        </div>

        <div className="card text-center">
          <Archive className="w-8 h-8 text-orange-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">
            {dataStats.totalRecords}
          </p>
          <p className="text-sm text-gray-600">Total Records</p>
        </div>
      </div>

      {/* Export Configuration */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Export Configuration
        </h3>

        <div className="space-y-4">
          {/* Export Format Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Package className="w-5 h-5 text-orange-600" />
              <div>
                <label className="font-medium text-gray-900">
                  Export as ZIP Archive
                </label>
                <p className="text-sm text-gray-600">
                  Download all files in a single ZIP archive with organized
                  folders
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={exportAsZip}
                onChange={(e) => setExportAsZip(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
            </label>
          </div>

          {/* Content Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={exportConfig.includeCleanedData}
                onChange={(e) =>
                  handleConfigChange("includeCleanedData", e.target.checked)
                }
                className="rounded"
              />
              <div>
                <span className="font-medium text-gray-900">Cleaned Data</span>
                <p className="text-sm text-gray-600">Processed CSV files</p>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={exportConfig.includeValidationReport}
                onChange={(e) =>
                  handleConfigChange(
                    "includeValidationReport",
                    e.target.checked
                  )
                }
                className="rounded"
              />
              <div>
                <span className="font-medium text-gray-900">
                  Validation Report
                </span>
                <p className="text-sm text-gray-600">
                  Error analysis & suggestions
                </p>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={exportConfig.includeRulesConfig}
                onChange={(e) =>
                  handleConfigChange("includeRulesConfig", e.target.checked)
                }
                className="rounded"
              />
              <div>
                <span className="font-medium text-gray-900">
                  Business Rules
                </span>
                <p className="text-sm text-gray-600">Rule configurations</p>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={exportConfig.includePrioritization}
                onChange={(e) =>
                  handleConfigChange("includePrioritization", e.target.checked)
                }
                className="rounded"
              />
              <div>
                <span className="font-medium text-gray-900">
                  Prioritization Settings
                </span>
                <p className="text-sm text-gray-600">Weight configurations</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Export Actions */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Ready to Export
            </h3>
            <p className="text-gray-600">
              {exportAsZip
                ? `Generate ZIP archive with ${
                    Object.values(exportConfig).filter(Boolean).length
                  } file types`
                : `Download ${
                    Object.values(exportConfig).filter(Boolean).length
                  } individual files`}
            </p>
          </div>

          <button
            onClick={handleExport}
            disabled={isExporting || dataStats.totalRecords === 0}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                {exportAsZip ? (
                  <Package className="w-4 h-4" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>{exportAsZip ? "Export ZIP" : "Export Files"}</span>
              </>
            )}
          </button>
        </div>

        {dataStats.totalRecords === 0 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              No data available to export. Please upload and process data files
              first.
            </p>
          </div>
        )}
      </div>

      {/* Export Preview */}
      {dataStats.totalRecords > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Export Preview
          </h3>

          <div className="space-y-3">
            {exportConfig.includeCleanedData && (
              <div className="flex items-center space-x-3 text-sm">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>📁 data/</span>
                <span className="text-gray-600">
                  {[
                    dataStats.clients > 0 && "cleaned_clients.csv",
                    dataStats.workers > 0 && "cleaned_workers.csv",
                    dataStats.tasks > 0 && "cleaned_tasks.csv",
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </div>
            )}

            {exportConfig.includeRulesConfig && rules.length > 0 && (
              <div className="flex items-center space-x-3 text-sm">
                <Settings className="w-4 h-4 text-green-600" />
                <span>📁 config/</span>
                <span className="text-gray-600">rules_config.json</span>
              </div>
            )}

            {exportConfig.includePrioritization && prioritization && (
              <div className="flex items-center space-x-3 text-sm">
                <Settings className="w-4 h-4 text-purple-600" />
                <span>📁 config/</span>
                <span className="text-gray-600">
                  prioritization_config.json
                </span>
              </div>
            )}

            {exportConfig.includeValidationReport && (
              <div className="flex items-center space-x-3 text-sm">
                <CheckCircle className="w-4 h-4 text-orange-600" />
                <span>📁 reports/</span>
                <span className="text-gray-600">validation_report.json</span>
              </div>
            )}

            <div className="flex items-center space-x-3 text-sm">
              <FileText className="w-4 h-4 text-gray-600" />
              <span>📄</span>
              <span className="text-gray-600">
                EXPORT_SUMMARY.json, README.md
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
