import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || '127.0.0.1';
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');
    const gpu = searchParams.get('gpu');
    const screen = searchParams.get('screen');
    const cores = searchParams.get('cores');
    const os = searchParams.get('os');

    const client = await clientPromise;
    const db = client.db('MentorshipIDs');

    // If querying device status for user.tsx
    if (deviceId) {
      const clientIp = getClientIp(request);

      // Primary check: exact deviceId match
      let deviceUser = await db.collection('ids').findOne({ deviceId });

      // Secondary check: cross-browser hardware profile match
      // If the user registered in Chrome and now opened Firefox/Edge,
      // the hardware profile (GPU + Screen + Cores + OS) on the same machine/IP will match
      if (!deviceUser && screen && cores && os) {
        const query: Record<string, unknown> = {
          'hardware.screen': screen,
          'hardware.cores': Number(cores),
          'hardware.os': os,
        };
        // If not a generic GPU, include GPU in matching
        if (gpu && gpu !== 'generic-gpu') {
          query['hardware.gpu'] = gpu;
        }
        // Match on IP as well
        if (clientIp) {
          query.ip = clientIp;
        }

        deviceUser = await db.collection('ids').findOne(query);

        // Auto-heal / sync: if found via hardware profile, update record with this deviceId
        if (deviceUser && deviceId) {
          await db.collection('ids').updateOne(
            { _id: deviceUser._id },
            { $set: { deviceId } }
          );
        }
      }

      return NextResponse.json({
        registered: !!deviceUser,
        user: deviceUser ? { username: deviceUser.username, createdAt: deviceUser.createdAt } : null
      });
    }

    // Default: fetch all users (for admin panel & leaderboard)
    const users = await db.collection('ids').find({}).toArray();
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
    const { username, deviceId, hardware } = body;

    if (!username || typeof username !== 'string' || !username.trim()) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const trimmedUsername = username.trim();
    const clientIp = getClientIp(request);

    const client = await clientPromise;
    const db = client.db('MentorshipIDs');

    // 1. Device check: verify this device hasn't already registered an ID
    if (deviceId) {
      // Primary check: exact deviceId
      let existingDevice = await db.collection('ids').findOne({ deviceId });

      // Cross-browser hardware check fallback
      if (!existingDevice && hardware) {
        const query: Record<string, unknown> = {
          'hardware.screen': hardware.screen,
          'hardware.cores': Number(hardware.cores),
          'hardware.os': hardware.os,
        };
        if (hardware.gpu && hardware.gpu !== 'generic-gpu') {
          query['hardware.gpu'] = hardware.gpu;
        }
        if (clientIp) {
          query.ip = clientIp;
        }
        existingDevice = await db.collection('ids').findOne(query);
      }

      if (existingDevice) {
        return NextResponse.json(
          { 
            error: `This device is already linked to LeetCode ID "${existingDevice.username}". Delete it first before adding a new one.` 
          },
          { status: 400 }
        );
      }
    }

    // 2. Check if LeetCode user already exists in database (case-insensitive)
    const existingUser = await db.collection('ids').findOne({ 
      username: { $regex: new RegExp(`^${trimmedUsername}$`, 'i') } 
    });
    
    if (existingUser) {
      return NextResponse.json({ error: 'This LeetCode username is already registered' }, { status: 400 });
    }

    // Insert new user preserving original casing
    await db.collection('ids').insertOne({ 
      username: trimmedUsername,
      deviceId: deviceId || null,
      hardware: hardware ? {
        gpu: hardware.gpu || 'generic-gpu',
        screen: hardware.screen || '',
        cores: Number(hardware.cores) || 4,
        timezone: hardware.timezone || 'UTC',
        os: hardware.os || 'unknown'
      } : null,
      ip: clientIp,
      createdAt: new Date()
    });

    return NextResponse.json({ success: true, username: trimmedUsername });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to add user' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const deviceId = searchParams.get('deviceId');
    const gpu = searchParams.get('gpu');
    const screen = searchParams.get('screen');
    const cores = searchParams.get('cores');
    const os = searchParams.get('os');
    const clientIp = getClientIp(request);

    if (!username && !deviceId) {
      return NextResponse.json({ error: 'Username or deviceId is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('MentorshipIDs');

    let result = null;

    // 1. Delete by username if provided (admin or user explicitly passing username)
    if (username) {
      result = await db.collection('ids').deleteOne({ 
        username: { $regex: new RegExp(`^${username}$`, 'i') } 
      });
    }

    // 2. If not deleted yet, try deleting by deviceId
    if ((!result || result.deletedCount === 0) && deviceId) {
      result = await db.collection('ids').deleteOne({ deviceId });
    }

    // 3. Fallback: delete by matching cross-browser hardware profile
    if ((!result || result.deletedCount === 0) && screen && cores && os) {
      const query: Record<string, unknown> = {
        'hardware.screen': screen,
        'hardware.cores': Number(cores),
        'hardware.os': os,
      };
      if (gpu && gpu !== 'generic-gpu') {
        query['hardware.gpu'] = gpu;
      }
      if (clientIp) {
        query.ip = clientIp;
      }
      result = await db.collection('ids').deleteOne(query);
    }

    if (!result || result.deletedCount === 0) {
      return NextResponse.json({ error: 'User not found or already deleted' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
