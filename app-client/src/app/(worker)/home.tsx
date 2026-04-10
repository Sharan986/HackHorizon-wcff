import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from 'expo-image-picker';
import { Feather } from "@expo/vector-icons";
import { glassCard, glassCardSolid, buttonShadow } from "../theme";
import {
  getWorkerDashboard,
  uploadWorkerReport,
  type RiskSummaryItem,
  type ReportItem,
} from "../services/api";

const CARD_COLORS = ["#FFFFFF", "#EAF1F6", "#EEEAF7"];

// Fallback data shown while API loads or if API fails
const FALLBACK_RISKS: RiskSummaryItem[] = [
  { label: "Silicosis", score: 0, status: "--" },
  { label: "Hearing", score: 0, status: "--" },
  { label: "Toxicity", score: 0, status: "--" },
];

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "high": return "#E7F3EA";
    case "moderate": return "#EEEAF7";
    case "low": return "#EAF1F6";
    default: return "#E6EBF0";
  }
}

function CircularProgress({ score }: { score: number }) {
  const size = 64;
  const strokeWidth = 6;

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <View
        style={{
          width: size, height: size, borderRadius: size / 2,
          borderWidth: strokeWidth, borderColor: "#E6EBF0",
          position: "absolute",
        }}
      />
      <View
        style={{
          width: size, height: size, borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: "#1B1E22",
          borderTopColor: score > 25 ? "#1B1E22" : "transparent",
          borderRightColor: score > 50 ? "#1B1E22" : "transparent",
          borderBottomColor: score > 75 ? "#1B1E22" : "transparent",
          borderLeftColor: "transparent",
          position: "absolute",
          transform: [{ rotate: "-90deg" }],
        }}
      />
      <Text className="text-[16px] font-bold text-[#1B1E22]">{score}</Text>
    </View>
  );
}

