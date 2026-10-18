import {deflateSync} from 'node:zlib'

// Small real, compressed, two-page PDF. Synthetic extraction fixture only;
// it is not a court decision, model response, or customer export.
export function officialSourcePdf({pages=2,empty=false}={}){
  const lines=[
    'Synthetische Quellenprobe: Pr\u00fcfung, F\u00e4lligkeit und Abrechnung.',
    'Voraussetzung A UND Voraussetzung B m\u00fcssen beide vorliegen.',
    'Eine genannte Ausnahme darf beim Lesen nicht verloren gehen.',
    'Diese Datei dient ausschlie\u00dflich einem technischen Extraktionstest.'
  ]
  const objects=[],add=data=>{objects.push(Buffer.from(data,'latin1'));return objects.length}
  add('<< /Type /Catalog /Pages 2 0 R >>')
  add(`<< /Type /Pages /Count ${pages} /Kids [${Array.from({length:pages},(_,i)=>`${4+i*2} 0 R`).join(' ')}] >>`)
  add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>')
  for(let page=0;page<pages;page++){
    const id=4+page*2
    add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 800] /Resources << /Font << /F1 3 0 R >> >> /Contents ${id+1} 0 R >>`)
    const commands=empty?'':lines.map((line,i)=>`BT /F1 12 Tf 1 0 0 1 40 ${740-i*25} Tm (${line}) Tj ET`).join('\n')+
      '\nBT /F1 12 Tf 1 0 0 1 40 600 Tm (960) Tj 1 0 0 1 300 600 Tm (288) Tj ET\n'+
      `BT /F1 12 Tf 1 0 0 1 40 550 Tm (Seite ${page+1}: Ende der synthetischen Quelle.) Tj ET`
    const compressed=deflateSync(Buffer.from(commands,'latin1'))
    add(Buffer.concat([Buffer.from(`<< /Length ${compressed.length} /Filter /FlateDecode >>\nstream\n`),compressed,Buffer.from('\nendstream')]))
  }
  const chunks=[Buffer.from('%PDF-1.7\n')],offsets=[0]
  let length=chunks[0].length
  for(let i=0;i<objects.length;i++){
    offsets.push(length)
    const chunk=Buffer.concat([Buffer.from(`${i+1} 0 obj\n`),objects[i],Buffer.from('\nendobj\n')])
    chunks.push(chunk);length+=chunk.length
  }
  chunks.push(Buffer.from(`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`+
    offsets.slice(1).map(offset=>`${String(offset).padStart(10,'0')} 00000 n \n`).join('')+
    `trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${length}\n%%EOF\n`))
  return new Uint8Array(Buffer.concat(chunks))
}
