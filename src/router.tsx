import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { PrimeOSClient } from "primeos-sdk"; // Your local or published SDK module
import { routeTree } from "./routeTree.gen";

// Instantiate the SDK client once outside or inside the setup block
const primeOS = new PrimeOSClient({
  // Use the local Docker API or fall back to production based on environment variables
  baseUrl: import.meta.env.VITE_PRIMEOS_API_URL || "http://localhost:5000/api",
  apiKey: import.meta.env.VITE_PRIMEOS_API_KEY || "",
});

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    // Add the primeOS SDK client into the global context
    context: { 
      queryClient,
      primeOS 
    },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
