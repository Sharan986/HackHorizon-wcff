import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { glassCard, glassCardSolid, buttonShadow } from "../theme";
import {
  getHealthScore,
  getReports,
} from "../services/api";

const { width } = Dimensions.get('window');

function CircularProgress({ score }: { score: number }) {
  const size = width * 0.45; // Responsive circle
  const strokeWidth = 14;

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      {/* Background circle */}
      <View
        style={{
          width: size, height: size, borderRadius: size / 2,
          borderWidth: strokeWidth, borderColor: "#E6EBF0",
          position: "absolute",
        }}
      />
      {/* Dynamic front circle logic block */}
      <View
        style={{
          width: size, height: size, borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: score > 0 ? "#1B1E22" : "transparent",
          borderTopColor: score > 25 ? "#1B1E22" : (score > 0 ? "#1B1E22" : "transparent"),
          borderRightColor: score > 50 ? "#1B1E22" : "transparent",
          borderBottomColor: score > 75 ? "#1B1E22" : "transparent",
          borderLeftColor: "transparent",
          position: "absolute",
          transform: [{ rotate: "-90deg" }],
        }}
      />
      <Text className="text-[48px] font-bold text-[#1B1E22] tracking-tighter">{score}</Text>
      <Text className="text-[12px] font-bold text-[#7A8188]">AI Score</Text>
    </View>
  );
}

export default function WorkerHomeScreen() {
  const [score, setScore] = useState(0);
  const [scoreStatus, setScoreStatus] = useState("not_calculated");
  const [reportCount, setReportCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const [healthResult, reportsResult] = await Promise.all([
        getHealthScore(),
        getReports()
      ]);
      
      if (healthResult.success && healthResult.data) {
        setScore(healthResult.data.score || 0);
        setScoreStatus(healthResult.data.status);
      }
      if (reportsResult.success && reportsResult.data) {
        setReportCount(reportsResult.data.length);
      }
    } catch(e) {}
  }, []);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await fetchDashboard();
      setIsLoading(false);
    })();
  }, [fetchDashboard]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  }, [fetchDashboard]);

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

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
        {/* Header Section */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-[14px] font-medium text-[#7A8188] leading-5">{greeting}</Text>
              <Text className="text-[28px] font-bold text-[#1B1E22] leading-8 mt-1">Dashboard</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(worker)/profile')} className="w-11 h-11 rounded-[22px] items-center justify-center bg-[#EAF1F6]">
              <Feather name="user" size={20} color="#1B1E22" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Global Score Card — Glass */}
        <View className="rounded-[22px] p-6 my-3 items-center justify-center" style={glassCardSolid}>
          <Text className="text-[18px] font-bold text-[#1B1E22] mb-6 self-start">Current AI Evaluation</Text>
          
          {isLoading ? (
             <View className="py-10"><ActivityIndicator size="large" color="#1B1E22" /></View>
          ) : scoreStatus === 'not_calculated' ? (
             <View className="py-6 items-center">
                <Feather name="moon" size={32} color="#7A8188" />
                <Text className="text-[14px] font-bold text-[#1B1E22] mt-3">Idle Model</Text>
                <Text className="text-[12px] font-medium text-[#7A8188] mt-1 text-center px-4">Initialize by uploading a medical history document.</Text>
             </View>
          ) : (
            <CircularProgress score={scoreStatus === 'calculating' ? 0 : score} />
          )}

          {scoreStatus === 'calculating' && (
            <View className="bg-[#1B1E22] rounded-[20px] px-4 py-2 mt-6 flex-row items-center">
               <ActivityIndicator color="#FFF" size="small" style={{ marginRight: 8 }}/>
               <Text className="text-[13px] font-bold text-white">Analyzing Data...</Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View className="flex-row justify-between my-3 gap-2">
          <TouchableOpacity onPress={() => router.push('/(worker)/profile')} className="flex-1 rounded-[22px] p-4 items-center bg-[#EEEAF7]" style={glassCard}>
            <View className="mb-2"><Feather name="settings" size={24} color="#1B1E22" /></View>
            <Text className="text-[13px] font-bold text-[#1B1E22] text-center">Update{"\n"}Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(worker)/risk')} className="flex-1 rounded-[22px] p-4 items-center bg-[#EAF1F6]" style={glassCard}>
            <View className="mb-2"><Feather name="bar-chart-2" size={24} color="#1B1E22" /></View>
            <Text className="text-[13px] font-bold text-[#1B1E22] text-center">View{"\n"}Insights</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(worker)/reports')} className="flex-1 rounded-[22px] p-4 items-center bg-[#E7F3EA]" style={glassCard}>
            <View className="mb-2"><Feather name="folder" size={24} color="#1B1E22" /></View>
            <Text className="text-[13px] font-bold text-[#1B1E22] text-center">Saved{"\n"}({reportCount})</Text>
          </TouchableOpacity>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          onPress={() => router.push('/(worker)/reports')}
          activeOpacity={0.8}
          className="bg-[#000000] rounded-[30px] h-[52px] justify-center items-center my-4 flex-row"
          style={buttonShadow}
        >
           <Feather name="upload" size={18} color="#FFF" style={{ marginRight: 8 }} />
           <Text className="text-white text-[16px] font-bold text-center">Upload Medical Report</Text>
        </TouchableOpacity>

        {/* Health Tip */}
        <View className="rounded-[22px] p-5 my-3 bg-[#E7F3EA]" style={glassCard}>
          <View className="flex-row items-start">
            <View className="mr-3.5"><Feather name="info" size={20} color="#1B1E22" /></View>
            <View className="flex-1">
              <Text className="text-[16px] font-bold text-[#1B1E22]">Backend Connection</Text>
              <Text className="text-[14px] font-medium text-[#7A8188] leading-5 mt-1.5">
                The App is synchronized with real NASA endpoint data evaluating your work city environment. 
              </Text>
            </View>
          </View>
        </View>

        <View className="h-10" />
      </ScrollView>
    </View>
  );
}
