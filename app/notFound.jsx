import Image from 'next/image'
import React from 'react'

export default function NotFound() {
  return (
    <>
    <div className='text-center'>

    <Image src="/404.jpeg" alt="Not Found" width={400} height={300} className="mx-auto mb-6" />
    <h1 className= 'text-pink-700 text-xl'>The item may not available but you can scroll there have so many more to explore.</h1>
    </div>
    </>
  )
}
