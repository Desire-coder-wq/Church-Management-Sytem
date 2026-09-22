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
import churchImage from "../../Assets/Images/Church.jpg";

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
           
          </div>

          {/* Stats/Features Row */}
          <div className="mt-16 grid grid-cols-2 gap-6 border-t border-slate-200 pt-8 md:grid-cols-4">
            <div>
              <p className="text-xs font-semibold text-slate-500">Manage Members</p>
              <div className="mt-2 flex items-center gap-2 text-lg font-bold text-navy">
                <FontAwesomeIcon icon={faUsers} className="text-slate-400" /> 
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Track Pledges</p>
              <div className="mt-2 flex items-center gap-2 text-lg font-bold text-navy">
                <FontAwesomeIcon icon={faHeart} className="text-slate-400" /> 
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Process Payments</p>
              <div className="mt-2 flex items-center gap-2 text-lg font-bold text-navy">
                <FontAwesomeIcon icon={faCreditCard} className="text-slate-400" /> 
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Grow Your Ministry</p>
              <div className="mt-2 flex items-center gap-2 text-lg font-bold text-navy">
                <FontAwesomeIcon icon={faChartLine} className="text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Image & Overlays */}
        <div className="relative mt-12 lg:mt-0">
          {/* Background Circle Shape */}
          <div className="absolute -right-20 -top-20 h-[600px] w-[600px] rounded-full bg-slate-100/50"></div>
          
          {/* Church Image */}
          <img 
            src={churchImage}
            alt="Church building" 
            className="relative z-10 h-full w-full rounded-bl-[100px] object-cover shadow-xl"
          />

       

   
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

            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-navy">
              <FontAwesomeIcon icon={faHeart} />
            </div>
            <div>
              <h4 className="font-bold text-navy">Track Pledges</h4>
         
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-navy">
              <FontAwesomeIcon icon={faCreditCard} />
            </div>
            <div>
              <h4 className="font-bold text-navy">Process Payments</h4>

            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-navy">
              <FontAwesomeIcon icon={faBell} />
            </div>
            <div>
              <h4 className="font-bold text-navy">Send Reminders</h4>

            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
