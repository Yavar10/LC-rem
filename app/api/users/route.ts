import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('MentorshipIDs'); 
    
    // Fetch all users
    const users = await db.collection('ids').find({}).toArray();
    
    // Return just the usernames
    const usernames = users.map(user => user.username);
    return NextResponse.json({ usernames });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username } = body;

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('MentorshipIDs');

    // Check if user already exists (case-insensitive)
    const existingUser = await db.collection('ids').findOne({ 
      username: { $regex: new RegExp(`^${username}$`, 'i') } 
    });
    
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // Insert new user preserving original casing
    await db.collection('ids').insertOne({ 
      username: username,
      createdAt: new Date()
    });

    return NextResponse.json({ success: true, username: username });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to add user' }, { status: 500 });
  }
}
