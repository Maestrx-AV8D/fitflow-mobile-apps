// navigation/MainStack.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Dashboard from '../screens/Dashboard'
import Log from '../screens/Log'
import Profile from '../screens/Profile'
import YourData from '../screens/YourData';

const Stack = createNativeStackNavigator()

export default function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard" component={Dashboard} />
       <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="YourData" component={YourData} />
    </Stack.Navigator>
  )
}
