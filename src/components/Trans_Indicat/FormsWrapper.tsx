import { useState } from "react";
import type { ReactNode } from "react";
import IndicatorForm from "../Trans_Indicat/IndicatorForm";
import TranscriptForm from "../Trans_Indicat/TranscriptForm";

type FormsWrapperProps = {
  children?: ReactNode;
};

export default function FormsWrapper({ children }: FormsWrapperProps) {
  const [engName, setEngName] = useState("");

  return (
    <div className="forms-wrapper">
      {children}
      <TranscriptForm engName={engName} setEngName={setEngName} />
      <IndicatorForm engName={engName} setEngName={setEngName} />
    </div>
  );
}
