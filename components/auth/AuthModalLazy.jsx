"use client";

import dynamic from "next/dynamic";

// AuthModal pulls in the Firebase Auth SDK (~80KB), which every page was
// paying for on first load because 11 components import AuthModal statically
// and most of them (Navbar, Footer, ProductCard, ...) render on nearly every
// route. Code-splitting it here means Firebase only downloads once someone
// actually opens the login/signup modal, not on every first-time visit.
const AuthModal = dynamic(() => import("./AuthModal"), { ssr: false });

export default AuthModal;
