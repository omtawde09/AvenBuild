import type { PortfolioItemId, ReviewId, UserId } from '@/domain/ids';
import { rupees } from '@/domain/money';
import type { ContractorProfile, OwnerSettings, PortfolioItem, Review, ServiceArea, User } from '@/domain/types';
import type { ServiceCategoryId } from '../categories';
import { allNotifications, seedImage, type SeedClock } from './builder';
import { U } from './ids';

export function seedUsers(t: SeedClock): User[] {
  const owner = (id: UserId, displayName: string, city: string, locality: string, persona = false): User => ({
    id,
    role: 'owner',
    displayName,
    city,
    locality,
    isPersona: persona,
    isSeed: true,
    createdAt: t.at(-120, '10:00'),
  });
  const contractor = (id: UserId, displayName: string, city: string, locality: string, persona = false): User => ({
    id,
    role: 'contractor',
    displayName,
    city,
    locality,
    isPersona: persona,
    isSeed: true,
    createdAt: t.at(-400, '10:00'),
  });
  return [
    owner(U.meera, 'Meera Kulkarni', 'Pune', 'Kothrud', true),
    owner(U.arjun, 'Arjun Patil', 'Pimpri-Chinchwad', 'Wakad'),
    owner(U.farah, 'Farah Shaikh', 'Pune', 'Baner'),
    owner(U.vikram, 'Vikram Joshi', 'Nashik', 'Satpur'),
    contractor(U.sahyadri, 'Sahyadri Waterproofing & Civil Works', 'Pune', 'Karve Nagar', true),
    contractor(U.deccan, 'Deccan Seal Systems', 'Pune', 'Hadapsar'),
    contractor(U.ganesh, 'Shree Ganesh Constructions', 'Pune', 'Warje'),
    contractor(U.jal, 'Jal Plumbing Services', 'Pune', 'Aundh'),
    contractor(U.konkan, 'Konkan Steel Fabricators', 'Nashik', 'Ambad'),
    contractor(U.tilecraft, 'Tilecraft Interiors', 'Mumbai', 'Andheri East'),
    contractor(U.voltline, 'Volt Line Electricals', 'Pune', 'Baner'),
    contractor(U.godavari, 'Godavari Infra Works', 'Nashik', 'Panchavati'),
    contractor(U.kaveri, 'Kaveri Floors', 'Bengaluru', 'Peenya'),
  ];
}

export function seedOwnerSettings(): OwnerSettings[] {
  return [U.meera, U.arjun, U.farah, U.vikram].map((userId) => ({ userId, contactPreference: 'messages_and_site_visits', notificationPrefs: { ...allNotifications } }));
}

interface ProfileSpec {
  id: UserId;
  businessName: string;
  contactName: string;
  bio: string;
  services: ServiceCategoryId[];
  areas: ServiceArea[];
  years: number;
  team: number;
  availability: ContractorProfile['availability']['status'];
  availableFromOffset: number;
  range: [number, number];
  responseHours: number;
  sampleCredentials: boolean;
  inclusions: string[];
  exclusions: string[];
}

