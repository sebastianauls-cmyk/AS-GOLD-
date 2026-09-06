'use client'

import { useEffect,useMemo,useState } from 'react'
import { isImageDocument } from './documentUploadReadiness.mjs'

const copy={
  de:{title:'Bildqualität',good:'Bildqualität ausreichend',dark:'Foto ist zu dunkel',bright:'Foto ist sehr hell',blur:'Foto wirkt unscharf',cropped:'Dokument könnte abgeschnitten sein',skew:'Dokument wirkt schief fotografiert',resolution:'Auflösung zu niedrig',retake:'Bitte neu fotografieren: Dokument vollständig, gerade und gut beleuchtet aufnehmen.',notImage:'Qualitätsprüfung ist nur bei Bildern nötig.'},
  en:{title:'Image quality',good:'Image quality is sufficient',dark:'Photo is too dark',bright:'Photo is very bright',blur:'Photo appears blurry',cropped:'Document may be cropped',skew:'Document appears tilted',resolution:'Resolution is too low',retake:'Retake the photo with the whole document visible, straight and well lit.',notImage:'Quality check is only needed for images.'},
  pl:{title:'Jakość obrazu',good:'Jakość obrazu jest wystarczająca',dark:'Zdjęcie jest zbyt ciemne',bright:'Zdjęcie jest bardzo jasne',blur:'Zdjęcie wygląda na nieostre',cropped:'Dokument może być ucięty',skew:'Dokument wygląda na przechylony',resolution:'Rozdzielczość jest zbyt niska',retake:'Zrób zdjęcie ponownie: cały dokument, prosto i przy dobrym świetle.',notImage:'Kontrola jakości dotyczy tylko obrazów.'},
  tr:{title:'Görüntü kalitesi',good:'Görüntü kalitesi yeterli',dark:'Fotoğraf çok karanlık',bright:'Fotoğraf çok parlak',blur:'Fotoğraf bulanık görünüyor',cropped:'Belge kesilmiş olabilir',skew:'Belge eğik çekilmiş görünüyor',resolution:'Çözünürlük çok düşük',retake:'Belgenin tamamını düz ve iyi aydınlatılmış şekilde yeniden çekin.',notImage:'Kalite kontrolü yalnızca görseller için gereklidir.'},
  ru:{title:'Качество изображения',good:'Качество изображения достаточное',dark:'Фото слишком тёмное',bright:'Фото слишком светлое',blur:'Фото выглядит размытым',cropped:'Документ может быть обрезан',skew:'Документ снят под углом',resolution:'Слишком низкое разрешение',retake:'Сделайте фото заново: весь документ, ровно и при хорошем освещении.',notImage:'Проверка качества нужна только для изображений.'},
  ar:{title:'جودة الصورة',good:'جودة الصورة كافية',dark:'الصورة داكنة جداً',bright:'الصورة شديدة السطوع',blur:'الصورة تبدو غير واضحة',cropped:'قد يكون المستند مقصوصاً',skew:'المستند يبدو مائلاً',resolution:'الدقة منخفضة جداً',retake:'أعد التصوير بحيث يظهر المستند كاملاً ومستقيماً وبإضاءة جيدة.',notImage:'فحص الجودة مطلوب للصور فقط.'},
  fr:{title:'Qualité de l’image',good:'Qualité d’image suffisante',dark:'Photo trop sombre',bright:'Photo très claire',blur:'Photo semble floue',cropped:'Le document peut être coupé',skew:'Le document semble incliné',resolution:'Résolution trop faible',retake:'Reprenez la photo avec le document entier, droit et bien éclairé.',notImage:'Le contrôle qualité est nécessaire uniquement pour les images.'},
  fa:{title:'کیفیت تصویر',good:'کیفیت تصویر کافی است',dark:'عکس بیش از حد تاریک است',bright:'عکس بسیار روشن است',blur:'عکس تار به نظر می‌رسد',cropped:'ممکن است سند بریده شده باشد',skew:'سند کج عکس گرفته شده است',resolution:'وضوح تصویر پایین است',retake:'لطفاً دوباره عکس بگیرید: کل سند، صاف و با نور مناسب.',notImage:'بررسی کیفیت فقط برای تصاویر لازم است.'},
  ro:{title:'Calitatea imaginii',good:'Calitatea imaginii este suficientă',dark:'Fotografia este prea întunecată',bright:'Fotografia este foarte luminoasă',blur:'Fotografia pare neclară',cropped:'Documentul poate fi tăiat',skew:'Documentul pare fotografiat înclinat',resolution:'Rezoluția este prea mică',retake:'Fotografiați din nou documentul complet, drept și bine luminat.',notImage:'Verificarea calității este necesară doar pentru imagini.'},
  bg:{title:'Качество на изображението',good:'Качеството на изображението е достатъчно',dark:'Снимката е твърде тъмна',bright:'Снимката е прекалено светла',blur:'Снимката изглежда размазана',cropped:'Документът може да е отрязан',skew:'Документът изглежда заснет накриво',resolution:'Резолюцията е твърде ниска',retake:'Снимайте отново целия документ, изправен и добре осветен.',notImage:'Проверката на качеството е нужна само за изображения.'},
  vi:{title:'Chất lượng ảnh',good:'Chất lượng ảnh đạt yêu cầu',dark:'Ảnh quá tối',bright:'Ảnh quá sáng',blur:'Ảnh có vẻ bị mờ',cropped:'Tài liệu có thể bị cắt mất phần',skew:'Tài liệu có vẻ bị chụp lệch',resolution:'Độ phân giải quá thấp',retake:'Hãy chụp lại toàn bộ tài liệu, thẳng và đủ sáng.',notImage:'Chỉ cần kiểm tra chất lượng đối với ảnh.'}
}

