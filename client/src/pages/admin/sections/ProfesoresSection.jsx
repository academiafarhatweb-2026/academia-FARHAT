import Tabs from '../../../components/Tabs';
import Teachers from '../Teachers';
import Settlements from '../Settlements';

export default function ProfesoresSection() {
  return (
    <Tabs
      tabs={[
        { label: 'Profesores', content: <Teachers /> },
        { label: 'Liquidaciones', content: <Settlements /> },
      ]}
    />
  );
}
