import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/auth/LoginScreen';

const S = createStackNavigator();
export default function AuthNavigator() {
  return (
    <S.Navigator screenOptions={{ headerShown:false }}>
      <S.Screen name="Login" component={LoginScreen}/>
    </S.Navigator>
  );
}