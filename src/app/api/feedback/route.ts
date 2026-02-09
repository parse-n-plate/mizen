/**
 * Feedback submission endpoint
 * Receives feedback data and creates a Notion database page.
 * Supports JSON (legacy) and multipart/form-data (preferred, single request with files).
 */
import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

const databaseId = process.env.NOTION_FEEDBACK_DATABASE_ID || '';
const MAX_SCREENSHOTS = 3;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

type FeedbackPayload = {
  type: string;
  message: string;
  deviceOS?: string;
  appVersion?: string;
  screenshotFiles: File[];
  screenshotFileUploadIds: string[];
  screenshotUrls: string[];
};

function parseJsonArrayString(value: string): string[] {
  const trimmed = value.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item): item is string => typeof item === 'string')
          .map((item) => item.trim())
          .filter(Boolean);
      }
    } catch {
      return [];
    }
  }

  return [trimmed];
}

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return parseJsonArrayString(value);
  }

  return [];
}

function isLikelyNotionFileUploadId(value: string): boolean {
  const normalized = value.replace(/-/g, '');
  return /^[0-9a-fA-F]{32}$/.test(normalized);
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function validateScreenshotFiles(files: File[]): string | null {
  if (files.length > MAX_SCREENSHOTS) {
    return `Maximum ${MAX_SCREENSHOTS} screenshots allowed`;
  }

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      return `File ${file.name} exceeds 10MB limit`;
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return `File ${file.name} has unsupported type`;
    }
  }

  return null;
}

async function parsePayload(request: NextRequest): Promise<FeedbackPayload> {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const screenshotFiles = formData
      .getAll('screenshots')
      .filter((entry): entry is File => entry instanceof File);

    const screenshotFileUploadIds = formData
      .getAll('screenshotFileUploadIds')
      .flatMap((value) =>
        typeof value === 'string' ? parseJsonArrayString(value) : [],
      );

    const screenshotUrls = formData
      .getAll('screenshotUrls')
      .flatMap((value) =>
        typeof value === 'string' ? parseJsonArrayString(value) : [],
      );

    return {
      type: String(formData.get('type') || '').trim(),
      message: String(formData.get('message') || '').trim(),
      deviceOS: String(formData.get('deviceOS') || '').trim() || undefined,
      appVersion: String(formData.get('appVersion') || '').trim() || undefined,
      screenshotFiles,
      screenshotFileUploadIds,
      screenshotUrls,
    };
  }

  const body = await request.json();
  return {
    type: String(body?.type || '').trim(),
    message: String(body?.message || '').trim(),
    deviceOS: typeof body?.deviceOS === 'string' ? body.deviceOS : undefined,
    appVersion:
      typeof body?.appVersion === 'string' ? body.appVersion : undefined,
    screenshotFiles: [],
    screenshotFileUploadIds: normalizeStringArray(
      body?.screenshotFileUploadIds,
    ),
    screenshotUrls: normalizeStringArray(body?.screenshotUrls),
  };
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.NOTION_API_KEY || !databaseId) {
      console.error('Missing Notion configuration');
      return NextResponse.json(
        { success: false, error: 'Feedback system not configured' },
        { status: 500 },
      );
    }

    const notion = new Client({
      auth: process.env.NOTION_API_KEY,
    });

    const payload = await parsePayload(request);
    if (!payload.type || !payload.message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 },
      );
    }

    if (
      payload.screenshotFileUploadIds.length > MAX_SCREENSHOTS ||
      !payload.screenshotFileUploadIds.every(isLikelyNotionFileUploadId)
    ) {
      return NextResponse.json(
        { success: false, error: 'Invalid screenshot file upload IDs' },
        { status: 400 },
      );
    }

    const screenshotFileError = validateScreenshotFiles(
      payload.screenshotFiles,
    );
    if (screenshotFileError) {
      return NextResponse.json(
        { success: false, error: screenshotFileError },
        { status: 400 },
      );
    }

    const legacyExternalUrls: string[] = [];
    const legacyScreenshotIds: string[] = [];
    for (const value of payload.screenshotUrls) {
      if (isHttpUrl(value)) {
        legacyExternalUrls.push(value);
        continue;
      }

      if (isLikelyNotionFileUploadId(value)) {
        legacyScreenshotIds.push(value);
        continue;
      }

      return NextResponse.json(
        { success: false, error: 'Invalid screenshot URLs payload' },
        { status: 400 },
      );
    }

    if (
      payload.screenshotFileUploadIds.length +
        payload.screenshotFiles.length +
        legacyExternalUrls.length +
        legacyScreenshotIds.length >
      MAX_SCREENSHOTS
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `Maximum ${MAX_SCREENSHOTS} screenshots allowed`,
        },
        { status: 400 },
      );
    }

    // Auto-generate title from message
    const title =
      payload.message.length > 60
        ? payload.message.slice(0, 60) + '…'
        : payload.message;

    // Create page first so file uploads are not orphaned if page creation fails.
    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        Title: {
          title: [{ text: { content: title } }],
        },
        Type: {
          select: { name: payload.type },
        },
        Status: {
          status: { name: 'Todo' },
        },
        Priority: {
          select: { name: 'Medium' },
        },
        Source: {
          select: { name: 'In-app' },
        },
        Reporter: {
          rich_text: [{ text: { content: 'Anonymous' } }],
        },
        'Device/OS': {
          rich_text: [{ text: { content: payload.deviceOS || 'Unknown' } }],
        },
        'App Version': {
          rich_text: [{ text: { content: payload.appVersion || 'Unknown' } }],
        },
      },
      children: [
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: { content: payload.message },
              },
            ],
          },
        },
      ],
    });

    const uploadedIds: string[] = [];
    const uploadErrors: string[] = [];

    for (const file of payload.screenshotFiles) {
      try {
        const created = await notion.fileUploads.create({
          mode: 'single_part',
          filename: file.name,
          content_type: file.type,
        });

        await notion.fileUploads.send({
          file_upload_id: created.id,
          file: { data: file, filename: file.name },
        });

        uploadedIds.push(created.id);
      } catch (error) {
        uploadErrors.push(file.name);
        console.error('Screenshot upload failed:', {
          fileName: file.name,
          pageId: response.id,
          error,
        });
      }
    }

    const fileUploadIds = [
      ...payload.screenshotFileUploadIds,
      ...legacyScreenshotIds,
      ...uploadedIds,
    ];

    const screenshotBlocks = [
      ...fileUploadIds.map((id) => ({
        object: 'block' as const,
        type: 'image' as const,
        image: {
          type: 'file_upload' as const,
          file_upload: { id },
        },
      })),
      ...legacyExternalUrls.map((url) => ({
        object: 'block' as const,
        type: 'image' as const,
        image: {
          type: 'external' as const,
          external: { url },
        },
      })),
    ];

    if (screenshotBlocks.length > 0) {
      const children = [
        {
          object: 'block' as const,
          type: 'heading_3' as const,
          heading_3: {
            rich_text: [
              { type: 'text' as const, text: { content: 'Screenshots' } },
            ],
          },
        },
        ...screenshotBlocks,
      ];

      try {
        await notion.blocks.children.append({
          block_id: response.id,
          children,
        });
      } catch (error) {
        console.error('Failed to append screenshot blocks:', {
          pageId: response.id,
          fileUploadIds,
          legacyExternalUrls,
          error,
        });
      }
    }

    return NextResponse.json({
      success: true,
      pageId: response.id,
      uploadedScreenshotCount: uploadedIds.length,
      failedScreenshotCount: uploadErrors.length,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to submit feedback';

    console.error('Notion API error:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
