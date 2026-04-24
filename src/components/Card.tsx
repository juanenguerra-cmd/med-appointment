import { ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'motion/react';

interface CardProps extends HTMLMotionProps<"div"> {
  children?: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function Card({ children, className = '', title, subtitle, actions, ...props }: CardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl border border-[#d6deeb] shadow-[0_6px_16px_rgba(11,42,111,.10)] overflow-hidden ${className}`}
      {...props}
    >
      {(title || subtitle || actions) && (
        <div className="px-5 py-4 border-b border-[#d6deeb] bg-[rgba(11,42,111,.03)] flex items-start justify-between gap-4">
          <div>
            {title && <h3 className="font-black text-slate-800 tracking-tight">{title}</h3>}
            {subtitle && <p className="text-sm text-slate-500 mt-0.5 font-medium">{subtitle}</p>}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      )}
      <div className="p-5 md:p-6">
        {children}
      </div>
    </motion.div>
  );
}
