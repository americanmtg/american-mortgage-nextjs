import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const token = formData.get('token') as string;
    const winnerId = parseInt(formData.get('winnerId') as string, 10);
    const legalName = formData.get('legalName') as string;
    const addressLine1 = formData.get('addressLine1') as string;
    const addressLine2 = (formData.get('addressLine2') as string) || null;
    const city = formData.get('city') as string;
    const state = formData.get('state') as string;
    const zipCode = formData.get('zipCode') as string;
    const w9Document = formData.get('w9Document') as File | null;
    const idDocument = formData.get('idDocument') as File | null;

    // Validate required fields
    if (!token || !winnerId || !legalName || !addressLine1 || !city || !state || !zipCode) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find the winner and validate token
    const winner = await prisma.giveaway_winners.findUnique({
      where: { claim_token: token },
      include: {
        giveaway: true,
        prize_claim: true,
      },
    });

    if (!winner) {
      return NextResponse.json(
        { error: 'Invalid claim token' },
        { status: 404 }
      );
    }

    if (winner.id !== winnerId) {
      return NextResponse.json(
        { error: 'Token does not match winner' },
        { status: 403 }
      );
    }

    // Check if already claimed
    if (winner.claimed_at) {
      return NextResponse.json(
        { error: 'Prize has already been claimed' },
        { status: 400 }
      );
    }

    // Check if claim deadline passed
    if (winner.claim_deadline && new Date() > new Date(winner.claim_deadline)) {
      return NextResponse.json(
        { error: 'Claim deadline has passed' },
        { status: 400 }
      );
    }

    // Check if W-9 is required
    const requiresW9 = winner.giveaway.require_w9 &&
      winner.giveaway.prize_value !== null &&
      Number(winner.giveaway.prize_value) >= Number(winner.giveaway.w9_threshold);

    if (requiresW9 && !w9Document) {
      return NextResponse.json(
        { error: 'W-9 form is required for this prize' },
        { status: 400 }
      );
    }

    // Create upload directory
    const uploadDir = path.join(process.cwd(), 'private', 'claims', winnerId.toString());
    await mkdir(uploadDir, { recursive: true });

    let w9Path: string | null = null;
    let idPath: string | null = null;

    // Save W-9 document
    if (w9Document) {
      const w9Buffer = Buffer.from(await w9Document.arrayBuffer());
      const w9Ext = path.extname(w9Document.name) || '.pdf';
      const w9Filename = `w9-${crypto.randomBytes(8).toString('hex')}${w9Ext}`;
      w9Path = path.join(uploadDir, w9Filename);
      await writeFile(w9Path, w9Buffer);
      // Store relative path in database
      w9Path = `/private/claims/${winnerId}/${w9Filename}`;
    }

    // Save ID document
    if (idDocument) {
      const idBuffer = Buffer.from(await idDocument.arrayBuffer());
      const idExt = path.extname(idDocument.name) || '.pdf';
      const idFilename = `id-${crypto.randomBytes(8).toString('hex')}${idExt}`;
      idPath = path.join(uploadDir, idFilename);
      await writeFile(idPath, idBuffer);
      // Store relative path in database
      idPath = `/private/claims/${winnerId}/${idFilename}`;
    }

    // Check if a prize claim already exists for this winner
    const existingClaim = await prisma.prize_claims.findFirst({
      where: { winner_id: winnerId },
    });

    let prizeClaim;
    if (existingClaim) {
      // Update existing claim
      prizeClaim = await prisma.prize_claims.update({
        where: { id: existingClaim.id },
        data: {
          legal_name: legalName,
          address_line1: addressLine1,
          address_line2: addressLine2,
          city: city,
          state: state,
          zip_code: zipCode,
          w9_document: w9Path || undefined,
          id_document: idPath || undefined,
          updated_at: new Date(),
        },
      });
    } else {
      // Create new claim
      prizeClaim = await prisma.prize_claims.create({
        data: {
          winner_id: winnerId,
          legal_name: legalName,
          address_line1: addressLine1,
          address_line2: addressLine2,
          city: city,
          state: state,
          zip_code: zipCode,
          w9_document: w9Path,
          id_document: idPath,
          fulfillment_status: 'pending',
        },
      });
    }

    // Update winner status to claimed
    await prisma.giveaway_winners.update({
      where: { id: winnerId },
      data: {
        claimed_at: new Date(),
        status: 'claimed',
        updated_at: new Date(),
      },
    });

    // TODO: Send confirmation email
    // await sendClaimConfirmationEmail(winner.entry.email, winner.giveaway.title);

    return NextResponse.json({
      success: true,
      message: 'Prize claim submitted successfully',
      claimId: prizeClaim.id,
    });
  } catch (error) {
    console.error('Error processing prize claim:', error);
    return NextResponse.json(
      { error: 'Failed to process claim' },
      { status: 500 }
    );
  }
}

// GET endpoint to check claim status
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json(
      { error: 'Token is required' },
      { status: 400 }
    );
  }

  const winner = await prisma.giveaway_winners.findUnique({
    where: { claim_token: token },
    include: {
      giveaway: {
        select: {
          title: true,
          prize_title: true,
        },
      },
      prize_claim: {
        select: {
          verified: true,
          fulfillment_status: true,
        },
      },
    },
  });

  if (!winner) {
    return NextResponse.json(
      { error: 'Invalid claim token' },
      { status: 404 }
    );
  }

  const claim = winner.prize_claim[0];
  return NextResponse.json({
    claimed: winner.claimed_at !== null,
    claimedAt: winner.claimed_at?.toISOString() || null,
    claimDeadline: winner.claim_deadline?.toISOString() || null,
    giveaway: winner.giveaway.title,
    prize: winner.giveaway.prize_title,
    verified: claim?.verified || false,
    fulfillmentStatus: claim?.fulfillment_status || null,
  });
}
