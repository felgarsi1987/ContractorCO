import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { colors, font, spacing, radius } from '../../utils/theme';

const DEMO = [
  { rol:'Admin',     email:'admin@contractorco.gov.co',    pass:'Admin2025*' },
  { rol:'Supervisor',email:'p.suarez@contractorco.gov.co', pass:'Super2025*' },
  { rol:'Auditor',   email:'auditor@contraloria.gov.co',   pass:'Audit2025*' },
];

export default function LoginScreen() {
  const { login } = useAuth();
  const insets    = useSafeAreaInsets();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleLogin = async () => {
    if (!email || !password) { setError('Ingresa correo y contraseña.'); return; }
    setLoading(true); setError('');
    try {
      const { error: err } = await login(email.trim(), password);
      if (err) {
        const m = { 'Invalid login credentials':'Correo o contraseña incorrectos.', 'Email not confirmed':'Confirma tu correo.' };
        setError(m[err.message] || err.message);
      }
    } catch (e) { setError('Error de conexión.'); }
    finally { setLoading(false); }
  };

  return (
    <View style={{ flex:1, backgroundColor:colors.navy }}>
      <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS==='ios'?'padding':undefined}>
        <ScrollView contentContainerStyle={{ flexGrow:1, justifyContent:'center', padding:spacing.xxl, paddingTop:insets.top+spacing.xxxl }}>

          {/* Logo */}
          <View style={{ alignItems:'center', marginBottom:spacing.xxxl }}>
            <View style={{ width:64, height:64, borderRadius:16, backgroundColor:colors.blue, alignItems:'center', justifyContent:'center', marginBottom:spacing.md }}>
              <Text style={{ fontSize:28 }}>🛡️</Text>
            </View>
            <Text style={{ color:colors.white, fontSize:font.xxl, fontWeight:'700', letterSpacing:-.3 }}>
              ContralControl
            </Text>
            <Text style={{ color:'rgba(147,197,253,0.7)', fontSize:font.sm, marginTop:4, letterSpacing:.5 }}>
              SISTEMA DE CONTROL DE CONTRATISTAS
            </Text>
          </View>

          {/* Card login */}
          <View style={{ backgroundColor:colors.white, borderRadius:radius.xl, padding:spacing.xxl }}>
            <Text style={{ fontSize:font.lg, fontWeight:'600', color:colors.gray900, marginBottom:spacing.xl }}>
              Iniciar sesión
            </Text>

            <View style={{ marginBottom:spacing.md }}>
              <Text style={s.label}>Correo institucional</Text>
              <TextInput
                style={s.input}
                value={email}
                onChangeText={setEmail}
                placeholder="usuario@entidad.gov.co"
                placeholderTextColor={colors.gray300}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={{ marginBottom:spacing.lg }}>
              <Text style={s.label}>Contraseña</Text>
              <TextInput
                style={s.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.gray300}
                secureTextEntry
              />
            </View>

            {error ? (
              <View style={{ backgroundColor:colors.dangerBg, borderRadius:radius.sm, padding:spacing.sm, marginBottom:spacing.md }}>
                <Text style={{ color:colors.danger, fontSize:font.sm }}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={{ backgroundColor:colors.blue, borderRadius:radius.md, padding:spacing.md, alignItems:'center', opacity:loading?.7:1 }}
              onPress={handleLogin} disabled={loading}
            >
              {loading
                ? <ActivityIndicator color={colors.white}/>
                : <Text style={{ color:colors.white, fontWeight:'600', fontSize:font.md }}>Ingresar al sistema</Text>}
            </TouchableOpacity>
          </View>

          {/* Demo credentials */}
          <View style={{ marginTop:spacing.xl, backgroundColor:'rgba(255,255,255,0.08)', borderRadius:radius.lg, padding:spacing.lg, borderWidth:1, borderColor:'rgba(255,255,255,0.12)' }}>
            <Text style={{ color:'rgba(147,197,253,0.6)', fontSize:font.xs, fontWeight:'600', letterSpacing:.8, marginBottom:spacing.sm }}>
              ACCESO DE DEMO
            </Text>
            {DEMO.map(d => (
              <TouchableOpacity key={d.rol} onPress={() => { setEmail(d.email); setPassword(d.pass); }}
                style={{ flexDirection:'row', alignItems:'center', gap:spacing.sm, paddingVertical:spacing.sm, borderBottomWidth:1, borderBottomColor:'rgba(255,255,255,0.08)' }}>
                <View style={{ backgroundColor:'rgba(59,130,246,0.3)', paddingHorizontal:8, paddingVertical:2, borderRadius:radius.full, minWidth:72, alignItems:'center' }}>
                  <Text style={{ color:'#93c5fd', fontSize:9, fontWeight:'700' }}>{d.rol.toUpperCase()}</Text>
                </View>
                <Text style={{ color:'rgba(255,255,255,0.7)', fontSize:font.xs, flex:1 }}>{d.email}</Text>
              </TouchableOpacity>
            ))}
            <Text style={{ color:'rgba(147,197,253,0.4)', fontSize:10, marginTop:spacing.sm }}>
              Toca una fila para autocompletar
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  label: { fontSize:font.xs, fontWeight:'600', color:'#64748b', textTransform:'uppercase', letterSpacing:.5, marginBottom:6 },
  input: { borderWidth:1, borderColor:'#e2e8f0', borderRadius:radius.md, padding:12, fontSize:font.md, color:'#1e293b', backgroundColor:'#f8fafc' },
});