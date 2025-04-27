import React from 'react'
import Sidebar from '../components/sideBar';
import Statement from '../components/Statements';
export default function statementPage() {
    return (
        <>
        <div className='flex'>
        <Sidebar/>
        <Statement/>
        </div>
        </>
      );
}
