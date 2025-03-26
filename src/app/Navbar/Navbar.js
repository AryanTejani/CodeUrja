// In your layout or page component
import dynamic from 'next/dynamic';

// Import the Navbar component with SSR disabled
const Navbar = dynamic(() => import('./components/Navbar'), {
  ssr: false,
});

export default function Layout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  );
}
