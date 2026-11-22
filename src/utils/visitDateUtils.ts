// Utility for Parsing and Formatting Site Visit Dates & Times cleanly in Dharitri Sentu

export interface ParsedVisitDateTime {
  displayDate: string;
  displayTime: string;
  isoDate: string;
  isoTime: string;
  relativeLabel?: string;
}

/**
 * Format date string into human friendly format: e.g. "Sat, Nov 14, 2026"
 */
export function formatFriendlyDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-IN', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  } catch {}
  return dateStr;
}

/**
 * Format 24hr or 12hr time into clean AM/PM format: e.g. "11:00" -> "11:00 AM"
 */
export function formatFriendlyTime(timeStr: string): string {
  const clean = timeStr.trim();
  if (/am|pm/i.test(clean)) return clean.toUpperCase();
  const parts = clean.split(':');
  if (parts.length >= 2) {
    const hours = parseInt(parts[0], 10);
    const minutes = parts[1].padStart(2, '0');
    if (!isNaN(hours)) {
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const h12 = hours % 12 || 12;
      return `${h12}:${minutes} ${ampm}`;
    }
  }
  return timeStr;
}

/**
 * Parse any stored visit dateTime string (e.g. "Nov 14, 2026 at 2:30 PM" or "2026-11-12 at 11:00")
 */
export function parseVisitDateTime(rawDateTime?: string): ParsedVisitDateTime {
  if (!rawDateTime) {
    const tomorrow = new Date(Date.now() + 86400000);
    const isoDate = tomorrow.toISOString().split('T')[0];
    return {
      displayDate: formatFriendlyDate(isoDate),
      displayTime: '11:00 AM',
      isoDate,
      isoTime: '11:00',
      relativeLabel: 'Tomorrow',
    };
  }

  // Check if contains " at "
  if (rawDateTime.includes(' at ')) {
    const [rawDatePart, rawTimePart] = rawDateTime.split(' at ');
    let isoDate = '';
    const parsedDate = new Date(rawDatePart);
    if (!isNaN(parsedDate.getTime())) {
      isoDate = parsedDate.toISOString().split('T')[0];
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(rawDatePart.trim())) {
      isoDate = rawDatePart.trim();
    }

    let isoTime = '11:00';
    const timeMatch = rawTimePart.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (timeMatch) {
      let h = parseInt(timeMatch[1], 10);
      const m = timeMatch[2];
      const meridiem = timeMatch[3]?.toUpperCase();
      if (meridiem === 'PM' && h < 12) h += 12;
      if (meridiem === 'AM' && h === 12) h = 0;
      isoTime = `${String(h).padStart(2, '0')}:${m}`;
    }

    return {
      displayDate: formatFriendlyDate(rawDatePart),
      displayTime: formatFriendlyTime(rawTimePart),
      isoDate: isoDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
      isoTime,
    };
  }

  // If only date or ISO timestamp
  const dateObj = new Date(rawDateTime);
  if (!isNaN(dateObj.getTime())) {
    return {
      displayDate: formatFriendlyDate(rawDateTime),
      displayTime: '11:00 AM',
      isoDate: dateObj.toISOString().split('T')[0],
      isoTime: '11:00',
    };
  }

  // Fallback
  return {
    displayDate: rawDateTime,
    displayTime: '11:00 AM',
    isoDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    isoTime: '11:00',
  };
}

/**
 * Get dynamic quick date suggestions (Tomorrow, This Weekend, Next Week)
 */
export function getQuickDatePresets(): Array<{ label: string; dateStr: string; subtext: string }> {
  const now = new Date();
  
  // Tomorrow
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowIso = tomorrow.toISOString().split('T')[0];

  // Saturday
  const saturday = new Date(now);
  const dayOfWeek = now.getDay();
  const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
  saturday.setDate(now.getDate() + daysUntilSaturday);
  const saturdayIso = saturday.toISOString().split('T')[0];

  // Sunday
  const sunday = new Date(now);
  const daysUntilSunday = (7 - dayOfWeek + 7) % 7 || 7;
  sunday.setDate(now.getDate() + daysUntilSunday);
  const sundayIso = sunday.toISOString().split('T')[0];

  // Next Monday
  const nextMonday = new Date(now);
  const daysUntilMonday = (8 - dayOfWeek + 7) % 7 || 7;
  nextMonday.setDate(now.getDate() + daysUntilMonday);
  const nextMondayIso = nextMonday.toISOString().split('T')[0];

  return [
    {
      label: 'Tomorrow',
      dateStr: tomorrowIso,
      subtext: tomorrow.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }),
    },
    {
      label: 'This Saturday',
      dateStr: saturdayIso,
      subtext: saturday.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    },
    {
      label: 'This Sunday',
      dateStr: sundayIso,
      subtext: sunday.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    },
    {
      label: 'Next Monday',
      dateStr: nextMondayIso,
      subtext: nextMonday.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    },
  ];
}

export const POPULAR_TIME_SLOTS = [
  { time: '09:30', label: '09:30 AM', period: 'Morning Slot' },
  { time: '11:00', label: '11:00 AM', period: 'Recommended' },
  { time: '14:30', label: '02:30 PM', period: 'Afternoon' },
  { time: '16:00', label: '04:00 PM', period: 'Cool Dusk' },
];
