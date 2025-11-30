/**
 * Test script for API endpoints
 * Run with: npx tsx test-api-endpoints.ts
 */

const BASE_URL = 'http://localhost:3000'

// Test credentials - use the admin credentials from the database
const TEST_EMAIL = 'test@test.com'
const TEST_PASSWORD = 'testpass123'

interface TestResult {
  endpoint: string
  method: string
  status: number
  success: boolean
  message?: string
}

const results: TestResult[] = []

async function login(): Promise<string | null> {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    })

    if (!response.ok) {
      console.log('Login failed:', await response.text())
      return null
    }

    // Get the set-cookie header
    const cookies = response.headers.get('set-cookie')
    if (cookies) {
      const match = cookies.match(/admin_session=([^;]+)/)
      if (match) {
        return match[1]
      }
    }
    return null
  } catch (error) {
    console.error('Login error:', error)
    return null
  }
}

async function testEndpoint(
  endpoint: string,
  method: string = 'GET',
  body?: any,
  sessionToken?: string
): Promise<TestResult> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (sessionToken) {
      headers['Cookie'] = `admin_session=${sessionToken}`
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    const text = await response.text()
    let data
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }

    return {
      endpoint,
      method,
      status: response.status,
      success: response.ok,
      message: response.ok ? 'OK' : data?.error || 'Failed',
    }
  } catch (error: any) {
    return {
      endpoint,
      method,
      status: 0,
      success: false,
      message: error.message,
    }
  }
}

async function runTests() {
  console.log('🧪 Testing API Endpoints\n')
  console.log('='.repeat(70))

  // Test 1: Unauthenticated access should be rejected
  console.log('\n📋 TEST: Unauthenticated Access')
  let result = await testEndpoint('/api/media')
  results.push(result)
  console.log(`  ${result.status === 401 ? '✅' : '❌'} GET /api/media without auth: ${result.status} (expected 401)`)

  // Test 2: Login
  console.log('\n📋 TEST: Authentication')
  const sessionToken = await login()
  if (sessionToken) {
    console.log('  ✅ Login successful')
  } else {
    console.log('  ❌ Login failed - cannot continue tests')
    process.exit(1)
  }

  // Test 3: Media endpoints
  console.log('\n📋 TEST: Media API')
  result = await testEndpoint('/api/media', 'GET', undefined, sessionToken)
  results.push(result)
  console.log(`  ${result.success ? '✅' : '❌'} GET /api/media: ${result.status}`)

  // Test 4: Blog posts endpoints
  console.log('\n📋 TEST: Blog Posts API')
  result = await testEndpoint('/api/blog-posts', 'GET', undefined, sessionToken)
  results.push(result)
  console.log(`  ${result.success ? '✅' : '❌'} GET /api/blog-posts: ${result.status}`)

  result = await testEndpoint('/api/blog-posts/1', 'GET', undefined, sessionToken)
  results.push(result)
  console.log(`  ${result.success || result.status === 404 ? '✅' : '❌'} GET /api/blog-posts/1: ${result.status}`)

  // Test 5: Pages endpoints
  console.log('\n📋 TEST: Pages API')
  result = await testEndpoint('/api/pages', 'GET', undefined, sessionToken)
  results.push(result)
  console.log(`  ${result.success ? '✅' : '❌'} GET /api/pages: ${result.status}`)

  result = await testEndpoint('/api/pages/1', 'GET', undefined, sessionToken)
  results.push(result)
  console.log(`  ${result.success || result.status === 404 ? '✅' : '❌'} GET /api/pages/1: ${result.status}`)

  // Test 6: Featured loans endpoints
  console.log('\n📋 TEST: Featured Loans API')
  result = await testEndpoint('/api/featured-loans', 'GET', undefined, sessionToken)
  results.push(result)
  console.log(`  ${result.success ? '✅' : '❌'} GET /api/featured-loans: ${result.status}`)

  result = await testEndpoint('/api/featured-loans/1', 'GET', undefined, sessionToken)
  results.push(result)
  console.log(`  ${result.success || result.status === 404 ? '✅' : '❌'} GET /api/featured-loans/1: ${result.status}`)

  // Test 7: Routes endpoints
  console.log('\n📋 TEST: Routes API')
  result = await testEndpoint('/api/routes', 'GET', undefined, sessionToken)
  results.push(result)
  console.log(`  ${result.success ? '✅' : '❌'} GET /api/routes: ${result.status}`)

  result = await testEndpoint('/api/routes/1', 'GET', undefined, sessionToken)
  results.push(result)
  console.log(`  ${result.success || result.status === 404 ? '✅' : '❌'} GET /api/routes/1: ${result.status}`)

  // Test 8: Settings endpoints
  console.log('\n📋 TEST: Settings API')

  result = await testEndpoint('/api/settings/site', 'GET', undefined, sessionToken)
  results.push(result)
  console.log(`  ${result.success ? '✅' : '❌'} GET /api/settings/site: ${result.status}`)

  result = await testEndpoint('/api/settings/seo', 'GET', undefined, sessionToken)
  results.push(result)
  console.log(`  ${result.success ? '✅' : '❌'} GET /api/settings/seo: ${result.status}`)

  result = await testEndpoint('/api/settings/header', 'GET', undefined, sessionToken)
  results.push(result)
  console.log(`  ${result.success ? '✅' : '❌'} GET /api/settings/header: ${result.status}`)

  result = await testEndpoint('/api/settings/footer', 'GET', undefined, sessionToken)
  results.push(result)
  console.log(`  ${result.success ? '✅' : '❌'} GET /api/settings/footer: ${result.status}`)

  result = await testEndpoint('/api/settings/navigation', 'GET', undefined, sessionToken)
  results.push(result)
  console.log(`  ${result.success ? '✅' : '❌'} GET /api/settings/navigation: ${result.status}`)

  // Summary
  console.log('\n' + '='.repeat(70))
  const passed = results.filter(r => r.success || (r.status === 401 && r.endpoint === '/api/media' && !r.method.includes('auth')) || r.status === 404).length
  const total = results.length
  console.log(`\n📊 Results: ${passed}/${total} tests passed`)

  if (passed === total) {
    console.log('✅ All tests passed!')
  } else {
    console.log('\n❌ Failed tests:')
    results.filter(r => !r.success && r.status !== 401 && r.status !== 404).forEach(r => {
      console.log(`   ${r.method} ${r.endpoint}: ${r.status} - ${r.message}`)
    })
  }
  console.log('='.repeat(70))

  process.exit(passed === total ? 0 : 1)
}

runTests().catch(err => {
  console.error('Test failed:', err)
  process.exit(1)
})
