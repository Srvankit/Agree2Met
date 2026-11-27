import {createFileRoute} from '@tanstack/react-router';
import {Detail} from '@/pages/Detail';
import {pageHead} from '@/lib/page-head';
export const Route=createFileRoute('/app/agreements/$id')({head:({params})=>pageHead(`Agreement ${params.id}`,'Review an agreement, document, parties and its audit history.'),component:Page});
function Page(){const {id}=Route.useParams();return <Detail id={id}/>;}
