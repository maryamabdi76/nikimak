// app/api/scoreboard/add-wins/route.ts
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

type DateKey = string;

type PlayerFromDb = {
  playerKey?: string;
  name: string;
  winsByDate: Record<DateKey, number>;
};

type ScoreboardFromDb = {
  leagueKey: string;
  seasonKey: string;
  title?: string;
  dates: DateKey[];
  players: PlayerFromDb[];
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, playerWins } = body;

    if (!date || !Array.isArray(playerWins)) {
      return NextResponse.json(
        {
          error: 'Invalid request. Date and playerWins array are required.',
        },
        { status: 400 }
      );
    }

    // Validate playerWins array
    for (const item of playerWins) {
      if (
        !item.playerName ||
        typeof item.wins !== 'number' ||
        item.wins < 0 ||
        isNaN(item.wins)
      ) {
        return NextResponse.json(
          {
            error:
              'Invalid playerWins format. Each item must have playerName (string) and wins (non-negative number).',
          },
          { status: 400 }
        );
      }
    }

    const client = await clientPromise;
    const db = client.db('scoreboard');

    // Find the scoreboard
    const scoreboard = await db
      .collection<ScoreboardFromDb>('scoreboards')
      .findOne({
        leagueKey: 'quantum-league',
        seasonKey: '2025-fall',
      });

    if (!scoreboard) {
      return NextResponse.json(
        { error: 'Scoreboard not found' },
        { status: 404 }
      );
    }

    // Format date as YYYY-MM-DD
    // Handle both ISO strings (2025-12-09T00:00:00.000Z) and YYYY-MM-DD format
    let dateKey: string;
    if (date.includes('T')) {
      // If it's an ISO string, extract YYYY-MM-DD from it
      dateKey = date.slice(0, 10);
    } else {
      // If it's already YYYY-MM-DD format, use it directly
      dateKey = date;
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
      return NextResponse.json(
        { error: 'Invalid date format. Expected YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Create a map of player names to wins for quick lookup
    const winsMap = new Map<string, number>();
    playerWins.forEach((item: { playerName: string; wins: number }) => {
      winsMap.set(item.playerName, item.wins);
    });

    // Update players' wins for this date
    const updatedPlayers = scoreboard.players.map((player) => {
      const winsToAdd = winsMap.get(player.name) || 0;
      return {
        ...player,
        winsByDate: {
          ...player.winsByDate,
          [dateKey]: (player.winsByDate[dateKey] || 0) + winsToAdd,
        },
      };
    });

    // Add date to dates array if not present
    const updatedDates = scoreboard.dates.includes(dateKey)
      ? scoreboard.dates
      : [...scoreboard.dates, dateKey].sort();

    // Update the scoreboard
    const result = await db
      .collection<ScoreboardFromDb>('scoreboards')
      .updateOne(
        {
          leagueKey: 'quantum-league',
          seasonKey: '2025-fall',
        },
        {
          $set: {
            players: updatedPlayers,
            dates: updatedDates,
            updatedAt: new Date(),
          },
        }
      );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Scoreboard not found' },
        { status: 404 }
      );
    }

    const totalWins = playerWins.reduce(
      (sum: number, item: { wins: number }) => sum + item.wins,
      0
    );

    return NextResponse.json({
      success: true,
      message: `Added wins for players on ${dateKey} (total: ${totalWins})`,
    });
  } catch (err) {
    console.error('Error adding wins', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
