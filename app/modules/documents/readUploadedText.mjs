// File.text() always decodes UTF-8, including BOM-marked UTF-16 exports from
// spreadsheet and text editors. Decode strictly so damaged text is never marked
// as an available original. The private uploaded file is retained either way.
export async function readUploadedText(file){
  const bytes=new Uint8Array(await file.arrayBuffer())
  const encoding=bytes[0]===0xff&&bytes[1]===0xfe?'utf-16le':bytes[0]===0xfe&&bytes[1]===0xff?'utf-16be':'utf-8'
  const text=new TextDecoder(encoding,{fatal:true}).decode(bytes)
  return text.trim()&&!text.includes('\u0000')?text:null
}
