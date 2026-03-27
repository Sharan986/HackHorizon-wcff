import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { glassTabBar } from "../theme";

export default function WorkerLayout() {
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
        name="home"
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color }) => <Feather name="home" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          tabBarLabel: "Reports",
          tabBarIcon: ({ color }) => <Feather name="file-text" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="risk"
        options={{
          tabBarLabel: "Risk",
          tabBarIcon: ({ color }) => <Feather name="activity" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ color }) => <Feather name="user" size={20} color={color} />,
        }}
      />
    </Tabs>
  );
}
