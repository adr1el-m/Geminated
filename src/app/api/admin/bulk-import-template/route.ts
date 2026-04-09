import { NextResponse } from 'next/server';
import { getCurrentUser, hasAcceptedLatestTerms } from '@/lib/auth';
import { generateBulkImportTemplate } from '@/lib/bulk-import';

export async function GET() {
  const user = await getCurrentUser();

  if (!user || user.role !== 'admin' || !hasAcceptedLatestTerms(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const csv = generateBulkImportTemplate();

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="star-link-teacher-import-template.csv"',
    },
  });
}
