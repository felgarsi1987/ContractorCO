import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const ExpoSecureStoreAdapter = {
  getItem:    (key) => SecureStore.getItemAsync(key),
  setItem:    (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(
  'https://kgnagteifewwmzpalomh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnbmFndGVpZmV3d216cGFsb21oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyODQ3OTYsImV4cCI6MjA5Njg2MDc5Nn0.7XtAhW4cX49IorNvKbxTTElIx6I0_US1PbPIpf2XfVw',
  {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
export default supabase;