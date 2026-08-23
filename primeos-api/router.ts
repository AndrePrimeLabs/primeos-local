// src/api/router.ts
import fs from 'fs';
import path from 'path';

// Helper to read your primeos.json configuration safely
function getPrimeOSConfig() {
  try {
    const configPath = path.resolve(process.cwd(), 'primeos.json');
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
  } catch (error) {
    console.error("Failed to read primeos.json:", error);
  }
  return { apiKey: process.env.VITE_PRIMEOS_API_KEY || "fallback_key" };
}

function createJsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, api_key"
    },
  });
}

export async function handlePrimeOSApi(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  
  // CORS Preflight Handling
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, api_key"
      }
    });
  }

  // Enforce isolation to your OpenAPI spec endpoints
  if (!url.pathname.startsWith("/api/entities/")) {
    return null; 
  }

  // Authenticate using the system configurations
  const config = getPrimeOSConfig();
  const apiKey = request.headers.get("api_key");
  if (!apiKey || apiKey !== config.apiKey) {
    return createJsonResponse({ error: "Unauthorized: Invalid or missing api_key" }, 401);
  }

  const method = request.method;
  const pathName = url.pathname;

  try {
    // Endpoint: /api/entities/Appointment
    if (pathName === "/api/entities/Appointment") {
      
      if (method === "GET") {
        const qParam = url.searchParams.get("q") || "{}";
        const queryFilter = JSON.parse(qParam); // Parses your stringified JSON filter
        const limit = parseInt(url.searchParams.get("limit") || "100");
        const skip = parseInt(url.searchParams.get("skip") || "0");
        const sortBy = url.searchParams.get("sort_by") || "-created_date";

        // TODO: Database lookup logic goes here (e.g., MongoDB find(queryFilter))
        const mockedRecords = [
          { id: "mock_1", patient_name: "John Doe", service_type: "consultation", date: "2026-08-25", status: "active" }
        ];
        return createJsonResponse(mockedRecords);
      }

      if (method === "POST") {
        const body = await request.json();
        // Validation check against OpenAPI spec keys
        if (!body.patient_name || !body.service_type || !body.date) {
          return createJsonResponse({ error: "Missing required fields" }, 400);
        }
        // TODO: Database persist logic goes here
        return createJsonResponse({ ...body, id: `generated_${Date.now()}` });
      }

      if (method === "DELETE") {
        const queryFilter = await request.json();
        // Danger validation matching your warning notice
        if (Object.keys(queryFilter).length === 0) {
          console.warn("CRITICAL: Wipeout triggered. Deleting all appointment records.");
        }
        // TODO: Database collection delete execution goes here
        return createJsonResponse({ success: true, deleted: 1 });
      }
    }

    // Endpoint: /api/entities/Appointment/bulk
    if (pathName === "/api/entities/Appointment/bulk") {
      if (method === "POST") {
        const recordsArray = await request.json(); // Array of records
        return createJsonResponse({ success: true, count: recordsArray.length, data: recordsArray });
      }
      
      if (method === "PUT") {
        const updatesArray = await request.json(); // Requires explicit 'id' fields
        return createJsonResponse({ success: true, updated: updatesArray.length });
      }
    }

    // Endpoint: /api/entities/Appointment/update-many
    if (pathName === "/api/entities/Appointment/update-many" && method === "PATCH") {
      const { query, data } = await request.json();
      
      // 'data' holds native MongoDB operators like $set or $inc passed right from your application frontend
      console.log("Applying MongoDB update filters:", query, data);
      
      // TODO: Execute your native database updateMany operation here
      return createJsonResponse({ success: true, matchedCount: 1, modifiedCount: 1 });
    }

    return createJsonResponse({ error: "Endpoint not found" }, 404);
  } catch (error: any) {
    return createJsonResponse({ error: error.message }, 400);
  }
}
