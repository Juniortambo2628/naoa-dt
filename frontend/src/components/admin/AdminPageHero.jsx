import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

/**
 * AdminPageHero — consistent page header for all admin dashboard pages.
 *
 * @param {string}   title        - Page title (required)
 * @param {string}   [description] - Optional subtitle / summary text
 * @param {string|Array} [breadcrumb] - Either just the current page label (string), or full array of { label, path? } objects. Dashboard entry is auto-prepended.
 * @param {ReactNode} [actions]    - Optional action buttons rendered on the right
 * @param {ReactNode} [icon]       - Optional icon element rendered before the title
 */
export default function AdminPageHero({ title, description, breadcrumb, icon }) {
  const crumbs = Array.isArray(breadcrumb)
    ? breadcrumb
    : [{ label: 'Dashboard', path: '/admin/dashboard' }, { label: breadcrumb || title }];
  return (
    <div className="my-8">
      {/* Breadcrumb */}
      {crumbs && crumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-sm mb-3">
          {crumbs.map((crumb, idx) => {
            const isLast = idx === crumbs.length - 1;
            return (
              <span key={idx} className="flex items-center gap-1.5">
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-stone-300" />}
                {crumb.path && !isLast ? (
                  <Link
                    to={crumb.path}
                    className="text-stone-400 hover:text-[#A67B5B] transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={isLast ? 'text-stone-700 font-medium' : 'text-stone-400'}>
                    {crumb.label}
                  </span>
                )}
              </span>
            );
          })}
        </nav>
      )}

      {/* Title Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {icon && (
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(166, 123, 91, 0.1)' }}
            >
              {icon}
            </div>
          )}
          <div>
            <h1
              className="text-2xl md:text-3xl font-semibold"
              style={{ color: '#4A3F35' }}
            >
              {title}
            </h1>
            {description && (
              <p className="text-sm mt-0.5" style={{ color: '#8B7B6B' }}>
                {description}
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
