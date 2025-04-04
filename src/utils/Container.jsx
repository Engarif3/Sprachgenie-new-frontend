const Container = ({ children }) => {
  return (
    <div className="w-full max-w-screen mx-auto px-1 md:px-8 lg:px-24">
      {children}
    </div>
  );
};

export default Container;
