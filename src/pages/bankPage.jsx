import React from 'react'
import Sidebar from '../components/sideBar';
import Bank from '../components/bank';
export default function debtorPage() {
    return (
        <>
        <div className='flex'>
        <Sidebar/>
        <Bank/>
        </div>
        
        </>
      );
}
