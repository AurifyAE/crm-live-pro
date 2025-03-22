import React from 'react'
import Sidebar from '../components/sideBar';
import CashFlow from '../components/cashFlow';
export default function debtorPage() {
    return (
        <>
        <div className='flex'>
        <Sidebar/>
        <CashFlow/>
        </div>
        
        </>
      );
}
