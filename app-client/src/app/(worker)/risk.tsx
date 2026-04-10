import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Feather } from "@expo/vector-icons";
import { glassCard, glassCardSolid } from "../theme";
import {
  getWorkerRiskAssessment,
  type RiskDetailItem,
} from "../services/api";

export default function RiskScreen() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [risks, setRisks] = useState<RiskDetailItem[]>([]);
  const [overallScore, setOverallScore] = useState(0);
  const [overallStatus, setOverallStatus] = useState("--");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRiskData = useCallback(async () => {
    const result = await getWorkerRiskAssessment();
    if (result.success && result.data) {
      const d = result.data;
      setRisks(d.risks || []);
      setOverallScore(d.overallScore ?? 0);
      setOverallStatus(d.overallStatus ?? "--");
      // Auto-expand first risk card
      if (d.risks?.length && !expanded) {
        setExpanded(d.risks[0].id);
      }
    }
  }, []);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await fetchRiskData();
      setIsLoading(false);
    })();
  }, [fetchRiskData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRiskData();
    setRefreshing(false);
  }, [fetchRiskData]);

  // Map risk status to background color for badges
  const getStatusBg = (status: string) => {
    switch (status.toLowerCase()) {
      case "high": return "#E7F3EA";
      case "moderate": return "#EEEAF7";
      case "low": return "#EAF1F6";
      default: return "#E6EBF0";
    }
  };

  const getIconBg = (id: string) => {
    const map: Record<string, string> = {
      silicosis: "#E7F3EA",
      hearing: "#EEEAF7",
      toxicity: "#EAF1F6",
    };
    return map[id] || "#EAF1F6";
  };

  return (
    <View className="flex-1 bg-[#F4F6F7] relative">
      <View className="absolute w-[350px] h-[350px] rounded-full bg-[#EAF1F6] -top-[120px] -right-[120px] opacity-80" />
      <View className="absolute w-[200px] h-[200px] rounded-full bg-[#E7F3EA] top-[80px] -left-[60px] opacity-80" />
      <StatusBar style="dark" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 60, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1B1E22" />}
      >
        <View className="mb-6">
          <Text className="text-[28px] font-bold text-[#1B1E22]">Risk Assessment</Text>
          <Text className="text-[14px] font-medium text-[#7A8188] mt-1">AI-powered occupational health analysis</Text>
        </View>

        {isLoading ? (
          <View className="py-20 items-center">
            <ActivityIndicator size="large" color="#1B1E22" />
            <Text className="text-[14px] font-medium text-[#7A8188] mt-4">Analyzing your risk profile…</Text>
          </View>
        ) : risks.length === 0 ? (
          <View className="rounded-[22px] p-10 items-center" style={glassCard}>
            <Feather name="shield" size={40} color="#7A8188" />
            <Text className="text-[16px] font-bold text-[#1B1E22] mt-4">No Risk Data</Text>
            <Text className="text-[14px] font-medium text-[#7A8188] mt-2 text-center">
              Upload a medical report first to generate your risk assessment.
            </Text>
          </View>
        ) : (
          <>
            {/* Overall Score Card */}
            <View className="rounded-[22px] p-5 mb-5" style={glassCardSolid}>
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-[16px] font-bold text-[#1B1E22]">Overall Risk Score</Text>
                <View className="px-3.5 py-1.5 rounded-[20px]" style={{ backgroundColor: getStatusBg(overallStatus) }}>
                  <Text className="text-[12px] font-bold text-[#1B1E22]">{overallStatus}</Text>
                </View>
              </View>
              <View className="flex-row items-baseline mb-4">
                <Text className="text-[48px] font-bold text-[#1B1E22]">{overallScore}</Text>
                <Text className="text-[18px] font-bold text-[#7A8188] ml-1">/100</Text>
              </View>
              <View className="h-2 rounded-full bg-[#E6EBF0] mb-3">
                <View className="h-full rounded-full bg-[#1B1E22]" style={{ width: `${Math.min(overallScore, 100)}%` }} />
              </View>
              <Text className="text-[13px] font-medium text-[#7A8188]">
                Based on your exposure profile and medical reports
              </Text>
            </View>

            {/* Individual Risk Cards */}
            {risks.map((risk) => {
              const isExpanded = expanded === risk.id;
              return (
                <TouchableOpacity
                  key={risk.id}
                  activeOpacity={0.8}
                  onPress={() => setExpanded(isExpanded ? null : risk.id)}
                  className="rounded-[22px] p-5 my-3"
                  style={glassCardSolid}
                >
                  <View className="flex-row items-center mb-4">
                    <View
                      className="w-[52px] h-[52px] rounded-[22px] items-center justify-center mr-4"
                      style={{ backgroundColor: getIconBg(risk.id) }}
                    >
                      <Feather name={(risk.icon || "activity") as any} size={24} color="#1B1E22" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[18px] font-bold text-[#1B1E22]">{risk.label}</Text>
                      <View className="flex-row items-center gap-3 mt-1">
                        <Text className="text-[20px] font-bold text-[#1B1E22]">{risk.score}</Text>
                        <View className="px-2.5 py-1 rounded-[20px]" style={{ backgroundColor: getStatusBg(risk.status) }}>
                          <Text className="text-[11px] font-bold text-[#1B1E22]">{risk.status}</Text>
                        </View>
                      </View>
                    </View>
                    <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#7A8188" />
                  </View>

                  {/* Score bar */}
                  <View className="h-1.5 rounded-full bg-[#E6EBF0]">
                    <View className="h-full rounded-full bg-[#1B1E22]" style={{ width: `${Math.min(risk.score, 100)}%` }} />
                  </View>

                  {/* Expanded details */}
                  {isExpanded && (
                    <View className="mt-5 border-t border-[#E6EBF0] pt-5">
                      {/* Reasons */}
                      {risk.reasons?.length > 0 && (
                        <View className="mb-5">
                          <View className="flex-row items-center mb-3">
                            <Feather name="info" size={16} color="#1B1E22" />
                            <Text className="text-[16px] font-bold text-[#1B1E22] ml-2">Why this score?</Text>
                          </View>
                          {risk.reasons.map((reason, i) => (
                            <View key={i} className="flex-row items-start mb-2.5 gap-3">
                              <View className="w-1.5 h-1.5 rounded-full bg-[#1B1E22] mt-2" />
                              <Text className="flex-1 text-[14px] font-medium text-[#7A8188] leading-5">{reason}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Recommendations */}
                      {risk.recommendations?.length > 0 && (
                        <View>
                          <View className="flex-row items-center mb-3">
                            <Feather name="check-circle" size={16} color="#1B1E22" />
                            <Text className="text-[16px] font-bold text-[#1B1E22] ml-2">Recommendations</Text>
                          </View>
                          {risk.recommendations.map((rec, i) => (
                            <View key={i} className="flex-row items-center rounded-[22px] p-4 mb-3 gap-3" style={glassCard}>
                              <Feather name={(rec.icon || "check") as any} size={18} color="#1B1E22" />
                              <Text className="flex-1 text-[14px] font-bold text-[#1B1E22] ml-2">{rec.text}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

            {/* Disclaimer */}
            <View className="flex-row rounded-[22px] p-5 gap-3 mt-4 items-center" style={glassCard}>
              <Feather name="alert-circle" size={20} color="#7A8188" />
              <Text className="flex-1 text-[13px] font-medium text-[#7A8188] leading-5 ml-2">
                Risk scores are generated using AI-driven analysis based on WHO and OSHA standards. Always consult a healthcare professional.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
