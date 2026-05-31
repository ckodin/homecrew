/* icons.jsx — minimal stroke icons (1.75 stroke, rounded). Original line work. */

const Ic = ({ d, size = 22, fill = false, sw = 1.75, children, ...p }) => (
  <svg viewBox="0 0 24 24" width={size} height={size}
       fill={fill ? "currentColor" : "none"} stroke="currentColor"
       strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" {...p}>
    {children || <path d={d} />}
  </svg>
);

const IconBoard = (p) => (
  <Ic {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2.5" />
    <path d="M3 9h18M9 9v11M15 9v11" />
  </Ic>
);
const IconTasks = (p) => (
  <Ic {...p}>
    <path d="M4 6.5l2 2 3.5-3.5M4 17.5l2 2L9.5 16" />
    <path d="M13 7h7M13 18h7" />
  </Ic>
);
const IconInsights = (p) => (
  <Ic {...p}>
    <path d="M4 19V5" />
    <path d="M4 19h16" />
    <path d="M8 16v-4M12 16V7M16 16v-6" />
  </Ic>
);
const IconSettings = (p) => (
  <Ic {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 13a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2 2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9 2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1A2 2 0 1 1 7.1 4.6l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.6 2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.6 1 2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </Ic>
);
const IconCheck = (p) => <Ic {...p}><path d="M4.5 12.5l5 5 10-11" /></Ic>;
const IconChevL = (p) => <Ic {...p}><path d="M15 5l-7 7 7 7" /></Ic>;
const IconChevR = (p) => <Ic {...p}><path d="M9 5l7 7-7 7" /></Ic>;
const IconX = (p) => <Ic {...p}><path d="M6 6l12 12M18 6L6 18" /></Ic>;
const IconClock = (p) => <Ic {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></Ic>;
const IconPlus = (p) => <Ic {...p}><path d="M12 5v14M5 12h14" /></Ic>;
const IconRepeat = (p) => <Ic {...p}><path d="M17 3l3 3-3 3" /><path d="M20 6H8a4 4 0 0 0-4 4v1" /><path d="M7 21l-3-3 3-3" /><path d="M4 18h12a4 4 0 0 0 4-4v-1" /></Ic>;
const IconBroom = (p) => <Ic {...p}><path d="M19 4l-7 7" /><path d="M11 8l5 5" /><path d="M14 11l-7.5 7.5a2 2 0 0 1-1.6.6L4 19l-.1-.9a2 2 0 0 1 .6-1.6L12 9" /></Ic>;

Object.assign(window, {
  IconBoard, IconTasks, IconInsights, IconSettings,
  IconCheck, IconChevL, IconChevR, IconX, IconClock, IconPlus, IconRepeat, IconBroom,
});
