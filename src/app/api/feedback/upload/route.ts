/**
 * Feedback screenshot upload endpoint
 * Accepts up to 3 images, uploads to Supabase Storage, returns public URLs
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabaseClient';

const MAX_FILES = 3;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('screenshots') as File[];

    // Validate file count
    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 }
      );
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { success: false, error: `Maximum ${MAX_FILES} files allowed` },
        { status: 400 }
      );
    }

    // Validate each file
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { success: false, error: `File ${file.name} exceeds 10MB limit` },
          { status: 400 }
        );
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          {
            success: false,
            error: `File ${file.name} has unsupported type. Only JPEG, PNG, WebP, and HEIC are allowed.`
          },
          { status: 400 }
        );
      }
    }

    // Upload to Supabase Storage
    const supabase = getSupabaseClient();
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const timestamp = Date.now();
      const uuid = crypto.randomUUID();
      const ext = file.name.split('.').pop() || 'jpg';
      const filePath = `feedback/${timestamp}-${uuid}.${ext}`;

      // Convert File to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { data, error } = await supabase.storage
        .from('feedback-screenshots')
        .upload(filePath, buffer, {
          contentType: file.type,
          cacheControl: '3600',
        });

      if (error) {
        console.error('Supabase upload error:', error);
        return NextResponse.json(
          { success: false, error: `Failed to upload ${file.name}` },
          { status: 500 }
        );
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('feedback-screenshots')
        .getPublicUrl(data.path);

      uploadedUrls.push(urlData.publicUrl);
    }

    return NextResponse.json({ success: true, urls: uploadedUrls });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload screenshots' },
      { status: 500 }
    );
  }
}
