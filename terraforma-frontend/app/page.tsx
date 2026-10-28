import Prototipo from '@/components/Prototipo';

export default function Pagina() {
  return <Prototipo demo={process.env.NEXT_PUBLIC_DEMO !== '0'} />;
}
