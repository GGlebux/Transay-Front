import { useState } from 'react';
import IndicatorForm from './IndicatorForm';
import TranscriptForm from './TranscriptForm';

function FormsWrapper() {
  const [engName, setEngName] = useState('');

  return (
    <>
      <TranscriptForm engName={engName} setEngName={setEngName} />
      <IndicatorForm engName={engName} setEngName={setEngName} />
    </>
  );
}

export default FormsWrapper;
