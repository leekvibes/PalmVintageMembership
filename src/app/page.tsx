import { PROGRAM_CONFIG, BUSINESS } from "@/lib/config";
import { InquiryForm } from "@/components/inquiry-form";

export default function MembershipPage() {
  return (
    <main className="flex flex-col">
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center justify-center bg-navy-darkest text-cream overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#233768_0%,_#020A1A_70%)] opacity-80" />
        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <p className="text-gold uppercase tracking-[0.18em] text-sm font-mono mb-6">
            Palm Vintage
          </p>
          <h1 className="text-4xl md:text-6xl font-light tracking-tight leading-[1.1] mb-6">
            Membership
          </h1>
          <p className="text-lg md:text-xl text-cream/80 font-light max-w-xl mx-auto mb-10">
            A chauffeured arrival. A table that knows your name. Two programs
            designed around how you prefer to dine.
          </p>
          <a
            href="#inquire"
            className="inline-block border border-gold/60 text-gold px-8 py-3.5 text-sm uppercase tracking-[0.14em] hover:bg-gold/10 transition-colors"
          >
            Inquire About Membership
          </a>
        </div>
      </section>

      {/* The Experience */}
      <section className="py-24 px-6 bg-cream">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-gold-dark uppercase tracking-[0.16em] text-xs font-mono mb-4">
            The Experience
          </p>
          <p className="text-xl md:text-2xl font-light text-navy-darkest leading-relaxed">
            Membership at Palm Vintage is access to the full expression of what
            we do — a private fleet, a chauffeured door-to-door service, and a
            dining relationship that deepens over time. No waiting. No
            wondering. Just arrive.
          </p>
        </div>
      </section>

      {/* Chauffeur Membership */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-[1fr_1.2fr] gap-16 items-start">
            <div className="aspect-[3/4] bg-navy-darkest/5 border border-border flex items-center justify-center text-navy/30 text-sm">
              Fleet Photography
            </div>

            <div>
              <p className="text-gold-dark uppercase tracking-[0.16em] text-xs font-mono mb-3">
                Program One
              </p>
              <h2 className="text-3xl md:text-4xl font-light tracking-tight text-navy-darkest mb-2">
                {PROGRAM_CONFIG.chauffeur.name}
              </h2>
              <p className="text-navy/60 text-lg mb-8">
                {PROGRAM_CONFIG.chauffeur.price} &middot;{" "}
                {PROGRAM_CONFIG.chauffeur.term}
              </p>

              <p className="text-navy-darkest/80 leading-relaxed mb-8">
                Arrive the way Palm Vintage intends — chauffeured, welcomed, and
                known by name. Your membership gives you standing access to our{" "}
                {BUSINESS.vehicles.join(" and ")} for pick-up and drop-off
                within a {PROGRAM_CONFIG.chauffeur.radius} of the restaurant.
              </p>

              <ul className="space-y-4 text-navy-darkest/80">
                <li className="flex gap-3">
                  <span className="text-gold-bright mt-0.5">&#9670;</span>
                  <span>
                    Chauffeured round-trip service — a driver greets you and
                    opens your door.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-gold-bright mt-0.5">&#9670;</span>
                  <span>
                    Bring whoever you&apos;d like as your guests when you ride.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-gold-bright mt-0.5">&#9670;</span>
                  <span>
                    Guest Pass — extend the service to a family friend for a
                    special occasion, even when you&apos;re not riding. A few
                    times per year.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-gold-bright mt-0.5">&#9670;</span>
                  <span>
                    Complimentary welcome drinks,{" "}
                    {PROGRAM_CONFIG.chauffeur.diningDiscount} off your bill, and
                    an anniversary dinner (up to{" "}
                    {PROGRAM_CONFIG.chauffeur.anniversaryDinnerValue}) after{" "}
                    {PROGRAM_CONFIG.chauffeur.anniversaryAfterMonths} months.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-gold-bright mt-0.5">&#9670;</span>
                  <span>
                    A personal membership profile to manage bookings and your
                    account.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-gold-bright mt-0.5">&#9670;</span>
                  <span>Membership is transferable.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Special Event Experience */}
      <section className="py-24 px-6 bg-navy-darkest text-cream">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-[1.2fr_1fr] gap-16 items-start">
            <div>
              <p className="text-gold uppercase tracking-[0.16em] text-xs font-mono mb-3">
                Program Two
              </p>
              <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-2">
                {PROGRAM_CONFIG.special_event.name}
              </h2>
              <p className="text-cream/60 text-lg mb-8">
                {PROGRAM_CONFIG.special_event.pricePerPerson} per person
                &middot; minimum {PROGRAM_CONFIG.special_event.minimumGuests}{" "}
                guests
              </p>

              <p className="text-cream/80 leading-relaxed mb-8">
                One unforgettable evening — the car, the champagne, the table,
                and someone to capture all of it. The full amount is applied
                toward your bill at Palm Vintage.
              </p>

              <ul className="space-y-4 text-cream/80">
                <li className="flex gap-3">
                  <span className="text-gold mt-0.5">&#9670;</span>
                  <span>
                    Champagne, a dedicated photographer, and chauffeured
                    round-trip within a{" "}
                    {PROGRAM_CONFIG.special_event.radius}.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-gold mt-0.5">&#9670;</span>
                  <span>
                    For birthdays: a custom cake arranged with advance notice.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-gold mt-0.5">&#9670;</span>
                  <span>Paid in full at booking.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-gold mt-0.5">&#9670;</span>
                  <span>
                    Flexible cancellation up to{" "}
                    {PROGRAM_CONFIG.special_event.cancellationWindow} prior.
                  </span>
                </li>
              </ul>
            </div>

            <div className="aspect-[3/4] bg-cream/5 border border-cream/10 flex items-center justify-center text-cream/30 text-sm">
              Evening Photography
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 bg-cream">
        <div className="max-w-4xl mx-auto">
          <p className="text-gold-dark uppercase tracking-[0.16em] text-xs font-mono mb-4 text-center">
            How It Works
          </p>
          <h2 className="text-3xl md:text-4xl font-light tracking-tight text-navy-darkest text-center mb-16">
            From inquiry to arrival
          </h2>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full border border-gold/40 flex items-center justify-center mx-auto mb-5">
                <span className="text-gold-dark font-mono text-sm">01</span>
              </div>
              <h3 className="font-medium text-navy-darkest mb-2">Inquire</h3>
              <p className="text-navy/60 text-sm leading-relaxed">
                Submit your interest below. A member of our team will reach out
                to discuss the program and answer any questions.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full border border-gold/40 flex items-center justify-center mx-auto mb-5">
                <span className="text-gold-dark font-mono text-sm">02</span>
              </div>
              <h3 className="font-medium text-navy-darkest mb-2">Onboard</h3>
              <p className="text-navy/60 text-sm leading-relaxed">
                Once approved, we&apos;ll set up your member profile — your
                preferences, your guests, your schedule.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full border border-gold/40 flex items-center justify-center mx-auto mb-5">
                <span className="text-gold-dark font-mono text-sm">03</span>
              </div>
              <h3 className="font-medium text-navy-darkest mb-2">Arrive</h3>
              <p className="text-navy/60 text-sm leading-relaxed">
                Book your car through your profile, choose your time, and
                we&apos;ll be at your door.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Fleet */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gold-dark uppercase tracking-[0.16em] text-xs font-mono mb-4">
            The Fleet
          </p>
          <h2 className="text-3xl md:text-4xl font-light tracking-tight text-navy-darkest mb-12">
            Two vehicles. One standard.
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="aspect-[4/3] bg-navy-darkest/5 border border-border flex items-center justify-center text-navy/30 text-sm">
              Rolls-Royce Photo
            </div>
            <div className="aspect-[4/3] bg-navy-darkest/5 border border-border flex items-center justify-center text-navy/30 text-sm">
              Cadillac Escalade Photo
            </div>
          </div>
          <p className="mt-8 text-navy/60 text-sm">
            Vehicle preference is noted at booking. Assignment is confirmed by
            our team based on availability.
          </p>
        </div>
      </section>

      {/* Inquiry Form */}
      <section id="inquire" className="py-24 px-6 bg-navy-darkest text-cream">
        <div className="max-w-2xl mx-auto">
          <p className="text-gold uppercase tracking-[0.16em] text-xs font-mono mb-4 text-center">
            Begin Here
          </p>
          <h2 className="text-3xl md:text-4xl font-light tracking-tight text-center mb-4">
            Inquire About Membership
          </h2>
          <p className="text-cream/60 text-center mb-12">
            Or reach us directly at{" "}
            <a
              href={`mailto:${BUSINESS.inquiryEmail}`}
              className="text-gold hover:text-gold-bright transition-colors"
            >
              {BUSINESS.inquiryEmail}
            </a>
          </p>

          <InquiryForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-navy-darkest border-t border-cream/10 text-cream/50">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-sm">
          <div className="text-center md:text-left">
            <p className="text-cream/80 font-light">{BUSINESS.name}</p>
            <p>
              {BUSINESS.address} &middot; {BUSINESS.venue}
            </p>
          </div>
          <div className="text-center md:text-right">
            <p>
              Open daily {BUSINESS.hours.open} – {BUSINESS.hours.close}
            </p>
            <a
              href={`mailto:${BUSINESS.inquiryEmail}`}
              className="text-gold/70 hover:text-gold transition-colors"
            >
              {BUSINESS.inquiryEmail}
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
