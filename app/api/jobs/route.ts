import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/slots';

export async function GET(request: NextRequest) {
  try {
    // Initialize storage
    storage.initialize();

    const jobs = await storage.getJobs();
    
    // Filter only published jobs for public view
    const publishedJobs = jobs.filter((job: any) => job.isPublished);
    
    return NextResponse.json({ success: true, jobs: publishedJobs });
  } catch (error) {
    console.error('Failed to fetch jobs:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch jobs' }, { status: 500 });
  }
}