export function seedContractorProfiles(t: SeedClock): ContractorProfile[] {
  const specs: ProfileSpec[] = [
    {
      id: U.sahyadri,
      businessName: 'Sahyadri Waterproofing & Civil Works',
      contactName: 'Rohan Deshpande',
      bio: 'Small Pune firm focused on leak-proofing older houses and apartment terraces, plus the RCC and tile repairs that usually come with them. We inspect before quoting, show the pond test, and write down what is excluded.',
      services: ['waterproofing', 'rcc', 'tiling', 'brickwork'],
      areas: [
        { city: 'Pune', localities: ['Kothrud', 'Karve Nagar', 'Warje', 'Bavdhan', 'Baner', 'Aundh', 'Hadapsar'] },
        { city: 'Pimpri-Chinchwad', localities: ['Wakad', 'Pimple Saudagar'] },
      ],
      years: 11,
      team: 14,
      availability: 'available',
      availableFromOffset: 5,
      range: [50_000, 25_00_000],
      responseHours: 3,
      sampleCredentials: true,
      inclusions: ['Material and labour', 'Debris removal from site', 'Site cleaning at handover'],
      exclusions: ['Structural repairs not listed in the quote', 'Electrical and plumbing alterations'],
    },
    {
      id: U.deccan,
      businessName: 'Deccan Seal Systems',
      contactName: 'Sameer Kale',
      bio: 'Membrane and coating-based waterproofing for terraces, basements and water tanks across Pune. Crew of eight trained applicators.',
      services: ['waterproofing'],
      areas: [
        { city: 'Pune', localities: ['Hadapsar', 'Kharadi', 'Kothrud', 'Baner'] },
        { city: 'Pimpri-Chinchwad', localities: [] },
      ],
      years: 7,
      team: 8,
      availability: 'available',
      availableFromOffset: 2,
      range: [40_000, 12_00_000],
      responseHours: 6,
      sampleCredentials: true,
      inclusions: ['Membrane and primer', 'Labour'],
      exclusions: ['Protective screed', 'Debris removal'],
    },
    {
      id: U.ganesh,
      businessName: 'Shree Ganesh Constructions',
      contactName: 'Mahesh Pawar',
      bio: 'General civil contractor for houses and small commercial buildings: excavation, RCC frame, brickwork, plaster, waterproofing and tiling. Works with an in-house structural consultant.',
      services: ['rcc', 'brickwork', 'excavation', 'waterproofing', 'tiling'],
      areas: [{ city: 'Pune', localities: ['Warje', 'Kothrud', 'Sinhagad Road', 'Hadapsar', 'Bavdhan'] }],
      years: 19,
      team: 32,
      availability: 'limited',
      availableFromOffset: 18,
      range: [2_00_000, 1_50_00_000],
      responseHours: 12,
      sampleCredentials: true,
      inclusions: ['Material and labour', 'Supervision'],
      exclusions: ['Statutory approvals', 'Water and electricity for construction'],
    },
    {
      id: U.jal,
      businessName: 'Jal Plumbing Services',
      contactName: 'Irfan Mulla',
      bio: 'Concealed and external plumbing for homes: CPVC supply lines, drainage, fixtures, overhead tanks and pressure pumps.',
      services: ['plumbing'],
      areas: [{ city: 'Pune', localities: ['Aundh', 'Kothrud', 'Baner', 'Pashan'] }],
      years: 9,
      team: 6,
      availability: 'available',
      availableFromOffset: 3,
      range: [15_000, 6_00_000],
      responseHours: 4,
      sampleCredentials: false,
      inclusions: ['Pipes and fittings as listed', 'Pressure testing'],
      exclusions: ['Sanitary ware', 'Wall tiling after chasing'],
    },
    {
      id: U.konkan,
      businessName: 'Konkan Steel Fabricators',
      contactName: 'Prakash Naik',
      bio: 'Structural steel fabrication and pre-engineered buildings for warehouses, workshops and farm sheds, with in-house design drawings.',
      services: ['fabrication', 'peb'],
      areas: [
        { city: 'Nashik', localities: ['Ambad', 'Satpur', 'Sinnar'] },
        { city: 'Pune', localities: ['Chakan', 'Talegaon'] },
        { city: 'Mumbai', localities: [] },
      ],
      years: 14,
      team: 40,
      availability: 'available',
      availableFromOffset: 10,
      range: [5_00_000, 3_00_00_000],
      responseHours: 24,
      sampleCredentials: true,
      inclusions: ['Shop drawings', 'Fabrication and erection', 'Primer and one coat of paint'],
      exclusions: ['Civil foundations', 'Crane hire beyond 10 days'],
    },
    {
      id: U.tilecraft,
      businessName: 'Tilecraft Interiors',
      contactName: 'Neha Fernandes',
      bio: 'Tiling and bathroom waterproofing for apartments and offices. Large-format tiles, epoxy grouting and precise levelling.',
      services: ['tiling', 'waterproofing'],
      areas: [
        { city: 'Mumbai', localities: ['Andheri', 'Powai', 'Goregaon'] },
        { city: 'Pimpri-Chinchwad', localities: ['Wakad', 'Hinjewadi'] },
      ],
      years: 6,
      team: 10,
      availability: 'available',
      availableFromOffset: 7,
      range: [60_000, 15_00_000],
      responseHours: 8,
      sampleCredentials: false,
      inclusions: ['Labour, adhesive and grout'],
      exclusions: ['Tiles (owner supplied)', 'Plumbing changes'],
    },
    {
      id: U.voltline,
      businessName: 'Volt Line Electricals',
      contactName: 'Anil Gaikwad',
      bio: 'House and shop wiring, distribution boards, earthing and lighting. Recently started taking bookings through this platform.',
      services: ['electrical'],
      areas: [{ city: 'Pune', localities: ['Baner', 'Aundh', 'Balewadi'] }],
      years: 4,
      team: 3,
      availability: 'available',
      availableFromOffset: 1,
      range: [10_000, 3_00_000],
      responseHours: 2,
      sampleCredentials: false,
      inclusions: ['Labour and listed materials'],
      exclusions: ['Light fixtures'],
    },
    {
      id: U.godavari,
      businessName: 'Godavari Infra Works',
      contactName: 'Sunil Bhosale',
      bio: 'Earthwork, RCC ring wells, paver blocks and trimix floors for farms, factories and housing societies around Nashik and Pune.',
      services: ['excavation', 'rcc_well', 'paver', 'trimix'],
      areas: [
        { city: 'Nashik', localities: ['Ambad', 'Panchavati', 'Satpur'] },
        { city: 'Pune', localities: ['Chakan', 'Hadapsar'] },
      ],
      years: 12,
      team: 22,
      availability: 'limited',
      availableFromOffset: 21,
      range: [1_00_000, 80_00_000],
      responseHours: 18,
      sampleCredentials: true,
      inclusions: ['Machinery and operators', 'Material and labour'],
      exclusions: ['Rock blasting', 'Dewatering'],
    },
    {
      id: U.kaveri,
      businessName: 'Kaveri Floors',
      contactName: 'Lakshmi Rao',
      bio: 'Industrial trimix and tile flooring for warehouses and showrooms in Bengaluru and Hyderabad.',
      services: ['trimix', 'tiling', 'paver'],
      areas: [
        { city: 'Bengaluru', localities: ['Peenya', 'Whitefield'] },
        { city: 'Hyderabad', localities: ['Gachibowli'] },
      ],
      years: 8,
      team: 18,
      availability: 'unavailable',
      availableFromOffset: 45,
      range: [3_00_000, 60_00_000],
      responseHours: 10,
      sampleCredentials: false,
      inclusions: ['Material and labour', 'Curing'],
      exclusions: ['Sub-base preparation'],
    },
  ];

  return specs.map((s, i) => ({
    userId: s.id,
    businessName: s.businessName,
    contactName: s.contactName,
    bio: s.bio,
    services: s.services,
    serviceAreas: s.areas,
    yearsExperience: s.years,
    teamSize: s.team,
    availability: { status: s.availability, availableFrom: t.day(s.availableFromOffset) },
    typicalProjectRange: { minPaise: rupees(s.range[0]), maxPaise: rupees(s.range[1]) },
    contactPreferences: { siteVisits: true, preferredHours: '9 am – 7 pm, Mon–Sat' },
    qualifications: s.sampleCredentials
      ? { licenceNumber: `DEMO-LIC-${String(140 + i * 7).padStart(4, '0')}`, licenceStatus: 'sample_demo', gstNumber: `27DEMO${String(10000 + i * 37)}Z1D${i}`, gstStatus: 'sample_demo' }
      : { licenceNumber: '', licenceStatus: 'not_submitted', gstNumber: '', gstStatus: 'not_submitted' },
    responseTimeSampleHours: s.responseHours,
    visibility: 'listed',
    quoteDefaults: { validityDays: 21, taxPercent: 18, inclusions: s.inclusions, exclusions: s.exclusions },
    notificationPrefs: { ...allNotifications },
    isSeed: true,
    updatedAt: t.at(-30, '09:00'),
  }));
}

