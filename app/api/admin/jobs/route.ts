import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/slots';

export async function GET(request: NextRequest) {
  try {
    storage.initialize();
    
    const searchParams = request.nextUrl.searchParams;
    const adminSecret = searchParams.get('secret');

    if (adminSecret !== storage.getAdminPassword()) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const jobs = await storage.getJobs();
    return NextResponse.json({ success: true, jobs });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    storage.initialize();
    
    const searchParams = request.nextUrl.searchParams;
    const adminSecret = searchParams.get('secret');

    if (adminSecret !== storage.getAdminPassword()) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const job = await request.json();
    if (!job.id || !job.title) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    await storage.saveJob(job);
    return NextResponse.json({ success: true, message: 'Job saved successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to save job' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    storage.initialize();
    
    const searchParams = request.nextUrl.searchParams;
    const adminSecret = searchParams.get('secret');

    if (adminSecret !== storage.getAdminPassword()) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing job ID' }, { status: 400 });
    }

    await storage.deleteJob(id);
    return NextResponse.json({ success: true, message: 'Job deleted successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete job' }, { status: 500 });
  }
}
