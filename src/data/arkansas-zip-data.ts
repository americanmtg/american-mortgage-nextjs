// Arkansas Zip Code to County mapping with property tax rates
// Data sources:
// - Zip codes: US Census Bureau, USPS
// - Tax rates: Arkansas Department of Finance & Administration, tax-rates.org
// Last updated: December 2024

export interface ArkansasCountyData {
  name: string;
  effectiveTaxRate: number; // Percentage of market value
}

export interface ArkansasZipData {
  zip: string;
  city: string;
  county: string;
}

// Arkansas county effective property tax rates (% of market value)
// Based on median taxes paid vs median home values
export const arkansasCountyTaxRates: Record<string, number> = {
  'Arkansas': 0.48,
  'Ashley': 0.52,
  'Baxter': 0.45,
  'Benton': 0.60,
  'Boone': 0.42,
  'Bradley': 0.55,
  'Calhoun': 0.53,
  'Carroll': 0.48,
  'Chicot': 0.62,
  'Clark': 0.50,
  'Clay': 0.55,
  'Cleburne': 0.42,
  'Cleveland': 0.52,
  'Columbia': 0.58,
  'Conway': 0.48,
  'Craighead': 0.58,
  'Crawford': 0.50,
  'Crittenden': 0.65,
  'Cross': 0.55,
  'Dallas': 0.52,
  'Desha': 0.58,
  'Drew': 0.52,
  'Faulkner': 0.55,
  'Franklin': 0.45,
  'Fulton': 0.40,
  'Garland': 0.48,
  'Grant': 0.50,
  'Greene': 0.52,
  'Hempstead': 0.55,
  'Hot Spring': 0.48,
  'Howard': 0.50,
  'Independence': 0.48,
  'Izard': 0.42,
  'Jackson': 0.55,
  'Jefferson': 0.62,
  'Johnson': 0.48,
  'Lafayette': 0.55,
  'Lawrence': 0.50,
  'Lee': 0.58,
  'Lincoln': 0.55,
  'Little River': 0.52,
  'Logan': 0.48,
  'Lonoke': 0.55,
  'Madison': 0.45,
  'Marion': 0.42,
  'Miller': 0.55,
  'Mississippi': 0.60,
  'Monroe': 0.55,
  'Montgomery': 0.42,
  'Nevada': 0.52,
  'Newton': 0.38,
  'Ouachita': 0.55,
  'Perry': 0.45,
  'Phillips': 0.62,
  'Pike': 0.48,
  'Poinsett': 0.55,
  'Polk': 0.42,
  'Pope': 0.50,
  'Prairie': 0.52,
  'Pulaski': 0.65,
  'Randolph': 0.50,
  'Saline': 0.55,
  'Scott': 0.45,
  'Searcy': 0.38,
  'Sebastian': 0.55,
  'Sevier': 0.48,
  'Sharp': 0.45,
  'St. Francis': 0.58,
  'Stone': 0.40,
  'Union': 0.55,
  'Van Buren': 0.42,
  'Washington': 0.55,
  'White': 0.52,
  'Woodruff': 0.55,
  'Yell': 0.48,
};

