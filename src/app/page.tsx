'use client';
import React, {useState, useEffect} from 'react';
import BrowseAuctions from '@/app/home/page';
import FishermanDashboard from '@/app/fisherman/dashboard/page';
import { useAuth } from '@/context/AuthContext';


export default function Page(){
  const { user } = useAuth();

  console.log(user?.role);
  return(
    
    user?.role === 'nelayan'
    ? <FishermanDashboard/>
    :<BrowseAuctions />
  );
}

