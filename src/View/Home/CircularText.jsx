// CircularText.jsx
import { useEffect } from "react";
import { motion, useAnimation, useMotionValue } from "motion/react";

// Rotation helper functions
const getRotationTransition = (duration, from, loop = true) => ({
  from,
  to: from + 360,
  ease: "linear",
  duration,
  type: "tween",
  repeat: loop ? Infinity : 0,
});

const getTransition = (duration, from) => ({
  rotate: getRotationTransition(duration, from),
  scale: {
    type: "spring",
    damping: 20,
    stiffness: 300,
  },
});

const CircularText = ({
  text,
  spinDuration = 20,
  onHover = "speedUp",
  className = "",
}) => {
  const words = text.split("*").filter(Boolean); // Split by * and remove empty
  const wordColors = ["text-red-500", "text-yellow-400", "text-green-400"]; // PRACTICE, MAKES, PERFECT
  const lettersWithColor = words.flatMap((word, idx) =>
    Array.from(word).map((letter) => ({
      letter,
      color: wordColors[idx % wordColors.length],
    }))
  );

  const controls = useAnimation();
  const rotation = useMotionValue(0);

  useEffect(() => {
    const start = rotation.get();
    controls.start({
      rotate: start + 360,
      scale: 1,
      transition: getTransition(spinDuration, start),
    });
  }, [spinDuration, controls, rotation]);

  const handleHoverStart = () => {
    const start = rotation.get();
    if (!onHover) return;

    let transitionConfig;
    let scaleVal = 1;

    switch (onHover) {
      case "slowDown":
        transitionConfig = getTransition(spinDuration * 2, start);
        break;
      case "speedUp":
        transitionConfig = getTransition(spinDuration / 4, start);
        break;
      case "pause":
        transitionConfig = {
          rotate: { type: "spring", damping: 20, stiffness: 300 },
          scale: { type: "spring", damping: 20, stiffness: 300 },
        };
        scaleVal = 1;
        break;
      case "goBonkers":
        transitionConfig = getTransition(spinDuration / 20, start);
        scaleVal = 0.8;
        break;
      default:
        transitionConfig = getTransition(spinDuration, start);
    }

    controls.start({
      rotate: start + 360,
      scale: scaleVal,
      transition: transitionConfig,
    });
  };

  const handleHoverEnd = () => {
    const start = rotation.get();
    controls.start({
      rotate: start + 360,
      scale: 1,
      transition: getTransition(spinDuration, start),
    });
  };

  return (
    <motion.div
      //   className={`m-0 mx-auto rounded-full w-[200px] h-[200px] relative font-black text-center cursor-pointer origin-center ${className}`}
      className={`m-0 rounded-full w-[200px] h-[200px] relative font-black text-center cursor-pointer origin-center hidden md:block lg:block ${className}`}
      style={{ rotate: rotation }}
      initial={{ rotate: 0 }}
      animate={controls}
      onMouseEnter={handleHoverStart}
      onMouseLeave={handleHoverEnd}
    >
      {lettersWithColor.map((item, i) => {
        const rotationDeg = (360 / lettersWithColor.length) * i;
        const factor = Math.PI / lettersWithColor.length;
        const x = factor * i;
        const y = factor * i;
        const transform = `rotateZ(${rotationDeg}deg) translate3d(${x}px, ${y}px, 0)`;

        return (
          <span
            key={i}
            className={`absolute inline-block inset-0 text-2xl transition-all duration-500 ease-[cubic-bezier(0,0,0,1)] ${item.color}`}
            style={{ transform, WebkitTransform: transform }}
          >
            {item.letter}
          </span>
        );
      })}
    </motion.div>
  );
};

export default CircularText;
