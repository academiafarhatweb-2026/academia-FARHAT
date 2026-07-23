import { useSearchParams } from 'react-router-dom';
import Tabs from '../../../components/Tabs';
import Students from '../Students';
import Enrollments from '../Enrollments';
import Payments from '../Payments';

export default function AlumnosSection() {
  const [searchParams] = useSearchParams();
  const initialActive = searchParams.get('tab') || undefined;

  return (
    <Tabs
      initialActive={initialActive}
      tabs={[
        { label: 'Alumnos', content: <Students /> },
        { label: 'Inscripciones', content: <Enrollments /> },
        { label: 'Pagos', content: <Payments /> },
      ]}
    />
  );
}
