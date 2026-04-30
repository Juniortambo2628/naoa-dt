import { motion } from 'framer-motion';

export const Skeleton = ({ 
  variant = 'text', 
  width, 
  height, 
  className = '', 
  style = {},
  as = 'div'
}) => {
  const Component = motion[as];
  
  const baseStyle = {
    background: 'linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 50%, #F3F4F6 75%)',
    backgroundSize: '200% 100%',
    display: as === 'span' ? 'inline-block' : 'block',
    ...style
  };

  const variants = {
    text: 'h-4 w-full rounded',
    circle: 'rounded-full',
    image: 'w-full aspect-video rounded-xl',
  };

  return (
    <Component
      animate={{ 
        backgroundPosition: ['100% 0', '-100% 0'] 
      }}
      transition={{ 
        duration: 1.5, 
        repeat: Infinity, 
        ease: "linear" 
      }}
      className={`animate-pulse ${variants[variant] || ''} ${className}`}
      style={{ 
        ...baseStyle,
        width: width || (variant === 'circle' ? '50px' : 'auto'),
        height: height || (variant === 'circle' ? '50px' : 'auto'),
      }}
    />
  );
};

export const CardSkeleton = () => (
  <div className="p-4 bg-white/50 rounded-2xl border border-stone-100 space-y-3">
    <Skeleton variant="image" height="150px" />
    <Skeleton variant="text" width="60%" />
    <Skeleton variant="text" width="40%" />
  </div>
);

export const TimelineSkeleton = () => (
  <div className="flex gap-6 mb-8">
    <Skeleton variant="circle" width="64px" height="64px" className="shrink-0" />
    <div className="flex-1 space-y-3 p-6 bg-white/50 rounded-2xl border border-stone-100">
      <Skeleton variant="text" width="30%" />
      <Skeleton variant="text" width="70%" height="24px" />
      <Skeleton variant="text" width="90%" />
    </div>
  </div>
);

export const MessageSkeleton = () => (
  <div className="flex gap-4 mb-6">
    <Skeleton variant="circle" width="56px" height="56px" className="shrink-0" />
    <div className="flex-1 space-y-2 p-5 bg-white/50 rounded-2xl rounded-tl-none border border-stone-100">
        <Skeleton variant="text" width="40%" />
        <Skeleton variant="text" width="90%" height="60px" />
    </div>
  </div>
);
