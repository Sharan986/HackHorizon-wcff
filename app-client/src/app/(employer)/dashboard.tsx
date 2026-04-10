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

const OVERVIEW_STATS = [
  { label: "Total Workers", value: "248", icon: "users", bg: "#EAF1F6" },
  { label: "High Risk", value: "34", icon: "alert-triangle", bg: "#E7F3EA" },
  { label: "Moderate", value: "67", icon: "alert-circle", bg: "#EEEAF7" },
  { label: "Low Risk", value: "147", icon: "check-circle", bg: "#FFFFFF" },
];

const DEPARTMENT_RISKS = [
  { name: "Mining Shaft A", workers: 42, highRisk: 12, avgScore: 68, trend: "trending-up" },
  { name: "Steel Furnace B", workers: 38, highRisk: 8, avgScore: 55, trend: "trending-down" },
  { name: "Chemical Plant C", workers: 31, highRisk: 6, avgScore: 49, trend: "minus" },
  { name: "Assembly Line D", workers: 56, highRisk: 4, avgScore: 32, trend: "trending-down" },
];

export default function EmployerDashboard() {
  return (
    <View className="flex-1 bg-[#F4F6F7] relative">
      <View className="absolute w-[350px] h-[350px] rounded-full bg-[#EAF1F6] -top-[120px] -right-[120px] opacity-80" />
      <View className="absolute w-[200px] h-[200px] rounded-full bg-[#E7F3EA] top-[80px] -left-[60px] opacity-80" />
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 60, paddingBottom: 100 }}>

        {/* Header Section */}
        <View className="mb-6 flex-row justify-between items-center">
          <View>
            <Text className="text-[14px] font-medium text-[#7A8188] leading-5">Employer Dashboard</Text>
            <Text className="text-[28px] font-bold text-[#1B1E22] leading-8 mt-1">TechSteel Ind.</Text>
          </View>
          <View className="w-12 h-12 rounded-[22px] bg-[#1B1E22] items-center justify-center" style={buttonShadow}>
            <Text className="text-[16px] font-bold text-white">TS</Text>
          </View>
        </View>

        {/* Overview Grid — Glass */}
        <View className="flex-row flex-wrap justify-between my-3 gap-y-4">
          {OVERVIEW_STATS.map((stat, i) => (
            <View key={i} className="w-[48%] rounded-[22px] p-5 items-center" style={[glassCard, { backgroundColor: stat.bg === '#FFFFFF' ? 'rgba(255,255,255,0.55)' : stat.bg }]}>
              <View className="mb-2"><Feather name={stat.icon as any} size={24} color="#1B1E22" /></View>
              <Text className="text-[24px] font-bold text-[#1B1E22]">{stat.value}</Text>
              <Text className="text-[13px] font-bold text-[#7A8188] mt-1">{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Risk Distribution — Glass */}
        <View className="rounded-[22px] p-5 my-3" style={glassCardSolid}>
          <Text className="text-[18px] font-bold text-[#1B1E22] mb-4">Risk Distribution</Text>
          <View className="flex-row h-3 rounded-full overflow-hidden gap-1 mb-4">
            <View style={{ flex: 34, backgroundColor: '#1B1E22' }} />
            <View style={{ flex: 67, backgroundColor: '#EEEAF7' }} />
            <View style={{ flex: 147, backgroundColor: '#EAF1F6' }} />
          </View>
          <View className="flex-row justify-between mt-2">
            <View className="flex-row items-center gap-2">
              <View className="w-2.5 h-2.5 rounded-full bg-[#1B1E22]" />
              <Text className="text-[13px] font-bold text-[#7A8188]">High (14%)</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <View className="w-2.5 h-2.5 rounded-full bg-[#EEEAF7]" />
              <Text className="text-[13px] font-bold text-[#7A8188]">Mod (27%)</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <View className="w-2.5 h-2.5 rounded-full bg-[#EAF1F6]" />
              <Text className="text-[13px] font-bold text-[#7A8188]">Low (59%)</Text>
            </View>
          </View>
        </View>

        {/* Department Table — Glass Cards */}
        <View className="my-3">
          <Text className="text-[18px] font-bold text-[#1B1E22] mb-4">Department Risks</Text>
          {DEPARTMENT_RISKS.map((dept, i) => (
            <TouchableOpacity key={i} className="rounded-[22px] p-5 mb-4" style={glassCardSolid} activeOpacity={0.7}>
              <View className="flex-row justify-between items-center mb-3">
                <View>
                  <Text className="text-[16px] font-bold text-[#1B1E22]">{dept.name}</Text>
                  <Text className="text-[13px] font-medium text-[#7A8188] mt-1">
                    {dept.workers} workers • {dept.highRisk} at risk
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-[24px] font-bold text-[#1B1E22]">{dept.avgScore}</Text>
                  <View className="ml-1"><Feather name={dept.trend as any} size={16} color="#7A8188" /></View>
                </View>
              </View>
              <View className="h-1.5 rounded-full bg-[#E6EBF0]">
                <View style={{ width: `${dept.avgScore}%`, backgroundColor: '#1B1E22', height: '100%', borderRadius: 3 }} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View className="h-10" />
      </ScrollView>
    </View>
  );
}
