import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Feather } from "@expo/vector-icons";
import { glassCard, glassCardSolid, buttonShadow } from "../theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const ZONES = [
  [
    { id: "A1", name: "Shaft A1", risk: 82, workers: 12 },
    { id: "A2", name: "Tunnel A2", risk: 75, workers: 8 },
    { id: "A3", name: "Drill A3", risk: 68, workers: 15 },
    { id: "A4", name: "Vent A4", risk: 45, workers: 6 },
  ],
  [
    { id: "B1", name: "Furnace B1", risk: 62, workers: 18 },
    { id: "B2", name: "Press B2", risk: 38, workers: 14 },
    { id: "B3", name: "Mold B3", risk: 55, workers: 10 },
    { id: "B4", name: "Cast B4", risk: 42, workers: 12 },
  ],
  [
    { id: "C1", name: "Chem Lab C1", risk: 71, workers: 8 },
    { id: "C2", name: "Storage C2", risk: 28, workers: 6 },
    { id: "C3", name: "Mixing C3", risk: 58, workers: 9 },
    { id: "C4", name: "Pack C4", risk: 15, workers: 20 },
  ],
  [
    { id: "D1", name: "Assembly D1", risk: 22, workers: 25 },
    { id: "D2", name: "Weld D2", risk: 48, workers: 11 },
    { id: "D3", name: "QC D3", risk: 12, workers: 18 },
    { id: "D4", name: "Dock D4", risk: 8, workers: 30 },
  ],
];

function getHeatColor(risk: number): string {
  if (risk >= 70) return "#1B1E22";
  if (risk >= 35) return "#7A8188";
  return "#E6EBF0";
}

function getHeatTextColor(risk: number): string {
  if (risk >= 35) return "#FFFFFF";
  return "#1B1E22";
}

export default function HeatmapScreen() {
  const [selectedZone, setSelectedZone] = useState<typeof ZONES[0][0] | null>(null);

  const cellSize = (SCREEN_WIDTH - 64) / 4;

  return (
    <View className="flex-1 bg-[#F4F6F7] relative">
      <View className="absolute w-[350px] h-[350px] rounded-full bg-[#EAF1F6] -top-[120px] -right-[120px] opacity-80" />
      <View className="absolute w-[200px] h-[200px] rounded-full bg-[#E7F3EA] top-[80px] -left-[60px] opacity-80" />
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 60, paddingBottom: 100 }}>

        <View className="mb-6">
          <Text className="text-[28px] font-bold text-[#1B1E22]">Risk Heatmap</Text>
          <Text className="text-[14px] font-medium text-[#7A8188] mt-1">Zone-based risk visualization</Text>
        </View>

        {/* Heatmap Grid — Glass */}
        <View className="rounded-[22px] p-4 mb-5" style={glassCardSolid}>
          <Text className="text-[16px] font-bold text-[#1B1E22] mb-4 pl-1">Facility Map</Text>
          {ZONES.map((row, ri) => (
            <View key={ri} className="flex-row gap-2 mb-2 justify-center">
              {row.map((zone) => {
                const isSelected = selectedZone?.id === zone.id;
                return (
                  <TouchableOpacity
                    key={zone.id}
                    onPress={() => setSelectedZone(zone)}
                    activeOpacity={0.8}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: getHeatColor(zone.risk),
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: isSelected ? 3 : 0,
                      borderColor: '#000000'
                    }}
                  >
                    <Text className="text-[14px] font-bold" style={{ color: getHeatTextColor(zone.risk) }}>{zone.id}</Text>
                    <Text className="text-[10px] font-medium mt-1" style={{ color: getHeatTextColor(zone.risk), opacity: 0.8 }}>{zone.risk}%</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Legend — Glass */}
        <View className="flex-row justify-around rounded-[22px] p-4 mb-5" style={glassCard}>
          <View className="flex-row items-center gap-2">
            <View className="w-3 h-3 rounded-full bg-[#1B1E22]" />
            <Text className="text-[13px] font-bold text-[#7A8188]">High</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <View className="w-3 h-3 rounded-full bg-[#7A8188]" />
            <Text className="text-[13px] font-bold text-[#7A8188]">Mod</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <View className="w-3 h-3 rounded-full bg-[#E6EBF0]" />
            <Text className="text-[13px] font-bold text-[#7A8188]">Low</Text>
          </View>
        </View>

        {/* Detail Card — Glass */}
        {selectedZone && (
          <View className="rounded-[22px] p-5 mb-5" style={glassCardSolid}>
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-[20px] bg-[#EAF1F6] items-center justify-center mr-3">
                  <Text className="text-[16px] font-bold text-[#1B1E22]">{selectedZone.id}</Text>
                </View>
                <View>
                  <Text className="text-[18px] font-bold text-[#1B1E22]">{selectedZone.name}</Text>
                  <Text className="text-[13px] font-medium text-[#7A8188] mt-1">{selectedZone.workers} workers active</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setSelectedZone(null)} className="w-8 h-8 items-center justify-center rounded-full" style={glassCard}>
                <Feather name="x" size={16} color="#1B1E22" />
              </TouchableOpacity>
            </View>

            <View className="flex-row gap-3 mb-4">
              <View className="flex-1 rounded-[20px] p-4" style={glassCard}>
                <Text className="text-[12px] font-bold text-[#7A8188] mb-1">Risk Score</Text>
                <Text className="text-[20px] font-bold text-[#1B1E22]">{selectedZone.risk}/100</Text>
              </View>
              <View className="flex-1 rounded-[20px] p-4" style={glassCard}>
                <Text className="text-[12px] font-bold text-[#7A8188] mb-1">Status</Text>
                <Text className="text-[16px] font-bold text-[#1B1E22]">{selectedZone.risk >= 70 ? 'Critical' : selectedZone.risk >= 35 ? 'Warning' : 'Safe'}</Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              className="bg-[#000000] rounded-[30px] h-[52px] justify-center items-center"
              style={buttonShadow}
            >
              <Text className="text-white text-[16px] font-bold">View Full Report</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Summary — Glass */}
        <View className="rounded-[22px] p-5" style={glassCardSolid}>
          <Text className="text-[18px] font-bold text-[#1B1E22] mb-4">Grid Summary</Text>
          <View className="flex-row justify-between">
            <View className="items-center">
              <Text className="text-[24px] font-bold text-[#1B1E22]">16</Text>
              <Text className="text-[12px] font-bold text-[#7A8188] mt-1">Zones</Text>
            </View>
            <View className="items-center">
              <Text className="text-[24px] font-bold text-[#1B1E22]">4</Text>
              <Text className="text-[12px] font-bold text-[#7A8188] mt-1">Critical</Text>
            </View>
            <View className="items-center">
              <Text className="text-[24px] font-bold text-[#1B1E22]">5</Text>
              <Text className="text-[12px] font-bold text-[#7A8188] mt-1">Warning</Text>
            </View>
            <View className="items-center">
              <Text className="text-[24px] font-bold text-[#1B1E22]">7</Text>
              <Text className="text-[12px] font-bold text-[#7A8188] mt-1">Safe</Text>
            </View>
          </View>
        </View>

        <View className="h-10" />
      </ScrollView>
    </View>
  );
}
