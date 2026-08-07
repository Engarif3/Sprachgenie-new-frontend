const Container = ({ children }) => {
  return (
    <div className="w-full mx-auto px-1 md:px-4 lg:px-8 xl:px-16 2xl:px-24">
      {children}
    </div>
  );
};

export default Container;
