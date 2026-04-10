import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Feather } from "@expo/vector-icons";
import { glassCard, glassCardSolid, buttonShadow } from "../theme";

const PATIENTS = [
  { id: 1, name: "Rajesh Kumar", role: "Mining Worker", score: 72, risk: "High", date: "Today", bg: "#FFFFFF" },
  { id: 2, name: "Amit Singh", role: "Furnace Operator", score: 85, risk: "High", date: "Today", bg: "#EAF1F6" },
  { id: 3, name: "Suresh Patel", role: "Assembly Line", score: 45, risk: "Moderate", date: "Yesterday", bg: "#EEEAF7" },
  { id: 4, name: "Vikram Das", role: "Chemical Plant", score: 38, risk: "Moderate", date: "Yesterday", bg: "#FFFFFF" },
  { id: 5, name: "Manoj Tiwari", role: "Warehouse", score: 12, risk: "Low", date: "2 days ago", bg: "#E7F3EA" },
];

export default function PatientsListScreen() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const filteredPatients = PATIENTS.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "All" || p.risk === filter;
    return matchSearch && matchFilter;
  });

  return (
    <View className="flex-1 bg-[#F4F6F7] relative">
      <View className="absolute w-[350px] h-[350px] rounded-full bg-[#EAF1F6] -top-[120px] -right-[120px] opacity-80" />
      <View className="absolute w-[200px] h-[200px] rounded-full bg-[#E7F3EA] top-[80px] -left-[60px] opacity-80" />
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 60, paddingBottom: 100 }}>

        <View className="mb-5">
          <Text className="text-[28px] font-bold text-[#1B1E22]">Patient Directory</Text>
          <Text className="text-[14px] font-medium text-[#7A8188] mt-1">248 assigned workers</Text>
        </View>

        {/* Stats — Glass */}
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 rounded-[22px] p-4" style={glassCard}>
            <Text className="text-[24px] font-bold text-[#1B1E22]">34</Text>
            <Text className="text-[12px] font-bold text-[#7A8188]">High Risk</Text>
          </View>
          <View className="flex-1 rounded-[22px] p-4" style={glassCard}>
            <Text className="text-[24px] font-bold text-[#1B1E22]">67</Text>
            <Text className="text-[12px] font-bold text-[#7A8188]">Moderate</Text>
          </View>
          <View className="flex-1 rounded-[22px] p-4" style={glassCard}>
            <Text className="text-[24px] font-bold text-[#1B1E22]">147</Text>
            <Text className="text-[12px] font-bold text-[#7A8188]">Low Risk</Text>
          </View>
        </View>

        {/* Search — Glass */}
        <View className="flex-row items-center rounded-[22px] px-4 h-[52px] mb-4" style={glassCardSolid}>
          <View className="mr-3"><Feather name="search" size={18} color="#1B1E22" /></View>
          <TextInput
            placeholder="Search patients..."
            placeholderTextColor="#7A8188"
            value={search}
            onChangeText={setSearch}
            className="flex-1 text-[16px] font-medium text-[#1B1E22]"
          />
        </View>

        {/* Filter Tabs — Glass Pills */}
        <View className="flex-row gap-2 mb-6">
          {(["All", "High", "Moderate", "Low"]).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              className={`rounded-[20px] px-4 py-2`}
              style={filter === f
                ? { backgroundColor: '#000000', ...buttonShadow }
                : glassCard
              }
            >
              <Text className={`text-[13px] font-bold ${filter === f ? 'text-white' : 'text-[#7A8188]'}`}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* List — Glass Cards */}
        {filteredPatients.map((patient) => {
          const isHigh = patient.risk === "High";
          return (
            <TouchableOpacity key={patient.id} activeOpacity={0.7} className="rounded-[22px] p-5 mb-4" style={[glassCardSolid, { backgroundColor: patient.bg === '#FFFFFF' ? 'rgba(255,255,255,0.55)' : patient.bg }]}>
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-row items-center flex-1">
                  <View className="w-12 h-12 rounded-[20px] bg-[#EAF1F6] items-center justify-center mr-3">
                    <Text className="text-[16px] font-bold text-[#1B1E22]">
                      {patient.name.split(" ").map(n => n[0]).join("")}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-[16px] font-bold text-[#1B1E22]">{patient.name}</Text>
                    <Text className="text-[13px] font-medium text-[#7A8188]">{patient.role}</Text>
                  </View>
                </View>
                {isHigh && (
                  <View className="bg-[#1B1E22] px-2.5 py-1 rounded-[20px]">
                    <Text className="text-[11px] font-bold text-white">Critical</Text>
                  </View>
                )}
              </View>

              <View className="flex-row items-center mt-2">
                <View className="flex-1">
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-[12px] font-bold text-[#7A8188]">Risk Score</Text>
                    <Text className="text-[14px] font-bold text-[#1B1E22]">{patient.score}/100</Text>
                  </View>
                  <View className="h-1.5 rounded-full bg-[#E6EBF0]">
                    <View className="h-full rounded-full bg-[#1B1E22]" style={{ width: `${patient.score}%` }} />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        <View className="h-10" />
      </ScrollView>
    </View>
  );
}
