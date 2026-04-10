import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Feather } from "@expo/vector-icons";
import { glassCard, glassCardSolid, buttonShadow } from "../theme";

const INSIGHTS = [
  { id: 1, type: "critical", icon: "alert-triangle", bg: "#EAF1F6", title: "High dust exposure detected in Shaft A", desc: "12 workers in Zone A1 show elevated silicosis risk scores.", time: "2 hours ago" },
  { id: 2, type: "warning", icon: "alert-circle", bg: "#EEEAF7", title: "Noise levels exceeding threshold", desc: "Average noise exposure exceeds 85 dB for 18 workers.", time: "5 hours ago" },
  { id: 3, type: "info", icon: "check-circle", bg: "#E7F3EA", title: "Monthly risk trend improving", desc: "Average risk score dropped from 35 to 22 this month.", time: "1 day ago" },
];

const TREND_DATA = [
  { month: "Oct", score: 48 },
  { month: "Nov", score: 45 },
  { month: "Dec", score: 42 },
  { month: "Jan", score: 44 },
  { month: "Feb", score: 39 },
  { month: "Mar", score: 37 },
];

export default function InsightsScreen() {
  return (
    <View className="flex-1 bg-[#F4F6F7] relative">
      <View className="absolute w-[350px] h-[350px] rounded-full bg-[#EAF1F6] -top-[120px] -right-[120px] opacity-80" />
      <View className="absolute w-[200px] h-[200px] rounded-full bg-[#E7F3EA] top-[80px] -left-[60px] opacity-80" />
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 60, paddingBottom: 100 }}>

        <View className="mb-6">
          <Text className="text-[28px] font-bold text-[#1B1E22]">AI Insights</Text>
          <Text className="text-[14px] font-medium text-[#7A8188] mt-1">Intelligent alerts & recommendations</Text>
        </View>

        {/* Risk Trend — Glass */}
        <View className="rounded-[22px] p-5 mb-5" style={glassCardSolid}>
          <Text className="text-[18px] font-bold text-[#1B1E22] mb-5">Risk Trend (6 Months)</Text>
          <View className="flex-row justify-between items-end h-[120px] mb-4">
            {TREND_DATA.map((item, i) => {
              const maxScore = 60;
              const heightPct = (item.score / maxScore) * 100;
              return (
                <View key={i} className="items-center flex-1">
                  <View className="w-[28px] h-[90px] bg-[#F4F6F7] rounded-full justify-end overflow-hidden mb-2">
                    <View className="w-full rounded-full bg-[#1B1E22]" style={{ height: `${heightPct}%` }} />
                  </View>
                  <Text className="text-[11px] font-bold text-[#1B1E22] mb-1">{item.score}</Text>
                  <Text className="text-[11px] font-bold text-[#7A8188]">{item.month}</Text>
                </View>
              );
            })}
          </View>
          <View className="bg-[#E7F3EA] rounded-[20px] p-3 items-center flex-row justify-center">
            <Feather name="arrow-down" size={12} color="#1B1E22" style={{ marginRight: 4 }} />
            <Text className="text-[12px] font-bold text-[#1B1E22]">23% decrease in risk over 6 months</Text>
          </View>
        </View>

        {/* Insight Cards — Glass */}
        <Text className="text-[18px] font-bold text-[#1B1E22] mb-4">Recent Insights</Text>
        {INSIGHTS.map((insight) => (
          <View key={insight.id} className="rounded-[22px] p-5 mb-4" style={[glassCard, { backgroundColor: insight.bg }]}>
            <View className="flex-row mb-3">
              <View className="mr-3 mt-1"><Feather name={insight.icon as any} size={24} color="#1B1E22" /></View>
              <View className="flex-1">
                <Text className="text-[16px] font-bold text-[#1B1E22] leading-6">{insight.title}</Text>
                <Text className="text-[12px] font-bold text-[#7A8188] mt-1">{insight.time}</Text>
              </View>
            </View>
            <Text className="text-[14px] font-medium text-[#1B1E22] mb-4 leading-5">{insight.desc}</Text>
            <TouchableOpacity className="bg-[#000000] rounded-[30px] py-3 items-center" style={buttonShadow}>
              <Text className="text-white text-[14px] font-bold">Review Action</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View className="h-10" />
      </ScrollView>
    </View>
  );
}
