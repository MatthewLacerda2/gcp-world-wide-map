import { useEffect, useState } from "react";
import type { ResultsData, ResultEntry } from "../types";
import geozonesData from "../assets/geozones.json";
import { calculateDistance, findGeozone, MAX_LAND_HOP_DISTANCE_KM } from "../utils";

// Cloud Run API URL
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
        
        // Helper to check if a hop is "impossible"
        const isPossibleHop = (hop: any) => {
          if (!hop.origin_location || !hop.destination_location) return true;

          const distanceMeters = calculateDistance(
            hop.origin_location.latitude, hop.origin_location.longitude,
            hop.destination_location.latitude, hop.destination_location.longitude
          );
          const distanceKm = distanceMeters / 1000;

          if (distanceKm <= MAX_LAND_HOP_DISTANCE_KM) return true;

          const originZone = findGeozone(hop.origin_location.latitude, hop.origin_location.longitude, geozonesData.features);
          const destZone = findGeozone(hop.destination_location.latitude, hop.destination_location.longitude, geozonesData.features);

          return originZone !== null && destZone !== null && originZone === destZone;
        };

        // Map backend format (hops, origin_ip, ping) to frontend format (origin, pingTime)
        const mappedData: ResultsData = jsonData.hops
          .filter(isPossibleHop) // THE MAGIC HAPPENS HERE
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
