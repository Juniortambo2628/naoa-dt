import { Loader2 } from 'lucide-react';

const sizes = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

export default function Spinner({ size = 'md', className = '' }) {
  return (
    <Loader2 className={`animate-spin text-[#A67B5B] ${sizes[size]} ${className}`} />
  );
}
