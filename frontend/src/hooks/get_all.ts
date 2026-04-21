import { useState, useEffect } from 'react';

export interface LocationData {
  id: number;
  latitude: number;
  longitude: number;
  city: string;
  region: string;
  country: string;
}

export interface HopData {
  origin_ip: string;
  origin_location: LocationData | null;
  destination_ip: string;
  destination_location: LocationData | null;
  ping: number;
}

export interface FetchResult {
  hops: HopData[];
}

const BACKEND_URL = 'http://localhost:3000/api/traceroutes';

export const useTraceroutes = () => {
  const [data, setData] = useState<FetchResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(BACKEND_URL);
      if (!response.ok) {
        throw new Error('Failed to fetch traceroute data');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refetch: fetchData };
};
