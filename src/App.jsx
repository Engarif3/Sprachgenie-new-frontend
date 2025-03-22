import { Outlet, useLocation } from "react-router-dom";
import NavBar from "./navbar/NavBar";
import Footer from "./footer/Footer";
import Container from "./utils/Container";
import ScrollToTop from "./ScrollToTop";

const App = () => {
  const location = useLocation();

  const noHeaderFooter =
    location.pathname.includes("login") || location.pathname.includes("signup");

  return (
    <>
      <ScrollToTop />
      {noHeaderFooter || <NavBar />}
      <Outlet />
      {noHeaderFooter || <Footer />}
    </>
  );
};

export default App;
