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
  logoUrl?: string;
}

// Format currency: $1,234.56
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Format currency whole: $1,234
const formatCurrencyWhole = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Convert image URL to base64
const getImageBase64 = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

export async function generateQuotePDF(quote: QuoteData, company: CompanyInfo): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // Colors - matching quote page
  const navy: [number, number, number] = [24, 31, 83];
  const textDark: [number, number, number] = [17, 24, 39];
  const textMuted: [number, number, number] = [107, 114, 128];
  const textLight: [number, number, number] = [156, 163, 175];
  const borderColor: [number, number, number] = [229, 231, 235];
  const bgCard: [number, number, number] = [249, 250, 251];

  let y = 16;

  // Try to load logo
  const logoUrl = company.logoUrl || '/cms-media/png-01.png';
  let logoLoaded = false;

  try {
    const logoBase64 = await getImageBase64(logoUrl);
    if (logoBase64) {
      // Small logo - 32mm width, proportional height (~19mm for 3440x2090 aspect)
      const logoWidth = 32;
      const logoHeight = 19;
      doc.addImage(logoBase64, 'PNG', margin, y, logoWidth, logoHeight);
      logoLoaded = true;
      y += logoHeight + 6;
    }
  } catch {
    // Logo failed, continue without it
  }

  if (!logoLoaded) {
    doc.setTextColor(...navy);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(company.companyName, margin, y + 6);
    y += 14;
  }

  // Thin divider
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.2);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Title row: "Loan Estimate" left, date/ID right
  doc.setTextColor(...textDark);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Loan Estimate', margin, y);

  const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  doc.setTextColor(...textLight);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`${date}  •  #${quote.quoteId}`, pageWidth - margin, y, { align: 'right' });

  y += 5;

  // "for Name"
  doc.setTextColor(...textMuted);
  doc.setFontSize(10);
  doc.text(`for ${quote.firstName} ${quote.lastName}`, margin, y);

  y += 10;

  // ══════════════ LOAN DETAILS CARD ══════════════
  const cardHeight = 42;
  doc.setFillColor(...bgCard);
  doc.roundedRect(margin, y, contentWidth, cardHeight, 3, 3, 'F');

  const cardPadding = 8;
  const col1 = margin + cardPadding;
  const col2 = margin + contentWidth / 3;
  const col3 = margin + (contentWidth * 2) / 3;

  y += 10;

  // Row 1 labels
  doc.setTextColor(...textLight);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('LOAN TYPE', col1, y);
  doc.text('PURCHASE PRICE', col2, y);
  doc.text('LOAN AMOUNT', col3, y);

  y += 5;

  // Row 1 values
  doc.setTextColor(...textDark);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(quote.loanType, col1, y);
  doc.text(formatCurrencyWhole(quote.purchasePrice), col2, y);
  doc.text(formatCurrencyWhole(quote.loanAmount), col3, y);

  y += 10;

  // Row 2 labels
  doc.setTextColor(...textLight);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('TERM', col1, y);
  doc.text('DOWN PAYMENT', col2, y);
  doc.text('RATE', col3, y);

  y += 5;

  // Row 2 values
  doc.setTextColor(...textDark);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`${quote.loanTerm} years`, col1, y);
  doc.text(`${quote.downPaymentPercent.toFixed(1)}%`, col2, y);
  doc.text(`${quote.interestRate.toFixed(3)}%`, col3, y);

  y += 16;

  // ══════════════ MONTHLY PAYMENT ══════════════
  doc.setTextColor(...textLight);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('MONTHLY PAYMENT', margin, y);

  y += 8;

  // Payment items
  const payments = [
    { label: 'Principal & Interest', value: quote.monthlyPi },
    { label: 'Property Taxes', value: quote.monthlyTaxes },
    { label: 'Homeowner\'s Insurance', value: quote.monthlyInsurance },
  ];

  if (quote.monthlyMip > 0) {
    payments.push({ label: 'Mortgage Insurance (MIP)', value: quote.monthlyMip });
  }
  if (quote.monthlyPmi > 0) {
    payments.push({ label: 'Mortgage Insurance (PMI)', value: quote.monthlyPmi });
  }

  doc.setFontSize(9);
  payments.forEach((item) => {
    doc.setTextColor(...textMuted);
    doc.setFont('helvetica', 'normal');
    doc.text(item.label, margin, y);
    doc.setTextColor(...textDark);
    doc.text(formatCurrency(item.value), pageWidth - margin, y, { align: 'right' });
    y += 7;
  });

  y += 2;

  // Divider before total
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);

  y += 8;

  // Total row
  doc.setTextColor(...textDark);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Estimated Total', margin, y);

  doc.setTextColor(...navy);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  const totalText = formatCurrency(quote.totalMonthlyPayment);
  doc.text(totalText, pageWidth - margin - 16, y, { align: 'right' });

  doc.setTextColor(...textMuted);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('/mo', pageWidth - margin, y);

  y += 14;

  // ══════════════ CTA BOX ══════════════
  doc.setFillColor(...navy);
  doc.roundedRect(margin, y, contentWidth, 24, 3, 3, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Ready to Get Started?', margin + 10, y + 9);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${company.phone}  •  ${company.email}`, margin + 10, y + 17);

  y += 32;

  // ══════════════ DISCLOSURE ══════════════
  doc.setTextColor(...textLight);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');

  const disclosure = 'This is an estimate only and does not constitute a loan approval or commitment to lend. Actual rates, terms, and payments may vary based on credit profile and other factors. All loans subject to credit approval.';
  const splitDisclosure = doc.splitTextToSize(disclosure, contentWidth);
  doc.text(splitDisclosure, margin, y);

  y += splitDisclosure.length * 3 + 8;

  // ══════════════ FOOTER ══════════════
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.2);
  doc.line(margin, y, pageWidth - margin, y);

  y += 5;

  doc.setTextColor(...textMuted);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`${company.companyName}  •  ${company.nmls}`, margin, y);
  doc.text('Equal Housing Opportunity', pageWidth - margin, y, { align: 'right' });

  // ══════════════ SAVE PDF ══════════════
  const filename = `Loan-Estimate-${quote.quoteId}.pdf`;

  // Check device type
  const isMobile = typeof window !== 'undefined' &&
    (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768);
  const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (isMobile && isIOS) {
    // iOS: Use share sheet
    const blob = doc.output('blob');
    const file = new File([blob], filename, { type: 'application/pdf' });
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
      } catch {
        // User cancelled or failed - open in new tab
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      }
    } else {
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    }
  } else if (isMobile) {
    // Android: anchor download
    const blob = doc.output('blob');
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  } else {
    // Desktop: direct save
    doc.save(filename);
  }
}
