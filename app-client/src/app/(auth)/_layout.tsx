import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { glassTabBar } from "../theme";

export default function AuthLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: glassTabBar,
        tabBarItemStyle: {
          borderRadius: 20,
          marginHorizontal: 5,
          marginVertical: 8,
          padding: 8,
        },
        tabBarActiveBackgroundColor: '#EAF1F6',
        tabBarActiveTintColor: '#1B1E22',
        tabBarInactiveTintColor: '#7A8188',
        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="login"
        options={{
          tabBarLabel: "Sign In",
          tabBarIcon: ({ color }) => <Feather name="log-in" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="register"
        options={{
          tabBarLabel: "Sign Up",
          tabBarIcon: ({ color }) => <Feather name="user-plus" size={20} color={color} />,
        }}
      />
    </Tabs>
  );
}