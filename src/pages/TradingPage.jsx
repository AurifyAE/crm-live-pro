import React from 'react'
import Sidebar from '../components/sideBar';
import Trading from '../components/Trading';
export default function debtorPage() {
    return (
        <>
        <div className='flex'>
        <Sidebar/>
        <Trading/>
        </div>
        </>
      );
}
