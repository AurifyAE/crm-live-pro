import React from 'react'
import Sidebar from '../components/sideBar';
import Debtor from '../components/debtor';
export default function debtorPage() {
    return (
        <>
        <div className='flex'>
        <Sidebar/>
        <Debtor/>
        </div>
        
        </>
      );
}
