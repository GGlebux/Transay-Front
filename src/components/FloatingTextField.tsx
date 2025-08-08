import React from 'react';
import '../styles/forms.css';


type FloatingProps = {
  id: string;
  label: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  type?: string;
  error?: string;
  success?: string;
  options?: { value: string; label: string }[]; // только для select
};

// --- Floating Input ---
export function FloatingTextInput({
  id, label, value, onChange, error, success,
  type = 'text',
}: FloatingProps) {
  const inputClass = error
    ? 'text-field__input_invalid'
    : success
    ? 'text-field__input_valid'
    : '';

  const message = error || success;
  const messageClass = error
    ? 'text-field__message_invalid'
    : success
    ? 'text-field__message_valid'
    : '';

  return (
    <div className="text-field">
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder=" "
        className={`text-field__input ${inputClass}`}
      />
      <label htmlFor={id} className="text-field__label">{label}</label>
      {message && <div className={`text-field__message ${messageClass}`}>{message}</div>}
    </div>
  );
}

// --- Floating Select ---
export function FloatingSelect({
  id, label, value, onChange, error, success, options = [],
}: FloatingProps) {
  const inputClass = error
    ? 'text-field__input_invalid'
    : success
    ? 'text-field__input_valid'
    : '';

  const message = error || success;
  const messageClass = error
    ? 'text-field__message_invalid'
    : success
    ? 'text-field__message_valid'
    : '';

  return (
    <div className="text-field">
      <select
        id={id}
        value={value}
        onChange={onChange}
        className={`text-field__input ${inputClass}`}
      >
        <option value=""> </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <label htmlFor={id} className="text-field__label">{label}</label>
      {message && <div className={`text-field__message ${messageClass}`}>{message}</div>}
    </div>
  );
}
