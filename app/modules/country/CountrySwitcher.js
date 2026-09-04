'use client'

import { COUNTRY_CATALOG } from './countryRegistry.mjs'

export function CountrySwitcher({value='DE',onChange,label='Land / Rechtsraum'}){
  return <label className="countrySwitcher">
    <span>{label}</span>
    <select value={value} onChange={event=>onChange?.(event.target.value)} aria-label={label}>
      {COUNTRY_CATALOG.map(country=><option value={country.key} key={country.key}>{country.flag} {country.label}</option>)}
    </select>
  </label>
}
