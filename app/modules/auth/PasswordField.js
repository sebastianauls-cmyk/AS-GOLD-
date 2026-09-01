export function PasswordField({id,label,value,onChange,visible,onToggle,labels,autoComplete,describedBy}){
  const actionLabel = visible ? labels.hide : labels.show
  return <div className="authField"><label htmlFor={id}>{label}</label><div className="passwordControl"><input id={id} type={visible?'text':'password'} value={value} onChange={onChange} autoComplete={autoComplete} aria-describedby={describedBy} required/><button type="button" className="passwordToggle" onClick={onToggle} aria-label={`${actionLabel}: ${label}`} aria-pressed={visible}>{actionLabel}</button></div></div>
}
