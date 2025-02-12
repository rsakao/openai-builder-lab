import { getJson } from "serpapi";

export async function POST(request: Request) {
  try {
    const { query } = await request.json()
    
    const data = await getJson({
      engine: "google_maps",
      q: query,
      api_key: process.env.SERPAPI_API_KEY
    });

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
