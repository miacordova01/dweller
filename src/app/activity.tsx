import { router } from 'expo-router';
import { Text } from 'react-native';
import { Screen,Panel,RowLink,T } from '@/components/DwellerUI';
export default function Activity(){return <Screen title="Activity" tab="Activity"><Text style={T.muted}>Everything happening around your home, in one place.</Text><Panel><RowLink title="Maintenance" subtitle="Track repair requests" icon="wrench" onPress={()=>router.push('/maintenance')}/><RowLink title="Rent & payments" subtitle="View rent information" icon="creditcard" onPress={()=>router.push('/payments')}/><RowLink title="Ask Dweller" subtitle="Get help with your next step" icon="sparkles" onPress={()=>router.push('/assistant')}/></Panel></Screen>}
