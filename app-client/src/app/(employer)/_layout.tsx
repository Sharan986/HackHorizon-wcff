import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { glassTabBar } from "../theme";

export default function EmployerLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: glassTabBar,
        tabBarItemStyle: {
          borderRadius: 24,
          marginVertical: 8,
          marginHorizontal: 12,
          overflow: "hidden",
        },
        tabBarActiveBackgroundColor: '#EAF1F6',
        tabBarActiveTintColor: '#1B1E22',
        tabBarInactiveTintColor: '#7A8188',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          tabBarLabel: "Dashboard",
          tabBarIcon: ({ color }) => <Feather name="bar-chart-2" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="heatmap"
        options={{
          tabBarLabel: "Heatmap",
          tabBarIcon: ({ color }) => <Feather name="map" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          tabBarLabel: "Insights",
          tabBarIcon: ({ color }) => <Feather name="zap" size={20} color={color} />,
        }}
      />
    </Tabs>
  );
}
