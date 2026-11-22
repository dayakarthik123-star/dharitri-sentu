import React from 'react';
import { useApp } from '../../app/AppContext';
import { AccountSecuritySettingsPanel } from './AccountSecuritySettingsPanel';

export const ProfileSettingsPage: React.FC = () => {
  const { currentUser, t } = useApp();

  return (
    <main className="min-h-[70vh] bg-warmivory py-8 sm:py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-8">
        <header className="border-b border-cream pb-6 sm:flex sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-teagreen">
              Dharitri Sentu / Security & Settings
            </p>
            <h1 className="mt-2 font-serif text-3xl sm:text-4xl font-bold text-evergreen">
              {t('profileTitle') || 'Account & Security Settings'}
            </h1>
            <p className="mt-2 max-w-2xl text-xs sm:text-sm text-secondarytext leading-relaxed">
              Manage your display identity, single-use OTP password updates, DigiLocker connections, notification alerts, and privacy controls.
            </p>
          </div>
          {currentUser && (
            <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#DFD6C3] bg-white px-3.5 py-1.5 text-xs font-bold text-evergreen sm:mt-0 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                Role: <strong className="capitalize">{currentUser.role}</strong>
              </span>
            </span>
          )}
        </header>

        <AccountSecuritySettingsPanel />
      </div>
    </main>
  );
};
