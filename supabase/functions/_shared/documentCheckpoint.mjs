// A continuation belongs to one caller, original file, consent and output scope.
// The sealed candidate is never trusted against a different source or language.
export async function documentCheckpointBinding({ownerId,document,bytes,outputLanguage,referenceLanguage,country}) {
  const digest=await crypto.subtle.digest('SHA-256',bytes)
  const fileHash=Array.from(new Uint8Array(digest),value=>value.toString(16).padStart(2,'0')).join('')
  return {workflow:'document-staged-v1',owner_id:ownerId,document_id:document.id,file_path:document.file_path,file_hash:fileHash,
    updated_at:document.updated_at,source_language:document.source_language||null,data_classification:document.data_classification,
    privacy_notice_version:document.privacy_notice_version,voice_context:document.voice_context||null,voice_language:document.voice_language||null,
    outputLanguage,referenceLanguage,country}
}
