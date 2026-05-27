// Show when user is logged in
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import DiscoverScreen from '../screens/DiscoverScreen';
import CookbookScreen from '../screens/CookbookScreen';
import CreateScreen from '../screens/CreateScreen';
import DetailScreen from '../screens/DetailScreen';
import IngredientFilterScreen from '../screens/IngredientFilterScreen';
import IngredientResultsScreen from '../screens/IngredientResultScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { COLORS } from '../constants/colors';
import { FONTS, FONT_SIZES } from '../constants/typography';

// Button tab icons
const TAB_ICONS = {
    Discover: 'map',
    Cookbook: 'book',
    Create: 'plus-circle',
    Profile: 'user',
};

// Tab Navigator
const Tab = createBottomTabNavigator();
function TabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarShowLabel: true,
                tabBarStyle: styles.tabBar,
                tabBarLabelStyle: styles.tabLabel,
                tabBarActiveTintColor: COLORS.green,
                tabBarInactiveTintColor: COLORS.muted,
                tabBarIcon: ({ focused, color }) => (
                    <Feather name={TAB_ICONS[route.name]} size={20} color={color} />
                ),
            })}
        >
            <Tab.Screen name="Discover" component={DiscoverScreen} />
            <Tab.Screen name="Cookbook" component={CookbookScreen} />
            <Tab.Screen name="Create" component={CreateScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
}

// Root Stack
const Stack = createNativeStackNavigator();
export default function AppNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {/* Main tab */}
            <Stack.Screen name="Tabs" component={TabNavigator} />
            <Stack.Screen name="Detail" component={DetailScreen} />
            <Stack.Screen name="IngredientFilter" component={IngredientFilterScreen} />
            <Stack.Screen name="Create" component={CreateScreen} />
            <Stack.Screen
                name="CreateModal"
                component={CreateScreen}
                options={{ presentation: 'modal' }}
            />

            <Stack.Screen name="IngredientResults" component={IngredientResultsScreen} />
        </Stack.Navigator>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: COLORS.white,
        borderTopColor: COLORS.border,
        borderTopWidth: 1,
        height: 68,
        paddingBottom: 12,
        paddingTop: 8,
    },
    tabLabel: {
        fontFamily: FONTS.sansMed,
        fontSize: FONT_SIZES.xs,
    },
});