import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Feather } from "@expo/vector-icons";
import { glassCard, glassCardSolid, buttonShadow } from "../theme";

const METRICS = [
  { label: "FEV1", value: "72%", ref: ">80%", status: "abnormal" },
  { label: "FVC", value: "81%", ref: ">80%", status: "normal" },
  { label: "Blood Pb", value: "8 µg/dL", ref: "<5 µg/dL", status: "abnormal" },
  { label: "O2 Sat", value: "96%", ref: ">95%", status: "normal" },
];

const SUGGESTIONS = [
  { id: 1, title: "Schedule High-Res CT Scan", desc: "To rule out early signs of silicosis given FEV1 drop.", icon: "plus-square", critical: true },
  { id: 2, title: "Recommend Job Rotation", desc: "Patient should be moved from active drilling to low-dust area.", icon: "refresh-cw", critical: true },
  { id: 3, title: "Repeat Blood Panel", desc: "Follow up on elevated blood lead levels in 30 days.", icon: "activity", critical: false },
];

export default function ClinicalScreen() {
  const [activeTab, setActiveTab] = useState("Vitals");

  return (
    <View className="flex-1 bg-[#F4F6F7] relative">
      <View className="absolute w-[350px] h-[350px] rounded-full bg-[#EAF1F6] -top-[120px] -right-[120px] opacity-80" />
      <View className="absolute w-[200px] h-[200px] rounded-full bg-[#E7F3EA] top-[80px] -left-[60px] opacity-80" />
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 60, paddingBottom: 100 }}>

        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-[28px] font-bold text-[#1B1E22]">Clinical View</Text>
            <Text className="text-[14px] font-medium text-[#7A8188] mt-1">Patient Profile & Metrics</Text>
          </View>
        </View>

        {/* Patient Hero Card — Glass */}
        <View className="rounded-[22px] p-5 mb-5" style={glassCardSolid}>
          <View className="flex-row mb-4">
            <View className="w-16 h-16 rounded-[22px] bg-[#EAF1F6] items-center justify-center mr-4">
              <Text className="text-[24px] font-bold text-[#1B1E22]">RK</Text>
            </View>
            <View className="flex-1">
              <View className="flex-row justify-between items-start">
                <Text className="text-[20px] font-bold text-[#1B1E22]">Rajesh Kumar</Text>
                <View className="bg-[#1B1E22] px-2.5 py-1 rounded-[20px]">
                  <Text className="text-[11px] font-bold text-white">Score: 72</Text>
                </View>
              </View>
              <Text className="text-[14px] font-medium text-[#7A8188] mt-1">Age 42 • Male • 15y Exposure</Text>
            </View>
          </View>
          <View className="flex-row flex-wrap gap-2 pt-4 border-t border-[#E6EBF0]">
            <View className="bg-[#E7F3EA] px-3 py-1.5 rounded-[20px]">
              <Text className="text-[12px] font-bold text-[#1B1E22]">Silica Dust</Text>
            </View>
            <View className="bg-[#EAF1F6] px-3 py-1.5 rounded-[20px]">
              <Text className="text-[12px] font-bold text-[#1B1E22]">Heavy Metals</Text>
            </View>
            <View className="bg-[#EEEAF7] px-3 py-1.5 rounded-[20px]">
              <Text className="text-[12px] font-bold text-[#1B1E22]">High Noise</Text>
            </View>
          </View>
        </View>

        {/* Tabs — Glass Container */}
        <View className="flex-row p-1.5 rounded-[24px] mb-5" style={glassCard}>
          {["Vitals", "Reports", "History"].map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`flex-1 items-center py-2.5 rounded-[20px]`}
              style={activeTab === tab ? glassCardSolid : undefined}
            >
              <Text className={`text-[13px] font-bold ${activeTab === tab ? 'text-[#1B1E22]' : 'text-[#7A8188]'}`}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Metrics Grid — Glass Cards */}
        <Text className="text-[18px] font-bold text-[#1B1E22] mb-3">Key Clinical Metrics</Text>
        <View className="flex-row flex-wrap gap-3 mb-6">
          {METRICS.map((m, i) => (
            <View key={i} className={`w-[48%] rounded-[22px] p-4 ${m.status === 'abnormal' ? 'border-[2px] border-[#1B1E22]' : ''}`} style={glassCardSolid}>
              <Text className="text-[14px] font-bold text-[#7A8188] mb-1">{m.label}</Text>
              <Text className={`text-[24px] font-bold ${m.status === 'abnormal' ? 'text-[#1B1E22]' : 'text-[#1B1E22]'}`}>{m.value}</Text>
              <Text className="text-[12px] font-medium text-[#7A8188] mt-1">Ref: {m.ref}</Text>
            </View>
          ))}
        </View>

        {/* Actions Suggested — Glass Cards */}
        <Text className="text-[18px] font-bold text-[#1B1E22] mb-3">AI Suggestions</Text>
        {SUGGESTIONS.map((s) => (
          <View key={s.id} className="rounded-[22px] p-5 mb-4" style={[glassCardSolid, s.critical ? { backgroundColor: '#EAF1F6' } : {}]}>
            <View className="flex-row items-start mb-3">
              <View className="mr-3 mt-1"><Feather name={s.icon as any} size={24} color="#1B1E22" /></View>
              <View className="flex-1">
                <Text className="text-[16px] font-bold text-[#1B1E22] leading-6">{s.title}</Text>
                <Text className="text-[14px] font-medium text-[#7A8188] mt-1">{s.desc}</Text>
              </View>
            </View>
            <TouchableOpacity className="bg-[#000000] rounded-[30px] p-3 items-center mt-2" style={buttonShadow}>
              <Text className="text-white text-[14px] font-bold">Approve Action</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View className="h-10" />
      </ScrollView>
    </View>
  );
}
