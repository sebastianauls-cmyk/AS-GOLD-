// Embedded Unicode fonts and real PDF text, shared by every customer export.
// Status markers are vector circles; they never depend on emoji font support.
export const PDF_LIGHT_COLORS={green:'#287B50',yellow:'#C08A16',red:'#BF3F3F',white:'#94A3B8'}
const MARKERS={'🟢':'green','🟡':'yellow','🔴':'red','⚪':'white'}
export function pdfLight(value) {const marker=String(value||'').match(/🟢|🟡|🔴|⚪/u)?.[0];return marker?MARKERS[marker]:Object.hasOwn(PDF_LIGHT_COLORS,value)?value:'white'}
let fontPromise
async function loadFonts() {
  if(!fontPromise) fontPromise=Promise.all(['DejaVuSans.ttf','DejaVuSans-Bold.ttf'].map(async name=>{
    const response=await fetch('/fonts/'+name)
    if(!response.ok)throw new Error('Die PDF-Schrift konnte nicht geladen werden. Bitte erneut versuchen.')
    const bytes=new Uint8Array(await response.arrayBuffer())
    let binary=''
    for(let index=0;index<bytes.length;index+=8192)binary+=String.fromCharCode(...bytes.subarray(index,index+8192))
    return btoa(binary)
  })).catch(error=>{fontPromise=null;throw error})
  return fontPromise
}

export function pdfTextBlocks(blocks) {
  return blocks.flatMap(block=>String(block.text??'').split(/\r?\n/).map((line,index)=>{
    const marker=line.match(/🟢|🟡|🔴|⚪/u)?.[0]
    return {...block,text:marker?line.replace(marker,'').trim():line,light:marker?MARKERS[marker]:index===0&&block.light?pdfLight(block.light):null,pageBreakBefore:index===0&&block.pageBreakBefore}
  }))
}

export async function createTextPdf({blocks,header='ASH Workspace Gold',language='de',title='',fonts}={}) {
  const {jsPDF}=await import('jspdf')
  const [regular,bold]=fonts||await loadFonts()
  const pdf=new jsPDF({unit:'pt',format:'a4',compress:true,putOnlyUsedFonts:true})
  pdf.addFileToVFS('DejaVuSans.ttf',regular);pdf.addFont('DejaVuSans.ttf','ASH','normal')
  pdf.addFileToVFS('DejaVuSans-Bold.ttf',bold);pdf.addFont('DejaVuSans-Bold.ttf','ASH','bold')
  const width=pdf.internal.pageSize.getWidth(),height=pdf.internal.pageSize.getHeight(),margin=48,maxY=height-58
  const contentWidth=width-2*margin,rtl=['ar','fa'].includes(language)
  let y=0
  const font=(size,bold=false)=>{pdf.setFont('ASH',bold?'bold':'normal');pdf.setFontSize(size)}
  const text=(line,x,atY,align='left',direction=rtl)=>{
    // Logical Unicode input must be reordered once, never reversed as a string.
    const arabic=/[\u0600-\u06ff]/u.test(line)
    if(arabic)pdf.internal.write('/Span << /ActualText <FEFF'+Array.from({length:line.length},(_,i)=>line.charCodeAt(i).toString(16).padStart(4,'0')).join('')+'> >> BDC')
    pdf.text(line,x,atY,{align,R2L:false,isInputVisual:false,isOutputVisual:true,isInputRtl:arabic?direction:false,isOutputRtl:false})
    if(arabic)pdf.internal.write('EMC')
  }
  function page(first=false) {
    if(!first)pdf.addPage()
    y=40;font(9,true);pdf.setTextColor('#596375')
    for(const line of pdf.splitTextToSize(String(header),contentWidth)) {text(line,rtl?width-margin:margin,y,rtl?'right':'left');y+=13}
    pdf.setDrawColor('#D8DFE6');pdf.line(margin,y+1,width-margin,y+1);y+=28
  }
  page(true)
  for(const block of pdfTextBlocks(blocks)) {
    if(block.pageBreakBefore)page()
    const blockRtl=block.language?['ar','fa'].includes(block.language):rtl
    const heading=['title','heading','step'].includes(block.kind)
    const size=block.kind==='title'?17:block.kind==='meta'?9:11,lineHeight=size*1.45
    const inset=block.light?15:block.kind==='bullet'?10:0
    font(size,heading)
    const lines=pdf.splitTextToSize((block.kind==='bullet'?'• ':'')+block.text,contentWidth-inset)
    if(heading&&y+lineHeight*(Math.min(lines.length,3)+1)>maxY)page()
    if(heading)y+=5
    for(let index=0;index<lines.length;index++) {
      if(y+lineHeight>maxY)page()
      font(size,heading);pdf.setTextColor(block.kind==='meta'?'#596375':'#202B3B')
      if(block.light&&index===0) {
        const color=PDF_LIGHT_COLORS[block.light]||PDF_LIGHT_COLORS.white
        pdf.setDrawColor(color);pdf.setFillColor(block.light==='white'?'#FFFFFF':color)
        pdf.circle(blockRtl?width-margin-4:margin+4,y-size*.32,3.6,'FD')
      }
      text(lines[index],blockRtl?width-margin-inset:margin+inset,y,blockRtl?'right':'left',blockRtl);y+=lineHeight
    }
    y+=block.kind==='meta'?7:10
  }
  const count=pdf.getNumberOfPages()
  for(let index=1;index<=count;index++) {
    pdf.setPage(index);font(8);pdf.setTextColor('#64748B');pdf.setR2L(false)
    pdf.text('ASH Workspace Gold',margin,height-28)
    pdf.text(`${index} / ${count}`,width-margin,height-28,{align:'right'})
  }
  pdf.setProperties({title:title||blocks[0]?.text||'ASH Workspace Gold',creator:'ASH Workspace Gold'})
  return pdf.output('blob')
}
