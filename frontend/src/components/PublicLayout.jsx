import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

/**
 * Shared chrome for the public-facing pages. Renders the Navbar and Footer
 * once around the routed page content (via <Outlet/>), so individual pages no
 * longer import or render them themselves.
 *
 * Pages with a bespoke full-screen layout (e.g. the FAQ panel) and the
 * guest-only invitation view intentionally render outside this layout.
 */
export default function PublicLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
    </>
  );
}
