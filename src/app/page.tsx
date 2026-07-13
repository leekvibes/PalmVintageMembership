import { PROGRAM_CONFIG, BUSINESS } from "@/lib/config";
import { InquiryForm } from "@/components/inquiry-form";

const HERO_BG =
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6945c9d4553e0371a41552a1/4d70f3afc_InC2_R1-4-0-0.jpg";

export default function MembershipPage() {
  return (
    <main className="flex flex-col">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_BG})` }}
        />
        <div className="absolute inset-0 bg-navy-darkest/70" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-24 h-px bg-gold/40" />

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <p className="font-script text-gold text-4xl md:text-5xl mb-2">
            An invitation
          </p>
          <h1 className="font-serif text-white text-4xl md:text-7xl uppercase tracking-[0.06em] leading-[1.1] mb-8">
            Beyond the Table
          </h1>
          <p className="font-mono text-cream/60 text-xs tracking-[0.2em] uppercase mb-12">
            Membership &middot; Palm Vintage
          </p>
          <a
            href="#inquire"
            className="inline-block border border-gold/50 text-gold font-serif text-sm uppercase tracking-[0.15em] px-10 py-4 hover:bg-gold/10 transition-colors"
          >
            Inquire About Membership
          </a>
        </div>

        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-12 h-px bg-gold/40" />
      </section>

      {/* The Experience */}
      <section className="py-24 md:py-32 px-6 bg-cream">
        <div className="max-w-3xl mx-auto text-center">
          <p className="font-script text-gold-dark text-3xl mb-6">
            The experience
          </p>
          <p className="font-body text-navy-darkest text-lg md:text-xl leading-relaxed">
            Membership at Palm Vintage is access to the full expression of what
            we do — a private fleet, a chauffeured door-to-door service, and a
            dining relationship that deepens over time. No waiting. No
            wondering. Just arrive.
          </p>
        </div>
      </section>

      {/* Chauffeur Membership */}
      <section className="py-24 md:py-32 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div className="aspect-[4/5] overflow-hidden">
              <img
                src="/images/rolls-royce-1.jpg"
                alt="Rolls-Royce Phantom — Palm Vintage fleet"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="md:py-8">
              <p className="font-script text-gold-dark text-2xl mb-3">
                Program One
              </p>
              <h2 className="font-serif text-navy-darkest text-3xl md:text-4xl uppercase tracking-[0.04em] mb-2">
                {PROGRAM_CONFIG.chauffeur.name}
              </h2>
              <p className="font-body text-navy/50 text-lg mb-10">
                {PROGRAM_CONFIG.chauffeur.price} &middot;{" "}
                {PROGRAM_CONFIG.chauffeur.term}
              </p>

              <p className="font-body text-navy-darkest/80 leading-relaxed mb-10">
                Arrive the way Palm Vintage intends — chauffeured, welcomed, and
                known by name. Your membership gives you standing access to our{" "}
                {BUSINESS.vehicles.join(" and ")} for pick-up and drop-off
                within a {PROGRAM_CONFIG.chauffeur.radius} of the restaurant.
              </p>

              <ul className="space-y-5 font-body text-navy-darkest/75">
                <li className="flex gap-4">
                  <span className="text-gold-dark mt-1 text-xs">&#9670;</span>
                  <span>
                    Chauffeured round-trip service — a driver greets you and
                    opens your door.
                  </span>
                </li>
                <li className="flex gap-4">
                  <span className="text-gold-dark mt-1 text-xs">&#9670;</span>
                  <span>
                    Bring whoever you&apos;d like as your guests when you ride.
                  </span>
                </li>
                <li className="flex gap-4">
                  <span className="text-gold-dark mt-1 text-xs">&#9670;</span>
                  <span>
                    Guest Pass — extend the service to a family friend for a
                    special occasion, even when you&apos;re not riding. A few
                    times per year.
                  </span>
                </li>
                <li className="flex gap-4">
                  <span className="text-gold-dark mt-1 text-xs">&#9670;</span>
                  <span>
                    Complimentary welcome drinks,{" "}
                    {PROGRAM_CONFIG.chauffeur.diningDiscount} off your bill, and
                    an anniversary dinner (up to{" "}
                    {PROGRAM_CONFIG.chauffeur.anniversaryDinnerValue}) after{" "}
                    {PROGRAM_CONFIG.chauffeur.anniversaryAfterMonths} months.
                  </span>
                </li>
                <li className="flex gap-4">
                  <span className="text-gold-dark mt-1 text-xs">&#9670;</span>
                  <span>
                    A personal membership profile to manage your bookings.
                  </span>
                </li>
                <li className="flex gap-4">
                  <span className="text-gold-dark mt-1 text-xs">&#9670;</span>
                  <span>Membership is transferable.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="flex justify-center py-4 bg-cream">
        <div className="w-16 h-px bg-gold/40" />
      </div>

      {/* Special Event Experience */}
      <section className="py-24 md:py-32 px-6 bg-navy-darkest text-cream relative overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div className="md:py-8">
              <p className="font-script text-gold text-2xl mb-3">
                Program Two
              </p>
              <h2 className="font-serif text-white text-3xl md:text-4xl uppercase tracking-[0.04em] mb-2">
                {PROGRAM_CONFIG.special_event.name}
              </h2>
              <p className="font-body text-cream/50 text-lg mb-10">
                {PROGRAM_CONFIG.special_event.pricePerPerson} per person
                &middot; minimum {PROGRAM_CONFIG.special_event.minimumGuests}{" "}
                guests
              </p>

              <p className="font-body text-cream/80 leading-relaxed mb-10">
                One unforgettable evening — the car, the champagne, the table,
                and someone to capture all of it. The full amount is applied
                toward your bill at Palm Vintage.
              </p>

              <ul className="space-y-5 font-body text-cream/70">
                <li className="flex gap-4">
                  <span className="text-gold mt-1 text-xs">&#9670;</span>
                  <span>
                    Champagne, a dedicated photographer, and chauffeured
                    round-trip within a {PROGRAM_CONFIG.special_event.radius}.
                  </span>
                </li>
                <li className="flex gap-4">
                  <span className="text-gold mt-1 text-xs">&#9670;</span>
                  <span>
                    For birthdays: a custom cake arranged with advance notice.
                  </span>
                </li>
                <li className="flex gap-4">
                  <span className="text-gold mt-1 text-xs">&#9670;</span>
                  <span>Paid in full at booking.</span>
                </li>
                <li className="flex gap-4">
                  <span className="text-gold mt-1 text-xs">&#9670;</span>
                  <span>
                    Flexible cancellation up to{" "}
                    {PROGRAM_CONFIG.special_event.cancellationWindow} prior.
                  </span>
                </li>
              </ul>
            </div>

            <div className="aspect-[4/5] overflow-hidden">
              <img
                src="/images/rolls-royce-4.jpg"
                alt="Rolls-Royce Phantom at golden hour"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 md:py-32 px-6 bg-cream">
        <div className="max-w-5xl mx-auto text-center">
          <p className="font-script text-gold-dark text-3xl mb-4">
            How it works
          </p>
          <h2 className="font-serif text-navy-darkest text-3xl md:text-4xl uppercase tracking-[0.04em] mb-20">
            From Inquiry to Arrival
          </h2>

          <div className="grid md:grid-cols-3 gap-16">
            <div>
              <div className="font-serif text-gold/60 text-5xl mb-6">I</div>
              <h3 className="font-serif text-navy-darkest text-lg uppercase tracking-wide mb-3">
                Inquire
              </h3>
              <p className="font-body text-navy/60 leading-relaxed">
                Submit your interest below. A member of our team will reach out
                to discuss the program and answer any questions.
              </p>
            </div>
            <div>
              <div className="font-serif text-gold/60 text-5xl mb-6">II</div>
              <h3 className="font-serif text-navy-darkest text-lg uppercase tracking-wide mb-3">
                Onboard
              </h3>
              <p className="font-body text-navy/60 leading-relaxed">
                Once approved, we&apos;ll set up your member profile — your
                preferences, your guests, your schedule.
              </p>
            </div>
            <div>
              <div className="font-serif text-gold/60 text-5xl mb-6">III</div>
              <h3 className="font-serif text-navy-darkest text-lg uppercase tracking-wide mb-3">
                Arrive
              </h3>
              <p className="font-body text-navy/60 leading-relaxed">
                Book your car through your profile, choose your time, and
                we&apos;ll be at your door.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Fleet */}
      <section className="py-24 md:py-32 px-6 bg-white">
        <div className="max-w-5xl mx-auto text-center">
          <p className="font-script text-gold-dark text-3xl mb-4">
            The fleet
          </p>
          <h2 className="font-serif text-navy-darkest text-3xl md:text-4xl uppercase tracking-[0.04em] mb-16">
            Two Vehicles. One Standard.
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="relative">
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src="/images/rolls-royce-5.jpg"
                  alt="Rolls-Royce Phantom"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="font-serif text-navy-darkest uppercase tracking-[0.1em] text-sm mt-4">
                Rolls-Royce
              </p>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] bg-navy-darkest/5 flex items-center justify-center text-navy/20 font-body text-sm italic">
                Cadillac Escalade — photo coming soon
              </div>
              <p className="font-serif text-navy-darkest uppercase tracking-[0.1em] text-sm mt-4">
                Cadillac Escalade
              </p>
            </div>
          </div>
          <p className="mt-10 font-body text-navy/50 text-sm">
            Vehicle preference is noted at booking. Assignment is confirmed by
            our team based on availability.
          </p>
        </div>
      </section>

      {/* Divider */}
      <div className="flex justify-center py-4 bg-cream">
        <div className="w-16 h-px bg-gold/40" />
      </div>

      {/* Inquiry Form */}
      <section
        id="inquire"
        className="py-24 md:py-32 px-6 bg-navy-darkest text-cream"
      >
        <div className="max-w-2xl mx-auto text-center">
          <p className="font-script text-gold text-3xl mb-4">Begin here</p>
          <h2 className="font-serif text-white text-3xl md:text-4xl uppercase tracking-[0.04em] mb-4">
            Inquire About Membership
          </h2>
          <p className="font-body text-cream/50 mb-12">
            Or reach us directly at{" "}
            <a
              href={`mailto:${BUSINESS.inquiryEmail}`}
              className="text-gold/80 hover:text-gold transition-colors"
            >
              {BUSINESS.inquiryEmail}
            </a>
          </p>

          <InquiryForm />
        </div>
      </section>
    </main>
  );
}
