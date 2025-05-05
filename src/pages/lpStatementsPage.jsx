import React from 'react'
import Sidebar from '../components/sideBar';
import LpStatement from '../components/lpStatements/index';
export default function lpstatementPage() {
    return (
        <>
        <div className='flex'>
        <Sidebar/>
        <LpStatement/>
        </div>
        </>
      );
}
