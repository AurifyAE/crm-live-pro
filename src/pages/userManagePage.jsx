import React from 'react'
import Sidebar from '../components/adminSideBar';
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
