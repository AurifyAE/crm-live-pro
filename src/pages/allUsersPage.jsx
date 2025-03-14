import React from 'react'
import Sidebar from '../components/sideBar';
import AllUsers from '../components/allUsers';
export default function debtorPage() {
    return (
        <>
        <div className='flex'>
        <Sidebar/>
        <AllUsers/>
        </div>
        
        </>
      );
}
