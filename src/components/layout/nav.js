// Single source of truth for app navigation (sidebar, shortcuts, page titles).
export const NAV = [
  { n: '01', key: '1', to: '/app', label: 'Security Overview', short: 'Overview', end: true },
  { n: '02', key: '2', to: '/app/recorder', label: 'Flight Recorder', short: 'Flight Recorder' },
  { n: '03', key: '3', to: '/app/investigation', label: 'Incident Investigation', short: 'Investigation', badge: 2 },
  { n: '04', key: '4', to: '/app/behavior', label: 'Behavioral Analysis', short: 'Behavior' },
  { n: '05', key: '5', to: '/app/timeline', label: 'Event Timeline', short: 'Timeline' },
  { n: '06', key: '6', to: '/app/entities', label: 'Network Entities', short: 'Entities' },
  { n: '07', key: '7', to: '/app/detection', label: 'Detection Details', short: 'Detection' },
  { n: '08', key: '8', to: '/app/report', label: 'Investigation Reports', short: 'Reports' },
  { n: '09', key: '9', to: '/app/settings', label: 'Settings', short: 'Settings', footer: true },
]
