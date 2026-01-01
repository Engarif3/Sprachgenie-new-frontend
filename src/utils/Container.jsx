const Container = ({ children }) => {
  return (
    // <div className="w-full max-w-screen mx-auto px-1 md:px-8 lg:px-24">
    <div className="mx-auto w-full max-w-[1440px] px-4">{children}</div>
  );
};

export default Container;
