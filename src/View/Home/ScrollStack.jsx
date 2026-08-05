import { Children, cloneElement, isValidElement } from "react";

export const ScrollStackItem = ({ children, itemClassName = "", style }) => (
  <div
    className={`scroll-stack-card relative w-full h-[22rem] my-8 p-12 pb-14 rounded-[40px] shadow-[0_0_30px_rgba(0,0,0,0.1)] origin-top will-change-transform ${itemClassName}`}
    style={{
      transform: "translate3d(0,0,0)",
      backfaceVisibility: "hidden",
      willChange: "transform",
      ...style,
    }}
  >
    {children}
  </div>
);

const ScrollStack = ({
  children,
  className = "",
  layoutVersion,
  itemDistance = 120,
  itemScale = 0.04,
  itemStackDistance = 40,
  stackPosition = 0.2,
  scaleEndPosition = 0.1,
  baseScale = 0.85,
  useWindowScroll = true,
}) => {
  const childArray = Children.toArray(children);
  const stackTop = `${Math.round(stackPosition * 100)}vh`;
  const stickyChildren = childArray.map((child, index) => {
    const scale = Math.min(1, baseScale + index * itemScale);
    const stickyTop = `calc(${stackTop} + ${index * itemStackDistance}px)`;

    const childWithScale = isValidElement(child)
      ? cloneElement(child, {
          style: {
            ...(child.props.style || {}),
            position: "sticky",
            top: stickyTop,
            zIndex: index + 1,
            marginBottom:
              index === childArray.length - 1 ? 0 : `${itemDistance}px`,
            transform: `translate3d(0,0,0) scale(${scale})`,
            transformOrigin: "top center",
          },
        })
      : child;

    return childWithScale;
  });

  return (
    <div className={`relative w-full ${className}`}>
      <div
        key={layoutVersion || "stack"}
        className="scroll-stack-inner px-4 pt-[20vh] md:px-10 lg:px-20"
      >
        {stickyChildren}
        <div className="scroll-stack-end h-px w-full" />
      </div>
    </div>
  );
};

export default ScrollStack;
