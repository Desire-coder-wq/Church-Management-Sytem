import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChurch,
  faUsers,
  faHeart,
  faCreditCard,
  faChartLine,
  faBell,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";

export function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="mx-auto flex max-w-7xl items-center justify-between p-6">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-navy">
          <FontAwesomeIcon icon={faChurch} className="text-gold text-2xl" />
          Church Pledge Manager
        </Link>
        <nav className="hidden space-x-8 text-sm font-medium text-slate-600 md:flex">
          <a href="#" className="text-navy underline decoration-gold decoration-2 underline-offset-8">Home</a>
          <a href="#" className="hover:text-navy">Features</a>
          <a href="#" className="hover:text-navy">How It Works</a>
          <a href="#" className="hover:text-navy">About</a>
        </nav>
        <Link to="/login" className="rounded-md bg-navy px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
          Sign in
        </Link>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-6 pt-10 pb-20 lg:grid lg:grid-cols-2 lg:gap-12 lg:pt-16">
        {/* Left Content */}
        <div className="flex flex-col justify-center">
          <p className="mb-4 text-sm font-bold uppercase tracking-wider text-gold">
            Fundraising Made Clear
          </p>
          <h1 className="text-5xl font-extrabold leading-tight text-navy md:text-6xl">
            Every pledge.
            <br />
            Every collection.
            <br />
            <span className="text-gold">One trusted record.</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg text-slate-600">
            A secure workspace for church staff to manage members, campaigns,
            payments and reminders.
          </p>
          
          <div className="mt-8 flex gap-4">
            <Link to="/signup" className="flex items-center gap-2 rounded-md bg-navy px-8 py-3 font-semibold text-white hover:bg-slate-800">
              Get started <FontAwesomeIcon icon={faArrowRight} size="sm" />
            </Link>
            <button className="rounded-md border border-navy px-8 py-3 font-semibold text-navy hover:bg-slate-100">
              Learn more
            </button>
          </div>

          {/* Stats/Features Row */}
          <div className="mt-16 grid grid-cols-2 gap-6 border-t border-slate-200 pt-8 md:grid-cols-4">
            <div>
              <p className="text-xs font-semibold text-slate-500">Manage Members</p>
              <div className="mt-2 flex items-center gap-2 text-lg font-bold text-navy">
                <FontAwesomeIcon icon={faUsers} className="text-slate-400" /> 500+
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Track Pledges</p>
              <div className="mt-2 flex items-center gap-2 text-lg font-bold text-navy">
                <FontAwesomeIcon icon={faHeart} className="text-slate-400" /> 1K+
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Process Payments</p>
              <div className="mt-2 flex items-center gap-2 text-lg font-bold text-navy">
                <FontAwesomeIcon icon={faCreditCard} className="text-slate-400" /> Secure
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Grow Your Ministry</p>
              <div className="mt-2 flex items-center gap-2 text-lg font-bold text-navy">
                <FontAwesomeIcon icon={faChartLine} className="text-slate-400" /> Together
              </div>
            </div>
          </div>
        </div>

        {/* Right Image & Overlays */}
        <div className="relative mt-12 hidden lg:mt-0 lg:block">
          {/* Background Circle Shape */}
          <div className="absolute -right-20 -top-20 h-[600px] w-[600px] rounded-full bg-slate-100/50"></div>
          
          {/* Church Image */}
          <img 
            src="/Assets/Images/church-hero.jpg" 
            alt="Church building" 
            className="relative z-10 h-full w-full rounded-bl-[100px] object-cover shadow-xl"
          />

          {/* Floating Card */}
          <div className="absolute left-0 top-1/4 z-20 w-64 rounded-xl bg-white p-6 shadow-lg">
            <div className="mb-3 h-1 w-8 bg-gold"></div>
            <h3 className="font-bold text-navy">Supporting churches to make a greater impact.</h3>
            <p className="mt-2 text-xs text-slate-500">Faith. Community. Growth.</p>
          </div>

          {/* Handwritten Script (Simulated with CSS for now, replace with SVG if needed) */}
          <div className="absolute -right-4 top-10 z-20 -rotate-6 font-serif text-3xl italic text-navy/80">
            Together <br /> for a brighter <br /> tomorrow
            <div className="ml-auto mt-1 h-1 w-12 bg-gold"></div>
          </div>
        </div>
      </section>

      {/* Bottom Features Bar */}
      <section className="border-t border-slate-200 bg-white py-10">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 md:grid-cols-4">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-navy">
              <FontAwesomeIcon icon={faUsers} />
            </div>
            <div>
              <h4 className="font-bold text-navy">Manage Members</h4>
              <p className="text-sm text-slate-500">Keep accurate and up-to-date member information.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-navy">
              <FontAwesomeIcon icon={faHeart} />
            </div>
            <div>
              <h4 className="font-bold text-navy">Track Pledges</h4>
              <p className="text-sm text-slate-500">Easily record and monitor pledges and giving.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-navy">
              <FontAwesomeIcon icon={faCreditCard} />
            </div>
            <div>
              <h4 className="font-bold text-navy">Process Payments</h4>
              <p className="text-sm text-slate-500">Secure and transparent payment tracking.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-navy">
              <FontAwesomeIcon icon={faBell} />
            </div>
            <div>
              <h4 className="font-bold text-navy">Send Reminders</h4>
              <p className="text-sm text-slate-500">Automate reminders and stay on track.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}