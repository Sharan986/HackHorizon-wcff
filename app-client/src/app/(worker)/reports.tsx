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
  getWorkerReports,
  uploadWorkerReport,
  type ReportItem,
} from "../services/api";

const CARD_COLORS = ["#FFFFFF", "#EAF1F6", "#EEEAF7"];
const typeIcons: Record<string, string> = { Lung: "wind", Hearing: "headphones", Blood: "droplet" };
const typeBgColors: Record<string, string> = { Lung: "bg-[#EAF1F6]", Hearing: "bg-[#E7F3EA]", Blood: "bg-[#EEEAF7]" };

export default function ReportsScreen() {
  const [filter, setFilter] = useState<"all" | "Analyzed" | "Pending">("all");
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = useCallback(async () => {
    const result = await getWorkerReports();
    if (result.success && result.data) {
      setReports(result.data.reports || []);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await fetchReports();
      setIsLoading(false);
    })();
  }, [fetchReports]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchReports();
    setRefreshing(false);
  }, [fetchReports]);

  // ─── Upload Logic ───────────────────────────────────────────

  const handleUploadReport = () => {
    Alert.alert("Upload Document", "Choose a method", [
      { text: "Camera", onPress: openCamera },
      { text: "Gallery", onPress: openGallery },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert("Need Permission", "Please grant camera permission.");
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      await doUpload(asset.uri, asset.fileName || `report_${Date.now()}.jpg`);
    }
  };

  const openGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert("Need Permission", "Please grant gallery permission.");
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.8,
      mediaTypes: ['images'],
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      await doUpload(asset.uri, asset.fileName || `report_${Date.now()}.jpg`);
    }
  };

  const doUpload = async (uri: string, fileName: string) => {
    setIsUploading(true);
    const result = await uploadWorkerReport(uri, fileName);
    setIsUploading(false);

    if (result.success) {
      Alert.alert("Success", "Report uploaded successfully.");
      await fetchReports(); // Refresh list
    } else {
      Alert.alert("Upload Failed", result.message || "Could not upload report.");
    }
  };

  // ─── Filtering ──────────────────────────────────────────────

  const filtered = reports.filter((r) => {
    if (filter === "all") return true;
    return r.status === filter;
  });

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
        <View className="mb-6">
          <Text className="text-[28px] font-bold text-[#1B1E22]">Medical Reports</Text>
          <Text className="text-[14px] font-medium text-[#7A8188] mt-1">
            {isLoading ? "Loading…" : `${reports.length} report${reports.length !== 1 ? 's' : ''} uploaded`}
          </Text>
        </View>

        {/* Upload Area */}
        <TouchableOpacity
          onPress={handleUploadReport}
          activeOpacity={0.7}
          disabled={isUploading}
          className="rounded-[22px] p-6 items-center border-[2px] border-dashed border-[#E6EBF0] mb-5"
          style={[glassCard, isUploading && { opacity: 0.6 }]}
        >
          <View className="w-16 h-16 rounded-[22px] bg-[#EAF1F6] items-center justify-center mb-3">
            {isUploading ? (
              <ActivityIndicator size="large" color="#1B1E22" />
            ) : (
              <Feather name="upload-cloud" size={32} color="#1B1E22" />
            )}
          </View>
          <Text className="text-[18px] font-bold text-[#1B1E22] mb-1">
            {isUploading ? "Uploading…" : "Upload New Report"}
          </Text>
          <Text className="text-[14px] text-[#7A8188] mb-4">PDF, JPG, or PNG • Max 10MB</Text>
          <View className="bg-[#000000] rounded-[30px] px-6 py-3" style={buttonShadow}>
            <Text className="text-white text-[14px] font-bold">Choose File</Text>
          </View>
        </TouchableOpacity>

        {/* Filter Tabs */}
        <View className="flex-row gap-3 mb-5">
          {(["all", "Analyzed", "Pending"] as const).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              className="rounded-[20px] px-4 py-2"
              style={filter === f ? { backgroundColor: '#000000', ...buttonShadow } : glassCard}
            >
              <Text className={`text-[14px] font-bold ${filter === f ? 'text-white' : 'text-[#7A8188]'}`}>
                {f === "all" ? "All" : f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Reports List */}
        {isLoading ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color="#1B1E22" />
            <Text className="text-[14px] font-medium text-[#7A8188] mt-3">Loading reports…</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View className="rounded-[22px] p-10 items-center" style={glassCard}>
            <Feather name="inbox" size={40} color="#7A8188" />
            <Text className="text-[16px] font-bold text-[#1B1E22] mt-4">No Reports Found</Text>
            <Text className="text-[14px] font-medium text-[#7A8188] mt-2 text-center">
              {filter === "all" ? "Upload your first medical report to get started." : `No ${filter.toLowerCase()} reports yet.`}
            </Text>
          </View>
        ) : (
          filtered.map((report, index) => {
            const bg = CARD_COLORS[index % CARD_COLORS.length];
            const iconName = (report.type && typeIcons[report.type]) || "file-text";
            const bgClass = (report.type && typeBgColors[report.type]) || "bg-[#E6EBF0]";

            return (
              <TouchableOpacity
                key={report.id}
                activeOpacity={0.7}
                className="rounded-[22px] p-5 my-2"
                style={[glassCardSolid, { backgroundColor: bg === '#FFFFFF' ? 'rgba(255,255,255,0.55)' : bg }]}
              >
                <View className="flex-row items-center mb-1">
                  <View className={`w-12 h-12 rounded-[20px] items-center justify-center mr-4 ${bgClass}`}>
                    <Feather name={iconName as any} size={22} color="#1B1E22" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[16px] font-bold text-[#1B1E22]">{report.name}</Text>
                    <Text className="text-[13px] font-medium text-[#7A8188] mt-1">{report.date}</Text>
                  </View>
                  <View className="bg-[#E6EBF0] rounded-[20px] px-3.5 py-1.5 flex-row items-center gap-1.5">
                    <View className={`w-1.5 h-1.5 rounded-full ${report.status === 'Analyzed' ? 'bg-[#1B1E22]' : 'bg-[#7A8188]'}`} />
                    <Text className={`text-[12px] font-bold ${report.status === 'Analyzed' ? 'text-[#1B1E22]' : 'text-[#7A8188]'}`}>
                      {report.status}
                    </Text>
                  </View>
                </View>

                {/* Show extracted values if available */}
                {report.values && Object.keys(report.values).length > 0 && (
                  <View className="flex-row flex-wrap gap-2 mt-4 pt-4 border-t border-[#E6EBF0]">
                    {Object.entries(report.values).map(([key, val]) => (
                      <View key={key} className="flex-row items-center bg-[#EAF1F6] rounded-[20px] px-3.5 py-1.5 gap-2">
                        <Text className="text-[12px] font-medium text-[#7A8188]">{key}</Text>
                        <Text className="text-[13px] font-bold text-[#1B1E22]">{String(val)}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Pending progress indicator */}
                {report.status === "Pending" && (
                  <View className="mt-4 pt-4 border-t border-[#E6EBF0]">
                    <Text className="text-[13px] font-bold text-[#7A8188] mb-2 pl-1">
                      <Feather name="clock" size={12} color="#7A8188" /> Analysis in progress…
                    </Text>
                    <View className="h-1.5 rounded-full bg-[#E6EBF0]">
                      <View className="w-[60%] h-full rounded-full bg-[#1B1E22]" />
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
