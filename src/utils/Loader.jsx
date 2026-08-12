import { ScaleLoader } from "react-spinners";
const Loader = ({ loading }) => {
  return (
    <p className="flex min-h-screen items-center justify-center">
      <span>
        <ScaleLoader
          color="#36d7b7"
          loading={loading}
          // cssOverride={override}
          size={150}
          aria-label="Loading Spinner"
          data-testid="loader"
        />
      </span>
    </p>
  );
};

export default Loader;
