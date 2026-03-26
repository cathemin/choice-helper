export function CatFace({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Head */}
      <path d="M20 55 Q20 85 50 85 Q80 85 80 55 Q80 35 50 35 Q20 35 20 55" />
      {/* Left ear */}
      <path d="M22 45 L15 20 L35 35" />
      {/* Right ear */}
      <path d="M78 45 L85 20 L65 35" />
      {/* Left eye */}
      <circle cx="35" cy="55" r="6" />
      <circle cx="35" cy="55" r="2" fill="currentColor" />
      {/* Right eye */}
      <circle cx="65" cy="55" r="6" />
      <circle cx="65" cy="55" r="2" fill="currentColor" />
      {/* Nose */}
      <path d="M47 65 L50 70 L53 65 Z" fill="currentColor" />
      {/* Mouth */}
      <path d="M50 70 Q45 75 40 73" />
      <path d="M50 70 Q55 75 60 73" />
      {/* Whiskers left */}
      <path d="M30 65 L10 60" />
      <path d="M30 68 L10 70" />
      <path d="M30 71 L10 80" />
      {/* Whiskers right */}
      <path d="M70 65 L90 60" />
      <path d="M70 68 L90 70" />
      <path d="M70 71 L90 80" />
    </svg>
  )
}

export function PawPrint({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 50 50"
      className={className}
      fill="currentColor"
    >
      {/* Main pad */}
      <ellipse cx="25" cy="32" rx="10" ry="8" />
      {/* Toe pads */}
      <ellipse cx="15" cy="18" rx="5" ry="4" />
      <ellipse cx="25" cy="14" rx="5" ry="4" />
      <ellipse cx="35" cy="18" rx="5" ry="4" />
    </svg>
  )
}

export function CatTail({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 120"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
    >
      <path d="M40 120 Q30 80 35 50 Q40 20 60 10 Q70 5 75 15" />
    </svg>
  )
}

export function FishTreat({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 40"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Fish body */}
      <path d="M15 20 Q25 8 45 10 Q60 12 55 20 Q60 28 45 30 Q25 32 15 20" />
      {/* Fish tail */}
      <path d="M55 20 Q65 10 75 8" />
      <path d="M55 20 Q65 30 75 32" />
      <path d="M75 8 Q70 20 75 32" />
      {/* Eye */}
      <circle cx="28" cy="18" r="3" fill="currentColor" />
      {/* Fin */}
      <path d="M40 12 Q45 5 38 10" />
      {/* Gill line */}
      <path d="M35 15 Q33 20 35 25" />
    </svg>
  )
}

export function SketchQuestionMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 80"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Question mark curve */}
      <path d="M10 20 Q10 8 20 8 Q32 8 32 20 Q32 32 20 38 Q20 45 20 50" />
      {/* Dot */}
      <circle cx="20" cy="62" r="4" fill="currentColor" />
    </svg>
  )
}

export function CatChasingButterfly({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 60"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Butterfly - animated floating */}
      <g className="animate-[flutter_2s_ease-in-out_infinite]">
        {/* Left wing */}
        <path d="M160 20 Q150 10 155 25 Q150 35 160 28" />
        {/* Right wing */}
        <path d="M160 20 Q170 10 165 25 Q170 35 160 28" />
        {/* Body */}
        <path d="M160 18 L160 32" strokeWidth="1.5" />
        {/* Antennae */}
        <path d="M160 18 Q157 12 155 10" strokeWidth="1" />
        <path d="M160 18 Q163 12 165 10" strokeWidth="1" />
      </g>
      
      {/* Running cat - animated bouncing */}
      <g className="animate-[bounce_0.5s_ease-in-out_infinite]">
        {/* Cat body - stretched running pose */}
        <path d="M40 35 Q60 30 80 35 Q95 38 100 42" />
        {/* Head */}
        <circle cx="105" cy="38" r="10" />
        {/* Ears */}
        <path d="M100 30 L97 22 L102 28" />
        <path d="M110 30 L113 22 L108 28" />
        {/* Eyes - focused on butterfly */}
        <circle cx="103" cy="36" r="1.5" fill="currentColor" />
        <circle cx="109" cy="36" r="1.5" fill="currentColor" />
        {/* Nose */}
        <path d="M106 40 L105 42 L107 42 Z" fill="currentColor" />
        {/* Front legs - running */}
        <path d="M85 38 Q88 50 92 55" />
        <path d="M75 38 Q80 48 78 55" />
        {/* Back legs - pushing off */}
        <path d="M45 38 Q40 50 35 55" />
        <path d="M55 40 Q48 52 50 55" />
        {/* Tail - up and curved excitedly */}
        <path d="M40 35 Q25 30 20 20 Q18 15 22 12" />
      </g>
      
      {/* Motion lines */}
      <g className="text-muted-foreground" strokeWidth="1">
        <path d="M10 35 L18 35" className="animate-[dash_0.8s_linear_infinite]" />
        <path d="M5 40 L15 40" className="animate-[dash_0.8s_linear_infinite_0.2s]" />
        <path d="M8 45 L16 45" className="animate-[dash_0.8s_linear_infinite_0.4s]" />
      </g>
    </svg>
  )
}

export function CatWand({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 50"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Stick */}
      <path d="M5 45 L55 15" />
      {/* String */}
      <path d="M55 15 Q60 20 65 18 Q72 15 70 22" />
      {/* Feather/toy */}
      <path d="M70 22 Q75 18 78 22 Q80 28 75 30 Q70 32 68 28 Q65 25 70 22" fill="currentColor" />
      <path d="M68 28 Q63 35 60 32" />
      <path d="M70 30 Q68 38 72 35" />
      {/* Handle grip */}
      <path d="M5 45 L8 42" />
      <path d="M10 48 L13 45" />
    </svg>
  )
}
