import dotenv from "dotenv";
dotenv.config({ path: ".env.local" }); // ✅ load .env.local manually

import { testGoogleConnection } from "../lib/googleSheets";

console.log("EMAIL:", process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
console.log("KEY START:", process.env.GOOGLE_PRIVATE_KEY?.slice(0, 50));

testGoogleConnection();