// Complete Arkansas zip code to county mapping
export const arkansasZipCodes: ArkansasZipData[] = [
  // Jefferson County
  { zip: '71601', city: 'Pine Bluff', county: 'Jefferson' },
  { zip: '71602', city: 'White Hall', county: 'Jefferson' },
  { zip: '71603', city: 'Pine Bluff', county: 'Jefferson' },
  { zip: '71611', city: 'Pine Bluff', county: 'Jefferson' },
  { zip: '71612', city: 'White Hall', county: 'Jefferson' },
  { zip: '71613', city: 'Pine Bluff', county: 'Jefferson' },

  // Desha County
  { zip: '71630', city: 'Arkansas City', county: 'Desha' },
  { zip: '71639', city: 'Dumas', county: 'Desha' },
  { zip: '71654', city: 'McGehee', county: 'Desha' },
  { zip: '71666', city: 'Rohwer', county: 'Desha' },
  { zip: '71670', city: 'Reed', county: 'Desha' },
  { zip: '71674', city: 'Watson', county: 'Desha' },
  { zip: '72379', city: 'Snow Lake', county: 'Desha' },

  // Bradley County
  { zip: '71631', city: 'Banks', county: 'Bradley' },
  { zip: '71647', city: 'Hermitage', county: 'Bradley' },
  { zip: '71651', city: 'Jersey', county: 'Bradley' },
  { zip: '71671', city: 'Warren', county: 'Bradley' },

  // Ashley County
  { zip: '71635', city: 'Crossett', county: 'Ashley' },
  { zip: '71642', city: 'Fountain Hill', county: 'Ashley' },
  { zip: '71646', city: 'Hamburg', county: 'Ashley' },
  { zip: '71658', city: 'Montrose', county: 'Ashley' },
  { zip: '71661', city: 'Parkdale', county: 'Ashley' },
  { zip: '71663', city: 'Portland', county: 'Ashley' },
  { zip: '71676', city: 'Wilmot', county: 'Ashley' },

  // Chicot County
  { zip: '71638', city: 'Dermott', county: 'Chicot' },
  { zip: '71640', city: 'Eudora', county: 'Chicot' },
  { zip: '71653', city: 'Lake Village', county: 'Chicot' },

  // Lincoln County
  { zip: '71643', city: 'Gould', county: 'Lincoln' },
  { zip: '71644', city: 'Grady', county: 'Lincoln' },
  { zip: '71667', city: 'Star City', county: 'Lincoln' },

  // Cleveland County
  { zip: '71652', city: 'Kingsland', county: 'Cleveland' },
  { zip: '71660', city: 'New Edinburg', county: 'Cleveland' },
  { zip: '71665', city: 'Rison', county: 'Cleveland' },

  // Drew County
  { zip: '71655', city: 'Monticello', county: 'Drew' },
  { zip: '71656', city: 'Monticello', county: 'Drew' },
  { zip: '71657', city: 'Monticello', county: 'Drew' },
  { zip: '71675', city: 'Wilmar', county: 'Drew' },
  { zip: '71677', city: 'Winchester', county: 'Drew' },

  // Ouachita County
  { zip: '71720', city: 'Bearden', county: 'Ouachita' },
  { zip: '71726', city: 'Reader', county: 'Ouachita' },
  { zip: '71751', city: 'Louann', county: 'Ouachita' },
  { zip: '71764', city: 'Stephens', county: 'Ouachita' },

  // Nevada County
  { zip: '71722', city: 'Bluff City', county: 'Nevada' },
  { zip: '71835', city: 'Emmet', county: 'Nevada' },
  { zip: '71857', city: 'Prescott', county: 'Nevada' },
  { zip: '71858', city: 'Rosston', county: 'Nevada' },

  // Union County
  { zip: '71724', city: 'Calion', county: 'Union' },
  { zip: '71730', city: 'El Dorado', county: 'Union' },
  { zip: '71731', city: 'El Dorado', county: 'Union' },
  { zip: '71747', city: 'Huttig', county: 'Union' },
  { zip: '71749', city: 'Junction City', county: 'Union' },
  { zip: '71758', city: 'Mount Holly', county: 'Union' },
  { zip: '71759', city: 'Norphlet', county: 'Union' },
  { zip: '71762', city: 'Smackover', county: 'Union' },
  { zip: '71765', city: 'Strong', county: 'Union' },

  // Dallas County
  { zip: '71725', city: 'Carthage', county: 'Dallas' },
  { zip: '71742', city: 'Fordyce', county: 'Dallas' },
  { zip: '71763', city: 'Manning', county: 'Dallas' },

  // Calhoun County
  { zip: '71744', city: 'Hampton', county: 'Calhoun' },
  { zip: '71745', city: 'Harrell', county: 'Calhoun' },
  { zip: '71766', city: 'Thornton', county: 'Calhoun' },

  // Columbia County
  { zip: '71740', city: 'Emerson', county: 'Columbia' },
  { zip: '71752', city: 'McNeil', county: 'Columbia' },
  { zip: '71753', city: 'Magnolia', county: 'Columbia' },
  { zip: '71754', city: 'Magnolia', county: 'Columbia' },
  { zip: '71770', city: 'Waldo', county: 'Columbia' },
  { zip: '71861', city: 'Taylor', county: 'Columbia' },

  // Clark County
  { zip: '71743', city: 'Gurdon', county: 'Clark' },
  { zip: '71921', city: 'Amity', county: 'Clark' },
  { zip: '71923', city: 'Arkadelphia', county: 'Clark' },
  { zip: '71962', city: 'Okolona', county: 'Clark' },

  // Little River County
  { zip: '71820', city: 'Alleene', county: 'Little River' },
  { zip: '71822', city: 'Ashdown', county: 'Little River' },
  { zip: '71836', city: 'Foreman', county: 'Little River' },
  { zip: '71853', city: 'Ogden', county: 'Little River' },
  { zip: '71865', city: 'Wilton', county: 'Little River' },
  { zip: '71866', city: 'Winthrop', county: 'Little River' },

  // Sevier County
  { zip: '71823', city: 'Ben Lomond', county: 'Sevier' },
  { zip: '71832', city: 'De Queen', county: 'Sevier' },
  { zip: '71841', city: 'Gillham', county: 'Sevier' },
  { zip: '71842', city: 'Horatio', county: 'Sevier' },
  { zip: '71846', city: 'Lockesburg', county: 'Sevier' },

  // Hempstead County
  { zip: '71825', city: 'Blevins', county: 'Hempstead' },
  { zip: '71838', city: 'Fulton', county: 'Hempstead' },
  { zip: '71847', city: 'McCaskill', county: 'Hempstead' },
  { zip: '71855', city: 'Ozan', county: 'Hempstead' },
  { zip: '71862', city: 'Washington', county: 'Hempstead' },
  { zip: '71801', city: 'Hope', county: 'Hempstead' },
  { zip: '71802', city: 'Hope', county: 'Hempstead' },

  // Lafayette County
  { zip: '71826', city: 'Bradley', county: 'Lafayette' },
  { zip: '71827', city: 'Buckner', county: 'Lafayette' },
  { zip: '71845', city: 'Lewisville', county: 'Lafayette' },
  { zip: '71860', city: 'Stamps', county: 'Lafayette' },

  // Miller County
  { zip: '71834', city: 'Doddridge', county: 'Miller' },
  { zip: '71837', city: 'Fouke', county: 'Miller' },
  { zip: '71839', city: 'Garland City', county: 'Miller' },
  { zip: '71854', city: 'Texarkana', county: 'Miller' },

  // Howard County
  { zip: '71833', city: 'Dierks', county: 'Howard' },
  { zip: '71851', city: 'Mineral Springs', county: 'Howard' },
  { zip: '71852', city: 'Nashville', county: 'Howard' },
  { zip: '71859', city: 'Saratoga', county: 'Howard' },
  { zip: '71971', city: 'Umpire', county: 'Howard' },

  // Garland County
  { zip: '71901', city: 'Hot Springs', county: 'Garland' },
  { zip: '71902', city: 'Hot Springs', county: 'Garland' },
  { zip: '71903', city: 'Hot Springs', county: 'Garland' },
  { zip: '71909', city: 'Hot Springs Village', county: 'Garland' },
  { zip: '71910', city: 'Hot Springs Village', county: 'Garland' },
  { zip: '71913', city: 'Hot Springs', county: 'Garland' },
  { zip: '71914', city: 'Hot Springs', county: 'Garland' },
  { zip: '71949', city: 'Jessieville', county: 'Garland' },
  { zip: '71956', city: 'Mountain Pine', county: 'Garland' },
  { zip: '71964', city: 'Pearcy', county: 'Garland' },
  { zip: '71968', city: 'Royal', county: 'Garland' },
  { zip: '72087', city: 'Lonsdale', county: 'Garland' },

  // Hot Spring County
  { zip: '71929', city: 'Bismarck', county: 'Hot Spring' },
  { zip: '71933', city: 'Bonnerdale', county: 'Hot Spring' },
  { zip: '71941', city: 'Donaldson', county: 'Hot Spring' },
  { zip: '72104', city: 'Malvern', county: 'Hot Spring' },
  { zip: '72105', city: 'Jones Mill', county: 'Hot Spring' },

  // Montgomery County
  { zip: '71935', city: 'Caddo Gap', county: 'Montgomery' },
  { zip: '71957', city: 'Mount Ida', county: 'Montgomery' },
  { zip: '71960', city: 'Norman', county: 'Montgomery' },
  { zip: '71961', city: 'Oden', county: 'Montgomery' },
  { zip: '71965', city: 'Pencil Bluff', county: 'Montgomery' },
  { zip: '71969', city: 'Sims', county: 'Montgomery' },
  { zip: '71970', city: 'Story', county: 'Montgomery' },

  // Pike County
  { zip: '71922', city: 'Antoine', county: 'Pike' },
  { zip: '71940', city: 'Delight', county: 'Pike' },
  { zip: '71943', city: 'Glenwood', county: 'Pike' },
  { zip: '71950', city: 'Kirby', county: 'Pike' },
  { zip: '71952', city: 'Langley', county: 'Pike' },
  { zip: '71958', city: 'Murfreesboro', county: 'Pike' },
  { zip: '71959', city: 'Newhope', county: 'Pike' },

  // Polk County
  { zip: '71937', city: 'Cove', county: 'Polk' },
  { zip: '71944', city: 'Grannis', county: 'Polk' },
  { zip: '71945', city: 'Hatfield', county: 'Polk' },
  { zip: '71953', city: 'Mena', county: 'Polk' },
  { zip: '71972', city: 'Vandervoort', county: 'Polk' },
  { zip: '71973', city: 'Wickes', county: 'Polk' },

  // Perry County
  { zip: '72001', city: 'Adona', county: 'Perry' },
  { zip: '72016', city: 'Bigelow', county: 'Perry' },
  { zip: '72025', city: 'Casa', county: 'Perry' },
  { zip: '72070', city: 'Houston', county: 'Perry' },
  { zip: '72126', city: 'Perryville', county: 'Perry' },

  // Saline County
  { zip: '72002', city: 'Alexander', county: 'Saline' },
  { zip: '72011', city: 'Bauxite', county: 'Saline' },
  { zip: '72015', city: 'Benton', county: 'Saline' },
  { zip: '72019', city: 'Benton', county: 'Saline' },
  { zip: '72022', city: 'Bryant', county: 'Saline' },
  { zip: '72065', city: 'Hensley', county: 'Saline' },
  { zip: '72103', city: 'Mabelvale', county: 'Saline' },
  { zip: '72122', city: 'Paron', county: 'Saline' },
  { zip: '72167', city: 'Traskwood', county: 'Saline' },

  // Arkansas County
  { zip: '72003', city: 'Almyra', county: 'Arkansas' },
  { zip: '72026', city: 'Casscoe', county: 'Arkansas' },
  { zip: '72038', city: 'Crocketts Bluff', county: 'Arkansas' },
  { zip: '72042', city: 'DeWitt', county: 'Arkansas' },
  { zip: '72048', city: 'Ethel', county: 'Arkansas' },
  { zip: '72055', city: 'Gillett', county: 'Arkansas' },
  { zip: '72073', city: 'Humphrey', county: 'Arkansas' },
  { zip: '72140', city: 'Saint Charles', county: 'Arkansas' },
  { zip: '72160', city: 'Stuttgart', county: 'Arkansas' },
  { zip: '72166', city: 'Tichnor', county: 'Arkansas' },

  // Lonoke County
  { zip: '72007', city: 'Austin', county: 'Lonoke' },
  { zip: '72023', city: 'Cabot', county: 'Lonoke' },
  { zip: '72024', city: 'Carlisle', county: 'Lonoke' },
  { zip: '72046', city: 'England', county: 'Lonoke' },
  { zip: '72072', city: 'Humnoke', county: 'Lonoke' },
  { zip: '72083', city: 'Keo', county: 'Lonoke' },
  { zip: '72086', city: 'Lonoke', county: 'Lonoke' },
  { zip: '72142', city: 'Scott', county: 'Lonoke' },
  { zip: '72176', city: 'Ward', county: 'Lonoke' },

  // White County
  { zip: '72010', city: 'Bald Knob', county: 'White' },
  { zip: '72012', city: 'Beebe', county: 'White' },
  { zip: '72020', city: 'Bradford', county: 'White' },
  { zip: '72045', city: 'El Paso', county: 'White' },
  { zip: '72060', city: 'Griffithville', county: 'White' },
  { zip: '72068', city: 'Higginson', county: 'White' },
  { zip: '72081', city: 'Judsonia', county: 'White' },
  { zip: '72082', city: 'Kensett', county: 'White' },
  { zip: '72085', city: 'Letona', county: 'White' },
  { zip: '72102', city: 'McRae', county: 'White' },
  { zip: '72121', city: 'Pangburn', county: 'White' },
  { zip: '72136', city: 'Romance', county: 'White' },
  { zip: '72137', city: 'Rose Bud', county: 'White' },
  { zip: '72139', city: 'Russell', county: 'White' },
  { zip: '72143', city: 'Searcy', county: 'White' },
  { zip: '72145', city: 'Searcy', county: 'White' },

  // Woodruff County
  { zip: '72006', city: 'Augusta', county: 'Woodruff' },
  { zip: '72036', city: 'Cotton Plant', county: 'Woodruff' },
  { zip: '72074', city: 'Hunter', county: 'Woodruff' },
  { zip: '72101', city: 'McCrory', county: 'Woodruff' },
  { zip: '72123', city: 'Patterson', county: 'Woodruff' },

  // Jackson County
  { zip: '72005', city: 'Amagon', county: 'Jackson' },
  { zip: '72014', city: 'Beedeville', county: 'Jackson' },
  { zip: '72043', city: 'Diaz', county: 'Jackson' },
  { zip: '72075', city: 'Jacksonport', county: 'Jackson' },
  { zip: '72112', city: 'Newport', county: 'Jackson' },
  { zip: '72431', city: 'Grubbs', county: 'Jackson' },
  { zip: '72471', city: 'Swifton', county: 'Jackson' },
  { zip: '72473', city: 'Tuckerman', county: 'Jackson' },

  // Van Buren County
  { zip: '72013', city: 'Bee Branch', county: 'Van Buren' },
  { zip: '72031', city: 'Clinton', county: 'Van Buren' },
  { zip: '72080', city: 'Jerusalem', county: 'Van Buren' },
  { zip: '72088', city: 'Fairfield Bay', county: 'Van Buren' },
  { zip: '72141', city: 'Scotland', county: 'Van Buren' },
  { zip: '72153', city: 'Shirley', county: 'Van Buren' },
  { zip: '72629', city: 'Dennard', county: 'Van Buren' },

  // Faulkner County
  { zip: '72032', city: 'Conway', county: 'Faulkner' },
  { zip: '72033', city: 'Conway', county: 'Faulkner' },
  { zip: '72034', city: 'Conway', county: 'Faulkner' },
  { zip: '72035', city: 'Conway', county: 'Faulkner' },
  { zip: '72039', city: 'Twin Groves', county: 'Faulkner' },
  { zip: '72047', city: 'Enola', county: 'Faulkner' },
  { zip: '72058', city: 'Greenbrier', county: 'Faulkner' },
  { zip: '72061', city: 'Guy', county: 'Faulkner' },
  { zip: '72106', city: 'Mayflower', county: 'Faulkner' },
  { zip: '72111', city: 'Mount Vernon', county: 'Faulkner' },
  { zip: '72173', city: 'Vilonia', county: 'Faulkner' },
  { zip: '72181', city: 'Wooster', county: 'Faulkner' },

  // Conway County
  { zip: '72027', city: 'Center Ridge', county: 'Conway' },
  { zip: '72030', city: 'Cleveland', county: 'Conway' },
  { zip: '72063', city: 'Hattieville', county: 'Conway' },
  { zip: '72107', city: 'Menifee', county: 'Conway' },
  { zip: '72110', city: 'Morrilton', county: 'Conway' },
  { zip: '72125', city: 'Perry', county: 'Conway' },
  { zip: '72127', city: 'Plumerville', county: 'Conway' },
  { zip: '72156', city: 'Solgohachia', county: 'Conway' },
  { zip: '72157', city: 'Springfield', county: 'Conway' },

  // Monroe County
  { zip: '72021', city: 'Brinkley', county: 'Monroe' },
  { zip: '72029', city: 'Clarendon', county: 'Monroe' },
  { zip: '72069', city: 'Holly Grove', county: 'Monroe' },
  { zip: '72108', city: 'Monroe', county: 'Monroe' },
  { zip: '72134', city: 'Roe', county: 'Monroe' },

  // Prairie County
  { zip: '72017', city: 'Biscoe', county: 'Prairie' },
  { zip: '72040', city: 'Des Arc', county: 'Prairie' },
  { zip: '72041', city: 'De Valls Bluff', county: 'Prairie' },
  { zip: '72064', city: 'Hazen', county: 'Prairie' },
  { zip: '72170', city: 'Ulm', county: 'Prairie' },

  // Grant County
  { zip: '72057', city: 'Grapevine', county: 'Grant' },
  { zip: '72084', city: 'Leola', county: 'Grant' },
  { zip: '72128', city: 'Poyen', county: 'Grant' },
  { zip: '72129', city: 'Prattsville', county: 'Grant' },
  { zip: '72150', city: 'Sheridan', county: 'Grant' },

  // Cleburne County
  { zip: '72044', city: 'Edgemont', county: 'Cleburne' },
  { zip: '72067', city: 'Greers Ferry', county: 'Cleburne' },
  { zip: '72130', city: 'Prim', county: 'Cleburne' },
  { zip: '72131', city: 'Quitman', county: 'Cleburne' },
  { zip: '72179', city: 'Wilburn', county: 'Cleburne' },
  { zip: '72523', city: 'Concord', county: 'Cleburne' },
  { zip: '72530', city: 'Drasco', county: 'Cleburne' },
  { zip: '72543', city: 'Heber Springs', county: 'Cleburne' },
  { zip: '72581', city: 'Tumbling Shoals', county: 'Cleburne' },

  // Pulaski County
  { zip: '72053', city: 'College Station', county: 'Pulaski' },
  { zip: '72076', city: 'Jacksonville', county: 'Pulaski' },
  { zip: '72078', city: 'Jacksonville', county: 'Pulaski' },
  { zip: '72099', city: 'Little Rock AFB', county: 'Pulaski' },
  { zip: '72113', city: 'Maumelle', county: 'Pulaski' },
  { zip: '72114', city: 'North Little Rock', county: 'Pulaski' },
  { zip: '72115', city: 'North Little Rock', county: 'Pulaski' },
  { zip: '72116', city: 'North Little Rock', county: 'Pulaski' },
  { zip: '72117', city: 'North Little Rock', county: 'Pulaski' },
  { zip: '72118', city: 'North Little Rock', county: 'Pulaski' },
  { zip: '72119', city: 'North Little Rock', county: 'Pulaski' },
  { zip: '72120', city: 'Sherwood', county: 'Pulaski' },
  { zip: '72124', city: 'North Little Rock', county: 'Pulaski' },
  { zip: '72135', city: 'Roland', county: 'Pulaski' },
  { zip: '72180', city: 'Woodson', county: 'Pulaski' },
  { zip: '72183', city: 'Wrightsville', county: 'Pulaski' },
  { zip: '72190', city: 'Little Rock', county: 'Pulaski' },
  { zip: '72199', city: 'Little Rock', county: 'Pulaski' },
  { zip: '72201', city: 'Little Rock', county: 'Pulaski' },
  { zip: '72202', city: 'Little Rock', county: 'Pulaski' },
  { zip: '72203', city: 'Little Rock', county: 'Pulaski' },
  { zip: '72204', city: 'Little Rock', county: 'Pulaski' },
  { zip: '72205', city: 'Little Rock', county: 'Pulaski' },
  { zip: '72206', city: 'Little Rock', county: 'Pulaski' },
  { zip: '72207', city: 'Little Rock', county: 'Pulaski' },
  { zip: '72209', city: 'Little Rock', county: 'Pulaski' },
  { zip: '72210', city: 'Little Rock', county: 'Pulaski' },
  { zip: '72211', city: 'Little Rock', county: 'Pulaski' },
  { zip: '72212', city: 'Little Rock', county: 'Pulaski' },
  { zip: '72214', city: 'Little Rock', county: 'Pulaski' },
  { zip: '72215', city: 'Little Rock', county: 'Pulaski' },
  { zip: '72216', city: 'Little Rock', county: 'Pulaski' },
  { zip: '72217', city: 'Little Rock', county: 'Pulaski' },
  { zip: '72219', city: 'Little Rock', county: 'Pulaski' },
  { zip: '72221', city: 'Little Rock', county: 'Pulaski' },
  { zip: '72222', city: 'Little Rock', county: 'Pulaski' },
  { zip: '72223', city: 'Little Rock', county: 'Pulaski' },
  { zip: '72225', city: 'Little Rock', county: 'Pulaski' },
  { zip: '72227', city: 'Little Rock', county: 'Pulaski' },
  { zip: '72231', city: 'Little Rock', county: 'Pulaski' },
  { zip: '72260', city: 'Little Rock', county: 'Pulaski' },
  { zip: '72295', city: 'Little Rock', county: 'Pulaski' },

  // Crittenden County
  { zip: '72301', city: 'West Memphis', county: 'Crittenden' },
  { zip: '72303', city: 'West Memphis', county: 'Crittenden' },
  { zip: '72327', city: 'Crawfordsville', county: 'Crittenden' },
  { zip: '72331', city: 'Earle', county: 'Crittenden' },
  { zip: '72332', city: 'Edmondson', county: 'Crittenden' },
  { zip: '72339', city: 'Gilmore', county: 'Crittenden' },
  { zip: '72364', city: 'Marion', county: 'Crittenden' },
  { zip: '72376', city: 'Proctor', county: 'Crittenden' },
  { zip: '72384', city: 'Turrell', county: 'Crittenden' },

  // Lee County
  { zip: '72311', city: 'Aubrey', county: 'Lee' },
  { zip: '72320', city: 'Brickeys', county: 'Lee' },
  { zip: '72341', city: 'Haynes', county: 'Lee' },
  { zip: '72360', city: 'Marianna', county: 'Lee' },
  { zip: '72368', city: 'Moro', county: 'Lee' },

  // Mississippi County
  { zip: '72315', city: 'Blytheville', county: 'Mississippi' },
  { zip: '72316', city: 'Blytheville', county: 'Mississippi' },
  { zip: '72321', city: 'Burdette', county: 'Mississippi' },
  { zip: '72329', city: 'Driver', county: 'Mississippi' },
  { zip: '72330', city: 'Dyess', county: 'Mississippi' },
  { zip: '72338', city: 'Frenchmans Bayou', county: 'Mississippi' },
  { zip: '72350', city: 'Joiner', county: 'Mississippi' },
  { zip: '72351', city: 'Keiser', county: 'Mississippi' },
  { zip: '72358', city: 'Luxora', county: 'Mississippi' },
  { zip: '72370', city: 'Osceola', county: 'Mississippi' },
  { zip: '72395', city: 'Wilson', county: 'Mississippi' },
  { zip: '72426', city: 'Dell', county: 'Mississippi' },
  { zip: '72428', city: 'Etowah', county: 'Mississippi' },
  { zip: '72438', city: 'Leachville', county: 'Mississippi' },
  { zip: '72442', city: 'Manila', county: 'Mississippi' },

  // St. Francis County
  { zip: '72322', city: 'Caldwell', county: 'St. Francis' },
  { zip: '72326', city: 'Colt', county: 'St. Francis' },
  { zip: '72335', city: 'Forrest City', county: 'St. Francis' },
  { zip: '72336', city: 'Forrest City', county: 'St. Francis' },
  { zip: '72340', city: 'Goodwin', county: 'St. Francis' },
  { zip: '72346', city: 'Heth', county: 'St. Francis' },
  { zip: '72348', city: 'Hughes', county: 'St. Francis' },
  { zip: '72359', city: 'Madison', county: 'St. Francis' },
  { zip: '72372', city: 'Palestine', county: 'St. Francis' },
  { zip: '72392', city: 'Wheatley', county: 'St. Francis' },
  { zip: '72394', city: 'Widener', county: 'St. Francis' },

  // Cross County
  { zip: '72324', city: 'Cherry Valley', county: 'Cross' },
  { zip: '72347', city: 'Hickory Ridge', county: 'Cross' },
  { zip: '72373', city: 'Parkin', county: 'Cross' },
  { zip: '72387', city: 'Vanndale', county: 'Cross' },
  { zip: '72396', city: 'Wynne', county: 'Cross' },

  // Phillips County
  { zip: '72328', city: 'Crumrod', county: 'Phillips' },
  { zip: '72333', city: 'Elaine', county: 'Phillips' },
  { zip: '72342', city: 'Helena', county: 'Phillips' },
  { zip: '72353', city: 'Lambrook', county: 'Phillips' },
  { zip: '72355', city: 'Lexa', county: 'Phillips' },
  { zip: '72366', city: 'Marvell', county: 'Phillips' },
  { zip: '72367', city: 'Mellwood', county: 'Phillips' },
  { zip: '72369', city: 'Oneida', county: 'Phillips' },
  { zip: '72374', city: 'Poplar Grove', county: 'Phillips' },
  { zip: '72383', city: 'Turner', county: 'Phillips' },
  { zip: '72389', city: 'Wabash', county: 'Phillips' },
  { zip: '72390', city: 'West Helena', county: 'Phillips' },

  // Poinsett County
  { zip: '72354', city: 'Lepanto', county: 'Poinsett' },
  { zip: '72365', city: 'Marked Tree', county: 'Poinsett' },
  { zip: '72377', city: 'Rivervale', county: 'Poinsett' },
  { zip: '72386', city: 'Tyronza', county: 'Poinsett' },
  { zip: '72429', city: 'Fisher', county: 'Poinsett' },
  { zip: '72432', city: 'Harrisburg', county: 'Poinsett' },
  { zip: '72472', city: 'Trumann', county: 'Poinsett' },
  { zip: '72475', city: 'Waldenburg', county: 'Poinsett' },
  { zip: '72479', city: 'Weiner', county: 'Poinsett' },

  // Craighead County
  { zip: '72401', city: 'Jonesboro', county: 'Craighead' },
  { zip: '72402', city: 'Jonesboro', county: 'Craighead' },
  { zip: '72403', city: 'Jonesboro', county: 'Craighead' },
  { zip: '72404', city: 'Jonesboro', county: 'Craighead' },
  { zip: '72411', city: 'Bay', county: 'Craighead' },
  { zip: '72414', city: 'Black Oak', county: 'Craighead' },
  { zip: '72416', city: 'Bono', county: 'Craighead' },
  { zip: '72417', city: 'Brookland', county: 'Craighead' },
  { zip: '72419', city: 'Caraway', county: 'Craighead' },
  { zip: '72421', city: 'Cash', county: 'Craighead' },
  { zip: '72427', city: 'Egypt', county: 'Craighead' },
  { zip: '72437', city: 'Lake City', county: 'Craighead' },
  { zip: '72447', city: 'Monette', county: 'Craighead' },
  { zip: '72467', city: 'State University', county: 'Craighead' },

  // Greene County
  { zip: '72412', city: 'Beech Grove', county: 'Greene' },
  { zip: '72425', city: 'Delaplaine', county: 'Greene' },
  { zip: '72436', city: 'Lafe', county: 'Greene' },
  { zip: '72443', city: 'Marmaduke', county: 'Greene' },
  { zip: '72450', city: 'Paragould', county: 'Greene' },
  { zip: '72451', city: 'Paragould', county: 'Greene' },

  // Clay County
  { zip: '72422', city: 'Corning', county: 'Clay' },
  { zip: '72424', city: 'Datto', county: 'Clay' },
  { zip: '72430', city: 'Greenway', county: 'Clay' },
  { zip: '72435', city: 'Knobel', county: 'Clay' },
  { zip: '72441', city: 'McDougal', county: 'Clay' },
  { zip: '72453', city: 'Peach Orchard', county: 'Clay' },
  { zip: '72454', city: 'Piggott', county: 'Clay' },
  { zip: '72456', city: 'Pollard', county: 'Clay' },
  { zip: '72461', city: 'Rector', county: 'Clay' },
  { zip: '72464', city: 'Saint Francis', county: 'Clay' },
  { zip: '72470', city: 'Success', county: 'Clay' },

  // Randolph County
  { zip: '72413', city: 'Biggers', county: 'Randolph' },
  { zip: '72444', city: 'Maynard', county: 'Randolph' },
  { zip: '72449', city: 'OKean', county: 'Randolph' },
  { zip: '72455', city: 'Pocahontas', county: 'Randolph' },
  { zip: '72460', city: 'Ravenden Springs', county: 'Randolph' },
  { zip: '72462', city: 'Reyno', county: 'Randolph' },
  { zip: '72478', city: 'Warm Springs', county: 'Randolph' },

  // Lawrence County
  { zip: '72410', city: 'Alicia', county: 'Lawrence' },
  { zip: '72415', city: 'Black Rock', county: 'Lawrence' },
  { zip: '72433', city: 'Hoxie', county: 'Lawrence' },
  { zip: '72434', city: 'Imboden', county: 'Lawrence' },
  { zip: '72440', city: 'Lynn', county: 'Lawrence' },
  { zip: '72445', city: 'Minturn', county: 'Lawrence' },
  { zip: '72457', city: 'Portia', county: 'Lawrence' },
  { zip: '72458', city: 'Powhatan', county: 'Lawrence' },
  { zip: '72459', city: 'Ravenden', county: 'Lawrence' },
  { zip: '72466', city: 'Smithville', county: 'Lawrence' },
  { zip: '72469', city: 'Strawberry', county: 'Lawrence' },
  { zip: '72476', city: 'Walnut Ridge', county: 'Lawrence' },
  { zip: '72572', city: 'Saffell', county: 'Lawrence' },

  // Independence County
  { zip: '72501', city: 'Batesville', county: 'Independence' },
  { zip: '72503', city: 'Batesville', county: 'Independence' },
  { zip: '72522', city: 'Charlotte', county: 'Independence' },
  { zip: '72524', city: 'Cord', county: 'Independence' },
  { zip: '72526', city: 'Cushman', county: 'Independence' },
  { zip: '72527', city: 'Desha', county: 'Independence' },
  { zip: '72534', city: 'Floral', county: 'Independence' },
  { zip: '72550', city: 'Locust Grove', county: 'Independence' },
  { zip: '72553', city: 'Magness', county: 'Independence' },
  { zip: '72562', city: 'Newark', county: 'Independence' },
  { zip: '72564', city: 'Oil Trough', county: 'Independence' },
  { zip: '72568', city: 'Pleasant Plains', county: 'Independence' },
  { zip: '72571', city: 'Rosie', county: 'Independence' },
  { zip: '72579', city: 'Sulphur Rock', county: 'Independence' },
  { zip: '72165', city: 'Thida', county: 'Independence' },

  // Sharp County
  { zip: '72513', city: 'Agnos', county: 'Sharp' },
  { zip: '72521', city: 'Cave City', county: 'Sharp' },
  { zip: '72529', city: 'Cherokee Village', county: 'Sharp' },
  { zip: '72532', city: 'Evening Shade', county: 'Sharp' },
  { zip: '72542', city: 'Hardy', county: 'Sharp' },
  { zip: '72569', city: 'Poughkeepsie', county: 'Sharp' },
  { zip: '72577', city: 'Sidney', county: 'Sharp' },
  { zip: '72482', city: 'Williford', county: 'Sharp' },

  // Izard County
  { zip: '72512', city: 'Horseshoe Bend', county: 'Izard' },
  { zip: '72517', city: 'Brockwell', county: 'Izard' },
  { zip: '72519', city: 'Calico Rock', county: 'Izard' },
  { zip: '72528', city: 'Dolph', county: 'Izard' },
  { zip: '72536', city: 'Franklin', county: 'Izard' },
  { zip: '72540', city: 'Guion', county: 'Izard' },
  { zip: '72556', city: 'Melbourne', county: 'Izard' },
  { zip: '72561', city: 'Mount Pleasant', county: 'Izard' },
  { zip: '72565', city: 'Oxford', county: 'Izard' },
  { zip: '72566', city: 'Pineville', county: 'Izard' },
  { zip: '72573', city: 'Sage', county: 'Izard' },
  { zip: '72584', city: 'Violet Hill', county: 'Izard' },
  { zip: '72585', city: 'Wideman', county: 'Izard' },
  { zip: '72587', city: 'Wiseman', county: 'Izard' },

  // Fulton County
  { zip: '72515', city: 'Bexar', county: 'Fulton' },
  { zip: '72520', city: 'Camp', county: 'Fulton' },
  { zip: '72525', city: 'Cherokee Village', county: 'Fulton' },
  { zip: '72531', city: 'Elizabeth', county: 'Fulton' },
  { zip: '72538', city: 'Gepp', county: 'Fulton' },
  { zip: '72539', city: 'Glencoe', county: 'Fulton' },
  { zip: '72554', city: 'Mammoth Spring', county: 'Fulton' },
  { zip: '72576', city: 'Salem', county: 'Fulton' },
  { zip: '72578', city: 'Sturkie', county: 'Fulton' },
  { zip: '72583', city: 'Viola', county: 'Fulton' },

  // Stone County
  { zip: '72051', city: 'Fox', county: 'Stone' },
  { zip: '72533', city: 'Fifty Six', county: 'Stone' },
  { zip: '72555', city: 'Marcella', county: 'Stone' },
  { zip: '72560', city: 'Mountain View', county: 'Stone' },
  { zip: '72567', city: 'Pleasant Grove', county: 'Stone' },
  { zip: '72663', city: 'Onia', county: 'Stone' },
  { zip: '72680', city: 'Timbo', county: 'Stone' },

  // Baxter County
  { zip: '72537', city: 'Gamaliel', county: 'Baxter' },
  { zip: '72544', city: 'Henderson', county: 'Baxter' },
  { zip: '72617', city: 'Big Flat', county: 'Baxter' },
  { zip: '72623', city: 'Clarkridge', county: 'Baxter' },
  { zip: '72626', city: 'Cotter', county: 'Baxter' },
  { zip: '72635', city: 'Gassville', county: 'Baxter' },
  { zip: '72642', city: 'Lakeview', county: 'Baxter' },
  { zip: '72651', city: 'Midway', county: 'Baxter' },
  { zip: '72653', city: 'Mountain Home', county: 'Baxter' },
  { zip: '72654', city: 'Mountain Home', county: 'Baxter' },
  { zip: '72658', city: 'Norfork', county: 'Baxter' },

  // Boone County
  { zip: '72601', city: 'Harrison', county: 'Boone' },
  { zip: '72602', city: 'Harrison', county: 'Boone' },
  { zip: '72630', city: 'Diamond City', county: 'Boone' },
  { zip: '72633', city: 'Everton', county: 'Boone' },
  { zip: '72644', city: 'Lead Hill', county: 'Boone' },
  { zip: '72662', city: 'Omaha', county: 'Boone' },

  // Marion County
  { zip: '72619', city: 'Bull Shoals', county: 'Marion' },
  { zip: '72634', city: 'Flippin', county: 'Marion' },
  { zip: '72661', city: 'Oakland', county: 'Marion' },
  { zip: '72668', city: 'Peel', county: 'Marion' },
  { zip: '72672', city: 'Pyatt', county: 'Marion' },
  { zip: '72677', city: 'Summit', county: 'Marion' },
  { zip: '72682', city: 'Valley Springs', county: 'Marion' },
  { zip: '72687', city: 'Yellville', county: 'Marion' },

  // Carroll County
  { zip: '72611', city: 'Alpena', county: 'Carroll' },
  { zip: '72616', city: 'Berryville', county: 'Carroll' },
  { zip: '72631', city: 'Eureka Springs', county: 'Carroll' },
  { zip: '72632', city: 'Eureka Springs', county: 'Carroll' },
  { zip: '72638', city: 'Green Forest', county: 'Carroll' },
  { zip: '72660', city: 'Oak Grove', county: 'Carroll' },

  // Newton County
  { zip: '72624', city: 'Compton', county: 'Newton' },
  { zip: '72628', city: 'Deer', county: 'Newton' },
  { zip: '72640', city: 'Hasty', county: 'Newton' },
  { zip: '72641', city: 'Jasper', county: 'Newton' },
  { zip: '72648', city: 'Marble Falls', county: 'Newton' },
  { zip: '72655', city: 'Mount Judea', county: 'Newton' },
  { zip: '72666', city: 'Parthenon', county: 'Newton' },
  { zip: '72683', city: 'Vendor', county: 'Newton' },
  { zip: '72685', city: 'Western Grove', county: 'Newton' },
  { zip: '72856', city: 'Pelsor', county: 'Newton' },

  // Searcy County
  { zip: '72610', city: 'Alco', county: 'Searcy' },
  { zip: '72639', city: 'Harriet', county: 'Searcy' },
  { zip: '72645', city: 'Leslie', county: 'Searcy' },
  { zip: '72650', city: 'Marshall', county: 'Searcy' },
  { zip: '72669', city: 'Pindall', county: 'Searcy' },
  { zip: '72675', city: 'Saint Joe', county: 'Searcy' },
  { zip: '72686', city: 'Witts Springs', county: 'Searcy' },

  // Washington County
  { zip: '72701', city: 'Fayetteville', county: 'Washington' },
  { zip: '72702', city: 'Fayetteville', county: 'Washington' },
  { zip: '72703', city: 'Fayetteville', county: 'Washington' },
  { zip: '72704', city: 'Fayetteville', county: 'Washington' },
  { zip: '72717', city: 'Canehill', county: 'Washington' },
  { zip: '72727', city: 'Elkins', county: 'Washington' },
  { zip: '72729', city: 'Evansville', county: 'Washington' },
  { zip: '72730', city: 'Farmington', county: 'Washington' },
  { zip: '72744', city: 'Lincoln', county: 'Washington' },
  { zip: '72749', city: 'Morrow', county: 'Washington' },
  { zip: '72753', city: 'Prairie Grove', county: 'Washington' },
  { zip: '72762', city: 'Springdale', county: 'Washington' },
  { zip: '72764', city: 'Springdale', county: 'Washington' },
  { zip: '72765', city: 'Springdale', county: 'Washington' },
  { zip: '72766', city: 'Springdale', county: 'Washington' },
  { zip: '72769', city: 'Summers', county: 'Washington' },
  { zip: '72774', city: 'West Fork', county: 'Washington' },
  { zip: '72959', city: 'Winslow', county: 'Washington' },

  // Benton County
  { zip: '72711', city: 'Avoca', county: 'Benton' },
  { zip: '72712', city: 'Bentonville', county: 'Benton' },
  { zip: '72713', city: 'Bentonville', county: 'Benton' },
  { zip: '72714', city: 'Bella Vista', county: 'Benton' },
  { zip: '72715', city: 'Bella Vista', county: 'Benton' },
  { zip: '72716', city: 'Bentonville', county: 'Benton' },
  { zip: '72718', city: 'Cave Springs', county: 'Benton' },
  { zip: '72719', city: 'Centerton', county: 'Benton' },
  { zip: '72722', city: 'Decatur', county: 'Benton' },
  { zip: '72732', city: 'Garfield', county: 'Benton' },
  { zip: '72734', city: 'Gentry', county: 'Benton' },
  { zip: '72736', city: 'Gravette', county: 'Benton' },
  { zip: '72739', city: 'Hiwasse', county: 'Benton' },
  { zip: '72745', city: 'Lowell', county: 'Benton' },
  { zip: '72747', city: 'Maysville', county: 'Benton' },
  { zip: '72751', city: 'Pea Ridge', county: 'Benton' },
  { zip: '72756', city: 'Rogers', county: 'Benton' },
  { zip: '72757', city: 'Rogers', county: 'Benton' },
  { zip: '72758', city: 'Rogers', county: 'Benton' },
  { zip: '72761', city: 'Siloam Springs', county: 'Benton' },
  { zip: '72768', city: 'Sulphur Springs', county: 'Benton' },

  // Madison County
  { zip: '72721', city: 'Combs', county: 'Madison' },
  { zip: '72738', city: 'Hindsville', county: 'Madison' },
  { zip: '72740', city: 'Huntsville', county: 'Madison' },
  { zip: '72742', city: 'Kingston', county: 'Madison' },
  { zip: '72752', city: 'Pettigrew', county: 'Madison' },
  { zip: '72760', city: 'Saint Paul', county: 'Madison' },
  { zip: '72773', city: 'Wesley', county: 'Madison' },
  { zip: '72776', city: 'Witter', county: 'Madison' },

  // Pope County
  { zip: '72679', city: 'Tilly', county: 'Pope' },
  { zip: '72801', city: 'Russellville', county: 'Pope' },
  { zip: '72802', city: 'Russellville', county: 'Pope' },
  { zip: '72811', city: 'Russellville', county: 'Pope' },
  { zip: '72812', city: 'Russellville', county: 'Pope' },
  { zip: '72823', city: 'Atkins', county: 'Pope' },
  { zip: '72837', city: 'Dover', county: 'Pope' },
  { zip: '72843', city: 'Hector', county: 'Pope' },
  { zip: '72847', city: 'London', county: 'Pope' },
  { zip: '72858', city: 'Pottsville', county: 'Pope' },

  // Johnson County
  { zip: '72830', city: 'Clarksville', county: 'Johnson' },
  { zip: '72832', city: 'Coal Hill', county: 'Johnson' },
  { zip: '72839', city: 'Hagarville', county: 'Johnson' },
  { zip: '72840', city: 'Hartman', county: 'Johnson' },
  { zip: '72845', city: 'Knoxville', county: 'Johnson' },
  { zip: '72846', city: 'Lamar', county: 'Johnson' },
  { zip: '72852', city: 'Oark', county: 'Johnson' },
  { zip: '72854', city: 'Ozone', county: 'Johnson' },

  // Yell County
  { zip: '72824', city: 'Belleville', county: 'Yell' },
  { zip: '72827', city: 'Bluffton', county: 'Yell' },
  { zip: '72828', city: 'Briggsville', county: 'Yell' },
  { zip: '72829', city: 'Centerville', county: 'Yell' },
  { zip: '72833', city: 'Danville', county: 'Yell' },
  { zip: '72834', city: 'Dardanelle', county: 'Yell' },
  { zip: '72838', city: 'Gravelly', county: 'Yell' },
  { zip: '72842', city: 'Havana', county: 'Yell' },
  { zip: '72853', city: 'Ola', county: 'Yell' },
  { zip: '72857', city: 'Plainview', county: 'Yell' },
  { zip: '72860', city: 'Rover', county: 'Yell' },

  // Franklin County
  { zip: '72820', city: 'Alix', county: 'Franklin' },
  { zip: '72821', city: 'Altus', county: 'Franklin' },
  { zip: '72928', city: 'Branch', county: 'Franklin' },
  { zip: '72930', city: 'Cecil', county: 'Franklin' },
  { zip: '72933', city: 'Charleston', county: 'Franklin' },
  { zip: '72949', city: 'Ozark', county: 'Franklin' },

  // Logan County
  { zip: '72826', city: 'Blue Mountain', county: 'Logan' },
  { zip: '72835', city: 'Delaware', county: 'Logan' },
  { zip: '72851', city: 'New Blaine', county: 'Logan' },
  { zip: '72855', city: 'Paris', county: 'Logan' },
  { zip: '72863', city: 'Scranton', county: 'Logan' },
  { zip: '72865', city: 'Subiaco', county: 'Logan' },
  { zip: '72927', city: 'Booneville', county: 'Logan' },
  { zip: '72943', city: 'Magazine', county: 'Logan' },
  { zip: '72951', city: 'Ratcliff', county: 'Logan' },

  // Scott County
  { zip: '72841', city: 'Harvey', county: 'Scott' },
  { zip: '72926', city: 'Boles', county: 'Scott' },
  { zip: '72950', city: 'Parks', county: 'Scott' },
  { zip: '72958', city: 'Waldron', county: 'Scott' },

  // Sebastian County
  { zip: '72901', city: 'Fort Smith', county: 'Sebastian' },
  { zip: '72902', city: 'Fort Smith', county: 'Sebastian' },
  { zip: '72903', city: 'Fort Smith', county: 'Sebastian' },
  { zip: '72904', city: 'Fort Smith', county: 'Sebastian' },
  { zip: '72905', city: 'Fort Smith', county: 'Sebastian' },
  { zip: '72906', city: 'Fort Smith', county: 'Sebastian' },
  { zip: '72908', city: 'Fort Smith', county: 'Sebastian' },
  { zip: '72913', city: 'Fort Smith', county: 'Sebastian' },
  { zip: '72914', city: 'Fort Smith', county: 'Sebastian' },
  { zip: '72916', city: 'Fort Smith', county: 'Sebastian' },
  { zip: '72917', city: 'Fort Smith', county: 'Sebastian' },
  { zip: '72918', city: 'Fort Smith', county: 'Sebastian' },
  { zip: '72919', city: 'Fort Smith', county: 'Sebastian' },
  { zip: '72923', city: 'Barling', county: 'Sebastian' },
  { zip: '72936', city: 'Greenwood', county: 'Sebastian' },
  { zip: '72937', city: 'Hackett', county: 'Sebastian' },
  { zip: '72938', city: 'Hartford', county: 'Sebastian' },
  { zip: '72940', city: 'Huntington', county: 'Sebastian' },
  { zip: '72941', city: 'Lavaca', county: 'Sebastian' },
  { zip: '72944', city: 'Mansfield', county: 'Sebastian' },
  { zip: '72945', city: 'Midland', county: 'Sebastian' },

  // Crawford County
  { zip: '72921', city: 'Alma', county: 'Crawford' },
  { zip: '72932', city: 'Cedarville', county: 'Crawford' },
  { zip: '72934', city: 'Chester', county: 'Crawford' },
  { zip: '72935', city: 'Dyer', county: 'Crawford' },
  { zip: '72946', city: 'Mountainburg', county: 'Crawford' },
  { zip: '72947', city: 'Mulberry', county: 'Crawford' },
  { zip: '72948', city: 'Natural Dam', county: 'Crawford' },
  { zip: '72952', city: 'Rudy', county: 'Crawford' },
  { zip: '72955', city: 'Uniontown', county: 'Crawford' },
  { zip: '72956', city: 'Van Buren', county: 'Crawford' },
  { zip: '72957', city: 'Van Buren', county: 'Crawford' },
];

// Helper function to get tax rate by zip code
export function getTaxRateByZip(zip: string): { county: string; city: string; taxRate: number } | null {
  const zipData = arkansasZipCodes.find(z => z.zip === zip);
  if (!zipData) return null;

  const taxRate = arkansasCountyTaxRates[zipData.county];
  if (taxRate === undefined) return null;

  return {
    county: zipData.county,
    city: zipData.city,
    taxRate,
  };
}

// Helper function to search zip codes by partial input
export function searchZipCodes(query: string, limit: number = 10): ArkansasZipData[] {
  const lowerQuery = query.toLowerCase();

  // First, exact zip matches
  const exactZip = arkansasZipCodes.filter(z => z.zip.startsWith(query));

  // Then, city name matches
  const cityMatches = arkansasZipCodes.filter(z =>
    z.city.toLowerCase().includes(lowerQuery) && !exactZip.includes(z)
  );

  return [...exactZip, ...cityMatches].slice(0, limit);
}

// Get all counties
export function getAllCounties(): string[] {
  return Object.keys(arkansasCountyTaxRates).sort();
}
