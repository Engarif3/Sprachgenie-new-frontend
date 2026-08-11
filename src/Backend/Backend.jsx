import { IoLockClosedOutline, IoKeyOutline } from "react-icons/io5";

const Backend = () => {
  return (
    <div className="min-h-screen bg-sky-700 flex justify-center items-center text-2xl text-white p-4 text-center">
      <h2 className="flex flex-col items-center gap-2">
        <span className="flex items-center gap-2">
          <IoLockClosedOutline aria-hidden="true" />
          The backend repository is private for security reasons.
        </span>
        <span className="flex items-center gap-2">
          <IoKeyOutline aria-hidden="true" />
          Access is available upon request.
        </span>
      </h2>
    </div>
  );
};

export default Backend;
