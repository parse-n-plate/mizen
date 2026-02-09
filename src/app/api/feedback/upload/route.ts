/**
 * Feedback screenshot upload endpoint
 * Legacy endpoint kept for backward compatibility.
 * Accepts up to 3 images, uploads to Notion file storage, returns file upload IDs.
 */
import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

const MAX_FILES = 3;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
];

export async function POST(request: NextRequest) {
  try {
    if (!process.env.NOTION_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Feedback system not configured' },
        { status: 500 },
      );
    }

    const notion = new Client({ auth: process.env.NOTION_API_KEY });
    const formData = await request.formData();
    const files = formData
      .getAll('screenshots')
      .filter((entry): entry is File => entry instanceof File);

    // Validate file count
    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 },
      );
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { success: false, error: `Maximum ${MAX_FILES} files allowed` },
        { status: 400 },
      );
    }

    // Validate each file
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { success: false, error: `File ${file.name} exceeds 10MB limit` },
          { status: 400 },
        );
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          {
            success: false,
            error: `File ${file.name} has unsupported type. Only JPEG, PNG, WebP, HEIC, and HEIF are allowed.`,
          },
          { status: 400 },
        );
      }
    }

    // Upload each file to Notion
    const fileUploadIds: string[] = [];

    for (const file of files) {
      // 1. Create file upload
      const created = await notion.fileUploads.create({
        mode: 'single_part',
        filename: file.name,
        content_type: file.type,
      });

      // 2. Send file data (single-part uploads auto-complete)
      await notion.fileUploads.send({
        file_upload_id: created.id,
        file: { data: file, filename: file.name },
      });

      fileUploadIds.push(created.id);
    }

    // Return `urls` for legacy clients still expecting the old key.
    // Values are Notion file upload IDs, handled by /api/feedback compatibility parsing.
    return NextResponse.json({
      success: true,
      fileUploadIds,
      urls: fileUploadIds,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload screenshots' },
      { status: 500 },
    );
  }
}
