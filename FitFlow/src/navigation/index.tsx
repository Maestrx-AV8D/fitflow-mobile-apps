// src/navigation/index.tsx
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Dashboard from '../screens/Dashboard'
import Log       from '../screens/Log'
// …other screens

const Stack = createNativeStackNavigator()

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Dashboard">
        <Stack.Screen name="Dashboard" component={Dashboard} />
        <Stack.Screen name="Log"       component={Log} />
        {/* … */}
      </Stack.Navigator>
    </NavigationContainer>
  )
}