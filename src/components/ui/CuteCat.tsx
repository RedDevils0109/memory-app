type Mood = "happy" | "sad" | "sleep" | "love";

export function CuteCat({ mood = "happy", className = "" }: { mood?: Mood; className?: string }) {
  const line = "#5A2A3A";
  return (
    <svg viewBox="0 0 120 110" className={className} aria-hidden>
      <path d="M22 44 L26 10 L50 28 Z" fill="#fff" stroke={line} strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M98 44 L94 10 L70 28 Z" fill="#fff" stroke={line} strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M29 36 L31 19 L44 29 Z" fill="#FF8FAB" />
      <path d="M91 36 L89 19 L76 29 Z" fill="#FF8FAB" />
      <ellipse cx="60" cy="60" rx="46" ry="38" fill="#fff" stroke={line} strokeWidth="3.5" />
      {mood === "sleep" ? (
        <>
          <path d="M34 56 q8 7 16 0" fill="none" stroke={line} strokeWidth="3.5" strokeLinecap="round" />
          <path d="M70 56 q8 7 16 0" fill="none" stroke={line} strokeWidth="3.5" strokeLinecap="round" />
        </>
      ) : mood === "sad" ? (
        <>
          <path d="M33 52 l14 6" stroke={line} strokeWidth="3.5" strokeLinecap="round" />
          <path d="M87 52 l-14 6" stroke={line} strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="41" cy="61" r="4.5" fill={line} />
          <circle cx="79" cy="61" r="4.5" fill={line} />
        </>
      ) : mood === "love" ? (
        <>
          <path d="M41 64 c-9-6-9-14-3-14 c3 0 3 3 3 3 c0 0 0-3 3-3 c6 0 6 8-3 14z" fill="#FF5D8F" />
          <path d="M79 64 c-9-6-9-14-3-14 c3 0 3 3 3 3 c0 0 0-3 3-3 c6 0 6 8-3 14z" fill="#FF5D8F" />
        </>
      ) : (
        <>
          <ellipse cx="41" cy="57" rx="5" ry="6.5" fill={line} />
          <ellipse cx="79" cy="57" rx="5" ry="6.5" fill={line} />
          <circle cx="43" cy="54" r="1.8" fill="#fff" />
          <circle cx="81" cy="54" r="1.8" fill="#fff" />
        </>
      )}
      <ellipse cx="28" cy="70" rx="7" ry="4.5" fill="#FF8FAB" opacity="0.6" />
      <ellipse cx="92" cy="70" rx="7" ry="4.5" fill="#FF8FAB" opacity="0.6" />
      <path d="M56 66 h8 l-4 4 z" fill="#FF5D8F" />
      {mood === "sad" ? (
        <path d="M52 78 q8 -6 16 0" fill="none" stroke={line} strokeWidth="3" strokeLinecap="round" />
      ) : (
        <path d="M52 72 q4 5 8 0 q4 5 8 0" fill="none" stroke={line} strokeWidth="3" strokeLinecap="round" />
      )}
      <path d="M14 62 l-12 -3 M14 69 l-12 2 M106 62 l12 -3 M106 69 l12 2" stroke={line} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
