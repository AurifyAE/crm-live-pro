import React from 'react'
import Sidebar from '../components/sideBar';
import Analysis   from '../components/analysis';
export default function debtorPage() {
    return (
        <>
        <div className='flex'>
        <Sidebar/>
        <Analysis/>
        </div>
        
        </>
      );
}
