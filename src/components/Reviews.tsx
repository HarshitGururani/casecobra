/* eslint-disable @next/next/no-img-element */
"use client";
import React, { HtmlHTMLAttributes, useEffect, useRef, useState } from "react";
import MaxWidthWrapper from "./MaxWidthWrapper";
import { useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import Phone from "./Phone";
const PHONES = [
  "/testimonials/1.jpg",
  "/testimonials/2.jpg",
  "/testimonials/3.jpg",
  "/testimonials/4.jpg",
  "/testimonials/5.jpg",
  "/testimonials/6.jpg",
];

function splitArray<T>(arr: Array<T>, numParts: number) {
  const results: Array<Array<T>> = [];

  for (let i = 0; i < arr.length; i++) {
    const index = i % numParts;

    if (!results[index]) {
      results[index] = [];
    }
    results[index].push(arr[i]);
  }

  return results;
}

function ReviewColumn({
  reviews,
  className,
  reviewClassName,
  msPerPixel = 0,
}: {
  reviews: string[];
  className?: string;
  reviewClassName?: (reviewIndex: number) => string;
  msPerPixel?: number;
}) {
  const columRef = useRef<HTMLDivElement | null>(null);
  const [columnHeight, setColumnHeight] = useState(0);
  const duration = `${columnHeight * msPerPixel}ms`;
  useEffect(() => {
    if (!columRef.current) return;

    const resizeObserver = new window.ResizeObserver(() => {
      setColumnHeight(columRef.current?.offsetHeight ?? 0);
    });

    resizeObserver.observe(columRef.current);

    return () => {
      resizeObserver.disconnect;
    };
  }, []);

  return (
    <div
      ref={columRef}
      className={cn("animate-marquee space-y-8 py-4", className)}
      style={{ "--marquee-duration": duration } as React.CSSProperties}
    >
      {reviews.concat(reviews).map((imgSrc, reviewIndex) => (
        <Review
          key={reviewIndex}
          className={reviewClassName?.(reviewIndex % reviews.length)}
          imgSrc={imgSrc}
        />
      ))}
    </div>
  );
}

interface ReviewProps extends HtmlHTMLAttributes<HTMLDivElement> {
  imgSrc: string;
}

const POSSIBLE_ANIMATION_DELAYS = [
  "0s",
  "0.1s",
  "0.2s",
  "0.3s",
  "0.4s",
  "0.5s",
];

const animationDelay =
  POSSIBLE_ANIMATION_DELAYS[
    Math.floor(Math.random() * POSSIBLE_ANIMATION_DELAYS.length)
  ];

function Review({ imgSrc, className, ...props }: ReviewProps) {
  return (
    <div
      className={cn(
        "animate-fade-in rounded-[2.25rem] bg-white p-6 opacity-0 shadow-xl shadow-slate-900/5",
        className
      )}
      style={{ animationDelay }}
      {...props}
    >
      <Phone imgSrc={imgSrc} />
    </div>
  );
}

function ReviewGrid() {
  const containeRef = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(containeRef, { once: true, amount: 0.4 });
  const columns = splitArray(PHONES, 3);
  const column1 = columns[0];
  const columns2 = columns[1];
  const columns3 = splitArray(columns[2], 2);
  return (
    <div
      ref={containeRef}
      className="relative -mx-4 grid grid-cols-1 h-[49rem] max-h-[150vh] items-start gap-8 overflow-hidden px-4 sm:mt-20 md:grid-cols-2 lg:grid-cols-3"
    >
      {isInView ? (
        <>
          <ReviewColumn
            reviews={[...column1, ...columns3.flat(), ...columns2]}
            reviewClassName={(reviewIndex) =>
              cn({
                "md:hidden": reviewIndex >= column1.length + columns3[0].length,
                "lg:hidden": reviewIndex >= column1.length,
              })
            }
            msPerPixel={10}
          />
          <ReviewColumn
            reviews={[...columns2, ...columns3[1]]}
            className="hidden md:block"
            reviewClassName={(reviewIndex) =>
              reviewIndex >= columns2.length ? "lg:hidden" : ""
            }
            msPerPixel={15}
          />
          <ReviewColumn
            reviews={columns3.flat()}
            className="hidden md:block"
            reviewClassName={(reviewIndex) =>
              reviewIndex >= columns2.length ? "lg:hidden" : ""
            }
            msPerPixel={10}
          />
        </>
      ) : null}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-slate-100" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-slate-100" />
    </div>
  );
}

const Reviews = () => {
  return (
    <MaxWidthWrapper className="relative max-w-5xl px-8 ">
      <img
        aria-hidden="true"
        src="/what-people-are-buying.png"
        alt=""
        className="absolute select-none hidden xl:block -left-28 top-[30%]"
      />
      <ReviewGrid />
    </MaxWidthWrapper>
  );
};
export default Reviews;
