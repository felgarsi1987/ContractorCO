import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { colors, font, spacing, radius } from '../../utils/theme';

const ROL_LABEL = { admin:'Administrador', supervisor:'Supervisor', auditor:'Auditor', contratista:'Contratista' };
const ROL_COLOR = { admin:colors.blue, supervisor:'#0d9488', auditor:'#7c3aed', contratista:colors.warning };

export default function PerfilScreen() {
  const insets = useSafeAreaInsets();
  const { usuario, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro que quieres salir?', [
      { text:'Cancelar', style:'cancel' },
      { text:'Salir', style:'destructive', onPress:logout },
    ]);
  };

  const initials = usuario?.nombre?.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase() || 'U';
  const rol = usuario?.rol || 'supervisor';

  const items = [
    { emoji:'📋', label:'Nombre',         value: usuario?.nombre  || '—' },
    { emoji:'📧', label:'Correo',          value: usuario?.email   || '—' },
    { emoji:'🛡️', label:'Rol',            value: ROL_LABEL[rol]   || rol  },
  ];

  const acciones = [
    { emoji:'🔔', label:'Configurar notificaciones' },
    { emoji:'🔒', label:'Cambiar contraseña'         },
    { emoji:'ℹ️', label:'Acerca de ContralControl'   },
    { emoji:'📞', label:'Soporte técnico'             },
  ];

  return (
    <View style={{ flex:1, backgroundColor:colors.bg }}>
      <View style={{ backgroundColor:colors.navy, paddingTop:insets.top+spacing.sm, paddingBottom:spacing.xxxl, paddingHorizontal:spacing.xl }}>
        <Text style={{ color:colors.white, fontSize:font.xl, fontWeight:'700', marginBottom:spacing.xl }}>Mi Perfil</Text>
        <View style={{ alignItems:'center' }}>
          <View style={{ width:72, height:72, borderRadius:36, backgroundColor:ROL_COLOR[rol]||colors.blue, alignItems:'center', justifyContent:'center', marginBottom:spacing.md }}>
            <Text style={{ color:colors.white, fontSize:font.xxl, fontWeight:'700' }}>{initials}</Text>
          </View>
          <Text style={{ color:colors.white, fontSize:font.lg, fontWeight:'700' }}>{usuario?.nombre || 'Usuario'}</Text>
          <View style={{ backgroundColor:'rgba(255,255,255,0.15)', paddingHorizontal:12, paddingVertical:4, borderRadius:radius.full, marginTop:6 }}>
            <Text style={{ color:'rgba(255,255,255,0.9)', fontSize:font.xs, fontWeight:'600' }}>
              {ROL_LABEL[rol] || rol}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding:spacing.lg, gap:spacing.lg, paddingBottom:spacing.xxxl }} showsVerticalScrollIndicator={false}>
        {/* Info */}
        <View style={{ backgroundColor:colors.card, borderRadius:radius.lg, overflow:'hidden', shadowColor:'#000', shadowOpacity:.05, shadowRadius:4, elevation:2 }}>
          <Text style={{ padding:spacing.lg, fontSize:font.sm, fontWeight:'600', color:colors.gray500, borderBottomWidth:1, borderBottomColor:colors.border }}>INFORMACIÓN DE LA CUENTA</Text>
          {items.map((item, i) => (
            <View key={item.label} style={{ flexDirection:'row', alignItems:'center', padding:spacing.lg, borderBottomWidth:i<items.length-1?1:0, borderBottomColor:colors.gray100, gap:spacing.md }}>
              <Text style={{ fontSize:18 }}>{item.emoji}</Text>
              <View>
                <Text style={{ fontSize:font.xs, color:colors.gray500, fontWeight:'600', marginBottom:2 }}>{item.label}</Text>
                <Text style={{ fontSize:font.sm, color:colors.gray900, fontWeight:'500' }}>{item.value}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Acciones */}
        <View style={{ backgroundColor:colors.card, borderRadius:radius.lg, overflow:'hidden', shadowColor:'#000', shadowOpacity:.05, shadowRadius:4, elevation:2 }}>
          {acciones.map((a, i) => (
            <TouchableOpacity key={a.label}
              style={{ flexDirection:'row', alignItems:'center', padding:spacing.lg, borderBottomWidth:i<acciones.length-1?1:0, borderBottomColor:colors.gray100, gap:spacing.md }}>
              <Text style={{ fontSize:18 }}>{a.emoji}</Text>
              <Text style={{ fontSize:font.sm, color:colors.gray700, fontWeight:'500', flex:1 }}>{a.label}</Text>
              <Text style={{ color:colors.gray300, fontSize:font.md }}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity onPress={handleLogout}
          style={{ backgroundColor:colors.dangerBg, borderRadius:radius.lg, padding:spacing.lg, alignItems:'center', borderWidth:1, borderColor:'rgba(220,38,38,0.2)' }}>
          <Text style={{ color:colors.danger, fontSize:font.md, fontWeight:'600' }}>🚪 Cerrar Sesión</Text>
        </TouchableOpacity>

        <Text style={{ textAlign:'center', fontSize:font.xs, color:colors.gray400 }}>
          ContralControl v1.0.0 · Colombia 🇨🇴
        </Text>
      </ScrollView>
    </View>
  );
}