// import { Outlet, useLocation } from "react-router-dom";
// import NavBar from "./navbar/NavBar";
// import Footer from "./footer/Footer";
// import ScrollToTop from "./ScrollToTop";
// import DarkVeil from "./View/Home/DarkVeil";

// const App = () => {
//   const location = useLocation();

//   const noHeaderFooter =
//     location.pathname.includes("login") || location.pathname.includes("signup");

//   return (
//     <div className="relative min-h-screen">
//       {/* DarkVeil fullscreen background */}
//       <div className="fixed inset-0 -z-10">
//         <DarkVeil />
//       </div>

//       {/* Page content */}
//       <ScrollToTop />
//       {!noHeaderFooter && <NavBar />}
//       <Outlet />
//       {!noHeaderFooter && <Footer />}
//     </div>
//   );
// };

// export default App;

import { Outlet, useLocation } from "react-router-dom";
import { Suspense } from "react";
import NavBar from "./navbar/NavBar";
import Footer from "./footer/Footer";
import ScrollToTop from "./ScrollToTop";
import DarkVeil from "./View/Home/DarkVeil";

const App = () => {
  const location = useLocation();

  const noHeaderFooter =
    location.pathname.includes("login") || location.pathname.includes("signup");

  return (
    <div className="relative min-h-screen">
      {/* DarkVeil fullscreen background */}
      <div className="fixed inset-0 -z-10">
        <DarkVeil />
      </div>

      <ScrollToTop />

      {!noHeaderFooter && <NavBar />}

      {/* Suspense here so lazy-loaded routes work */}
      <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
        <Outlet />
      </Suspense>

      {!noHeaderFooter && <Footer />}
    </div>
  );
};

export default App;
