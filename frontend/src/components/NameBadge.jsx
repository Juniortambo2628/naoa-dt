import { motion } from 'framer-motion';
import { User } from 'lucide-react';

const BADGE_STYLES = {
  family: {
    gradient: 'from-rose-400 to-rose-500',
    shadow: 'shadow-rose-200',
    accent: 'bg-rose-100 text-rose-600',
  },
  friends: {
    gradient: 'from-blue-400 to-blue-500',
    shadow: 'shadow-blue-200',
    accent: 'bg-blue-100 text-blue-600',
  },
  colleagues: {
    gradient: 'from-emerald-400 to-emerald-500',
    shadow: 'shadow-emerald-200',
    accent: 'bg-emerald-100 text-emerald-600',
  },
  vip: {
    gradient: 'from-amber-400 to-amber-500',
    shadow: 'shadow-amber-200',
    accent: 'bg-amber-100 text-amber-600',
  },
  default: {
    gradient: 'from-[#A67B5B] to-[#C8A68E]',
    shadow: 'shadow-[#A67B5B]/20',
    accent: 'bg-stone-100 text-stone-600',
  },
};

function getBadgeStyle(group) {
  return BADGE_STYLES[group?.toLowerCase()] || BADGE_STYLES.default;
}

export default function NameBadge({ guest, showTable = true, size = 'normal', animate = true }) {
  const style = getBadgeStyle(guest?.group);
  const firstName = guest?.name?.split(' ')[0] || 'Guest';
  
  const sizeClasses = {
    small: 'w-16 h-20',
    normal: 'w-24 h-28',
    large: 'w-32 h-36',
  };

  const textClasses = {
    small: 'text-xs',
    normal: 'text-sm',
    large: 'text-base',
  };

  const MotionWrapper = animate ? motion.div : 'div';
  const animationProps = animate ? {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    whileHover: { y: -4, scale: 1.05 },
  } : {};

  return (
    <MotionWrapper
      {...animationProps}
      className={`${sizeClasses[size]} flex flex-col items-center`}
    >
      {/* Badge card */}
      <div className={`
        relative w-full h-full rounded-2xl overflow-hidden
        bg-white border border-stone-100
        ${style.shadow} shadow-lg
        flex flex-col items-center justify-center
        transform transition-transform
      `}>
        {/* Header accent */}
        <div className={`absolute top-0 left-0 right-0 h-8 bg-gradient-to-r ${style.gradient}`} />
        
        {/* Avatar */}
        <div className={`
          relative z-10 w-12 h-12 rounded-full bg-white
          flex items-center justify-center
          shadow-md mt-2
        `}>
          {guest?.avatar_url ? (
            <img 
              src={guest.avatar_url} 
              alt={firstName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <User className="w-6 h-6 text-stone-400" />
          )}
        </div>

        {/* Name */}
        <div className="relative z-10 mt-2 text-center px-2">
          <p className={`font-semibold text-stone-800 ${textClasses[size]} leading-tight`}>
            {firstName}
          </p>
          {guest?.group && size !== 'small' && (
            <span className={`
              inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-medium
              ${style.accent}
            `}>
              {guest.group}
            </span>
          )}
        </div>

        {/* Table number */}
        {showTable && guest?.table_name && (
          <div className="absolute bottom-2 left-0 right-0 text-center">
            <span className="text-[9px] text-stone-400">
              Table {guest.table_name}
            </span>
          </div>
        )}
      </div>
    </MotionWrapper>
  );
}

export function NameBadgeCompact({ guest }) {
  const style = getBadgeStyle(guest?.group);
  const firstName = guest?.name?.split(' ')[0] || 'Guest';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="inline-flex items-center gap-2 bg-white rounded-full pl-1 pr-3 py-1 shadow-sm border border-stone-100"
    >
      <div className={`
        w-7 h-7 rounded-full bg-gradient-to-r ${style.gradient}
        flex items-center justify-center text-white text-xs font-bold
      `}>
        {firstName.charAt(0).toUpperCase()}
      </div>
      <span className="text-sm font-medium text-stone-700">{firstName}</span>
      {guest?.table_name && (
        <span className="text-[10px] text-stone-400">T{guest.table_name}</span>
      )}
    </motion.div>
  );
}
