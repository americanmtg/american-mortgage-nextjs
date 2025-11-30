/**
 * Test script for data layer functions
 * Run with: npx tsx test-data-layer.ts
 */

import {
  getSiteSettings,
  getSeoSettings,
  getHeaderSettings,
  getFooter,
  getNavigation,
  getBlogPosts,
  getBlogPost,
  getRecentBlogPosts,
  getPage,
  getPages,
  getFeaturedLoans,
  getRoutes,
  getMediaUrl,
} from './src/lib/data'

async function runTests() {
  console.log('🧪 Testing Data Layer Functions\n')
  console.log('='.repeat(60))

  // Test 1: getSiteSettings
  console.log('\n📋 TEST: getSiteSettings()')
  const siteSettings = await getSiteSettings()
  if (siteSettings) {
    console.log('  ✅ Success')
    console.log(`     Company: ${siteSettings.companyName}`)
    console.log(`     Phone: ${siteSettings.phone}`)
    console.log(`     Email: ${siteSettings.email}`)
    console.log(`     Logo: ${siteSettings.logo?.filename || 'N/A'}`)
    console.log(`     Logo White: ${siteSettings.logoWhite?.filename || 'N/A'}`)
  } else {
    console.log('  ❌ Failed - returned null')
  }

  // Test 2: getSeoSettings
  console.log('\n📋 TEST: getSeoSettings()')
  const seoSettings = await getSeoSettings()
  if (seoSettings) {
    console.log('  ✅ Success')
    console.log(`     Site Title: ${seoSettings.siteTitle}`)
    console.log(`     Meta Desc: ${seoSettings.metaDescription?.substring(0, 50)}...`)
    console.log(`     OG Title: ${seoSettings.ogTitle}`)
    console.log(`     GA ID: ${seoSettings.googleAnalyticsId}`)
  } else {
    console.log('  ❌ Failed - returned null')
  }

  // Test 3: getHeaderSettings
  console.log('\n📋 TEST: getHeaderSettings()')
  const headerSettings = await getHeaderSettings()
  if (headerSettings) {
    console.log('  ✅ Success')
    console.log(`     Background Type: ${headerSettings.backgroundType}`)
    console.log(`     Button Text: ${headerSettings.headerButtonText}`)
    console.log(`     Button URL: ${headerSettings.headerButtonUrl}`)
    console.log(`     Button Color: ${headerSettings.headerButtonBackgroundColor}`)
  } else {
    console.log('  ❌ Failed - returned null')
  }

  // Test 4: getFooter
  console.log('\n📋 TEST: getFooter()')
  const footer = await getFooter()
  if (footer) {
    console.log('  ✅ Success')
    console.log(`     Tagline: ${footer.tagline}`)
    console.log(`     Copyright: ${footer.copyrightText}`)
    console.log(`     CTA Text: ${footer.ctaText}`)
    console.log(`     Columns: ${footer.columns?.length || 0}`)
    footer.columns?.forEach((col: any, i: number) => {
      console.log(`       Column ${i + 1}: "${col.title}" (${col.links?.length || 0} links)`)
    })
  } else {
    console.log('  ❌ Failed - returned null')
  }

  // Test 5: getNavigation
  console.log('\n📋 TEST: getNavigation()')
  const navigation = await getNavigation()
  if (navigation) {
    console.log('  ✅ Success')
    console.log(`     Main Menu Items: ${navigation.mainMenu?.length || 0}`)
    navigation.mainMenu?.forEach((item: any) => {
      console.log(`       - ${item.label} -> ${item.url}`)
    })
  } else {
    console.log('  ❌ Failed - returned null')
  }

  // Test 6: getBlogPosts
  console.log('\n📋 TEST: getBlogPosts()')
  const blogPosts = await getBlogPosts()
  console.log(`  ✅ Success - ${blogPosts.length} posts`)
  blogPosts.forEach((post: any) => {
    console.log(`     - "${post.title}" (/${post.slug}) by ${post.author}`)
  })

  // Test 7: getBlogPost
  console.log('\n📋 TEST: getBlogPost("test")')
  const blogPost = await getBlogPost('test')
  if (blogPost) {
    console.log('  ✅ Success')
    console.log(`     Title: ${blogPost.title}`)
    console.log(`     Slug: ${blogPost.slug}`)
    console.log(`     Author: ${blogPost.author}`)
    console.log(`     Has Content: ${!!blogPost.content}`)
  } else {
    console.log('  ❌ Failed - returned null')
  }

  // Test 8: getRecentBlogPosts
  console.log('\n📋 TEST: getRecentBlogPosts(3)')
  const recentPosts = await getRecentBlogPosts(3)
  console.log(`  ✅ Success - ${recentPosts.length} posts`)

  // Test 9: getPage
  console.log('\n📋 TEST: getPage("reviews")')
  const page = await getPage('reviews')
  if (page) {
    console.log('  ✅ Success')
    console.log(`     Title: ${page.title}`)
    console.log(`     Slug: ${page.slug}`)
    console.log(`     Template: ${page.template}`)
    console.log(`     Subtitle: ${page.subtitle}`)
  } else {
    console.log('  ❌ Failed - returned null')
  }

  // Test 10: getPages
  console.log('\n📋 TEST: getPages()')
  const pages = await getPages()
  console.log(`  ✅ Success - ${pages.length} pages`)
  pages.forEach((p: any) => {
    console.log(`     - "${p.title}" (/${p.slug})`)
  })

  // Test 11: getFeaturedLoans
  console.log('\n📋 TEST: getFeaturedLoans()')
  const loans = await getFeaturedLoans()
  console.log(`  ✅ Success - ${loans.length} loans`)
  loans.forEach((loan: any) => {
    console.log(`     - "${loan.title}" (${loan.icon})`)
    console.log(`       ${loan.subtitle}`)
  })

  // Test 12: getRoutes
  console.log('\n📋 TEST: getRoutes()')
  const routes = await getRoutes()
  console.log(`  ✅ Success - ${routes.length} routes`)
  routes.forEach((route: any) => {
    console.log(`     - ${route.name} -> ${route.path}`)
  })

  // Test 13: getMediaUrl helper
  console.log('\n📋 TEST: getMediaUrl()')
  const mediaTests = [
    { url: '/api/media/file/test.png' },
    { url: '/cms-media/file/test.png' },
    '/api/media/file/string.png',
    null,
  ]
  mediaTests.forEach((test: any, i) => {
    const result = getMediaUrl(test)
    console.log(`     Test ${i + 1}: ${JSON.stringify(test)} -> ${result}`)
  })

  console.log('\n' + '='.repeat(60))
  console.log('✅ All tests completed!')
  console.log('='.repeat(60))

  process.exit(0)
}

runTests().catch(err => {
  console.error('Test failed:', err)
  process.exit(1)
})
