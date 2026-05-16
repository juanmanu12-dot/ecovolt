import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://tenfgcagqsupabqgreit.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlbmZnY2FncXN1cGFicWdyZWl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NzA2MDUsImV4cCI6MjA5NDQ0NjYwNX0.MAhbPjRVilGBzC7D0ZKHzCkIiBCGrFZ3XrM_xO0x03Q";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
