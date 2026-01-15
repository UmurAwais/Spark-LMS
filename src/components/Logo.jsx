import React from 'react'
import { Link } from 'react-router-dom'
import logoImage from '../assets/Logo.png'

const Logo = () => {
  return (
    <Link to="/" className="w-24 md:w-32 block cursor-pointer">
      <img src={logoImage} alt="Logo" className="w-full h-auto" />
    </Link>
  )
}

export default Logo