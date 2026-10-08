function luminance(data){let sum=0;for(let i=0;i<data.length;i+=4)sum+=(data[i]*0.2126+data[i+1]*0.7152+data[i+2]*0.0722);return sum/(data.length/4||1)}
function edgeVariance(data,width,height){let sum=0,sumSq=0,n=0;for(let y=1;y<height-1;y+=2){for(let x=1;x<width-1;x+=2){const i=(y*width+x)*4;const left=data[i-4],right=data[i+4],up=data[i-width*4],down=data[i+width*4];const g=Math.abs(right-left)+Math.abs(down-up);sum+=g;sumSq+=g*g;n++}}const mean=sum/(n||1);return sumSq/(n||1)-mean*mean}

// A mostly white page is normal for documents. Only warn about bright exposure
// when it also lacks a meaningful amount of contrasting foreground. This is a
// pixel-quality hint, not an OCR or completeness guarantee; blur remains checked.
function hasDocumentContrast(data){
  let foreground=0
  for(let i=0;i<data.length;i+=4){
    const value=data[i]*0.2126+data[i+1]*0.7152+data[i+2]*0.0722
    if(value<160)foreground++
  }
  return foreground>=Math.max(16,data.length/4*0.001)
}

// Ignore isolated specks when checking for an almost uniform image. This only
// detects absent tonal detail; neither this nor edge variance measures OCR.
function tonalRange(data){
  const histogram=new Uint32Array(256),pixels=data.length/4
  for(let i=0;i<data.length;i+=4)histogram[Math.round(data[i]*0.2126+data[i+1]*0.7152+data[i+2]*0.0722)]++
  const percentile=fraction=>{let count=0;for(let value=0;value<256;value++){count+=histogram[value];if(count>=pixels*fraction)return value}return 255}
  return percentile(0.995)-percentile(0.005)
}

export function assessDocumentImage({data,width,height,naturalWidth=width,naturalHeight=height}){
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<3||height<3||!data||data.length!==width*height*4||!Number.isFinite(naturalWidth)||!Number.isFinite(naturalHeight)||naturalWidth<=0||naturalHeight<=0)return {status:'bad',issues:['unreadable']}
  const lum=luminance(data);const variance=edgeVariance(data,width,height);const contrast=tonalRange(data);const issues=[]
  if(Math.min(naturalWidth,naturalHeight)<800||Math.max(naturalWidth,naturalHeight)<1200)issues.push('resolution')
  if(lum<55)issues.push('dark'); else if(lum>225&&!hasDocumentContrast(data))issues.push('bright')
  if(variance<350)issues.push('blur')
  // Frame shape says nothing about document angle or missing page edges.
  // Low global edge energy also occurs with legible pencil handwriting and
  // empty margins: warn without calling it unreadable or silently approving it.
  const severe=variance<350&&contrast<16
  if(severe)issues.push('low_contrast')
  const next={status:issues.length?(severe?'bad':'warn'):'good',issues,width:naturalWidth,height:naturalHeight,luminance:Math.round(lum),sharpness:Math.round(variance),contrast}
  return next
}
