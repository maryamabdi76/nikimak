// app/api/scoreboard/route.ts
import { NextResponse } from 'next/server';
// if you don't have path alias "@", use: import clientPromise from '../../../lib/mongodb';
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

export async function GET() {
  try {
    const client = await clientPromise;
    // use the same DB name you used in Atlas UI
    const db = client.db('scoreboard');

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

    return NextResponse.json(scoreboard);
  } catch (err) {
    console.error('Error loading scoreboard', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
