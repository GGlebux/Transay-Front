import { useState } from "react";
import type { ReactNode } from "react";
import IndicatorForm from "./IndicatorForm";
import TranscriptForm from "./TranscriptForm";

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
