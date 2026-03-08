import { Children, useLayoutEffect, useRef, useCallback } from "react";

export const ScrollStackItem = ({ children, itemClassName = "" }) => (
  <div
    className={`scroll-stack-card relative w-full h-[22rem] my-8 p-12 pb-14 rounded-[40px] shadow-[0_0_30px_rgba(0,0,0,0.1)] origin-top will-change-transform ${itemClassName}`}
    style={{
      transform: "translate3d(0,0,0)",
      backfaceVisibility: "hidden",
      willChange: "transform",
    }}
  >
    {children}
  </div>
);

const ScrollStack = ({
  children,
  className = "",
  itemDistance = 120,
  itemScale = 0.04,
  itemStackDistance = 40,
  stackPosition = 0.2,
  scaleEndPosition = 0.1,
  baseScale = 0.85,
  useWindowScroll = true,
}) => {
  const scrollerRef = useRef(null);
  const innerRef = useRef(null);
  const endRef = useRef(null);
  const cardsRef = useRef([]);
  const rafRef = useRef(null);
  const tickingRef = useRef(false);
  const measurementsRef = useRef({ cardTops: [], endTop: 0 });
  const cardCount = Children.count(children);
  const releasePadding = `${Math.max(42, cardCount * 7)}rem`;

  // ---------- helpers ----------

  const getScrollTop = useCallback(() => {
    if (useWindowScroll) {
      return window.scrollY;
    }

    return scrollerRef.current?.scrollTop ?? 0;
  }, [useWindowScroll]);

  const clamp01 = (v) => Math.max(0, Math.min(1, v));

  const measureLayout = useCallback(() => {
    const cards = cardsRef.current;
    const inner = innerRef.current;
    const endEl = endRef.current;
    if (!cards.length) return;

    if (useWindowScroll) {
      const innerTop = inner
        ? inner.getBoundingClientRect().top + window.scrollY
        : 0;

      measurementsRef.current = {
        cardTops: cards.map((card) => innerTop + card.offsetTop),
        endTop: endEl ? innerTop + endEl.offsetTop : 0,
      };
      return;
    }

    measurementsRef.current = {
      cardTops: cards.map((card) => card.offsetTop),
      endTop: endEl ? endEl.offsetTop : 0,
    };
  }, [useWindowScroll]);

  // ---------- main update ----------

  const update = useCallback(() => {
    const cards = cardsRef.current;
    if (!cards.length) return;

    const scrollTop = getScrollTop();
    const vh = useWindowScroll
      ? window.innerHeight
      : (scrollerRef.current?.clientHeight ?? window.innerHeight);

    const stackPx = vh * stackPosition;
    const scaleEndPx = vh * scaleEndPosition;
    const { cardTops, endTop } = measurementsRef.current;

    cards.forEach((card, i) => {
      const top = cardTops[i] ?? 0;

      const triggerStart = top - stackPx - i * itemStackDistance;
      const triggerEnd = top - scaleEndPx;

      const pinStart = triggerStart;
      const pinEnd = endTop - vh / 2;

      const progress = clamp01(
        (scrollTop - triggerStart) / (triggerEnd - triggerStart),
      );

      const targetScale = baseScale + i * itemScale;
      const scale = 1 - progress * (1 - targetScale);

      let y = 0;

      if (scrollTop >= pinStart && scrollTop <= pinEnd) {
        y = scrollTop - top + stackPx + i * itemStackDistance;
      } else if (scrollTop > pinEnd) {
        y = pinEnd - top + stackPx + i * itemStackDistance;
      }

      card.style.transform = `translate3d(0, ${y}px, 0) scale(${scale})`;
    });
  }, [
    getScrollTop,
    itemScale,
    itemStackDistance,
    stackPosition,
    scaleEndPosition,
    baseScale,
    useWindowScroll,
  ]);

  const scheduleUpdate = useCallback(() => {
    if (tickingRef.current) return;

    tickingRef.current = true;
    rafRef.current = requestAnimationFrame(() => {
      tickingRef.current = false;
      update();
    });
  }, [update]);

  // ---------- init ----------

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    const inner = innerRef.current;
    const cards = Array.from(
      useWindowScroll
        ? (scroller?.querySelectorAll(".scroll-stack-card") ?? [])
        : (scroller?.querySelectorAll(".scroll-stack-card") ?? []),
    );

    cardsRef.current = cards;

    cards.forEach((c, i) => {
      if (i < cards.length - 1) {
        c.style.marginBottom = `${itemDistance}px`;
      }

      c.style.willChange = "transform";
      c.style.transform = "translate3d(0,0,0)";
      c.style.backfaceVisibility = "hidden";
    });

    const scrollTarget = useWindowScroll ? window : scroller;

    const handleScroll = () => {
      scheduleUpdate();
    };

    const handleResize = () => {
      measureLayout();
      scheduleUpdate();
    };

    const handleWindowLoad = () => {
      measureLayout();
      scheduleUpdate();
    };

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            measureLayout();
            scheduleUpdate();
          })
        : null;

    measureLayout();
    update();

    scrollTarget?.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);
    window.addEventListener("load", handleWindowLoad);

    if (resizeObserver) {
      if (scroller) resizeObserver.observe(scroller);
      if (inner) resizeObserver.observe(inner);
      cards.forEach((card) => resizeObserver.observe(card));
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      resizeObserver?.disconnect();

      scrollTarget?.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("load", handleWindowLoad);
    };
  }, [itemDistance, measureLayout, scheduleUpdate, update, useWindowScroll]);

  return (
    <div
      ref={scrollerRef}
      className={`relative w-full ${className}`}
      style={{
        transform: "translate3d(0,0,0)",
        willChange: "transform",
      }}
    >
      <div
        ref={innerRef}
        className="scroll-stack-inner px-20 pt-[20vh]"
        style={{ paddingBottom: releasePadding }}
      >
        {children}
        <div ref={endRef} className="scroll-stack-end h-px w-full" />
      </div>
    </div>
  );
};

export default ScrollStack;
