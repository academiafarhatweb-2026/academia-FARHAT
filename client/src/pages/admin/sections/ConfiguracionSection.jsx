import Tabs from '../../../components/Tabs';
import HomeEditor from '../HomeEditor';
import Plans from '../Plans';

export default function ConfiguracionSection() {
  return (
    <Tabs
      tabs={[
        { label: 'Home', content: <HomeEditor /> },
        { label: 'Planes', content: <Plans /> },
      ]}
    />
  );
}
