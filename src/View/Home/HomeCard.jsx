import React from "react";
import { Link } from "react-router-dom";

const HomeCard = ({ title, text, link }) => {
  return (
    <Link
      to={link}
      className=" bg-gradient-to-r from-gray-900 via-slate-700 to-slate-400 w-96 h-[12rem] shadow-xl flex justify-center items-center rounded-xl"
    >
      <div>
        <h2 className="text-orange-600 text-2xl font-semibold font-mono ">
          {title}
        </h2>
        <p className=" text-white font-mono text-lg">{text}</p>
      </div>
    </Link>
  );
};

export default HomeCard;
