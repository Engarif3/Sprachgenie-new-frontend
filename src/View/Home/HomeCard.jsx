import React from "react";
import { Link } from "react-router-dom";

const HomeCard = ({ title, text, link }) => {
  return (
    <Link
      to={link}
      // className=" bg-gradient-to-r from-gray-900 via-slate-700 to-slate-400 w-96 h-[12rem] shadow-xl flex justify-center items-center rounded-xl  transition delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-105 "
      className=" bg-gradient-to-r from-gray-900 via-slate-700 to-slate-400 w-96 h-[12rem] shadow-xl flex justify-start items-center rounded-xl transition delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-105 will-change-transform"
    >
      <div className="ml-12">
        <h2 className="text-orange-600 text-2xl font-semibold font-mono ">
          {title}
        </h2>
        <p className=" text-white font-mono text-lg">{text}</p>
      </div>
    </Link>
  );
};

export default HomeCard;