function luminance(data){let sum=0;for(let i=0;i<data.length;i+=4)sum+=(data[i]*0.2126+data[i+1]*0.7152+data[i+2]*0.0722);return sum/(data.length/4||1)}
function edgeVariance(data,width,height){let sum=0,sumSq=0,n=0;for(let y=1;y<height-1;y+=2){for(let x=1;x<width-1;x+=2){const i=(y*width+x)*4;const left=data[i-4],right=data[i+4],up=data[i-width*4],down=data[i+width*4];const g=Math.abs(right-left)+Math.abs(down-up);sum+=g;sumSq+=g*g;n++}}const mean=sum/(n||1);return sumSq/(n||1)-mean*mean}

export default function DocumentImageQualityCheck({file,language='de',onResult}){
  const c=copy[language]||copy.de
  const [result,setResult]=useState(null)
  const extension=file?.name?.includes('.')?file.name.split('.').pop().toLowerCase():''
  const isImage=!!file&&isImageDocument({fileType:file.type,extension})
  useEffect(()=>{
    if(!file||!isImage){setResult(file?{status:'not-image',issues:[]} : null);return}
    let active=true
    const url=URL.createObjectURL(file);const img=new Image()
    img.onload=()=>{
      if(!active)return
      const max=900;const scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));const width=Math.max(1,Math.round(img.naturalWidth*scale));const height=Math.max(1,Math.round(img.naturalHeight*scale));
      const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,width,height);const data=ctx.getImageData(0,0,width,height).data
      const lum=luminance(data);const variance=edgeVariance(data,width,height);const issues=[]
      if(Math.min(img.naturalWidth,img.naturalHeight)<800||Math.max(img.naturalWidth,img.naturalHeight)<1200)issues.push('resolution')
      if(lum<55)issues.push('dark'); else if(lum>225)issues.push('bright')
      if(variance<350)issues.push('blur')
      const ratio=img.naturalWidth/img.naturalHeight;if(ratio<0.45||ratio>2.2)issues.push('cropped')
      if(ratio>0.72&&ratio<1.05)issues.push('skew')
      const severe=issues.includes('dark')||issues.includes('blur')||issues.includes('cropped')
      const next={status:issues.length?(severe?'bad':'warn'):'good',issues,width:img.naturalWidth,height:img.naturalHeight,luminance:Math.round(lum),sharpness:Math.round(variance)}
      setResult(next);onResult?.(next);URL.revokeObjectURL(url)
    }
    img.onerror=()=>{if(!active)return;const next={status:'bad',issues:['blur']};setResult(next);onResult?.(next);URL.revokeObjectURL(url)};img.src=url
    return()=>{active=false;URL.revokeObjectURL(url)}
  },[file,isImage,language])

  const rows=useMemo(()=>result?.issues||[],[result])
  if(!file)return null
  if(!isImage)return <div className="analysisFacts"><b>{c.title}</b><p>🟢 {c.notImage}</p></div>
  if(!result)return <div className="analysisFacts"><b>{c.title}</b><p>🟡 …</p></div>
  const dot=result.status==='good'?'🟢':result.status==='warn'?'🟡':'🔴'
  return <div className="analysisFacts"><b>{c.title}</b><p><strong>{dot} {result.status==='good'?c.good:c.retake}</strong></p>{rows.length?<div>{rows.map(key=><span key={key}><small>{key}</small><strong>{result.status==='bad'?'🔴':'🟡'} {c[key]}</strong></span>)}</div>:null}</div>
}
