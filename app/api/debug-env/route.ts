export async function GET() {
  return new Response(
    JSON.stringify({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      keyStart: process.env.GOOGLE_PRIVATE_KEY?.slice(0, 50),
    }),
    { status: 200 }
  );
}
