"use client";

import { useState } from "react";
import { Brain, Lightbulb, Zap, MessageSquare } from "lucide-react";
import type { DataGridState, ValidationError } from "@/types";

interface AIAssistantProps {
  dataState: DataGridState;
  validationErrors: ValidationError[];
  onSuggestionApply?: (suggestion: any) => void;
  onRuleGenerate?: (rule: any) => void;
}

export default function AIAssistant({
  dataState,
  validationErrors,
  onSuggestionApply,
  onRuleGenerate,
}: AIAssistantProps) {
  // Default handlers if not provided
  const handleSuggestionApply =
    onSuggestionApply ||
    ((suggestion: any) => {
      console.log("Applied suggestion:", suggestion);
      // Could show a toast notification here
    });

  const handleRuleGenerate =
    onRuleGenerate ||
    ((rule: any) => {
      console.log("Generated rule:", rule);
      // Could show a toast notification here
    });
  const [activeTab, setActiveTab] = useState<"suggestions" | "chat">(
    "suggestions"
  );
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<
    Array<{ id: string; type: "user" | "ai"; message: string; timestamp: Date }>
  >([
    {
      id: "1",
      type: "ai",
      message:
        "👋 Hi! I'm your AI assistant. I can help you with data analysis, validation errors, and rule suggestions. What would you like to know?",
      timestamp: new Date(),
    },
  ]);

  const suggestions = [
    {
      id: "1",
      type: "data_quality",
      title: "Missing Skills Coverage",
      description:
        "Tasks T015 (AI Integration) require Machine Learning skills, but no workers have this skill.",
      action: "Add ML skill to Worker W008",
      confidence: 0.92,
    },
    {
      id: "2",
      type: "rule_suggestion",
      title: "Co-run Pattern Detected",
      description:
        "Tasks T001 and T003 are frequently requested together by clients.",
      action: "Create co-run rule",
      confidence: 0.87,
    },
    {
      id: "3",
      type: "optimization",
      title: "Load Balancing Issue",
      description:
        "Frontend workers are overloaded while backend workers have capacity.",
      action: "Redistribute tasks",
      confidence: 0.78,
    },
  ];

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatMessage.trim()) {
      const userMessage = {
        id: Date.now().toString(),
        type: "user" as const,
        message: chatMessage.trim(),
        timestamp: new Date(),
      };

      setChatHistory((prev) => [...prev, userMessage]);

      // Simple AI response logic (mock)
      setTimeout(() => {
        const aiResponse = generateAIResponse(
          chatMessage.trim(),
          dataState,
          validationErrors
        );
        setChatHistory((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            type: "ai",
            message: aiResponse,
            timestamp: new Date(),
          },
        ]);
      }, 1000);

      setChatMessage("");
    }
  };

  const generateAIResponse = (
    message: string,
    dataState: DataGridState,
    validationErrors: ValidationError[]
  ): string => {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes("error") || lowerMessage.includes("validation")) {
      const errorCount = validationErrors.length;
      if (errorCount === 0) {
        return "Great news! Your data has no validation errors. Everything looks clean and ready for processing.";
      }
      return `I found ${errorCount} validation error(s) in your data. The most common issues are: ${validationErrors
        .slice(0, 3)
        .map((e) => e.type)
        .join(", ")}. Would you like me to suggest fixes?`;
    }

    if (lowerMessage.includes("rule") || lowerMessage.includes("suggest")) {
      return "Based on your data patterns, I recommend creating co-run rules for frequently paired tasks and load balancing rules for overutilized workers. Check the Suggestions tab for specific recommendations.";
    }

    if (lowerMessage.includes("data") || lowerMessage.includes("quality")) {
      const totalRecords =
        dataState.clients.length +
        dataState.workers.length +
        dataState.tasks.length;
      return `Your dataset contains ${dataState.clients.length} clients, ${
        dataState.workers.length
      } workers, and ${
        dataState.tasks.length
      } tasks (${totalRecords} total records). Data quality appears ${
        validationErrors.length === 0
          ? "excellent"
          : "good with some fixable issues"
      }.`;
    }

    if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
      return "Hello! I'm here to help you optimize your resource allocation. I can analyze your data, suggest improvements, and help fix validation issues. What would you like to explore?";
    }

    return "I can help you with data validation, rule suggestions, and optimization insights. Try asking about validation errors, data quality, or rule recommendations. What specific aspect would you like to discuss?";
  };

  return (
    <div className="card">
      <div className="flex items-center space-x-2 mb-4">
        <Brain className="w-5 h-5 text-purple-600" />
        <h3 className="font-semibold text-gray-900">AI Assistant</h3>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-4 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab("suggestions")}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === "suggestions"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Lightbulb className="w-4 h-4 inline mr-1" />
          Suggestions
        </button>
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === "chat"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <MessageSquare className="w-4 h-4 inline mr-1" />
          Chat
        </button>
      </div>

      {activeTab === "suggestions" && (
        <div className="space-y-3">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="ai-suggestion border rounded-lg p-3"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-gray-900 text-sm">
                  {suggestion.title}
                </h4>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                  {Math.round(suggestion.confidence * 100)}%
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-3">
                {suggestion.description}
              </p>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {suggestion.type.replace("_", " ").toUpperCase()}
                </span>

                <button
                  onClick={() => handleSuggestionApply(suggestion)}
                  className="flex items-center space-x-1 text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-200 transition-colors"
                >
                  <Zap className="w-3 h-3" />
                  <span>{suggestion.action}</span>
                </button>
              </div>
            </div>
          ))}

          {suggestions.length === 0 && (
            <div className="text-center py-6 text-gray-500">
              <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No suggestions available</p>
              <p className="text-xs">AI is analyzing your data...</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "chat" && (
        <div className="space-y-4">
          <div className="h-48 bg-gray-50 rounded-lg p-3 overflow-y-auto">
            <div className="space-y-3">
              {chatHistory.map((chat) => (
                <div
                  key={chat.id}
                  className={`flex ${
                    chat.type === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] p-2 rounded-lg text-sm ${
                      chat.type === "user"
                        ? "bg-blue-100 text-blue-900 ml-4"
                        : "bg-white text-gray-700 mr-4 border"
                    }`}
                  >
                    {chat.type === "ai" && (
                      <Brain className="w-3 h-3 inline mr-1 text-purple-600" />
                    )}
                    {chat.message}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleChatSubmit}>
            <div className="flex space-x-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 input-field text-sm"
              />
              <button
                type="submit"
                disabled={!chatMessage.trim()}
                className="btn-primary text-sm px-3 py-2"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
