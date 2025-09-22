// import axios from "axios";
// import { NextRequest, NextResponse } from "next/server";

// // Force dynamic rendering and disable caching
// export const dynamic = "force-dynamic";
// export const revalidate = 0;

// // Retry function with exponential backoff
// async function fetchWithRetry(url: string, options: any, maxRetries = 3) {
//   for (let attempt = 1; attempt <= maxRetries; attempt++) {
//     try {
//       console.log(`Attempt ${attempt} to fetch from WCA API...`);
//       const response = await axios.get(url, options);
//       console.log(`Successfully fetched data on attempt ${attempt}`);
//       return response;
//     } catch (error: any) {
//       console.error(`Attempt ${attempt} failed:`, error.code || error.message);
      
//       if (attempt === maxRetries) {
//         throw error;
//       }
      
//       // Wait before retrying (exponential backoff)
//       const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
//       console.log(`Waiting ${waitTime}ms before retry...`);
//       await new Promise(resolve => setTimeout(resolve, waitTime));
//     }
//   }
// }

// export async function GET(request: NextRequest) {
//   try {
//     console.log("Starting competition fetch...");
    
//     // Use fetch instead of axios for better Next.js compatibility
//     const controller = new AbortController();
//     const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

//     const response = await fetch(
//       "https://www.worldcubeassociation.org/api/v0/competitions?country_iso2=IN&per_page=1000",
//       {
//         headers: {
//           "User-Agent": "CubingKerala/1.0",
//           "Accept": "application/json",
//         },
//         signal: controller.signal,
//         // Don't cache the request
//         cache: 'no-store'
//       }
//     );

//     clearTimeout(timeoutId);

//     if (!response.ok) {
//       throw new Error(`WCA API responded with status: ${response.status}`);
//     }

//     const data = await response.json();
//     console.log(`Fetched ${data.length} total competitions from WCA`);

//     // Alternative: Use axios with better configuration as fallback
//     // const res = await fetchWithRetry(
//     //   "https://www.worldcubeassociation.org/api/v0/competitions?country_iso2=IN&per_page=1000",
//     //   {
//     //     headers: {
//     //       "User-Agent": "CubingKerala/1.0",
//     //       "Accept": "application/json",
//     //     },
//     //     timeout: 30000, // Increased to 30 seconds
//     //   },
//     //   2 // 2 retries
//     // );
//     // const data = res.data;

//     const keralaCompetitions = data.filter(
//       (competition: any) =>
//         competition.city && competition.city.includes("Kerala")
//     );

//     console.log(`Found ${keralaCompetitions.length} Kerala competitions`);

//     const now = new Date();
//     const upcomingCompetitions = keralaCompetitions
//       .filter((competition: any) => new Date(competition.start_date) > now)
//       .reverse();

//     const pastCompetitions = keralaCompetitions.filter(
//       (competition: any) => new Date(competition.start_date) <= now
//     );

//     console.log(`Upcoming: ${upcomingCompetitions.length}, Past: ${pastCompetitions.length}`);

//     // Return response with explicit no-cache headers
//     return new NextResponse(
//       JSON.stringify({ 
//         upcomingCompetitions, 
//         pastCompetitions,
//         lastFetch: new Date().toISOString(),
//         totalFetched: data.length 
//       }),
//       {
//         status: 200,
//         headers: {
//           "Content-Type": "application/json",
//           "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
//           "Pragma": "no-cache",
//           "Expires": "0",
//           // Add timestamp header for debugging
//           "X-Generated-At": new Date().toISOString(),
//         },
//       }
//     );
//   } catch (error: any) {
//     console.error("API Error:", error);
    
//     // Provide different error messages based on error type
//     let errorMessage = "Failed to fetch competitions";
//     let statusCode = 500;
    
//     if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
//       errorMessage = "Request timeout - WCA API is taking too long to respond";
//       statusCode = 504;
//     } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
//       errorMessage = "Cannot connect to WCA API";
//       statusCode = 503;
//     } else if (error.message?.includes('status')) {
//       errorMessage = `WCA API error: ${error.message}`;
//       statusCode = 502;
//     }

//     return new NextResponse(
//       JSON.stringify({ 
//         error: errorMessage,
//         details: process.env.NODE_ENV === 'development' ? error.message : undefined,
//         timestamp: new Date().toISOString()
//       }),
//       { 
//         status: statusCode,
//         headers: {
//           "Content-Type": "application/json",
//           "Cache-Control": "no-store, no-cache, must-revalidate",
//         },
//       }
//     );
//   }
// }

import { NextRequest, NextResponse } from "next/server";

// App Router route-segment config for Vercel Functions
export const dynamic = "force-dynamic"; // disable caching at the framework layer [web:22]
export const revalidate = 0; // no ISR revalidation [web:22]
export const maxDuration = 30; // ensure Vercel allocates up to 30s for this function [web:21][web:25]

// Helper to fetch with an AbortController timeout that leaves headroom < maxDuration
async function fetchJsonWithTimeout(url: string, init: RequestInit = {}, timeoutMs = 22000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
      headers: {
        "User-Agent": "CubingKerala/1.0",
        Accept: "application/json",
        ...(init.headers || {}),
      },
    });
    if (!res.ok) {
      throw new Error(`WCA API responded with status: ${res.status}`);
    }
    return await res.json();
  } finally {
    clearTimeout(id);
  }
}

export async function GET(_req: NextRequest) {
  try {
    // Paginate to avoid large payload/latency spikes in serverless runtime [web:20][web:12]
    // WCA v0 competitions are paginated; default ~25 per page, use ?page=1..N [web:36]
    const base =
      "https://www.worldcubeassociation.org/api/v0/competitions?country_iso2=IN&per_page=100";
    // Fetch first 3 pages quickly; increase if needed but keep under time budget [web:20]
    const [p1, p2, p3] = await Promise.all([
      fetchJsonWithTimeout(`${base}&page=1`),
      fetchJsonWithTimeout(`${base}&page=2`),
      fetchJsonWithTimeout(`${base}&page=3`),
    ]);

    const data = [...p1, ...p2, ...p3];

    const keralaCompetitions = data.filter(
      (competition: any) => competition.city && competition.city.includes("Kerala")
    );

    const now = new Date();
    const upcomingCompetitions = keralaCompetitions
      .filter((c: any) => new Date(c.start_date) > now)
      .reverse();
    const pastCompetitions = keralaCompetitions.filter(
      (c: any) => new Date(c.start_date) <= now
    );

    return new NextResponse(
      JSON.stringify({
        upcomingCompetitions,
        pastCompetitions,
        lastFetch: new Date().toISOString(),
        totalFetched: data.length,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
          "X-Generated-At": new Date().toISOString(),
        },
      }
    );
  } catch (error: any) {
    let errorMessage = "Failed to fetch competitions";
    let statusCode = 500;

    if (error.name === "AbortError") {
      errorMessage = "Request timeout - WCA API is taking too long to respond";
      statusCode = 504;
    } else if (error.code === "ECONNABORTED") {
      errorMessage = "Request timeout - WCA API is taking too long to respond";
      statusCode = 504;
    } else if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      errorMessage = "Cannot connect to WCA API";
      statusCode = 503;
    } else if (error.message?.includes("status")) {
      errorMessage = `WCA API error: ${error.message}`;
      statusCode = 502;
    }

    return new NextResponse(
      JSON.stringify({
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
        timestamp: new Date().toISOString(),
      }),
      {
        status: statusCode,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  }
}
