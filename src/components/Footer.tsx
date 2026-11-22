import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../app/AppContext';

export const Footer: React.FC = () => {
  const { t } = useApp();

  return (
    <footer className="bg-evergreen text-warmivory mt-16 border-t border-teagreen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2.5">
              <img src="/assets/logo.svg" alt="Dharitri Sentu" className="w-8 h-8 bg-warmivory rounded-full p-1" />
              <span className="font-serif text-xl font-bold text-warmivory">Dharitri Sentu</span>
            </div>
            <p className="text-xs text-mistyblue/90 leading-relaxed">
              {t('heroDescription')}
            </p>
            <p className="text-[11px] text-cream/80 bg-teagreen/40 p-2.5 rounded-lg border border-leafgreen/30">
              {t('govBoundaryNotice')}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-cream mb-3">
              Marketplace & Map
            </h3>
            <ul className="space-y-2 text-xs text-mistyblue">
              <li><Link to="/explore" className="hover:underline">Interactive Parcel Map & Listings</Link></li>
              <li><Link to="/buyers" className="hover:underline">For Land Buyers</Link></li>
              <li><Link to="/sellers" className="hover:underline">For Land Sellers</Link></li>
              <li><Link to="/price-explorer" className="hover:underline">Price Comparison & Projections</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-cream mb-3">
              Trust & Due Diligence
            </h3>
            <ul className="space-y-2 text-xs text-mistyblue">
              <li><Link to="/explore" className="hover:underline">Verified Land Parcels</Link></li>
              <li><Link to="/cases" className="hover:underline">5-Point Due Diligence Cases</Link></li>
              <li><Link to="/landlocker" className="hover:underline">LandLocker Document Vault</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-cream mb-3">
              Platform & Information
            </h3>
            <ul className="space-y-2 text-xs text-mistyblue">
              <li><Link to="/assistant" className="hover:underline">Voice & Text Guide Assistant</Link></li>
              <li><Link to="/about" className="hover:underline">About & USPR Architecture</Link></li>
              <li><Link to="/privacy" className="hover:underline">Privacy & Data Minimisation</Link></li>
              <li><Link to="/terms" className="hover:underline">Terms & Prototype Disclaimers</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-teagreen/60 flex flex-col sm:flex-row items-center justify-between text-xs text-mistyblue/80 gap-4">
          <p>© 2026 Dharitri Sentu. Land information and verification depend on authorised source availability.</p>
          <p>{t('languageReviewNote')}</p>
        </div>
      </div>
    </footer>
  );
};
