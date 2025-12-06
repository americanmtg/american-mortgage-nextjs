import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';

// GET - Public: Fetch about page settings
export async function GET() {
  try {
    const settings = await prisma.about_page_settings.findFirst({
      where: { id: 1 },
    });

    if (!settings) {
      // Return defaults
      return NextResponse.json({
        success: true,
        data: {
          heroTitle: 'About American Mortgage',
          heroSubtitle: 'Your trusted Arkansas mortgage broker — dedicated to making homeownership accessible for everyone.',
          missionTitle: 'Our Mission',
          missionContent: 'American Mortgage was founded with a clear purpose: to simplify the home buying process and make it accessible to everyone. We combine industry expertise with personalized service to guide you toward the right loan for your situation.',
          whatWeDoTitle: 'What We Do',
          whatWeDoContent: 'We offer a full range of mortgage products including FHA, VA, USDA, and Conventional loans. Our team specializes in helping first-time homebuyers, veterans, and families across Arkansas find financing solutions that fit their needs.',
          whatWeDoItems: ['Purchase and refinance loans', 'Down payment assistance programs', 'Fast pre-approvals', 'Competitive rates and terms'],
          approachTitle: 'Our Approach',
          approachItems: [
            { title: 'Transparent', description: 'Clear communication and no hidden fees. We explain every step of the process.', icon: 'eye' },
            { title: 'Responsive', description: 'We return calls and emails promptly. Your questions deserve quick answers.', icon: 'lightning' },
            { title: 'Efficient', description: 'Streamlined processes to get you from application to closing without delays.', icon: 'clock' },
          ],
          contactTitle: 'Contact Us',
          contactName: 'American Mortgage',
          contactNmls: '#2676687',
          contactPhone: '(870) 926-4052',
          contactEmail: 'hello@americanmtg.com',
          contactAddress: '122 CR 7185, Jonesboro, AR 72405',
          contactImage: '/images/am-logo-white.png',
          ctaText: 'Start Your Application',
          ctaUrl: '/apply',
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        heroTitle: settings.hero_title,
        heroSubtitle: settings.hero_subtitle,
        missionTitle: settings.mission_title,
        missionContent: settings.mission_content,
        whatWeDoTitle: settings.what_we_do_title,
        whatWeDoContent: settings.what_we_do_content,
        whatWeDoItems: settings.what_we_do_items,
        approachTitle: settings.approach_title,
        approachItems: settings.approach_items,
        contactTitle: settings.contact_title,
        contactName: settings.contact_name,
        contactNmls: settings.contact_nmls,
        contactPhone: settings.contact_phone,
        contactEmail: settings.contact_email,
        contactAddress: settings.contact_address,
        contactImage: (settings as any).contact_image || '/images/am-logo-white.png',
        ctaText: settings.cta_text,
        ctaUrl: settings.cta_url,
      },
    });
  } catch (error) {
    console.error('Error fetching about settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// PUT - Protected: Update about page settings
export async function PUT(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();

    const settings = await prisma.$executeRaw`
      INSERT INTO about_page_settings (id, hero_title, hero_subtitle, mission_title, mission_content, what_we_do_title, what_we_do_content, what_we_do_items, approach_title, approach_items, contact_title, contact_name, contact_nmls, contact_phone, contact_email, contact_address, contact_image, cta_text, cta_url, updated_at)
      VALUES (1, ${body.heroTitle}, ${body.heroSubtitle}, ${body.missionTitle}, ${body.missionContent}, ${body.whatWeDoTitle}, ${body.whatWeDoContent}, ${JSON.stringify(body.whatWeDoItems)}::jsonb, ${body.approachTitle}, ${JSON.stringify(body.approachItems)}::jsonb, ${body.contactTitle}, ${body.contactName}, ${body.contactNmls}, ${body.contactPhone}, ${body.contactEmail}, ${body.contactAddress}, ${body.contactImage || '/images/am-logo-white.png'}, ${body.ctaText}, ${body.ctaUrl}, NOW())
      ON CONFLICT (id) DO UPDATE SET
        hero_title = EXCLUDED.hero_title,
        hero_subtitle = EXCLUDED.hero_subtitle,
        mission_title = EXCLUDED.mission_title,
        mission_content = EXCLUDED.mission_content,
        what_we_do_title = EXCLUDED.what_we_do_title,
        what_we_do_content = EXCLUDED.what_we_do_content,
        what_we_do_items = EXCLUDED.what_we_do_items,
        approach_title = EXCLUDED.approach_title,
        approach_items = EXCLUDED.approach_items,
        contact_title = EXCLUDED.contact_title,
        contact_name = EXCLUDED.contact_name,
        contact_nmls = EXCLUDED.contact_nmls,
        contact_phone = EXCLUDED.contact_phone,
        contact_email = EXCLUDED.contact_email,
        contact_address = EXCLUDED.contact_address,
        contact_image = EXCLUDED.contact_image,
        cta_text = EXCLUDED.cta_text,
        cta_url = EXCLUDED.cta_url,
        updated_at = NOW()
    `;

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error updating about settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to update settings' }, { status: 500 });
  }
}
