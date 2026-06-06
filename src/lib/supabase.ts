import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://maxkwcepwxcjnsklkpbo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1heGt3Y2Vwd3hjam5za2xrcGJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NzQ2NzMsImV4cCI6MjA5NjI1MDY3M30.ZZioXjoHivK6dGieIJZoR4t3JQEi9ZRhLoqUamozbBA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);