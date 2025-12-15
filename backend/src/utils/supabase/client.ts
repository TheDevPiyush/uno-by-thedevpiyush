import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv"

dotenv.config()

const supabaseURL = process.env.SUPABASE_URL || ""
const supabseKEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

if (!supabaseURL || !supabseKEY) {
    console.log("NO ENVs Provided.")
}

export const supabase = createClient(supabaseURL, supabseKEY)