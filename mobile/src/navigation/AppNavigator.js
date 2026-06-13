import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator }      from '@react-navigation/stack';
import { View, Text, Platform }      from 'react-native';
import { colors, font }              from '../utils/theme';
import DashboardScreen   from '../screens/dashboard/DashboardScreen';
import ContratosScreen   from '../screens/contratos/ContratosScreen';
import ContratoDetalle   from '../screens/contratos/ContratoDetalle';
import AlertasScreen     from '../screens/alertas/AlertasScreen';
import DocumentosScreen  from '../screens/documentos/DocumentosScreen';
import PerfilScreen      from '../screens/perfil/PerfilScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabIcon({ name, focused }) {
  const icons = {
    Dashboard:  focused ? '⬛' : '□',
    Contratos:  focused ? '📋' : '📄',
    Alertas:    focused ? '🔔' : '🔕',
    Documentos: focused ? '📁' : '📂',
    Perfil:     focused ? '👤' : '🧑',
  };
  return (
    <View style={{ alignItems:'center' }}>
      <Text style={{ fontSize:20 }}>{icons[name] || '○'}</Text>
    </View>
  );
}

function ContratosStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown:false }}>
      <Stack.Screen name="ListaContratos" component={ContratosScreen}/>
      <Stack.Screen name="DetalleContrato" component={ContratoDetalle}/>
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor:   colors.blueLight,
        tabBarInactiveTintColor: colors.gray400,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor:  colors.border,
          borderTopWidth:  1,
          height:          Platform.OS === 'ios' ? 82 : 60,
          paddingBottom:   Platform.OS === 'ios' ? 24 : 8,
          paddingTop:      8,
        },
        tabBarLabelStyle: { fontSize: font.xs, fontWeight:'500' },
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused}/>,
      })}
    >
      <Tab.Screen name="Dashboard"  component={DashboardScreen}  options={{ title:'Resumen'   }}/>
      <Tab.Screen name="Contratos"  component={ContratosStack}   options={{ title:'Contratos' }}/>
      <Tab.Screen name="Alertas"    component={AlertasScreen}    options={{ title:'Alertas'   }}/>
      <Tab.Screen name="Documentos" component={DocumentosScreen} options={{ title:'Documentos'}}/>
      <Tab.Screen name="Perfil"     component={PerfilScreen}     options={{ title:'Perfil'    }}/>
    </Tab.Navigator>
  );
}