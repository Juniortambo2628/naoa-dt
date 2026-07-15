import { motion } from 'framer-motion';

/**
 * AdminPageLayout — standardized vertical layout for all admin dashboard pages.
 *
 * Order:
 *   1. Hero section (title, breadcrumb, description)
 *   2. Summary / overview cards (optional)
 *   3. Search / filter toolbar (optional)
 *   4. Page content
 *
 * @param {ReactNode} hero     - AdminPageHero element
 * @param {ReactNode} summary  - AdminSummaryCards element (optional)
 * @param {ReactNode} toolbar  - AdminToolbar element (optional)
 * @param {ReactNode} children - Main page content
 */
export default function AdminPageLayout({ hero, summary, toolbar, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-8 pb-8"
    >
      {hero}

      {summary}

      {toolbar}

      {children}
    </motion.div>
  );
}
