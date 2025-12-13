import { jsPDF } from 'jspdf';

interface QuoteData {
  quoteId: string;
  firstName: string;
  lastName: string;
  loanType: string;
  purchasePrice: number;
  downPaymentPercent: number;
  downPaymentAmount: number;
  loanAmount: number;
  interestRate: number;
  loanTerm: number;
  monthlyPi: number;
  monthlyInsurance: number;
  monthlyTaxes: number;
  monthlyMip: number;
  monthlyPmi: number;
  totalMonthlyPayment: number;
}

interface CompanyInfo {
  companyName: string;
  phone: string;
  email: string;
  address: string;
  nmls: string;
  applyUrl: string;
}

// Format currency with accounting format: $1,234.56
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export function generateQuotePDF(quote: QuoteData, company: CompanyInfo): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // Colors
  const primaryColor: [number, number, number] = [24, 31, 83]; // #181F53
  const grayColor: [number, number, number] = [100, 100, 100];
  const lightGray: [number, number, number] = [200, 200, 200];

  let y = 20;

  // Header background
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Company name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(company.companyName.toUpperCase(), margin, y + 8);

  // Subtitle
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Loan Estimate', margin, y + 18);

  // Quote ID and Date (right aligned)
  doc.setFontSize(10);
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(`Quote ${quote.quoteId}`, pageWidth - margin, y + 8, { align: 'right' });
  doc.text(date, pageWidth - margin, y + 16, { align: 'right' });

  y = 60;

  // Prepared For section
  doc.setTextColor(...grayColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('PREPARED FOR', margin, y);

  y += 7;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`${quote.firstName} ${quote.lastName}`, margin, y);

  y += 15;

  // Divider
  doc.setDrawColor(...lightGray);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);

  y += 12;

  // Loan Details Section
  doc.setTextColor(...primaryColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('LOAN DETAILS', margin, y);

  y += 10;

  const detailsLeft = [
    { label: 'Loan Type', value: quote.loanType },
    { label: 'Purchase Price', value: formatCurrency(quote.purchasePrice) },
    { label: 'Down Payment', value: `${formatCurrency(quote.downPaymentAmount)} (${quote.downPaymentPercent.toFixed(1)}%)` },
  ];

  const detailsRight = [
    { label: 'Loan Amount', value: formatCurrency(quote.loanAmount) },
    { label: 'Interest Rate', value: `${quote.interestRate.toFixed(2)}%` },
    { label: 'Loan Term', value: `${quote.loanTerm} years` },
  ];

  doc.setFontSize(10);
  const colWidth = contentWidth / 2;

  detailsLeft.forEach((item, index) => {
    const itemY = y + index * 12;
    doc.setTextColor(...grayColor);
    doc.setFont('helvetica', 'normal');
    doc.text(item.label, margin, itemY);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(item.value, margin + 50, itemY);
  });

  detailsRight.forEach((item, index) => {
    const itemY = y + index * 12;
    doc.setTextColor(...grayColor);
    doc.setFont('helvetica', 'normal');
    doc.text(item.label, margin + colWidth, itemY);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(item.value, margin + colWidth + 50, itemY);
  });

  y += 45;

  // Divider
  doc.setDrawColor(...lightGray);
  doc.line(margin, y, pageWidth - margin, y);

  y += 12;

  // Monthly Payment Section
  doc.setTextColor(...primaryColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('ESTIMATED MONTHLY PAYMENT', margin, y);

  y += 15;

  // Total Payment Box
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(margin, y, contentWidth, 25, 3, 3, 'F');

  doc.setTextColor(...primaryColor);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(quote.totalMonthlyPayment), pageWidth / 2, y + 17, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('/month', pageWidth / 2 + 55, y + 17);

  y += 35;

  // Payment Breakdown
  const breakdown = [
    { label: 'Principal & Interest', value: quote.monthlyPi },
    { label: 'Property Insurance', value: quote.monthlyInsurance },
    { label: 'Property Taxes', value: quote.monthlyTaxes },
  ];

  if (quote.monthlyMip > 0) {
    breakdown.push({ label: 'FHA Mortgage Insurance (MIP)', value: quote.monthlyMip });
  }

  if (quote.monthlyPmi > 0) {
    breakdown.push({ label: 'Private Mortgage Insurance (PMI)', value: quote.monthlyPmi });
  }

  doc.setFontSize(10);
  breakdown.forEach((item, index) => {
    const itemY = y + index * 10;
    doc.setTextColor(...grayColor);
    doc.setFont('helvetica', 'normal');
    doc.text(item.label, margin, itemY);
    doc.setTextColor(0, 0, 0);
    doc.text(formatCurrency(item.value), pageWidth - margin, itemY, { align: 'right' });
  });

  y += breakdown.length * 10 + 15;

  // Divider
  doc.setDrawColor(...lightGray);
  doc.line(margin, y, pageWidth - margin, y);

  y += 12;

  // Ready to Get Started Section
  doc.setFillColor(...primaryColor);
  doc.roundedRect(margin, y, contentWidth, 40, 3, 3, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Ready to Get Started?', margin + 10, y + 12);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Apply Online: ${company.applyUrl}`, margin + 10, y + 24);
  doc.text(`Call: ${company.phone}  |  Email: ${company.email}`, margin + 10, y + 34);

  y += 55;

  // Disclosure
  doc.setTextColor(...grayColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');

  const disclosure = `DISCLOSURE: This is an estimate only and does not constitute a loan approval, commitment to lend, or guarantee of rates or terms. Actual rates, terms, fees, and monthly payments may vary based on your credit profile, property type, loan-to-value ratio, and other factors. Interest rates are subject to change without notice. All loans are subject to credit approval and verification of income, assets, and property value. This estimate does not include all costs associated with obtaining a mortgage, such as closing costs, prepaid items, or escrow deposits. Contact us for a complete loan estimate with all applicable fees and costs.`;

  const splitDisclosure = doc.splitTextToSize(disclosure, contentWidth);
  doc.text(splitDisclosure, margin, y);

  y += splitDisclosure.length * 4 + 15;

  // Footer
  doc.setDrawColor(...lightGray);
  doc.line(margin, y, pageWidth - margin, y);

  y += 8;
  doc.setTextColor(...grayColor);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(company.companyName, margin, y);

  doc.setFont('helvetica', 'normal');
  doc.text(`${company.nmls}`, margin, y + 6);
  doc.text(company.address, margin, y + 12);

  // Equal Housing Logo text
  doc.text('Equal Housing Opportunity', pageWidth - margin, y + 6, { align: 'right' });

  // Save the PDF
  doc.save(`${company.companyName.replace(/\s+/g, '-')}-Quote-${quote.quoteId}.pdf`);
}
