import { useEffect, useState } from "react";
import type { ResultsData, ResultEntry } from "../types";

// Static Gist URL (for free hosting)
const API_URL = "https://gist.githubusercontent.com/MatthewLacerda2/18b7c0081f4b4fd4efdc9e67f4675e02/raw/51a2d96346cc5189a0a4a8e960d0e1f2a862df85/gcp-traceroute";

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
        const mappedData: ResultsData = jsonData.hops
          .map((hop: any) => ({
            origin: hop.origin_ip,
            destination: hop.destination_ip,
            pingTime: hop.ping,
            origin_geo: hop.origin_location,
            destination_geo: hop.destination_location,
            region: hop.region
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
