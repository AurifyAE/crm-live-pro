import React from 'react'
import Sidebar from '../components/sideBar';
import UserManagement   from '../components/userManage';
export default function userManagePage() {
    return (
        <>
        <div className='flex'>
        <Sidebar/>
        <UserManagement/>
        </div>
        
        </>
      );
}
