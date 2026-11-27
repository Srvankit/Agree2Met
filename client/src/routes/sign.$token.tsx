import {createFileRoute} from '@tanstack/react-router';
import {Signing} from '@/pages/Signing';
import {pageHead} from '@/lib/page-head';
export const Route=createFileRoute('/sign/$token')({head:()=>pageHead('Electronic signing','Review, consent and sign a demo agreement with Agree2Met.'),component:Page});
function Page(){const {token}=Route.useParams();return <Signing token={token}/>;}
