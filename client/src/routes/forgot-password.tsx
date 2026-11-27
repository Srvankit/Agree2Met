import {createFileRoute} from '@tanstack/react-router';
import {Auth} from '@/pages/Auth';
import {pageHead} from '@/lib/page-head';
export const Route=createFileRoute('/forgot-password')({head:()=>pageHead('Forgot password', 'Forgot password with Agree2Met and manage your agreements.'),component:()=> <Auth mode="forgot-password"/>});
