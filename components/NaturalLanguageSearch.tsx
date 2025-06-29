"use client";

import { useState } from "react";
import { Search, Sparkles, Send, X } from "lucide-react";
import type { DataGridState, NaturalLanguageQuery } from "@/types";

interface NaturalLanguageSearchProps {
  dataState: DataGridState;
  onSearch: (
    query: string,
    dataState: DataGridState
  ) => Promise<NaturalLanguageQuery>;
  placeholder?: string;
  isProcessing?: boolean;
}

export default function NaturalLanguageSearch({
  dataState,
  onSearch,
  placeholder = "Search with natural language...",
  isProcessing = false,
}: NaturalLanguageSearchProps) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] =
    useState<NaturalLanguageQuery | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsSearching(true);
      try {
        const results = await onSearch(query.trim(), dataState);
        setSearchResults(results);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    }
  };

  const clearResults = () => {
    setSearchResults(null);
    setQuery("");
  };

  const suggestions = [
    "Show me all high-priority clients",
    "Find workers with JavaScript skills",
    "Tasks requiring more than 3 phases",
    "Clients with missing requested tasks",
  ];

  return (
    <div className="space-y-4">
      <div className="glass-effect rounded-xl p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <h3 className="text-sm font-semibold text-gray-900">
            AI-Powered Search
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full pl-9 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={isProcessing || isSearching}
            />
            <button
              type="submit"
              disabled={!query.trim() || isProcessing || isSearching}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-purple-600 hover:text-purple-700 disabled:opacity-50"
            >
              {isSearching ? (
                <div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-3 h-3" />
              )}
            </button>
          </div>
        </form>

        <div>
          <p className="text-xs text-gray-500 mb-2">Try these examples:</p>
          <div className="flex flex-wrap gap-1">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => setQuery(suggestion)}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-full transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search Results */}
      {searchResults && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-900">
              Search Results
            </h4>
            <button
              onClick={clearResults}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="text-xs text-gray-600 bg-gray-50 rounded p-2">
              <strong>Query:</strong> {searchResults.query}
            </div>

            <div className="text-xs">
              <strong className="text-gray-700">
                Found {searchResults.results.length} result(s)
              </strong>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2">
              {searchResults.results
                .slice(0, 10)
                .map((result: any, index: number) => (
                  <div key={index} className="bg-gray-50 rounded p-2 text-xs">
                    <div className="font-medium text-gray-900">
                      {result.Name ||
                        result.ClientID ||
                        result.WorkerID ||
                        result.TaskID}
                    </div>
                    <div className="text-gray-600 mt-1">
                      {result.PriorityLevel &&
                        `Priority: ${result.PriorityLevel}`}
                      {result.Skills &&
                        ` | Skills: ${result.Skills.slice(0, 3).join(", ")}`}
                      {result.Duration &&
                        ` | Duration: ${result.Duration} phases`}
                      {result.Category && ` | Category: ${result.Category}`}
                    </div>
                  </div>
                ))}
            </div>

            {searchResults.results.length > 10 && (
              <div className="text-xs text-gray-500 text-center">
                ... and {searchResults.results.length - 10} more results
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
