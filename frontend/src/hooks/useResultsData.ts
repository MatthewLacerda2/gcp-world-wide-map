import { useEffect, useState } from "react";
import type { ResultsData } from "../types";

// GitHub Gist raw URL for results.json
const API_URL = "https://world-wide-map-backend-494720044321.us-central1.run.app/api/traceroutes";

export function useResultsData() {
  const [data, setData] = useState<ResultsData>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.statusText}`);
        }

        const jsonData = await response.json();
        
        // Map backend format (hops, origin_ip, ping) to frontend format (origin, pingTime)
        const mappedData: ResultsData = jsonData.hops.map((hop: any) => ({
          origin: hop.origin_ip,
          destination: hop.destination_ip,
          pingTime: hop.ping,
          origin_geo: hop.origin_location,
          destination_geo: hop.destination_location
        }));

        setData(mappedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
        console.error("Error fetching API:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
}
