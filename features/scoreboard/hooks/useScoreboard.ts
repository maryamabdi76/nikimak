import { useEffect, useState } from 'react';

import { Scoreboard } from '../types';

export function useScoreboard() {
  const [scoreboard, setScoreboard] = useState<Scoreboard | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchScoreboard = async () => {
    try {
      const res = await fetch('/api/scoreboard');
      if (!res.ok) {
        console.error('Failed to load scoreboard', await res.text());
        return;
      }
      const data: Scoreboard = await res.json();
      setScoreboard(data);
    } catch (e) {
      console.error('Error fetching scoreboard', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScoreboard();
  }, []);

  return {
    scoreboard,
    loading,
    fetchScoreboard,
  };
}
