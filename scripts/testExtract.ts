import { extractSheetInfo } from "@/lib/parsing";

async function test() {
  const url = "https://docs.google.com/spreadsheets/d/1aHFjhmQaQAS-qGh9_bIIppMtO8PrBykz3eJ0MIC5-10/edit?usp=sharing";
  const result = await extractSheetInfo(url, "Kiswahili Activities", false);
  console.log(result);
}

test();