export default function WorkerHomeScreen() {
  const [risks, setRisks] = useState<RiskSummaryItem[]>(FALLBACK_RISKS);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [userName, setUserName] = useState("Worker");
  const [healthTip, setHealthTip] = useState("Wear N95 masks in high-dust zones. Regular use can reduce silica inhalation by up to 95%.");
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    const result = await getWorkerDashboard();

    if (result.success && result.data) {
      const d = result.data;
      if (d.risks?.length) setRisks(d.risks);
      if (d.recentReports?.length) setReports(d.recentReports);
      if (d.user?.name) setUserName(d.user.name);
      if (d.healthTip) setHealthTip(d.healthTip);
    }
    // If API fails, we keep the fallback/current state — no crash
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

  // ─── Upload Logic ───────────────────────────────────────────

  const handleUploadReport = () => {
    Alert.alert("Upload Report", "Choose a method to upload your report", [
      { text: "Camera", onPress: openCamera },
      { text: "Gallery", onPress: openGallery },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert("Permission Needed", "Please grant camera permissions.");
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const fileName = asset.fileName || `report_${Date.now()}.jpg`;
      await doUpload(asset.uri, fileName);
    }
  };

  const openGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert("Permission Needed", "Please grant gallery permissions.");
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.8,
      mediaTypes: ['images'],
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const fileName = asset.fileName || `report_${Date.now()}.jpg`;
      await doUpload(asset.uri, fileName);
    }
  };

  const doUpload = async (uri: string, fileName: string) => {
    setIsUploading(true);
    const result = await uploadWorkerReport(uri, fileName);
    setIsUploading(false);

    if (result.success) {
      Alert.alert("Success", "Report uploaded for analysis!");
      // Refresh dashboard to get updated reports
      await fetchDashboard();
    } else {
      Alert.alert("Upload Failed", result.message || "Could not upload report.");
    }
  };

  // ─── Greeting based on time ─────────────────────────────────

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  // ─── Render ─────────────────────────────────────────────────

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
              <Text className="text-[14px] font-medium text-[#7A8188] leading-5">{getGreeting()}</Text>
              <Text className="text-[28px] font-bold text-[#1B1E22] leading-8 mt-1">{userName}</Text>
            </View>
            <TouchableOpacity className="w-11 h-11 rounded-[22px] items-center justify-center" style={glassCard}>
              <Feather name="bell" size={20} color="#1B1E22" />
            </TouchableOpacity>
          </View>
          <Text className="text-[14px] font-medium text-[#7A8188] leading-5 mt-2">How are you feeling today?</Text>
        </View>

        {/* Risk Summary Card */}
        <View className="rounded-[22px] p-5 my-3" style={glassCardSolid}>
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-[18px] font-bold text-[#1B1E22]">Risk Summary</Text>
            <TouchableOpacity><Text className="text-[14px] font-bold text-[#1B1E22]">See Details</Text></TouchableOpacity>
          </View>

          {isLoading ? (
            <View className="py-8 items-center">
              <ActivityIndicator size="large" color="#1B1E22" />
              <Text className="text-[13px] font-medium text-[#7A8188] mt-3">Loading risk data…</Text>
            </View>
          ) : (
            <View className="flex-row justify-around">
              {risks.map((risk, i) => (
                <View key={i} className="items-center">
                  <CircularProgress score={risk.score} />
                  <Text className="text-[13px] font-semibold text-[#7A8188] mt-2 mb-2">{risk.label}</Text>
                  <View className="rounded-[20px] px-3.5 py-1.5" style={{ backgroundColor: getStatusColor(risk.status) }}>
                    <Text className="text-[12px] font-medium text-[#1B1E22]">{risk.status}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View className="flex-row justify-between my-3 gap-2">
          <TouchableOpacity onPress={handleUploadReport} className="flex-1 rounded-[22px] p-4 items-center bg-[#E7F3EA]" style={glassCard}>
            <View className="mb-2"><Feather name="file-plus" size={24} color="#1B1E22" /></View>
            <Text className="text-[13px] font-bold text-[#1B1E22] text-center">Upload{"\n"}Report</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 rounded-[22px] p-4 items-center bg-[#EAF1F6]" style={glassCard}>
            <View className="mb-2"><Feather name="bar-chart-2" size={24} color="#1B1E22" /></View>
            <Text className="text-[13px] font-bold text-[#1B1E22] text-center">View{"\n"}Analysis</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 rounded-[22px] p-4 items-center bg-[#EEEAF7]" style={glassCard}>
            <View className="mb-2"><Feather name="activity" size={24} color="#1B1E22" /></View>
            <Text className="text-[13px] font-bold text-[#1B1E22] text-center">Get{"\n"}Advice</Text>
          </TouchableOpacity>
        </View>

        {/* Upload CTA */}
        <TouchableOpacity
          onPress={handleUploadReport}
          activeOpacity={0.8}
          disabled={isUploading}
          className="bg-[#000000] rounded-[30px] h-[52px] justify-center items-center my-4 flex-row"
          style={[buttonShadow, isUploading && { opacity: 0.7 }]}
        >
          {isUploading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text className="text-white text-[16px] font-bold text-center">Upload Medical Report</Text>
          )}
        </TouchableOpacity>

        {/* Recent Reports */}
        <View className="my-3">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-[18px] font-bold text-[#1B1E22]">Recent Reports</Text>
            <TouchableOpacity><Text className="text-[14px] font-bold text-[#1B1E22]">View All</Text></TouchableOpacity>
          </View>

          {isLoading ? (
            <View className="py-6 items-center">
              <ActivityIndicator size="small" color="#1B1E22" />
            </View>
          ) : reports.length === 0 ? (
            <View className="rounded-[22px] p-8 items-center" style={glassCard}>
              <Feather name="file" size={32} color="#7A8188" />
              <Text className="text-[14px] font-medium text-[#7A8188] mt-3 text-center">No reports yet. Upload your first medical report above.</Text>
            </View>
          ) : (
            reports.map((report, index) => {
              const bg = CARD_COLORS[index % CARD_COLORS.length];
              return (
                <TouchableOpacity key={report.id} activeOpacity={0.7} className="flex-row items-center p-5 mb-4 rounded-[22px]" style={[glassCard, { backgroundColor: bg === '#FFFFFF' ? 'rgba(255,255,255,0.55)' : bg }]}>
                  <View className="w-12 h-12 rounded-[24px] items-center justify-center mr-4" style={glassCard}>
                    <Feather name="clipboard" size={20} color="#1B1E22" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[16px] font-bold text-[#1B1E22]">{report.name}</Text>
                    <Text className="text-[14px] font-medium text-[#7A8188] mt-1">{report.date}</Text>
                  </View>
                  <View className="bg-[#E6EBF0] rounded-[20px] px-3.5 py-1.5">
                    <Text className="text-[12px] font-medium text-[#1B1E22]">{report.status}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Health Tip */}
        <View className="rounded-[22px] p-5 my-3 bg-[#E7F3EA]" style={glassCard}>
          <View className="flex-row items-start">
            <View className="mr-3.5"><Feather name="info" size={20} color="#1B1E22" /></View>
            <View className="flex-1">
              <Text className="text-[16px] font-bold text-[#1B1E22]">Daily Health Tip</Text>
              <Text className="text-[14px] font-medium text-[#7A8188] leading-5 mt-1.5">{healthTip}</Text>
            </View>
          </View>
        </View>

        <View className="h-10" />
      </ScrollView>
    </View>
  );
}
