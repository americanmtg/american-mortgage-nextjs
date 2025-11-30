'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './HeroSection.module.css';

export default function HeroSection() {
  const [loanPurpose, setLoanPurpose] = useState<'purchase' | 'refinance' | ''>('');

  return (
    <section className={styles.heroSection}>
      <div className={styles.heroContainer}>
        {/* Left Side - Content & Form */}
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Your Trusted<br />
            <span className={styles.heroTitleAccent}>Arkansas Mortgage Lender</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Low rates. Fast approvals. Expert guidance every step of the way.
          </p>

          {/* Quick Start Form */}
          <div className={styles.heroForm}>
            <p className={styles.heroFormLabel}>I want to:</p>
            <div className={styles.heroFormButtons}>
              <button
                type="button"
                className={`${styles.heroFormBtn} ${loanPurpose === 'purchase' ? styles.heroFormBtnActive : ''}`}
                onClick={() => setLoanPurpose('purchase')}
              >
                <svg className={styles.heroFormBtnIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                Buy a Home
              </button>
              <button
                type="button"
                className={`${styles.heroFormBtn} ${loanPurpose === 'refinance' ? styles.heroFormBtnActive : ''}`}
                onClick={() => setLoanPurpose('refinance')}
              >
                <svg className={styles.heroFormBtnIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 11-9-9"></path>
                  <polyline points="21 3 21 9 15 9"></polyline>
                  <path d="M21 9l-9 9"></path>
                </svg>
                Refinance
              </button>
            </div>
            <Link href="/apply" className={styles.heroCtaBtn}>
              Get Started Now
            </Link>
          </div>

          {/* Social Proof */}
          <div className={styles.heroSocialProof}>
            <div className={styles.heroAvatars}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className={styles.heroAvatar} />
              ))}
            </div>
            <div className={styles.heroRatings}>
              <div className={styles.heroStars}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <svg key={i} className={styles.heroStar} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <div className={styles.heroRatingText}>
                <span className={styles.heroRatingNumber}>4.9/5</span>
                <span className={styles.heroRatingLabel}>from 2,500+ reviews</span>
              </div>
            </div>
            <div className={styles.heroStats}>
              <div className={styles.heroStat}>
                <span className={styles.heroStatNumber}>98%</span>
                <span className={styles.heroStatLabel}>Would Recommend</span>
              </div>
              <div className={styles.heroStatDivider} />
              <div className={styles.heroStat}>
                <span className={styles.heroStatNumber}>3 min</span>
                <span className={styles.heroStatLabel}>To Get Started</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Image/Visual */}
        <div className={styles.heroVisual}>
          <div className={styles.heroImagePlaceholder}>
            <div className={styles.heroImageContent}>
              <svg className={styles.heroImageIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              <span>Hero Image</span>
            </div>
          </div>
          {/* Floating Stats Card */}
          <div className={styles.heroFloatingCard}>
            <div className={styles.heroFloatingCardIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <div className={styles.heroFloatingCardContent}>
              <span className={styles.heroFloatingCardNumber}>621</span>
              <span className={styles.heroFloatingCardText}>families started their quote today</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