export function seedPortfolio(t: SeedClock): PortfolioItem[] {
  const item = (
    id: string,
    contractorId: UserId,
    title: string,
    category: ServiceCategoryId,
    description: string,
    value: [number, number] | null,
    monthsAgo: number,
    city: string,
    art: string[],
  ): PortfolioItem => ({
    id: id as PortfolioItemId,
    contractorId,
    title,
    category,
    description,
    approxValue: value ? { minPaise: rupees(value[0]), maxPaise: rupees(value[1]) } : null,
    completedOn: t.day(-monthsAgo * 30),
    city,
    images: art.map((a, n) => seedImage(`att_${id}_${n + 1}`, `${a}-${n + 1}.jpg`, a, t.at(-monthsAgo * 30, '12:00'))),
    isSeed: true,
  });
  return [
    item('pf_seed_sah_1', U.sahyadri, 'Terrace re-waterproofing, 1,400 sq ft bungalow', 'waterproofing', 'Removed failed brick-bat coba, re-sloped with screed and laid a torch-applied APP membrane. 48-hour pond test witnessed by the owner.', [1_50_000, 2_00_000], 3, 'Pune', ['terrace']),
    item('pf_seed_sah_2', U.sahyadri, 'Apartment bathroom refit with waterproofing', 'tiling', 'Stripped two bathrooms to the slab, applied a cementitious coating with coving at junctions, and retiled with anti-skid floor tiles.', [1_20_000, 1_60_000], 6, 'Pune', ['bathroom', 'tiles']),
    item('pf_seed_sah_3', U.sahyadri, 'Basement retaining wall seepage treatment', 'waterproofing', 'Pressure-grouted the cracks and applied a crystalline coating on the inside face of a housing-society basement retaining wall.', [3_00_000, 4_00_000], 11, 'Pimpri-Chinchwad', ['basement']),
    item('pf_seed_dec_1', U.deccan, 'Overhead tank internal coating', 'waterproofing', 'Food-grade coating inside a 10,000 litre RCC overhead tank after crack repairs.', [45_000, 60_000], 4, 'Pune', ['tank']),
    item('pf_seed_dec_2', U.deccan, 'Society terrace PU coating', 'waterproofing', 'Polyurethane coating over 6,000 sq ft of terrace for a 7-storey residential society.', [4_00_000, 5_50_000], 9, 'Pune', ['terrace']),
    item('pf_seed_gan_1', U.ganesh, 'G+2 residence frame and brickwork', 'rcc', 'RCC frame, 230 mm brickwork and internal plaster for a 2,800 sq ft independent house.', [38_00_000, 45_00_000], 8, 'Pune', ['frame', 'brick']),
    item('pf_seed_gan_2', U.ganesh, 'Compound wall with gate pillars', 'brickwork', '160 running ft of compound wall on PCC footing with RCC gate pillars.', [3_50_000, 4_20_000], 14, 'Pune', ['brick']),
    item('pf_seed_jal_1', U.jal, 'Full-home CPVC replumbing', 'plumbing', 'Replaced corroded GI lines in a 3BHK flat with concealed CPVC and new diverters.', [90_000, 1_20_000], 5, 'Pune', ['plumbing']),
    item('pf_seed_kon_1', U.konkan, 'Warehouse PEB, 12,000 sq ft', 'peb', 'Clear-span pre-engineered warehouse with mezzanine and ridge ventilator.', [80_00_000, 95_00_000], 7, 'Nashik', ['shed']),
    item('pf_seed_kon_2', U.konkan, 'Workshop fabrication shed', 'fabrication', 'Tubular truss shed with polycarbonate skylights over a CNC workshop.', [12_00_000, 15_00_000], 13, 'Pune', ['shed']),
    item('pf_seed_til_1', U.tilecraft, 'Office floor in 800×1600 tiles', 'tiling', 'Large-format vitrified tiles with levelling clips and epoxy grout over 3,200 sq ft.', [6_00_000, 7_50_000], 2, 'Mumbai', ['tiles']),
    item('pf_seed_god_1', U.godavari, 'Factory trimix floor, 20,000 sq ft', 'trimix', 'M25 trimix with power floating and saw-cut joints for a packaging unit.', [32_00_000, 38_00_000], 6, 'Nashik', ['floor']),
    item('pf_seed_god_2', U.godavari, 'RCC ring well, 30 ft', 'rcc_well', 'Excavation and RCC ring lining for a farm well with parapet.', [4_50_000, 5_50_000], 15, 'Nashik', ['well']),
    item('pf_seed_kav_1', U.kaveri, 'Showroom paver forecourt', 'paver', '80 mm interlocking pavers on compacted sub-base for a car showroom forecourt.', [5_00_000, 6_00_000], 10, 'Bengaluru', ['paver']),
  ];
}

