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
    const { playerName } = body;

    if (!playerName || typeof playerName !== 'string' || playerName.trim() === '') {
      return NextResponse.json(
        { error: 'Invalid request. Player name is required.' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('scoreboard');

    // Get the scoreboard
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

    // Check if player already exists
    const playerExists = scoreboard.players.some(
      (p) => p.name.toLowerCase().trim() === playerName.toLowerCase().trim()
    );

    if (playerExists) {
      return NextResponse.json(
        { error: 'Player with this name already exists' },
        { status: 400 }
      );
    }

    // Initialize winsByDate with 0 for all existing dates
    const winsByDate: Record<DateKey, number> = {};
    scoreboard.dates.forEach((date) => {
      winsByDate[date] = 0;
    });

    // Create new player
    const newPlayer: PlayerFromDb = {
      name: playerName.trim(),
      winsByDate,
    };

    // Add player to the scoreboard
    const result = await db
      .collection<ScoreboardFromDb>('scoreboards')
      .updateOne(
        {
          leagueKey: 'quantum-league',
          seasonKey: '2025-fall',
        },
        {
          $push: { players: newPlayer },
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
      message: 'Player added successfully',
      player: newPlayer,
    });
  } catch (err) {
    console.error('Error adding player', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

