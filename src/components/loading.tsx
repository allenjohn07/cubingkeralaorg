'use client'

import React from 'react'
import LoginLoadingComponent from './login-loading'

const LoadingComponent = ({ width }: { width?: number }) => {
  return (
    // <div className={width ? `w-${width}` : 'w-[100px] md:w-[200px]'}>
    //   <LottieComponent path='/rounds-spinning.json' />
    // </div>
    <div className="absolute top-0 left-0 w-full h-full flex justify-center items-center">
      <LoginLoadingComponent />
    </div>
  )
}

export default LoadingComponent