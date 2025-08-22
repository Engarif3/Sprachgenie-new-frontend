import { Link } from "react-router-dom";
import ElectricBorder from "./ElectricBorder";

const HomeCard = ({ title, text, link }) => {
  return (
    <Link
      to={link}
      // className=" bg-gradient-to-r from-gray-900 via-slate-700 to-slate-400 w-96 h-[12rem] shadow-xl flex justify-center items-center rounded-xl  transition delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-105 "
      className=""
    >
      {/* <div className=" bg-gradient-to-r from-gray-900 via-slate-700 to-slate-400 w-96 md:w-80  h-[12rem] shadow-xl flex justify-start items-center rounded-xl transition delay-150 duration-300 ease-in-out hover:-translate-y-1 hover:scale-105 will-change-transform"> */}
      <ElectricBorder
        color="#FF0000"
        speed={1}
        chaos={0.5}
        thickness={4}
        style={{ borderRadius: 8 }}
      >
        {/* <div className="ml-12 h-24">
          <p style={{ margin: "6px 0 0", opacity: 0.8 }}>
            A glowing, animated border wrapper.
          </p>
        </div> */}
        <div className=" bg-gradient-to-r from-slate-900 via-cyan-800 to-cyan-600 w-96 md:w-80  h-[12rem] shadow-xl flex justify-start items-center rounded-xl transition delay-150 duration-300 ease-in-out  will-change-transform hover:animate-pulse px-8">
          <h2 className="text-green-500 text-2xl font-bold capitalize">
            {title}
          </h2>
          <p className=" text-white font-mono text-lg">{text}</p>
        </div>
      </ElectricBorder>
      ;
    </Link>
  );
};

export default HomeCard;

// CREDIT
// Component inspired by @BalintFerenczy on X
// https://codepen.io/BalintFerenczy/pen/KwdoyEN

<ElectricBorder
  color="#7df9ff"
  speed={1}
  chaos={0.5}
  thickness={2}
  style={{ borderRadius: 16 }}
>
  <div>
    <p style={{ margin: "6px 0 0", opacity: 0.8 }}>
      A glowing, animated border wrapper.
    </p>
  </div>
</ElectricBorder>;
