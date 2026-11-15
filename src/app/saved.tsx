import { router } from 'expo-router';
import { Text } from 'react-native';
import { Screen, Panel, T, RowLink } from '@/components/DwellerUI';
export default function Saved(){return <Screen tab="Saved" title="Saved homes"><Panel><Text style={T.h2}>Your shortlist starts here.</Text><Text style={[T.muted,{marginTop:8}]}>Save a home from Discover to keep track of places you love. Saved homes currently stay on the listing screen until persistent favorites are enabled.</Text><RowLink icon="magnifyingglass" title="Explore homes" subtitle="Browse available places" onPress={()=>router.push('/')}/></Panel></Screen>}
