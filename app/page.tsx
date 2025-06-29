"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Upload,
  Database,
  Settings,
  Target,
  Download,
  Brain,
  CheckCircle,
  AlertCircle,
  Users,
  Briefcase,
  ClipboardList,
} from "lucide-react";

import FileUploadSection from "@/components/FileUploadSection";
import DataGridSection from "@/components/DataGridSection";
import ValidationPanel from "@/components/ValidationPanel";
import NaturalLanguageSearch from "@/components/NaturalLanguageSearch";
import AIAssistant from "@/components/AIAssistant";
import RuleBuilderSection from "@/components/RuleBuilderSection";
import PrioritizationSection from "@/components/PrioritizationSection";
import ExportSection from "@/components/ExportSection";

import { useDataStore } from "@/hooks/useDataStore";
import { useValidationEngine } from "@/hooks/useValidationEngine";
import { useAIFeatures } from "@/hooks/useAIFeatures";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("upload");
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  const dataStore = useDataStore();
  const validationEngine = useValidationEngine(dataStore.dataState);
  const aiFeatures = useAIFeatures();

  const totalRecords =
    dataStore.dataState.clients.length +
    dataStore.dataState.workers.length +
    dataStore.dataState.tasks.length;
  const hasData = totalRecords > 0;

  const tabItems = [
    {
      id: "upload",
      label: "Upload Data",
      icon: Upload,
      description: "Import CSV/XLSX files",
      disabled: false,
    },
    {
      id: "data",
      label: "Data Grid",
      icon: Database,
      description: "View and edit records",
      disabled: !hasData,
    },
    {
      id: "rules",
      label: "Business Rules",
      icon: Settings,
      description: "Configure allocation rules",
      disabled: !hasData,
    },
    {
      id: "prioritization",
      label: "Prioritization",
      icon: Target,
      description: "Set priorities and weights",
      disabled: !hasData,
    },
    {
      id: "export",
      label: "Export",
      icon: Download,
      description: "Download processed data",
      disabled: !hasData,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-blue-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent">
                    Dashboard
                  </h1>
                  <p className="text-xs text-slate-500">
                    AI-Powered Resource Allocation
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Data Summary */}
              {hasData && (
                <div className="flex items-center space-x-2 text-sm">
                  <Badge
                    variant="outline"
                    className="flex items-center space-x-1"
                  >
                    <Users className="w-3 h-3" />
                    <span>{dataStore.dataState.clients.length} Clients</span>
                  </Badge>
                  <Badge
                    variant="outline"
                    className="flex items-center space-x-1"
                  >
                    <Briefcase className="w-3 h-3" />
                    <span>{dataStore.dataState.workers.length} Workers</span>
                  </Badge>
                  <Badge
                    variant="outline"
                    className="flex items-center space-x-1"
                  >
                    <ClipboardList className="w-3 h-3" />
                    <span>{dataStore.dataState.tasks.length} Tasks</span>
                  </Badge>
                </div>
              )}

              {/* Validation Status */}
              {hasData && (
                <div className="flex items-center space-x-2">
                  {validationEngine.validationSummary.criticalErrors > 0 ? (
                    <Badge
                      variant="destructive"
                      className="flex items-center space-x-1"
                    >
                      <AlertCircle className="w-3 h-3" />
                      <span>
                        {validationEngine.validationSummary.criticalErrors}{" "}
                        Errors
                      </span>
                    </Badge>
                  ) : (
                    <Badge
                      variant="default"
                      className="flex items-center space-x-1 bg-green-100 text-green-800"
                    >
                      <CheckCircle className="w-3 h-3" />
                      <span>Valid</span>
                    </Badge>
                  )}
                </div>
              )}

              {/* AI Assistant Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAIAssistant(!showAIAssistant)}
                className="flex items-center space-x-2"
              >
                <Brain className="w-4 h-4" />
                <span>AI Assistant</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card className="bg-white/50 backdrop-blur-sm border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>Resource Allocation Configurator</span>
                </CardTitle>
                <CardDescription>
                  Transform your spreadsheet chaos into organized, validated
                  data ready for allocation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-5 mb-6">
                    {tabItems.map((item) => (
                      <TabsTrigger
                        key={item.id}
                        value={item.id}
                        disabled={item.disabled}
                        className="flex flex-col items-center space-y-1 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                      >
                        <item.icon className="w-4 h-4" />
                        <span className="text-xs">{item.label}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <TabsContent value="upload" className="mt-0">
                        <FileUploadSection
                          onFilesUploaded={dataStore.uploadFiles}
                          supportedFormats={["csv", "xlsx"]}
                          maxFileSize={10 * 1024 * 1024}
                        />
                      </TabsContent>

                      <TabsContent value="data" className="mt-0">
                        <DataGridSection
                          dataState={dataStore.dataState}
                          validationErrors={validationEngine.validationErrors}
                          onDataUpdate={dataStore.updateData}
                          onValidationRun={validationEngine.runValidation}
                          onValidationFix={validationEngine.fixValidationError}
                          onDeleteRow={dataStore.deleteRow}
                          onDeleteColumn={dataStore.deleteColumn}
                        />
                      </TabsContent>

                      <TabsContent value="rules" className="mt-0">
                        <RuleBuilderSection dataState={dataStore.dataState} />
                      </TabsContent>

                      <TabsContent value="prioritization" className="mt-0">
                        <PrioritizationSection
                          dataState={dataStore.dataState}
                        />
                      </TabsContent>

                      <TabsContent value="export" className="mt-0">
                        <ExportSection
                          dataState={dataStore.dataState}
                          validationSummary={validationEngine.validationSummary}
                          rules={[]}
                          prioritization={{}}
                        />
                      </TabsContent>
                    </motion.div>
                  </AnimatePresence>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Natural Language Search */}
            {hasData && (
              <Card className="bg-white/50 backdrop-blur-sm border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    Quick Search
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <NaturalLanguageSearch
                    dataState={dataStore.dataState}
                    onSearch={aiFeatures.processNaturalLanguageQuery}
                  />
                </CardContent>
              </Card>
            )}

            {/* Validation Panel */}
            {hasData && validationEngine.validationErrors.length > 0 && (
              <ValidationPanel
                validationErrors={validationEngine.validationErrors}
                summary={validationEngine.validationSummary}
                onErrorFix={validationEngine.fixValidationError}
                onRevalidate={validationEngine.runValidation}
              />
            )}

            {/* AI Assistant */}
            <AnimatePresence>
              {showAIAssistant && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <AIAssistant
                    dataState={dataStore.dataState}
                    validationErrors={validationEngine.validationErrors}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
