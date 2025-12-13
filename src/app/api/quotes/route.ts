import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth';
import { sendQuoteConfirmation } from '@/lib/notifications/email';
import { sendQuoteConfirmationSms } from '@/lib/notifications/sms';

// Format currency with accounting format: $1,234.56
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Generate sequential 4-digit quote ID
async function generateQuoteId(): Promise<string> {
  // Get the highest existing quote number
  const result = await pool.query(
    "SELECT quote_id FROM quotes WHERE quote_id ~ '^[0-9]{4}$' ORDER BY CAST(quote_id AS INTEGER) DESC LIMIT 1"
  );

  let nextNum = 1001; // Start at 1001 to avoid leading zeros
  if (result.rows.length > 0) {
    nextNum = parseInt(result.rows[0].quote_id) + 1;
  }

  // If we've exceeded 9999, add a digit
  if (nextNum > 9999) {
    nextNum = 10001; // Move to 5 digits
  }

  return nextNum.toString();
}

// POST - Create a new quote (public)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      firstName,
      lastName,
      phone,
      email,
      loanType,
      purchasePrice,
      downPaymentPercent,
      downPaymentAmount,
      loanAmount,
      interestRate,
      loanTerm,
      monthlyPi,
      monthlyInsurance,
      monthlyTaxes,
      monthlyMip,
      monthlyPmi,
      totalMonthlyPayment,
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !loanType || !purchasePrice) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if phone/email are required
    const settingsResult = await pool.query(
      'SELECT quote_phone_required, quote_email_required FROM calculator_settings WHERE id = 1'
    );
    const settings = settingsResult.rows[0] || { quote_phone_required: true, quote_email_required: true };

    if (settings.quote_phone_required && !phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    if (settings.quote_email_required && !email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const quoteId = await generateQuoteId();

    // Get IP address
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';

    const result = await pool.query(
      `INSERT INTO quotes (
        quote_id, first_name, last_name, phone, email,
        loan_type, purchase_price, down_payment_percent, down_payment_amount, loan_amount,
        interest_rate, loan_term, monthly_pi, monthly_insurance, monthly_taxes,
        monthly_mip, monthly_pmi, total_monthly_payment, ip_address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *`,
      [
        quoteId, firstName, lastName, phone || null, email || null,
        loanType, purchasePrice, downPaymentPercent, downPaymentAmount, loanAmount,
        interestRate, loanTerm, monthlyPi, monthlyInsurance, monthlyTaxes,
        monthlyMip || 0, monthlyPmi || 0, totalMonthlyPayment, ipAddress
      ]
    );

    // Get base URL for quote link
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('host') || 'dev.americanmtg.com';
    const baseUrl = `${protocol}://${host}`;
    const quoteUrl = `${baseUrl}/quote/${quoteId}`;

    // Send email confirmation if email was provided
    if (email) {
      try {
        // Get site settings for company info
        const siteResult = await pool.query(
          'SELECT company_name, phone, email FROM site_settings LIMIT 1'
        );
        const footerResult = await pool.query(
          'SELECT nmls_info FROM footer LIMIT 1'
        );

        const site = siteResult.rows[0] || {};
        const footerData = footerResult.rows[0] || {};

        const companyInfo = {
          company_name: site.company_name || 'American Mortgage',
          phone: site.phone || '(870) 926-4052',
          email: site.email || 'hello@americanmtg.com',
          nmls_id: footerData.nmls_info || 'NMLS ID #2676687'
        };

        await sendQuoteConfirmation({
          email,
          firstName,
          quoteId,
          loanType,
          purchasePrice: formatCurrency(purchasePrice),
          loanAmount: formatCurrency(loanAmount),
          interestRate,
          loanTerm,
          totalMonthlyPayment: formatCurrency(totalMonthlyPayment),
          quoteUrl,
          applyUrl: `${baseUrl}/apply`,
          companyName: companyInfo.company_name,
          companyPhone: companyInfo.phone,
          companyEmail: companyInfo.email,
          companyNmls: companyInfo.nmls_id,
        });
        console.log('[QUOTE] Email sent to:', email);
      } catch (emailError) {
        console.error('[QUOTE] Failed to send email:', emailError);
        // Don't fail the quote creation if email fails
      }
    }

    // Send SMS confirmation if phone was provided
    if (phone) {
      try {
        await sendQuoteConfirmationSms({
          phone,
          firstName,
          quoteId,
          totalMonthlyPayment: formatCurrency(totalMonthlyPayment),
          quoteUrl,
        });
        console.log('[QUOTE] SMS sent to:', phone);
      } catch (smsError) {
        console.error('[QUOTE] Failed to send SMS:', smsError);
        // Don't fail the quote creation if SMS fails
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: result.rows[0].id,
        quoteId: result.rows[0].quote_id,
        quoteUrl,
      }
    });
  } catch (error) {
    console.error('Error creating quote:', error);
    return NextResponse.json(
      { error: 'Failed to create quote' },
      { status: 500 }
    );
  }
}

// GET - List all quotes (admin only)
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    let query = `
      SELECT * FROM quotes
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (
        first_name ILIKE $${params.length} OR
        last_name ILIKE $${params.length} OR
        email ILIKE $${params.length} OR
        phone ILIKE $${params.length} OR
        quote_id ILIKE $${params.length}
      )`;
    }

    // Get total count
    const countResult = await pool.query(
      query.replace('SELECT *', 'SELECT COUNT(*)'),
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    return NextResponse.json({
      data: result.rows.map(row => ({
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
        createdAt: row.created_at,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotes' },
      { status: 500 }
    );
  }
}
