import React from 'react'
import Sidebar from '../components/sideBar';
import LP from '../components/liquidityProvider';
export default function debtorPage() {
    return (
        <>
        <div className='flex'>
        <Sidebar/>
        <LP/>
        </div>
        
        </>
      );
}
