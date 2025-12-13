import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET - Get a single quote by quote_id (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  try {
    const { quoteId } = await params;

    const result = await pool.query(
      'SELECT * FROM quotes WHERE quote_id = $1',
      [quoteId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }

    const row = result.rows[0];

    // Return limited data for public access (no IP, no internal ID)
    return NextResponse.json({
      success: true,
      data: {
        quoteId: row.quote_id,
        firstName: row.first_name,
        lastName: row.last_name,
        loanType: row.loan_type,
        purchasePrice: row.purchase_price,
        downPaymentPercent: parseFloat(row.down_payment_percent),
        downPaymentAmount: row.down_payment_amount,
        loanAmount: row.loan_amount,
        interestRate: parseFloat(row.interest_rate),
        loanTerm: row.loan_term,
        monthlyPi: parseFloat(row.monthly_pi),
        monthlyInsurance: parseFloat(row.monthly_insurance),
        monthlyTaxes: parseFloat(row.monthly_taxes),
        monthlyMip: parseFloat(row.monthly_mip),
        monthlyPmi: parseFloat(row.monthly_pmi),
        totalMonthlyPayment: parseFloat(row.total_monthly_payment),
        createdAt: row.created_at,
      }
    });
  } catch (error) {
    console.error('Error fetching quote:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quote' },
      { status: 500 }
    );
  }
}
