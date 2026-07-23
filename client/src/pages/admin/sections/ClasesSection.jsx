import { useSearchParams } from 'react-router-dom';
import Tabs from '../../../components/Tabs';
import Classes from '../Classes';
import ScheduleOverview from '../ScheduleOverview';

export default function ClasesSection() {
  const [searchParams] = useSearchParams();
  const initialActive = searchParams.get('tab') || undefined;

  return (
    <Tabs
      initialActive={initialActive}
      tabs={[
        { label: 'Clases', content: <Classes /> },
        { label: 'Horario general', content: <ScheduleOverview /> },
      ]}
    />
  );
}