export function seedReviews(t: SeedClock): Review[] {
  const r = (
    id: string,
    contractorId: UserId,
    reviewerLabel: string,
    projectTitle: string,
    rating: number,
    dims: [number | null, number | null, number | null],
    text: string,
    daysAgo: number,
  ): Review => ({
    id: id as ReviewId,
    contractorId,
    projectId: null,
    workspaceId: null,
    ownerId: null,
    reviewerLabel,
    projectTitle,
    rating,
    dimensions: { communication: dims[0], quality: dims[1], scheduleClarity: dims[2] },
    text,
    createdAt: t.at(-daysAgo, '19:00'),
    isSeed: true,
  });
  return [
    r('rev_seed_sah_1', U.sahyadri, 'Homeowner, Karve Nagar', 'Terrace waterproofing', 5, [5, 5, 4], 'They showed us the old layers they removed and did the pond test while we watched. No leaks through one full monsoon so far.', 75),
    r('rev_seed_sah_2', U.sahyadri, 'Flat owner, Warje', 'Bathroom refit', 4, [4, 5, 3], 'Good finish and clean site. Took five days longer than planned because of tile delivery, but they told us early.', 160),
    r('rev_seed_sah_3', U.sahyadri, 'Society secretary, Wakad', 'Basement seepage treatment', 5, [5, 4, 5], 'Clear written scope, and they stuck to it. The committee appreciated the photo updates.', 320),
    r('rev_seed_sah_4', U.sahyadri, 'Homeowner, Bavdhan', 'Parapet crack repair', 4, [4, 4, 4], 'Fair price for a small job that others did not want to take on.', 410),
    r('rev_seed_dec_1', U.deccan, 'Homeowner, Hadapsar', 'Overhead tank coating', 4, [3, 4, 4], 'Work was neat. Took a couple of reminders to get the warranty letter.', 110),
    r('rev_seed_dec_2', U.deccan, 'Society manager, Kharadi', 'Terrace PU coating', 5, [5, 5, 5], 'Finished a day early and coordinated well with the society office.', 260),
    r('rev_seed_dec_3', U.deccan, 'Shop owner, Baner', 'Sunshade waterproofing', 3, [3, 3, 2], 'Result is fine but the start date moved twice.', 380),
    r('rev_seed_gan_1', U.ganesh, 'Homeowner, Sinhagad Road', 'G+1 house construction', 5, [4, 5, 5], 'Strong on structure and site safety. The engineer explained every pour.', 90),
    r('rev_seed_gan_2', U.ganesh, 'Homeowner, Warje', 'Compound wall', 4, [4, 4, 4], 'Solid work. Quote was detailed, which made comparing easy.', 200),
    r('rev_seed_gan_3', U.ganesh, 'Clinic owner, Kothrud', 'Clinic extension', 4, [3, 5, 4], 'Quality is excellent; replies can be slow during busy weeks.', 290),
    r('rev_seed_gan_4', U.ganesh, 'Homeowner, Bavdhan', 'Slab repair', 5, [5, 5, 4], 'Found the actual cause of the cracks instead of just patching.', 350),
    r('rev_seed_gan_5', U.ganesh, 'Homeowner, Hadapsar', 'Plaster and brickwork', 3, [3, 4, 2], 'Good masons; scheduling was the weak point.', 430),
    r('rev_seed_jal_1', U.jal, 'Flat owner, Aundh', 'CPVC replumbing', 5, [5, 5, 5], 'Pressure-tested every line in front of us and labelled the valves.', 140),
    r('rev_seed_jal_2', U.jal, 'Homeowner, Pashan', 'Tank and pump installation', 4, [4, 4, 5], 'Quick and tidy. Had to come back once to fix a small drip, at no charge.', 300),
    r('rev_seed_kon_1', U.konkan, 'Workshop owner, Ambad', 'Fabrication shed', 4, [4, 5, 3], 'Drawings were very clear. Erection crew needed one extra week.', 180),
    r('rev_seed_kon_2', U.konkan, 'Logistics firm, Sinnar', 'Warehouse PEB', 5, [5, 5, 5], 'Handled design, approvals coordination and erection without surprises.', 240),
    r('rev_seed_kon_3', U.konkan, 'Farm owner, Talegaon', 'Cattle shed', 4, [4, 4, 4], 'Sturdy and well finished.', 400),
    r('rev_seed_til_1', U.tilecraft, 'Office admin, Andheri', 'Office flooring', 5, [5, 5, 4], 'Perfectly level large tiles — no lippage anywhere.', 60),
    r('rev_seed_til_2', U.tilecraft, 'Flat owner, Wakad', 'Bathroom retiling', 4, [4, 4, 4], 'Good work; they asked us to buy tiles separately, which was stated upfront.', 210),
    r('rev_seed_god_1', U.godavari, 'Factory manager, Satpur', 'Trimix floor', 5, [4, 5, 5], 'Flat, hard floor and joints cut on time. Very organised crew.', 170),
    r('rev_seed_god_2', U.godavari, 'Farmer, Panchavati', 'Ring well', 4, [4, 4, 3], 'Good well. Monsoon delayed completion by ten days.', 330),
    r('rev_seed_kav_1', U.kaveri, 'Showroom owner, Whitefield', 'Paver forecourt', 4, [4, 4, 4], 'Neat pattern and good compaction.', 280),
  ];
}
