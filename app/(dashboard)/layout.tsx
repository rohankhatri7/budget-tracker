import Navbar from '@/components/providers/Navbar'
import React, { ReactNode } from 'react'
import ParticleAnimation from '@/components/ParticleAnimation'

function layout({children} : {children: ReactNode}) {
  return (
    <div className='relative flex min-h-screen w-full flex-col'>
        <Navbar />
        <div className='w-full flex-grow'>
          {children}
        </div>
        <ParticleAnimation />
    </div>
  )
}

export default layout