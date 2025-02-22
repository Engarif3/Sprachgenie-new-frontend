import Container from "../utils/Container";

const Footer = () => {
  return (
    <Container>
      <footer className="footer footer-center bg-base-300 text-base-content ">
        <aside>
          <p>
            Copyright © {new Date().getFullYear()} - All right reserved by{" "}
            <span className="text-cyan-800 font-semibold mr-4">
              Md Arifur Rahman
            </span>
            . Email:{" "}
            <span className="text-cyan-800 font-semibold">
              arif.aust.eng@gmail.com
            </span>
          </p>
        </aside>
      </footer>
    </Container>
  );
};

export default Footer;
