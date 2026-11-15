import { ConvexError, v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { activeLease, currentLandlord, currentRenter } from "./people";
import { DEFAULT_TIMEZONE } from "./time";

const photo = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

const listings = [
  {
    title: "Bright room in a Mission Victorian, three easygoing flatmates",
    address: "538 Capp St",
    neighborhood: "Mission District",
    rentMonthlyCents: 175000,
    depositCents: 175000,
    bedrooms: 1,
    bathrooms: 1,
    squareFeet: 140,
    availableFrom: Date.UTC(2026, 11, 1),
    leaseTermMonths: 12,
    description:
      "Furnished back bedroom with a big window over the garden. You share the kitchen and one and a half baths with two designers and a nurse. Valencia is a block and a half away, 24th St BART is a seven-minute walk.",
    amenities: ["Furnished", "In-unit laundry", "Utilities included"],
    photoUrls: [
      photo("photo-1615874959474-d609969a20ed"),
      photo("photo-1597418048367-7dd01e4404ee"),
    ],
  },
  {
    title: "Sunny in-law with its own entrance off Treat",
    address: "1067 Treat Ave",
    neighborhood: "Mission District",
    rentMonthlyCents: 265000,
    depositCents: 265000,
    bedrooms: 0,
    bathrooms: 1,
    squareFeet: 380,
    availableFrom: Date.UTC(2026, 11, 15),
    leaseTermMonths: 12,
    description:
      "Ground-floor studio under our house, renovated last year. Separate side entrance, built-in desk, a full bath, and a compact kitchen. Quiet block, street parking is manageable after 7.",
    amenities: ["Private entrance", "Built-in desk", "Utilities included"],
    photoUrls: [
      photo("photo-1786886393825-a2aff98f5f0a"),
      photo("photo-1761123141836-3b3221dac3e5"),
    ],
  },
  {
    title: "Garden cottage studio behind our place in Noe",
    address: "371 Jersey St",
    neighborhood: "Noe Valley",
    rentMonthlyCents: 270000,
    depositCents: 270000,
    bedrooms: 0,
    bathrooms: 1,
    squareFeet: 300,
    availableFrom: Date.UTC(2027, 0, 1),
    leaseTermMonths: 12,
    description:
      "Small detached ADU at the back of the garden, all windows and wood paneling. Kitchenette with a two-burner cooktop and a mini fridge, plus a shower bath. You walk through the side yard, so it is very private. Ideal for one person.",
    amenities: ["Garden access", "Detached ADU", "Kitchenette"],
    photoUrls: [
      photo("photo-1541004995602-b3e898709909"),
      photo("photo-1593195150431-d5463aba0ec7"),
    ],
  },
  {
    title: "Top-floor Edwardian flat, two bedrooms and a working fireplace",
    address: "1338 Sanchez St",
    neighborhood: "Noe Valley",
    rentMonthlyCents: 560000,
    depositCents: 840000,
    bedrooms: 2,
    bathrooms: 1,
    squareFeet: 1150,
    availableFrom: Date.UTC(2026, 11, 1),
    leaseTermMonths: 12,
    description:
      "Upper unit of our two-unit building. Living room with the original built-ins and a gas fireplace, two good-sized bedrooms, and a dining room you could use as an office. We live downstairs and fix things fast.",
    amenities: ["Fireplace", "Shared laundry", "Garage parking"],
    photoUrls: [
      photo("photo-1633330977020-2bdfb8530cc2"),
      photo("photo-1771611186938-39a6b934f2f6"),
    ],
  },
  {
    title: "One-bedroom a block from Irving, the N, and the park",
    address: "1366 7th Ave",
    neighborhood: "Inner Sunset",
    rentMonthlyCents: 335000,
    depositCents: 335000,
    bedrooms: 1,
    bathrooms: 1,
    squareFeet: 620,
    availableFrom: Date.UTC(2026, 11, 1),
    leaseTermMonths: 12,
    description:
      "Second-floor flat with a bright front room that fits a desk and a couch. Bedroom faces the back and stays quiet. Golden Gate Park and the N Judah are both a short walk.",
    amenities: ["Shared laundry", "Hardwood floors", "Cats OK"],
    photoUrls: [
      photo("photo-1613575831056-0acd5da8f085"),
      photo("photo-1774578342100-f779e988c83d"),
    ],
  },
  {
    title: "Room near UCSF Parnassus, great for a resident or grad student",
    address: "1478 5th Ave",
    neighborhood: "Inner Sunset",
    rentMonthlyCents: 165000,
    depositCents: 165000,
    bedrooms: 1,
    bathrooms: 1,
    squareFeet: 130,
    availableFrom: Date.UTC(2026, 11, 1),
    leaseTermMonths: 6,
    description:
      "Unfurnished bedroom in a four-bedroom house. Everyone works or studies at UCSF, so the house is quiet on weeknights. Shared kitchen, two baths for four people, and a little backyard.",
    amenities: ["Utilities included", "Shared backyard", "Month-to-month after 6"],
    photoUrls: [photo("photo-1630699293277-4d3f2522b7cb")],
  },
  {
    title: "Garden-level one-bedroom in Bernal, bay window and lots of light",
    address: "86 Bocana St",
    neighborhood: "Bernal Heights",
    rentMonthlyCents: 295000,
    depositCents: 295000,
    bedrooms: 1,
    bathrooms: 1,
    squareFeet: 540,
    availableFrom: Date.UTC(2026, 11, 15),
    leaseTermMonths: 12,
    description:
      "The lower unit of our house, with its own door from the garden. The bedroom has a bay window that gets morning sun. Updated kitchen with a little breakfast table. Up the hill to the park, down the hill to Cortland.",
    amenities: ["Private entrance", "Garden access", "In-unit laundry"],
    photoUrls: [
      photo("photo-1499916078039-922301b0eb9b"),
      photo("photo-1538944570562-2c9cb7857097"),
    ],
  },
  {
    title: "Two-bedroom Bernal cottage with a deck off the kitchen",
    address: "125 Ellsworth St",
    neighborhood: "Bernal Heights",
    rentMonthlyCents: 475000,
    depositCents: 712500,
    bedrooms: 2,
    bathrooms: 1,
    squareFeet: 980,
    availableFrom: Date.UTC(2027, 0, 1),
    leaseTermMonths: 12,
    description:
      "Whole little house, which we lived in until our family outgrew it. Open living and dining room, two bedrooms, a deck for coffee, and a washer and dryer. Dogs welcome with a pet deposit.",
    amenities: ["Deck", "In-unit laundry", "Dogs OK"],
    photoUrls: [
      photo("photo-1763827513396-5917fc6c84f3"),
      photo("photo-1771610947362-ade3a22642f2"),
    ],
  },
  {
    title: "Cozy Outer Richmond studio, ten minutes from the beach",
    address: "659 36th Ave",
    neighborhood: "Outer Richmond",
    rentMonthlyCents: 215000,
    depositCents: 215000,
    bedrooms: 0,
    bathrooms: 1,
    squareFeet: 360,
    availableFrom: Date.UTC(2026, 11, 1),
    leaseTermMonths: 12,
    description:
      "Studio on the ground floor of our house. Proper kitchen with a gas stove and a stacked washer, plenty of closet space. Ocean Beach, Lands End, and the 38R are all close by. Foggy, quiet, and cheap for the city.",
    amenities: ["In-unit laundry", "Gas stove", "Street parking"],
    photoUrls: [
      photo("photo-1657040899594-34f4b6739988"),
      photo("photo-1556185781-a47769abb7ee"),
    ],
  },
  {
    title: "Inner Richmond one-bedroom, two blocks from Clement",
    address: "418 9th Ave",
    neighborhood: "Inner Richmond",
    rentMonthlyCents: 320000,
    depositCents: 320000,
    bedrooms: 1,
    bathrooms: 1,
    squareFeet: 650,
    availableFrom: Date.UTC(2026, 11, 15),
    leaseTermMonths: 12,
    description:
      "Middle flat in a three-unit building we own. New kitchen with a gas range, refinished floors, and a sunny living room. Clement St dumplings and Green Apple Books are two blocks away.",
    amenities: ["Shared laundry", "Gas stove", "Storage unit"],
    photoUrls: [
      photo("photo-1759691555285-74005fcf3ddf"),
      photo("photo-1610527003928-47afd5f470c6"),
    ],
  },
  {
    title: "Hayes Valley studio in an old Victorian, top floor",
    address: "571 Grove St",
    neighborhood: "Hayes Valley",
    rentMonthlyCents: 279500,
    depositCents: 279500,
    bedrooms: 0,
    bathrooms: 1,
    squareFeet: 420,
    availableFrom: Date.UTC(2026, 11, 1),
    leaseTermMonths: 12,
    description:
      "One room with high ceilings and a separate sleeping alcove, on the top floor of a four-unit Victorian. Patricia's Green and the Hayes St shops are around the corner. Third-floor walk-up, no elevator.",
    amenities: ["High ceilings", "Shared laundry", "Bike storage"],
    photoUrls: [
      photo("photo-1583847268964-b28dc8f51f92"),
      photo("photo-1522771739844-6a9f6d5f14af"),
    ],
  },
  {
    title: "Big one-bedroom on Page with bay windows",
    address: "437 Page St",
    neighborhood: "Hayes Valley",
    rentMonthlyCents: 385000,
    depositCents: 385000,
    bedrooms: 1,
    bathrooms: 1,
    squareFeet: 760,
    availableFrom: Date.UTC(2027, 0, 1),
    leaseTermMonths: 12,
    description:
      "Second-floor flat in an Edwardian. Bay-window living room, bedroom big enough for a king and a reading chair, and a back door to a shared garden. Walk to Hayes Valley, the Lower Haight, and Civic Center BART.",
    amenities: ["Bay windows", "Shared garden", "Shared laundry"],
    photoUrls: [
      photo("photo-1776482128074-960564637e76"),
      photo("photo-1612152605347-f93296cb657d"),
    ],
  },
  {
    title: "New backyard ADU on Potrero Hill, quiet and very bright",
    address: "1015 Wisconsin St",
    neighborhood: "Potrero Hill",
    rentMonthlyCents: 245000,
    depositCents: 245000,
    bedrooms: 0,
    bathrooms: 1,
    squareFeet: 400,
    availableFrom: Date.UTC(2026, 11, 15),
    leaseTermMonths: 12,
    description:
      "We built this cottage in the back garden in 2025. Long galley kitchen with open shelving, a bed nook at the far end, and a full bath. Mini-split heat, its own water heater, and a gate to the street.",
    amenities: ["Detached ADU", "Mini-split heating", "Garden access"],
    photoUrls: [
      photo("photo-1628394029749-ea3dcce4caa6"),
      photo("photo-1734599511415-cb4a52aea2fe"),
    ],
  },
  {
    title: "Two-bedroom lower unit in the Excelsior, garage parking included",
    address: "742 Persia Ave",
    neighborhood: "Excelsior",
    rentMonthlyCents: 365000,
    depositCents: 365000,
    bedrooms: 2,
    bathrooms: 1,
    squareFeet: 900,
    availableFrom: Date.UTC(2026, 11, 1),
    leaseTermMonths: 12,
    description:
      "Lower flat of a two-unit house. Open kitchen with a breakfast bar, two bedrooms facing the backyard, and one parking spot in the garage. Mission St buses and the Balboa Park BART are close.",
    amenities: ["Garage parking", "Shared backyard", "Shared laundry"],
    photoUrls: [
      photo("photo-1560448075-cbc16bb4af8e"),
      photo("photo-1625334782252-da92af3ad887"),
    ],
  },
  {
    title: "Simple room for rent in a family home, Excelsior",
    address: "917 Naples St",
    neighborhood: "Excelsior",
    rentMonthlyCents: 135000,
    depositCents: 135000,
    bedrooms: 1,
    bathrooms: 1,
    squareFeet: 110,
    availableFrom: Date.UTC(2026, 11, 1),
    leaseTermMonths: 6,
    description:
      "Furnished bedroom in our home. You get your own bathroom down the hall and kitchen privileges. Looking for someone tidy and quiet, ideally working days. No smoking.",
    amenities: ["Furnished", "Private bathroom", "Utilities included"],
    photoUrls: [photo("photo-1781249144129-4ba0869707f5")],
  },
  {
    title: "Corner studio in a small SoMa building, close to Caltrain",
    address: "45 Langton St",
    neighborhood: "SoMa",
    rentMonthlyCents: 260000,
    depositCents: 260000,
    bedrooms: 0,
    bathrooms: 1,
    squareFeet: 450,
    availableFrom: Date.UTC(2026, 11, 15),
    leaseTermMonths: 12,
    description:
      "Corner unit on the third floor of a six-unit building on a quiet alley. Windows on two sides, room for a proper desk, and a sleeping area by the closets. Walk to Caltrain, Muni Metro, and Civic Center.",
    amenities: ["Corner unit", "Elevator", "Bike storage"],
    photoUrls: [
      photo("photo-1560448076-957f79776e95"),
      photo("photo-1781249144083-6264548df901"),
    ],
  },
  {
    title: "Glen Park in-law with a pink-tiled kitchen, steps from BART",
    address: "48 Chenery St",
    neighborhood: "Glen Park",
    rentMonthlyCents: 285000,
    depositCents: 285000,
    bedrooms: 1,
    bathrooms: 1,
    squareFeet: 560,
    availableFrom: Date.UTC(2027, 0, 1),
    leaseTermMonths: 12,
    description:
      "Lower-level one-bedroom we just finished renovating. Butcher-block kitchen that looks out at the garden, a bedroom with a garden window, and its own entrance. Glen Park BART and the village are a five-minute walk.",
    amenities: ["Private entrance", "In-unit laundry", "Near BART"],
    photoUrls: [
      photo("photo-1721522000055-795cf74e9856"),
      photo("photo-1780672823863-1f40d9c6435d"),
    ],
  },
  {
    title: "Two bedrooms on the top floor of our Glen Park house",
    address: "312 Surrey St",
    neighborhood: "Glen Park",
    rentMonthlyCents: 495000,
    depositCents: 742500,
    bedrooms: 2,
    bathrooms: 1.5,
    squareFeet: 1050,
    availableFrom: Date.UTC(2026, 11, 15),
    leaseTermMonths: 12,
    description:
      "Upper floor with its own stairway. Bright living room, two bedrooms, a bath and a half, and a washer and dryer in the unit. Glen Canyon Park is at the end of the street.",
    amenities: ["In-unit laundry", "Private entrance", "Near Glen Canyon Park"],
    photoUrls: [
      photo("photo-1633505899118-4ca6bd143043"),
      photo("photo-1757417983938-2c2a931d41aa"),
    ],
  },
];

export const seedListings = internalMutation({
  args: {},
  returns: v.object({ inserted: v.number(), skipped: v.number() }),
  handler: async (ctx) => {
    const existing = await ctx.db.query("listings").collect();
    const addresses = new Set(existing.map((listing) => listing.address));
    let inserted = 0;
    for (const listing of listings) {
      if (addresses.has(listing.address)) continue;
      await ctx.db.insert("listings", {
        ...listing,
        city: "San Francisco",
        photoStorageIds: [],
        status: "active",
        source: "dweller",
        missingFields: [],
      });
      inserted++;
    }
    return { inserted, skipped: listings.length - inserted };
  },
});

// Showing hours for the demo landlord and the clauses of Jordan's lease, so
// the assistant's bookTour and answerLeaseQuestion have real rows to read.
// Run after landlord:seedLandlordDemo. Safe to run again.
export const seedAgentDemo = internalMutation({
  args: {},
  returns: v.object({ availability: v.number(), leaseClauses: v.number() }),
  handler: async (ctx) => {
    const landlord = await currentLandlord(ctx);
    const renter = await currentRenter(ctx);
    if (landlord === null || renter === null) {
      throw new ConvexError("Run landlord:seedLandlordDemo before seeding the agent demo.");
    }
    let availability = 0;
    const hasHours = await ctx.db
      .query("availability")
      .withIndex("by_landlord", (q) => q.eq("landlordId", landlord.userId))
      .first();
    if (hasHours === null) {
      for (const window of showingHours) {
        await ctx.db.insert("availability", {
          ...window,
          landlordId: landlord.userId,
          timezone: DEFAULT_TIMEZONE,
        });
        availability++;
      }
    }
    let leaseClauses = 0;
    const lease = await activeLease(ctx, renter.userId);
    const hasClauses = lease
      ? await ctx.db
          .query("leaseClauses")
          .withIndex("by_lease_order", (q) => q.eq("leaseId", lease._id))
          .first()
      : null;
    if (lease !== null && hasClauses === null) {
      for (const [orderIndex, clause] of sanchezLeaseClauses.entries()) {
        await ctx.db.insert("leaseClauses", { ...clause, leaseId: lease._id, orderIndex });
        leaseClauses++;
      }
    }
    return { availability, leaseClauses };
  },
});

// weekday: 0 = Sunday; minutes from local midnight.
const showingHours = [
  { weekday: 3, startMinute: 17 * 60 + 30, endMinute: 19 * 60 },
  { weekday: 6, startMinute: 10 * 60, endMinute: 13 * 60 },
  { weekday: 0, startMinute: 11 * 60, endMinute: 14 * 60 },
];

const sanchezLeaseClauses = [
  {
    section: "3.1",
    heading: "Rent",
    text: "Tenant shall pay monthly rent of $5,600.00 in advance on or before the first (1st) day of each calendar month, by Zelle or another method Landlord agrees to in writing.",
  },
  {
    section: "3.2",
    heading: "Late payment",
    text: "If rent is not received by 11:59 p.m. on the fifth (5th) day of the month, Tenant shall pay a late charge of $150.00. Landlord will not charge a late fee for any month in which rent is received within the five-day grace period.",
  },
  {
    section: "4.1",
    heading: "Security deposit",
    text: "Tenant has paid a security deposit of $8,400.00. Within twenty-one (21) days after Tenant vacates, Landlord shall return the deposit less any lawful deductions for unpaid rent, cleaning to the condition at move-in, and damage beyond ordinary wear and tear, with an itemized statement.",
  },
  {
    section: "6.1",
    heading: "Pets",
    text: "No animals may be kept on the premises without Landlord's prior written consent, except service and support animals as provided by law. Landlord will not unreasonably withhold consent for one cat or one dog under 40 pounds, subject to an additional security deposit of $500.00.",
  },
  {
    section: "7.1",
    heading: "Subletting and assignment",
    text: "Tenant shall not sublet any part of the premises or assign this Agreement without Landlord's prior written consent, which shall not be unreasonably withheld. Short-term rentals of fewer than thirty (30) days are prohibited.",
  },
  {
    section: "8.1",
    heading: "Repairs and maintenance",
    text: "Tenant shall promptly report any leak, malfunction, or damage to Landlord through Dweller. Landlord shall make necessary repairs within a reasonable time and shall address conditions affecting health or safety, including loss of water, heat, or electricity, within twenty-four (24) hours of notice.",
  },
  {
    section: "8.4",
    heading: "Landlord's entry",
    text: "Except in an emergency, Landlord shall give Tenant at least twenty-four (24) hours' written notice before entering the premises, and shall enter only between 8:00 a.m. and 6:00 p.m. on weekdays unless Tenant agrees otherwise.",
  },
  {
    section: "9.2",
    heading: "Guests",
    text: "Tenant may have guests stay for up to fourteen (14) consecutive days, and no more than thirty (30) days in any twelve-month period, without Landlord's written consent.",
  },
  {
    section: "12.1",
    heading: "Ending the lease",
    text: "This lease ends on May 31, 2027. Unless either party gives at least sixty (60) days' written notice before that date, the tenancy continues month to month on the same terms. Tenant may end a month-to-month tenancy with thirty (30) days' written notice.",
  },
];
