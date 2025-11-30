// app/api/scoreboard/update-cell/route.ts
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

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { playerName, date, wins } = body;

    if (
      !playerName ||
      !date ||
      typeof wins !== 'number' ||
      wins < 0 ||
      isNaN(wins)
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid request. playerName, date, and wins (non-negative number) are required.',
        },
        { status: 400 }
      );
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

    // Find and update the specific player
    const playerIndex = scoreboard.players.findIndex(
      (p) => p.name === playerName
    );

    if (playerIndex === -1) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // Update the player's wins for this date
    const updatedPlayers = [...scoreboard.players];
    updatedPlayers[playerIndex] = {
      ...updatedPlayers[playerIndex],
      winsByDate: {
        ...updatedPlayers[playerIndex].winsByDate,
        [dateKey]: wins,
      },
    };

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

    return NextResponse.json({
      success: true,
      message: `Updated ${playerName}'s wins for ${dateKey} to ${wins}`,
    });
  } catch (err) {
    console.error('Error updating cell', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
