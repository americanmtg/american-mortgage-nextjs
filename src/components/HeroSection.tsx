'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './HeroSection.module.css';

interface HeroSettings {
  eyebrow?: string;
  headlineLine1?: string;
  headlineLine2?: string;
  buttonText?: string;
  buttonUrl?: string;
  reassuranceTime?: string;
  reassuranceText?: string;
  ratingPercent?: string;
  ratingText?: string;
  widgetType?: 'ratings' | 'badge';
  widgetEnabled?: boolean;
  photo1Url?: string | null;
  photo2Url?: string | null;
  photo3Url?: string | null;
  badgeText?: string;
  badgeSubtext?: string;
  mobileGradientEnabled?: boolean;
}

interface HeroSectionProps {
  settings?: HeroSettings;
}

export default function HeroSection({ settings }: HeroSectionProps) {
  const [santaIconEnabled, setSantaIconEnabled] = useState(false);

  useEffect(() => {
    async function checkSantaIcon() {
      try {
        const res = await fetch('/api/settings/site');
        if (res.ok) {
          const result = await res.json();
          setSantaIconEnabled(result.data?.santaIconEnabled ?? false);
        }
      } catch (error) {
        console.error('Failed to check santa icon setting:', error);
      }
    }
    checkSantaIcon();
  }, []);

  // Use settings with defaults
  const eyebrow = settings?.eyebrow || 'Trusted Nationwide';
  const headlineLine1 = settings?.headlineLine1 || 'Get home with the';
  const headlineLine2 = settings?.headlineLine2 || 'first name in financing';
  const buttonText = settings?.buttonText || 'Get Started Now';
  const buttonUrl = settings?.buttonUrl || '/apply';
  const reassuranceTime = settings?.reassuranceTime || '3 min';
  const reassuranceText = settings?.reassuranceText || 'No impact to credit';
  const ratingPercent = settings?.ratingPercent || '98%';
  const ratingText = settings?.ratingText || 'would recommend';
  const widgetType = settings?.widgetType || 'badge';
  const widgetEnabled = settings?.widgetEnabled ?? true;
  const photo1Url = settings?.photo1Url;
  const photo2Url = settings?.photo2Url;
  const photo3Url = settings?.photo3Url;
  const badgeText = settings?.badgeText || 'Same-Day Pre-Approvals';
  const badgeSubtext = settings?.badgeSubtext || 'Fast & hassle-free';
  const mobileGradientEnabled = settings?.mobileGradientEnabled ?? true;

  // Ratings Widget (photos + stars)
  const RatingsWidget = () => (
    <div className={styles.trustBadge}>
      <div className={styles.avatarGroup}>
        {[photo1Url, photo2Url, photo3Url].map((url, i) => (
          <div key={i} className={styles.avatar}>
            {url ? (
              <img
                src={url}
                alt={`Customer ${i + 1}`}
                className={styles.avatarImage}
              />
            ) : (
              <div className={styles.avatarInner} />
            )}
          </div>
        ))}
      </div>
      <div className={styles.ratingPill}>
        <div className={styles.stars}>
          {[1, 2, 3, 4, 5].map((i) => (
            <svg key={i} className={styles.star} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          ))}
        </div>
        <div className={styles.ratingLine}>
          <span className={styles.ratingPercent}>{ratingPercent}</span>
          <span className={styles.ratingText}>{ratingText}</span>
        </div>
      </div>
    </div>
  );

  // Badge Widget (modern design with checkmark)
  const BadgeWidget = () => (
    <div className={styles.badgeWidget}>
      <div className={styles.badgeIconWrapper}>
        <svg className={styles.badgeCheckmark} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 12L10 17L20 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div className={styles.badgeContent}>
        <span className={styles.badgeText}>{badgeText}</span>
        <span className={styles.badgeSubtext}>{badgeSubtext}</span>
      </div>
    </div>
  );

  return (
    <section className={`${styles.hero} ${!mobileGradientEnabled ? styles.heroSolid : ''}`}>
      <div className={styles.container}>
        {widgetEnabled && (
          widgetType === 'ratings' ? <RatingsWidget /> : <BadgeWidget />
        )}
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 className={styles.headline}>
          {headlineLine1}<br />
          <span className={styles.headlineItalic}>{headlineLine2}</span>
        </h1>
        <Link href={buttonUrl} className={`${styles.ctaButton} ${santaIconEnabled ? styles.ctaButtonWithIcon : ''}`}>
          {santaIconEnabled && (
            <svg className={styles.santaIcon} viewBox="0 0 80 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Reindeer in FRONT (pulling) */}
              <g>
                {/* Body */}
                <ellipse cx="68" cy="16" rx="5" ry="3.5" fill="currentColor" opacity="0.95"/>
                {/* Head */}
                <circle cx="75" cy="13" r="2.5" fill="currentColor" opacity="0.95"/>
                {/* Antlers */}
                <path d="M76 11 L78 7 M77 8 L79 7 M76 11 L75 7 M75.5 8 L74 7" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.9"/>
                {/* Legs */}
                <line x1="65" y1="19" x2="64" y2="24" stroke="currentColor" strokeWidth="1.2" opacity="0.9"/>
                <line x1="67" y1="19" x2="66" y2="24" stroke="currentColor" strokeWidth="1.2" opacity="0.9"/>
                <line x1="70" y1="19" x2="69" y2="24" stroke="currentColor" strokeWidth="1.2" opacity="0.9"/>
                <line x1="72" y1="19" x2="71" y2="24" stroke="currentColor" strokeWidth="1.2" opacity="0.9"/>
                {/* Nose (Rudolph!) */}
                <circle cx="77" cy="13" r="1" fill="#ffeb3b"/>
              </g>
              {/* Reins */}
              <path d="M62 16 Q55 14 48 16" stroke="currentColor" strokeWidth="0.6" fill="none" opacity="0.7"/>
              {/* Sleigh in BACK */}
              <g>
                {/* Sleigh body */}
                <path d="M28 12 L28 20 Q28 22 30 22 L46 22 Q50 22 50 18 L50 14 Q50 12 48 12 Z" fill="currentColor" opacity="0.95"/>
                {/* Sleigh runner */}
                <path d="M26 23 Q28 25 32 25 L48 25 Q52 25 54 23" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.9"/>
                {/* Santa silhouette */}
                <circle cx="38" cy="10" r="3.5" fill="currentColor" opacity="0.95"/>
                <ellipse cx="38" cy="16" rx="4" ry="3.5" fill="currentColor" opacity="0.95"/>
                {/* Santa hat */}
                <path d="M35.5 7 Q38 3 41 7" fill="#ffeb3b"/>
                <circle cx="41" cy="5" r="1.2" fill="currentColor" opacity="0.95"/>
              </g>
            </svg>
          )}
          {buttonText}
        </Link>
        <p className={styles.reassurance}>
          <span className={styles.timeSpan}>
            <svg className={styles.clockIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span style={{ marginLeft: '6px' }}>{reassuranceTime}</span>
          </span>
          <span className={styles.dot}>•</span>
          <span className={styles.creditImpact}>{reassuranceText}</span>
        </p>
      </div>
    </section>
  );
}
