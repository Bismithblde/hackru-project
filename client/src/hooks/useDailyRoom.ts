import { useState, useEffect } from "react";
import { SERVER_URL } from "../constants";
import type { DailyRoomResponse } from "../types";

export function useDailyRoom(roomId: string) {
  const [dailyRoomUrl, setDailyRoomUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDailyRoom = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${SERVER_URL}/api/daily-room/${roomId}`);

        if (!response.ok) {
          throw new Error(
            `Server returned ${response.status}: ${response.statusText}`
          );
        }

        const data: DailyRoomResponse = await response.json();

        if (!data.url) {
          throw new Error("No room URL returned from server");
        }

        setDailyRoomUrl(data.url);
      } catch (err: any) {
        console.error("[Daily] Failed to fetch room URL:", err);
        setError(err.message || "Failed to create voice room");
      } finally {
        setLoading(false);
      }
    };

    fetchDailyRoom();
  }, [roomId]);

  return { dailyRoomUrl, error, loading };
}
