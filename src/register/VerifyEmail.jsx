import { Link } from "react-router-dom";

const VerifyEmail = () => {
  return (
    <div className="text-center flex justify-center items-center min-h-screen">
      <div className="flex flex-col justify-center items-center gap-4">
        <h2 className="text-2xl">
          Please verify your email before logging in.
        </h2>{" "}
        <p className="mb-12">
          <Link
            to="/login"
            className=" font-semibold  text-lg btn  btn-primary"
          >
            Login
          </Link>
        </p>
        <p>Verification link expired? or invalid?</p>
        <p>
          <Link
            to="/resend-verification"
            className=" font-semibold  text-lg btn btn-sm btn-warning"
          >
            Resend Verification
          </Link>
        </p>
      </div>
    </div>
  );
};

export default VerifyEmail;
