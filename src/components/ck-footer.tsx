'use client'

import React from 'react'
import { FaGithub } from "react-icons/fa";


const handleLinkRedirect = () => {
    window.open("https://www.allenjohn.online", "_blank")
}


const handleGithubRedirect = () => {
    window.open("https://github.com/cubingkeralaorg/cubingkerala", "_blank")
}


const CubingKeralaFooter = () => {
    return (
        <footer className="py-6 px-6 sm:px-6 text-stone-400 flex justify-center items-center">
            <div className="space-y-1 w-full">
                <p className="text-xs text-stone-600">Created by <span onClick={() => handleLinkRedirect()} className="cursor-pointer hover:text-blue-400 transition-all duration-200 ease-in">allenjohn</span></p>
                <div className='flex items-center justify-between'>
                    <p className="text-xs">&copy; {new Date().getFullYear()} Cubing Kerala. All rights reserved.</p>
                    <div onClick={() => handleGithubRedirect()} className='text-stone-400 transition-all duration-200 ease-in hover:text-blue-400 cursor-pointer text-xs hidden md:flex gap-1 items-center'>
                        <FaGithub className='text-xs' />
                        <span>github</span>
                    </div>
                    <FaGithub className='text-stone-400 hover:text-blue-500 cursor-pointer text-xs md:hidden mr-1' />
                </div>
            </div>
        </footer>
    )
}

export default CubingKeralaFooter