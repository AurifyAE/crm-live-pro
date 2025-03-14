import React from 'react'
import Home from '../components/MISDashboard'
import Sidebar from '../components/sideBar'
export default function homePage() {
   
    return (
      <>
      <div className='flex'>
      <Sidebar/>
      <Home/>
      </div>
      
      </>
    );
  }