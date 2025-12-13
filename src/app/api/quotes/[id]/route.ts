import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth';

// GET - Get single quote (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;

    const result = await pool.query(
      'SELECT * FROM quotes WHERE id = $1 OR quote_id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return errorResponse('Quote not found', 404);
    }

    const row = result.rows[0];

    return successResponse({
      id: row.id,
      quoteId: row.quote_id,
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone,
      email: row.email,
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
      ipAddress: row.ip_address,
      createdAt: row.created_at,
    });
  } catch (error) {
    console.error('Error fetching quote:', error);
    return errorResponse('Failed to fetch quote');
  }
}

// DELETE - Delete a quote (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;

    const result = await pool.query(
      'DELETE FROM quotes WHERE id = $1 OR quote_id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return errorResponse('Quote not found', 404);
    }

    return successResponse({ deleted: true });
  } catch (error) {
    console.error('Error deleting quote:', error);
    return errorResponse('Failed to delete quote');
  }
}
