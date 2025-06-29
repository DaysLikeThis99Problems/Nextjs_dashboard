"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  File,
  X,
  CheckCircle,
  AlertCircle,
  Sparkles,
  FileSpreadsheet,
  Database,
} from "lucide-react";
import { toast } from "react-hot-toast";

import { parseCSVFile, parseXLSXFile } from "@/lib/fileParser";
import { aiColumnMapper } from "@/lib/aiFeatures";
import type { UploadedFile, FileProcessingResult } from "@/types";

interface FileUploadSectionProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
  supportedFormats: string[];
  maxFileSize: number;
}

export default function FileUploadSection({
  onFilesUploaded,
  supportedFormats = ["csv", "xlsx"],
  maxFileSize = 10 * 1024 * 1024,
}: FileUploadSectionProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [processingFiles, setProcessingFiles] = useState<Set<string>>(
    new Set()
  );
  const [useAIMapping, setUseAIMapping] = useState(true);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      handleFiles(files);
    },
    []
  );

  const handleFiles = async (files: File[]) => {
    const validFiles: UploadedFile[] = [];

    for (const file of files) {
      // Validate file type
      const extension = file.name.split(".").pop()?.toLowerCase();
      if (!extension || !supportedFormats.includes(extension)) {
        toast.error(`Unsupported file format: ${file.name}`);
        continue;
      }

      // Validate file size
      if (file.size > maxFileSize) {
        toast.error(`File too large: ${file.name}`);
        continue;
      }

      // Determine file type based on name
      let type: "clients" | "workers" | "tasks" = "clients";
      const fileName = file.name.toLowerCase();
      if (fileName.includes("worker")) type = "workers";
      else if (fileName.includes("task")) type = "tasks";
      else if (fileName.includes("client")) type = "clients";

      validFiles.push({
        file,
        type,
        status: "pending",
        progress: 0,
      });
    }

    if (validFiles.length === 0) return;

    setUploadedFiles((prev) => [...prev, ...validFiles]);
    await processFiles(validFiles);
  };

  const processFiles = async (files: UploadedFile[]) => {
    const fileIds = files.map((f) => f.file.name);
    setProcessingFiles((prev) => new Set([...prev, ...fileIds]));

    const processedFiles: UploadedFile[] = [];

    for (const uploadedFile of files) {
      try {
        // Update status to processing
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.file.name === uploadedFile.file.name
              ? { ...f, status: "processing", progress: 25 }
              : f
          )
        );

        // Parse file based on extension
        let result: FileProcessingResult;
        const extension = uploadedFile.file.name
          .split(".")
          .pop()
          ?.toLowerCase();

        if (extension === "csv") {
          result = await parseCSVFile(uploadedFile.file, uploadedFile.type);
        } else if (extension === "xlsx") {
          result = await parseXLSXFile(uploadedFile.file, uploadedFile.type);
        } else {
          throw new Error("Unsupported file format");
        }

        // Update progress
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.file.name === uploadedFile.file.name ? { ...f, progress: 50 } : f
          )
        );

        // Apply AI column mapping if enabled
        if (useAIMapping && result.parsingMetadata.columnsDetected.length > 0) {
          const aiResult = await aiColumnMapper(
            result.parsingMetadata.columnsDetected,
            uploadedFile.type
          );

          if (aiResult.suggestions.length > 0) {
            // Apply AI suggestions to improve data mapping
            result.warnings.push(
              `AI detected ${aiResult.suggestions.length} column mapping suggestions`
            );
          }
        }

        // Update progress
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.file.name === uploadedFile.file.name ? { ...f, progress: 75 } : f
          )
        );

        // Finalize
        const finalFile: UploadedFile = {
          ...uploadedFile,
          status: "completed",
          result,
          progress: 100,
        };

        processedFiles.push(finalFile);

        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.file.name === uploadedFile.file.name ? finalFile : f
          )
        );
      } catch (error) {
        console.error("File processing error:", error);

        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.file.name === uploadedFile.file.name
              ? {
                  ...f,
                  status: "error",
                  progress: 0,
                  result: {
                    errors: [
                      error instanceof Error ? error.message : "Unknown error",
                    ],
                    warnings: [],
                    parsingMetadata: {
                      rowsProcessed: 0,
                      columnsDetected: [],
                      dataQualityScore: 0,
                    },
                  },
                }
              : f
          )
        );
      }
    }

    setProcessingFiles((prev) => {
      const newSet = new Set(prev);
      fileIds.forEach((id) => newSet.delete(id));
      return newSet;
    });

    if (processedFiles.length > 0) {
      onFilesUploaded(processedFiles);
    }
  };

  const removeFile = (fileName: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.file.name !== fileName));
  };

  const retryFile = async (fileName: string) => {
    const file = uploadedFiles.find((f) => f.file.name === fileName);
    if (file) {
      await processFiles([{ ...file, status: "pending", progress: 0 }]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Upload Your Data Files
        </h2>
        <p className="text-gray-600">
          Upload CSV or XLSX files for clients, workers, and tasks. Our AI will
          help map columns automatically.
        </p>
      </div>

      {/* AI Mapping Toggle */}
      <div className="flex items-center justify-center space-x-3">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={useAIMapping}
            onChange={(e) => setUseAIMapping(e.target.checked)}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700">Use AI Column Mapping</span>
          <Sparkles className="w-4 h-4 text-purple-500" />
        </label>
      </div>

      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
          ${
            isDragging
              ? "border-primary-400 bg-primary-50"
              : "border-gray-300 hover:border-gray-400"
          }
        `}
      >
        <input
          type="file"
          multiple
          accept=".csv,.xlsx"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full">
              <Upload className="w-8 h-8 text-primary-600" />
            </div>
          </div>

          <div>
            <p className="text-lg font-medium text-gray-900">
              Drop files here or click to browse
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Supports CSV and XLSX files up to{" "}
              {Math.round(maxFileSize / (1024 * 1024))}MB
            </p>
          </div>

          <div className="flex items-center justify-center space-x-6 text-xs text-gray-400">
            <div className="flex items-center space-x-1">
              <FileSpreadsheet className="w-4 h-4" />
              <span>CSV</span>
            </div>
            <div className="flex items-center space-x-1">
              <Database className="w-4 h-4" />
              <span>XLSX</span>
            </div>
          </div>
        </div>
      </div>

      {/* File List */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <h3 className="text-lg font-medium text-gray-900">
              Uploaded Files
            </h3>

            {uploadedFiles.map((file) => (
              <motion.div
                key={file.file.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-lg border border-gray-200 p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`
                      flex items-center justify-center w-10 h-10 rounded-lg
                      ${
                        file.status === "completed"
                          ? "bg-green-100"
                          : file.status === "error"
                          ? "bg-red-100"
                          : file.status === "processing"
                          ? "bg-blue-100"
                          : "bg-gray-100"
                      }
                    `}
                    >
                      {file.status === "completed" ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : file.status === "error" ? (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      ) : file.status === "processing" ? (
                        <div className="loading-spinner" />
                      ) : (
                        <File className="w-5 h-5 text-gray-600" />
                      )}
                    </div>

                    <div>
                      <p className="font-medium text-gray-900">
                        {file.file.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {file.type} • {(file.file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {file.status === "error" && (
                      <button
                        onClick={() => retryFile(file.file.name)}
                        className="text-sm text-primary-600 hover:text-primary-700"
                      >
                        Retry
                      </button>
                    )}

                    <button
                      onClick={() => removeFile(file.file.name)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                {file.status === "processing" && (
                  <div className="mt-3">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Results Summary */}
                {file.result && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Rows:</span>
                        <span className="ml-1 font-medium">
                          {file.result.parsingMetadata.rowsProcessed}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Columns:</span>
                        <span className="ml-1 font-medium">
                          {file.result.parsingMetadata.columnsDetected.length}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Quality:</span>
                        <span className="ml-1 font-medium">
                          {(
                            file.result.parsingMetadata.dataQualityScore * 100
                          ).toFixed(0)}
                          %
                        </span>
                      </div>
                    </div>

                    {file.result.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-red-600 font-medium">
                          Errors:
                        </p>
                        <ul className="text-sm text-red-600 ml-4">
                          {file.result.errors.slice(0, 3).map((error, idx) => (
                            <li key={idx}>• {error}</li>
                          ))}
                          {file.result.errors.length > 3 && (
                            <li>
                              • ... and {file.result.errors.length - 3} more
                            </li>
                          )}
                        </ul>
                      </div>
                    )}

                    {file.result.warnings.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-yellow-600 font-medium">
                          Warnings:
                        </p>
                        <ul className="text-sm text-yellow-600 ml-4">
                          {file.result.warnings
                            .slice(0, 2)
                            .map((warning, idx) => (
                              <li key={idx}>• {warning}</li>
                            ))}
                          {file.result.warnings.length > 2 && (
                            <li>
                              • ... and {file.result.warnings.length - 2} more
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sample Data Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">
          Expected File Structure:
        </h4>
        <div className="space-y-2 text-sm text-blue-800">
          <div>
            <strong>clients.csv:</strong> ClientID, ClientName, PriorityLevel,
            RequestedTaskIDs, GroupTag, AttributesJSON
          </div>
          <div>
            <strong>workers.csv:</strong> WorkerID, WorkerName, Skills,
            AvailableSlots, MaxLoadPerPhase, WorkerGroup, QualificationLevel
          </div>
          <div>
            <strong>tasks.csv:</strong> TaskID, TaskName, Category, Duration,
            RequiredSkills, PreferredPhases, MaxConcurrent
          </div>
        </div>
      </div>
    </div>
  );
}
