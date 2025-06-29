"use client";

import { useState } from "react";
import { BarChart3, Sliders, Target } from "lucide-react";
import ReactSlider from "react-slider";
import type { DataGridState } from "@/types";

interface PrioritizationSectionProps {
  dataState: DataGridState;
  onWeightsUpdate?: (weights: any) => void;
  onProfileSelect?: (profileId: string) => void;
}

export default function PrioritizationSection({
  dataState,
  onWeightsUpdate,
  onProfileSelect,
}: PrioritizationSectionProps) {
  // Default handlers if not provided
  const handleWeightsUpdate =
    onWeightsUpdate ||
    ((weights: any) => {
      console.log("Weights updated:", weights);
    });

  const handleProfileSelect =
    onProfileSelect ||
    ((profileId: string) => {
      console.log("Profile selected:", profileId);
    });
  const [weights, setWeights] = useState({
    priorityLevel: 25,
    taskFulfillment: 20,
    fairnessConstraints: 15,
    workloadBalance: 20,
    skillUtilization: 10,
    phaseOptimization: 10,
  });

  const profiles = [
    {
      id: "maximize_fulfillment",
      name: "Maximize Fulfillment",
      description: "Focus on completing as many requested tasks as possible",
      weights: {
        priorityLevel: 30,
        taskFulfillment: 35,
        fairnessConstraints: 10,
        workloadBalance: 10,
        skillUtilization: 10,
        phaseOptimization: 5,
      },
    },
    {
      id: "fair_distribution",
      name: "Fair Distribution",
      description: "Ensure equal treatment across all clients and workers",
      weights: {
        priorityLevel: 15,
        taskFulfillment: 15,
        fairnessConstraints: 35,
        workloadBalance: 20,
        skillUtilization: 10,
        phaseOptimization: 5,
      },
    },
    {
      id: "efficiency_focused",
      name: "Efficiency Focused",
      description: "Optimize for resource utilization and minimal waste",
      weights: {
        priorityLevel: 20,
        taskFulfillment: 15,
        fairnessConstraints: 10,
        workloadBalance: 15,
        skillUtilization: 25,
        phaseOptimization: 15,
      },
    },
  ];

  const handleWeightChange = (key: string, value: number) => {
    const newWeights = { ...weights, [key]: value };
    setWeights(newWeights);
    handleWeightsUpdate(newWeights);
  };

  const handleProfileSelectClick = (profile: any) => {
    setWeights(profile.weights);
    handleWeightsUpdate(profile.weights);
    handleProfileSelect(profile.id);
  };

  const normalizeWeights = () => {
    const total = Object.values(weights).reduce(
      (sum, weight) => sum + weight,
      0
    );
    const normalized = Object.entries(weights).reduce((acc, [key, value]) => {
      acc[key] = Math.round((value / total) * 100);
      return acc;
    }, {} as any);
    setWeights(normalized);
    handleWeightsUpdate(normalized);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Prioritization & Weights
        </h2>
        <p className="text-gray-600">
          Configure how the allocation system should balance different criteria
        </p>
      </div>

      {/* Preset Profiles */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Quick Profiles</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {profiles.map((profile) => (
            <button
              key={profile.id}
              onClick={() => handleProfileSelectClick(profile)}
              className="card-hover text-left"
            >
              <div className="flex items-start space-x-3">
                <Target className="w-5 h-5 text-primary-600 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    {profile.name}
                  </h4>
                  <p className="text-sm text-gray-600">{profile.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Weights */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Custom Weights
          </h3>
          <button onClick={normalizeWeights} className="btn-secondary text-sm">
            Normalize to 100%
          </button>
        </div>

        <div className="space-y-6">
          {Object.entries(weights).map(([key, value]) => {
            const label = key
              .replace(/([A-Z])/g, " $1")
              .replace(/^./, (str) => str.toUpperCase());

            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    {label}
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900 w-8 text-right">
                      {value}%
                    </span>
                  </div>
                </div>

                <div className="px-2">
                  <ReactSlider
                    value={value}
                    onChange={(val) => handleWeightChange(key, val)}
                    min={0}
                    max={50}
                    className="w-full h-2 bg-gray-200 rounded-full"
                    thumbClassName="w-4 h-4 bg-primary-600 rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500"
                    trackClassName="h-2 bg-primary-200 rounded-full"
                  />
                </div>

                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Low Impact</span>
                  <span>High Impact</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Weight Summary */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total Weight:</span>
            <span
              className={`font-medium ${
                Object.values(weights).reduce((sum, w) => sum + w, 0) === 100
                  ? "text-green-600"
                  : "text-orange-600"
              }`}
            >
              {Object.values(weights).reduce((sum, w) => sum + w, 0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Weight Visualization */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Weight Distribution
        </h3>

        <div className="space-y-3">
          {Object.entries(weights)
            .sort(([, a], [, b]) => b - a)
            .map(([key, value]) => {
              const label = key
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, (str) => str.toUpperCase());
              const percentage = value;

              return (
                <div key={key} className="flex items-center space-x-3">
                  <div className="w-32 text-right text-sm text-gray-600">
                    {label}
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-primary-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(percentage, 2)}%` }}
                    />
                  </div>
                  <div className="w-12 text-sm font-medium text-gray-900">
                    {percentage}%
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Impact Preview */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Expected Impact
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">High Priority Areas:</h4>
            {Object.entries(weights)
              .filter(([, value]) => value >= 20)
              .map(([key]) => (
                <div key={key} className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-gray-700">
                    {key
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (str) => str.toUpperCase())}
                  </span>
                </div>
              ))}
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Low Priority Areas:</h4>
            {Object.entries(weights)
              .filter(([, value]) => value < 15)
              .map(([key]) => (
                <div key={key} className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full" />
                  <span className="text-gray-700">
                    {key
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (str) => str.toUpperCase())}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
