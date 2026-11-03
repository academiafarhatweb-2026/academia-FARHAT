import { useSearchParams } from 'react-router-dom';
import Tabs from '../../../components/Tabs';
import Products from '../Products';
import Sales from '../Sales';

export default function StockSection() {
  const [searchParams] = useSearchParams();
  const initialActive = searchParams.get('tab') || undefined;

  return (
    <Tabs
      initialActive={initialActive}
      tabs={[
        { label: 'Productos', content: <Products /> },
        { label: 'Ventas', content: <Sales /> },
      ]}
    />
  );
}
