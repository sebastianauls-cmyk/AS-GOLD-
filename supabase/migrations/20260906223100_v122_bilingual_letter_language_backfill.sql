update public.documents
set customer_copy_language = case
  when analysis_summary like '%KUNDENKOPIE / ÜBERSETZUNG (Deutsch)%' then 'de'
  when analysis_summary like '%KUNDENKOPIE / ÜBERSETZUNG (English)%' then 'en'
  when analysis_summary like '%KUNDENKOPIE / ÜBERSETZUNG (Français)%' then 'fr'
  when analysis_summary like '%KUNDENKOPIE / ÜBERSETZUNG (Türkçe)%' then 'tr'
  when analysis_summary like '%KUNDENKOPIE / ÜBERSETZUNG (Polski)%' then 'pl'
  when analysis_summary like '%KUNDENKOPIE / ÜBERSETZUNG (Русский)%' then 'ru'
  when analysis_summary like '%KUNDENKOPIE / ÜBERSETZUNG (العربية)%' then 'ar'
  when analysis_summary like '%KUNDENKOPIE / ÜBERSETZUNG (فارسی)%' then 'fa'
  when analysis_summary like '%KUNDENKOPIE / ÜBERSETZUNG (Română)%' then 'ro'
  when analysis_summary like '%KUNDENKOPIE / ÜBERSETZUNG (Български)%' then 'bg'
  when analysis_summary like '%KUNDENKOPIE / ÜBERSETZUNG (Tiếng Việt)%' then 'vi'
  else customer_copy_language
end
where customer_copy_language is null
  and nullif(btrim(customer_copy), '') is not null;
