import React from 'react'
import Sidebar from '../components/sideBar';
import Profile from '../components/profile/ProfileManagement';
export default function ProfilePage() {
    return (
        <>
        <div className='flex'>
        <Sidebar/>
        <Profile/>
        </div>
        </>
      );
}
