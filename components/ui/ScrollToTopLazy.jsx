"use client";

import dynamic from "next/dynamic";

const ScrollToTop = dynamic(() => import("./ScrollToTop"), { ssr: false });

export default ScrollToTop;
