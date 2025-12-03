// ZIP code to city lookup using Zippopotam.us API

interface ZipLookupResult {
  city: string;
  state: string;
  stateAbbr: string;
}

// Cache for ZIP code lookups
const zipCache = new Map<string, ZipLookupResult | null>();

// Arkansas ZIP code to city mapping (common ZIP codes)
// Zippopotam.us doesn't have all ZIP codes, so we maintain a fallback
const arkansasZipCodes: Record<string, string> = {
  // Jonesboro area
  '72401': 'Jonesboro',
  '72402': 'Jonesboro',
  '72403': 'Jonesboro',
  '72404': 'Jonesboro',
  '72405': 'Jonesboro',
  // Little Rock area
  '72201': 'Little Rock',
  '72202': 'Little Rock',
  '72203': 'Little Rock',
  '72204': 'Little Rock',
  '72205': 'Little Rock',
  '72206': 'Little Rock',
  '72207': 'Little Rock',
  '72209': 'Little Rock',
  '72210': 'Little Rock',
  '72211': 'Little Rock',
  '72212': 'Little Rock',
  // Fort Smith area
  '72901': 'Fort Smith',
  '72902': 'Fort Smith',
  '72903': 'Fort Smith',
  '72904': 'Fort Smith',
  // Fayetteville area
  '72701': 'Fayetteville',
  '72702': 'Fayetteville',
  '72703': 'Fayetteville',
  '72704': 'Fayetteville',
  // Springdale
  '72762': 'Springdale',
  '72764': 'Springdale',
  '72765': 'Springdale',
  // Rogers/Bentonville
  '72712': 'Bentonville',
  '72756': 'Rogers',
  '72758': 'Rogers',
  // Conway
  '72032': 'Conway',
  '72034': 'Conway',
  '72035': 'Conway',
  // Hot Springs
  '71901': 'Hot Springs',
  '71902': 'Hot Springs',
  '71903': 'Hot Springs',
  // Pine Bluff
  '71601': 'Pine Bluff',
  '71602': 'Pine Bluff',
  '71603': 'Pine Bluff',
  // Texarkana
  '71854': 'Texarkana',
  // El Dorado
  '71730': 'El Dorado',
  // Paragould
  '72450': 'Paragould',
  // West Memphis
  '72301': 'West Memphis',
  // Searcy
  '72143': 'Searcy',
  '72145': 'Searcy',
  // Russellville
  '72801': 'Russellville',
  '72802': 'Russellville',
  // Mountain Home
  '72653': 'Mountain Home',
  // Blytheville
  '72315': 'Blytheville',
  '72316': 'Blytheville',
  // Harrison
  '72601': 'Harrison',
  '72602': 'Harrison',
  // Cabot
  '72023': 'Cabot',
  // Siloam Springs
  '72761': 'Siloam Springs',
};

export async function lookupZipCode(zipCode: string): Promise<ZipLookupResult | null> {
  // Check cache first
  if (zipCache.has(zipCode)) {
    return zipCache.get(zipCode) || null;
  }

  try {
    const response = await fetch(`https://api.zippopotam.us/us/${zipCode}`, {
      next: { revalidate: 86400 }, // Cache for 24 hours
    });

    if (!response.ok) {
      // Try fallback for Arkansas ZIP codes
      return tryArkansasFallback(zipCode);
    }

    const data = await response.json();

    // Check if API returned valid data (sometimes returns empty object)
    if (data.places && data.places.length > 0) {
      const result: ZipLookupResult = {
        city: data.places[0]['place name'],
        state: data.places[0].state,
        stateAbbr: data.places[0]['state abbreviation'],
      };
      zipCache.set(zipCode, result);
      return result;
    }

    // API returned empty data, try fallback
    return tryArkansasFallback(zipCode);
  } catch (error) {
    console.error('ZIP lookup error:', error);
    // Try fallback on error
    return tryArkansasFallback(zipCode);
  }
}

function tryArkansasFallback(zipCode: string): ZipLookupResult | null {
  const city = arkansasZipCodes[zipCode];
  if (city) {
    const result: ZipLookupResult = {
      city,
      state: 'Arkansas',
      stateAbbr: 'AR',
    };
    zipCache.set(zipCode, result);
    return result;
  }

  zipCache.set(zipCode, null);
  return null;
}

// Synchronous version using a static map for common ZIP codes
// This is a fallback for when we can't use async
const commonZipCodes: Record<string, { city: string; state: string }> = {
  // This can be expanded with common ZIP codes
  // For now, we'll rely on the async API
};

export function getStaticCityFromZip(zipCode: string): { city: string; state: string } | null {
  return commonZipCodes[zipCode] || null;
}
