import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { StatusBar } from 'expo-status-bar';

// Screen imports
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import LeadsListScreen from './src/screens/LeadsListScreen';
import LeadFormScreen from './src/screens/LeadFormScreen';
import LeadDetailsScreen from './src/screens/LeadDetailsScreen';
import CustomerFormScreen from './src/screens/CustomerFormScreen';
import TeamsScreen from './src/screens/TeamsScreen';
import TargetsScreen from './src/screens/TargetsScreen';
import ProductsScreen from './src/screens/ProductsScreen';
import ConfigsScreen from './src/screens/ConfigsScreen';
import ActivityLoggerScreen from './src/screens/ActivityLoggerScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import QuotationsListScreen from './src/screens/QuotationsListScreen';
import QuotationFormScreen from './src/screens/QuotationFormScreen';
import QuotationDetailsScreen from './src/screens/QuotationDetailsScreen';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

// Sidebar Navigation Menu Drawer
function MainDrawerNavigator() {
  return (
    <Drawer.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerStyle: { backgroundColor: '#1E1B3A' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: 'bold' },
        drawerActiveTintColor: '#FF6B81',
        drawerActiveBackgroundColor: '#FFF0F2',
        drawerLabelStyle: { fontWeight: 'bold' },
        drawerStyle: { backgroundColor: '#fff', width: 260 },
      }}
    >
      <Drawer.Screen name="Dashboard" component={DashboardScreen} />
      <Drawer.Screen name="Leads" component={LeadsListScreen} />
      <Drawer.Screen name="Quotations" component={QuotationsListScreen} />
      <Drawer.Screen name="New Customer" component={CustomerFormScreen} />
      <Drawer.Screen name="Sales Teams" component={TeamsScreen} />
      <Drawer.Screen name="Sales Targets" component={TargetsScreen} />
      <Drawer.Screen name="Products & Pricing" component={ProductsScreen} />
      <Drawer.Screen name="Lead Pipeline Stages" component={ConfigsScreen} />
      <Drawer.Screen name="User Profile" component={ProfileScreen} />
    </Drawer.Navigator>
  );
}

// Root Stack Router
export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        
        {/* Encompasses the Sidebar and its screens */}
        <Stack.Screen name="MainDrawer" component={MainDrawerNavigator} />
        
        {/* Form and detail overlays */}
        <Stack.Screen 
          name="LeadDetails" 
          component={LeadDetailsScreen} 
          options={{ 
            headerShown: true, 
            title: 'Lead Profile', 
            headerTintColor: '#ffffff', 
            headerStyle: { backgroundColor: '#1E1B3A' } 
          }} 
        />
        <Stack.Screen 
          name="LeadForm" 
          component={LeadFormScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="ActivityLogger" 
          component={ActivityLoggerScreen} 
          options={{ 
            headerShown: true, 
            title: 'Log Call', 
            headerTintColor: '#ffffff', 
            headerStyle: { backgroundColor: '#1E1B3A' } 
          }} 
        />
        <Stack.Screen 
          name="Notifications" 
          component={NotificationsScreen} 
          options={{ 
            headerShown: true, 
            title: 'Notifications', 
            headerTintColor: '#ffffff', 
            headerStyle: { backgroundColor: '#1E1B3A' } 
          }} 
        />
        <Stack.Screen 
          name="QuotationForm" 
          component={QuotationFormScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="QuotationDetails" 
          component={QuotationDetailsScreen} 
          options={{ 
            headerShown: true, 
            title: 'Quotation details', 
            headerTintColor: '#ffffff', 
            headerStyle: { backgroundColor: '#1E1B3A' } 
          }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
