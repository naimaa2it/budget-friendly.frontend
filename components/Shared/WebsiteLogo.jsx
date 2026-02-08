import React from "react";
import Image from "next/image";
import Link from "next/link";

const WebsiteLogo = () => {
  return (
  <div >
    <Link href="/">
          <Image
            src="/mainLogo.png"
            alt="Budget Friendly"
            width={100}
            height={100}
            className="h-7 mb-0"
          />
    </Link>
  </div>
  );
};

export default WebsiteLogo;
