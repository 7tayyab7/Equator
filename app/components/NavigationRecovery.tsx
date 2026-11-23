import {useEffect} from 'react';
import {useNavigation} from 'react-router';
export function NavigationRecovery(){const navigation=useNavigation();useEffect(()=>{document.documentElement.dataset.equatorReady='true';},[]);return navigation.state==='loading'?<div className="navigation-progress" role="status" aria-label="Opening page"/>:null;}
