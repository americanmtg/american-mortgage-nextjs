import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const headersList = await headers();

    // Get IP address
    const forwardedFor = headersList.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : null;

    // Get user agent
    const userAgent = headersList.get('user-agent') || null;

    // Extract form data
    const {
      loanType,
      firstName,
      lastName,
      email,
      phone,
      location,
      homebuyingStage,
      priceRange,
      propertyType,
      purchaseTimeline,
      downPaymentPercent,
      ownsHome,
      firstTimeBuyer,
      homeValue,
      currentRate,
      mortgageBalance,
      wantsCashOut,
      cashOutAmount,
      militaryService,
      militaryBranch,
      employmentStatus,
      annualIncome,
      bankruptcyHistory,
      creditScore,
    } = body;

    // Validate required fields
    if (!loanType || !firstName || !lastName || !email || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create lead in database
    const lead = await prisma.prequalify_leads.create({
      data: {
        lead_type: loanType,
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone,
        location: location || null,
        homebuying_stage: homebuyingStage || null,
        price_range: priceRange || null,
        property_type: propertyType || null,
        purchase_timeline: purchaseTimeline || null,
        down_payment_percent: downPaymentPercent || null,
        owns_home: ownsHome || null,
        first_time_buyer: firstTimeBuyer ?? null,
        home_value: homeValue || null,
        current_rate: currentRate || null,
        mortgage_balance: mortgageBalance || null,
        wants_cash_out: wantsCashOut ?? null,
        cash_out_amount: cashOutAmount || null,
        military_service: militaryService ?? null,
        military_branch: militaryBranch || null,
        employment_status: employmentStatus || null,
        annual_income: annualIncome || null,
        bankruptcy_history: bankruptcyHistory ?? null,
        credit_score: creditScore || null,
        ip_address: ipAddress,
        user_agent: userAgent,
        status: 'new',
      },
    });

    return NextResponse.json({
      success: true,
      data: { id: lead.id },
    });
  } catch (error) {
    console.error('Error creating prequalify lead:', error);
    return NextResponse.json(
      { error: 'Failed to submit form. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // This endpoint could be used by admin to list leads
  // For now, just return a message
  return NextResponse.json({
    message: 'Use POST to submit a prequalify form',
  });
}
