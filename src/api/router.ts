// src/api/router.ts

// Basic header api_key validation helper
function unauthorizedResponse() {
  return new Response(JSON.stringify({ error: "Unauthorized: Invalid or missing api_key" }), {
    status: 401,
    headers: { "content-type": "application/json" },
  });
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function handlePrimeOSApi(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  
  // Only handle paths explicitly designated for our custom entities
  if (!url.pathname.startsWith("/api/entities/")) {
    return null; 
  }

  // 1. Authenticate Request via your environment token
  const apiKey = request.headers.get("api_key");
  const validKey = process.env.PRIME_OS_API_KEY || "fallback_dev_key";
  if (!apiKey || apiKey !== validKey) {
    return unauthorizedResponse();
  }

  const method = request.method;
  const path = url.pathname;

  try {
    // 2. Map Endpoints: /api/entities/Appointment
    if (path === "/api/entities/Appointment") {
      
      // GET: List with filters, limit, skip, and sort rules
      if (method === "GET") {
        const qParam = url.searchParams.get("q") || "{}";
        const query = JSON.parse(qParam);
        const limit = parseInt(url.searchParams.get("limit") || "100");
        const skip = parseInt(url.searchParams.get("skip") || "0");
        const sortBy = url.searchParams.get("sort_by") || "-created_date";
        
        // TODO: Insert your Mongoose/MongoDB query here: 
        // await Appointment.find(query).sort(sortBy).skip(skip).limit(limit)
        const mockData = [{ id: "1", patient_name: "John Doe", service_type: "consultation", date: "2026-08-25", status: "active" }];
        
        return jsonResponse(mockData);
      }

      // POST: Create a standard record
      if (method === "POST") {
        const body = await request.json();
        // TODO: await new Appointment(body).save()
        return jsonResponse({ ...body, id: `generated_${Date.now()}` });
      }

      // DELETE: Delete many by query matching spec warning guidelines
      if (method === "DELETE") {
        const queryFilter = await request.json();
        if (Object.keys(queryFilter).length === 0) {
          console.warn("CRITICAL WARNING: Empty query passed. Truncating entire Appointment entity collection.");
        }
        // TODO: const result = await Appointment.deleteMany(queryFilter)
        return jsonResponse({ success: true, deleted: 1 });
      }
    }

    // 3. Map Bulk Endpoints: /api/entities/Appointment/bulk
    if (path === "/api/entities/Appointment/bulk") {
      
      // POST: Bulk creation
      if (method === "POST") {
        const bodyArray = await request.json(); // Array of records
        // TODO: const records = await Appointment.insertMany(bodyArray)
        return jsonResponse(bodyArray);
      }

      // PUT: Bulk update (requires an "id" field in items)
      if (method === "PUT") {
        const bodyArray = await request.json();
        // TODO: Run a bulkWrite operations array loop on your MongoDB database
        return jsonResponse(bodyArray);
      }
    }

    // 4. Map MongoDB Dynamic Batch Updates: /api/entities/Appointment/update-many
    if (path === "/api/entities/Appointment/update-many" && method === "PATCH") {
      const { query, data } = await request.json();
      
      // Fully captures incoming raw MongoDB operator structures ($set, $inc, $push, $pull)
      // TODO: const result = await Appointment.updateMany(query, data);
      
      return jsonResponse({ success: true, matchedCount: 1, modifiedCount: 1 });
    }

    return jsonResponse({ error: "Endpoint not found" }, 404);
  } catch (error: any) {
    return jsonResponse({ error: error.message }, 400);
  }
}
