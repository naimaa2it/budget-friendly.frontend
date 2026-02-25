import Lottie from "lottie-react";
import Empty from "../../public/animations/Empty.json";
import { useRouter } from 'next/navigation';

const EmptyAnimation = () => {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center text-center p-4">
      <div className="w-full max-w-[200px] mb-4">
        <Lottie 
          animationData={Empty}
          loop={true}
        />
      </div>
      <p className="text-lg font-semibold mb-2">Your cart is empty!</p>
      <button
        onClick={() => router.push('/')}
        className="mt-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
      >
        Explore More
      </button>
    </div>
  );
};

export default EmptyAnimation;