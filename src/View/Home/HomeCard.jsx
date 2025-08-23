import { Link } from "react-router-dom";
// import TargetCursor from "./TargetCursor ";

const HomeCard = ({ title, text, link }) => {
  return (
    <>
      {/* <TargetCursor spinDuration={2} hideDefaultCursor={true} /> */}
      <Link
        to={link}
        // className=" bg-gradient-to-r from-gray-900 via-slate-700 to-slate-400 w-96 h-[12rem] shadow-xl flex justify-center items-center rounded-xl  transition delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-105 "
        className="border-2 border-sky-800 rounded-2xl p-2 cursor-target"
      >
        {/* <div className=" bg-gradient-to-r from-gray-900 via-slate-700 to-slate-400 w-96 md:w-80  h-[12rem] shadow-xl flex justify-start items-center rounded-xl transition delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-105 will-change-transform"> */}
        <div className=" bg-gradient-to-r from-slate-900 via-cyan-800 to-cyan-600 w-96 md:w-80  h-[12rem] shadow-xl flex justify-start items-center rounded-xl transition delay-150 duration-300 ease-in-out  will-change-transform hover:animate-pulse">
          <div className="ml-12 h-24">
            <h2 className="text-green-500 text-2xl font-bold capitalize">
              {title}
            </h2>
            <p className=" text-white font-mono text-lg">{text}</p>
          </div>
        </div>
      </Link>
    </>
  );
};

export default HomeCard;
