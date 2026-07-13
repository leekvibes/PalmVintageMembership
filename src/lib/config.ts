export const PROGRAM_CONFIG = {
  chauffeur: {
    name: "Chauffeur Membership",
    price: "$500/month",
    term: "12-month membership",
    guestPassesPerYear: 3, // EDITABLE: exact number being finalized
    radius: "3-mile radius",
    diningDiscount: "10%",
    anniversaryDinnerValue: "$500",
    anniversaryAfterMonths: 6,
  },
  special_event: {
    name: "Special Event Experience",
    pricePerPerson: "$600",
    minimumGuests: 2,
    cancellationWindow: "48 hours",
    radius: "3-mile radius",
  },
} as const;

export const BUSINESS = {
  name: "Palm Vintage",
  address: "1414 South Penn Square, Philadelphia",
  venue: "The Ritz-Carlton",
  inquiryEmail: "Palmvintagephl@gmail.com",
  hours: { open: "7:00 AM", close: "12:00 AM" },
  vehicles: ["Rolls-Royce", "Cadillac Escalade"],
  website: "https://thepalmvintage.com",
} as const;
