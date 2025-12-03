import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth';

export async function PUT(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.authenticated) return auth.response;

  try {
    const { order } = await request.json();

    if (!Array.isArray(order)) {
      return errorResponse('Invalid order format', 400);
    }

    // Update positions in a transaction
    await prisma.$transaction(
      order.map((id: number, index: number) =>
        prisma.giveaways.update({
          where: { id },
          data: { position: index },
        })
      )
    );

    return successResponse({ success: true });
  } catch (error) {
    console.error('Error reordering giveaways:', error);
    return errorResponse('Failed to reorder giveaways');
  }
}
