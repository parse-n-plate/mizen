/**
 * Feedback submission endpoint
 * Receives feedback data and creates a Notion database page
 */
import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const databaseId = process.env.NOTION_FEEDBACK_DATABASE_ID || '';

export async function POST(request: NextRequest) {
  try {
    const {
      type,
      message,
      screenshotUrls,
      deviceOS,
      appVersion,
    } = await request.json();

    if (!type || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!process.env.NOTION_API_KEY || !databaseId) {
      console.error('Missing Notion configuration');
      return NextResponse.json(
        { success: false, error: 'Feedback system not configured' },
        { status: 500 }
      );
    }

    // Auto-generate title from message
    const title = message.length > 60 ? message.slice(0, 60) + '…' : message;

    // Build page content blocks
    const children: any[] = [
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: { content: message },
            },
          ],
        },
      },
    ];

    // Add screenshots if present
    if (screenshotUrls && screenshotUrls.length > 0) {
      children.push({
        object: 'block',
        type: 'heading_3',
        heading_3: {
          rich_text: [{ type: 'text', text: { content: 'Screenshots' } }],
        },
      });

      screenshotUrls.forEach((url: string) => {
        children.push({
          object: 'block',
          type: 'image',
          image: {
            type: 'external',
            external: { url },
          },
        });
      });
    }

    // Create Notion page
    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        Title: {
          title: [{ text: { content: title } }],
        },
        Type: {
          select: { name: type },
        },
        Status: {
          select: { name: 'Todo' },
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
          rich_text: [{ text: { content: deviceOS || 'Unknown' } }],
        },
        'App Version': {
          rich_text: [{ text: { content: appVersion || 'Unknown' } }],
        },
      },
      children,
    });

    return NextResponse.json({ success: true, pageId: response.id });
  } catch (error: any) {
    console.error('Notion API error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}
