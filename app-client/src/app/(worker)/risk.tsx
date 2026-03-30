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
  getHealthScore,
  type HealthScoreResponse,
} from "../services/api";

export default function RiskScreen() {
  const [healthData, setHealthData] = useState<HealthScoreResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRiskData = useCallback(async () => {
    const result = await getHealthScore();
    if (result.success && result.data) {
      setHealthData(result.data);
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

  // Derived properties from backend HealthScore
  const score = healthData?.score ?? 0;
  const statusStr = healthData?.status || "not_calculated";
  const suggestions = healthData?.suggestions || [];
  
  // High score = More Danger according to backend doc
  let statusLabel = "Assessing";
  let statusBg = "#E6EBF0";
  if (statusStr === "ready" || statusStr === "calculating") {
      if (score >= 75) { statusLabel = "High Risk"; statusBg = "#FDE8E8"; } // Light red fallback
      else if (score >= 40) { statusLabel = "Moderate"; statusBg = "#EEEAF7"; }
      else { statusLabel = "Low Risk"; statusBg = "#E7F3EA"; }
  } else if (statusStr === "not_calculated") {
      statusLabel = "Pending Data";
  }

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
          <Text className="text-[28px] font-bold text-[#1B1E22]">Health Assessment</Text>
          <Text className="text-[14px] font-medium text-[#7A8188] mt-1">AI-powered predictive modeling</Text>
        </View>

        {isLoading ? (
          <View className="py-20 items-center">
            <ActivityIndicator size="large" color="#1B1E22" />
            <Text className="text-[14px] font-medium text-[#7A8188] mt-4">Connecting to AI Engine…</Text>
          </View>
        ) : statusStr === "not_calculated" ? (
          <View className="rounded-[22px] p-10 items-center" style={glassCard}>
            <Feather name="shield" size={40} color="#7A8188" />
            <Text className="text-[16px] font-bold text-[#1B1E22] mt-4">No Data Generated</Text>
            <Text className="text-[14px] font-medium text-[#7A8188] mt-2 text-center">
              Complete your profile and upload medical reports to empower the Risk Engine.
            </Text>
          </View>
        ) : (
          <>
            {/* Overall Score Card */}
            <View className="rounded-[22px] p-5 mb-5" style={glassCardSolid}>
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-[16px] font-bold text-[#1B1E22]">Gemma-9B Score</Text>
                <View className="px-3.5 py-1.5 rounded-[20px]" style={{ backgroundColor: statusBg }}>
                  <Text className="text-[12px] font-bold text-[#1B1E22]">{statusLabel}</Text>
                </View>
              </View>
              
              <View className="flex-row items-baseline mb-4">
                <Text className="text-[56px] font-bold text-[#1B1E22] tracking-tighter">{score}</Text>
                <Text className="text-[18px] font-bold text-[#7A8188] ml-1">/100</Text>
              </View>
              
              {/* Score bar */}
              <View className="h-2 rounded-full bg-[#E6EBF0] mb-3">
                <View className="h-full rounded-full bg-[#1B1E22]" style={{ width: `${Math.min(score, 100)}%` }} />
              </View>
              
              <Text className="text-[13px] font-medium text-[#7A8188] mb-1">
                Higher scores indicate a greater cumulative health risk factoring in NASA environment intelligence.
              </Text>
              {healthData?.last_calculated && (
                <Text className="text-[11px] font-bold text-[#A0A5AA] mt-2">
                  Last evaluated: {new Date(healthData.last_calculated).toLocaleDateString()}
                </Text>
              )}
            </View>

            {statusStr === "calculating" && (
              <View className="rounded-[20px] p-4 mb-5 flex-row items-center bg-[#EAF1F6]" style={glassCard}>
                <ActivityIndicator color="#1B1E22" size="small" style={{ marginRight: 12 }} />
                <Text className="flex-1 text-[13px] font-bold text-[#1B1E22] leading-5">
                  Your profile has updated! The AI model is currently regenerating your score.
                </Text>
              </View>
            )}

            {/* Suggestions / Insights generated by backend */}
            {suggestions.length > 0 && (
              <View className="rounded-[22px] p-5 mb-5" style={glassCardSolid}>
                <Text className="text-[18px] font-bold text-[#1B1E22] mb-4">Actionable Insights</Text>
                {suggestions.map((suggestion, i) => (
                   <View key={i} className="flex-row items-start mb-3 bg-[#F4F6F7] p-4 rounded-[16px]">
                     <View className="mt-0.5 mr-3"><Feather name="activity" size={20} color="#1B1E22" /></View>
                     <Text className="flex-1 text-[14px] font-medium text-[#1B1E22] leading-5">
                       {suggestion}
                     </Text>
                   </View>
                ))}
              </View>
            )}

            {/* Disclaimer */}
            <View className="flex-row rounded-[22px] p-5 gap-3 mt-2 items-center" style={glassCard}>
              <Feather name="alert-circle" size={20} color="#7A8188" />
              <Text className="flex-1 text-[13px] font-medium text-[#7A8188] leading-5 ml-2">
                Scores and insights are generated utilizing experimental AI model inferencing and NASA API telemetry. Do not replace professional medical evaluations.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
