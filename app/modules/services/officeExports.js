import JSZip from 'jszip'

const XML_HEADER='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
const RELATIONSHIP_NS='http://schemas.openxmlformats.org/package/2006/relationships'
const OFFICE_REL_NS='http://schemas.openxmlformats.org/officeDocument/2006/relationships'
const CORE_NS='http://schemas.openxmlformats.org/package/2006/metadata/core-properties'

function cleanXmlText(value,maxLength=32767){
  return String(value??'')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'')
    .slice(0,maxLength)
}

function escapeXml(value,maxLength){
  return cleanXmlText(value,maxLength)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&apos;')
}

function coreProperties(title){
  const now=new Date().toISOString()
  return XML_HEADER+
    '<cp:coreProperties xmlns:cp="'+CORE_NS+'" xmlns:dc="http://purl.org/dc/elements/1.1/" '+
    'xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" '+
    'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'+
    '<dc:title>'+escapeXml(title,255)+'</dc:title><dc:creator>AS Workspace Gold</dc:creator>'+
    '<cp:lastModifiedBy>AS Workspace Gold</cp:lastModifiedBy>'+
    '<dcterms:created xsi:type="dcterms:W3CDTF">'+now+'</dcterms:created>'+
    '<dcterms:modified xsi:type="dcterms:W3CDTF">'+now+'</dcterms:modified>'+
    '</cp:coreProperties>'
}

function rootRelationships(mainTarget){
  return XML_HEADER+'<Relationships xmlns="'+RELATIONSHIP_NS+'">'+
    '<Relationship Id="rId1" Type="'+OFFICE_REL_NS+'/officeDocument" Target="'+mainTarget+'"/>'+
    '<Relationship Id="rId2" Type="'+OFFICE_REL_NS+'/extended-properties" Target="docProps/app.xml"/>'+
    '<Relationship Id="rId3" Type="'+RELATIONSHIP_NS+'/metadata/core-properties" Target="docProps/core.xml"/>'+
    '</Relationships>'
}

async function zipBlob(zip,mimeType){
  const bytes=await zip.generateAsync({
    type:'uint8array',
    compression:'DEFLATE',
    compressionOptions:{level:6},
  })
  return new Blob([bytes],{type:mimeType})
}

function columnName(index){
  let current=index+1
  let name=''
  while(current>0){
    const remainder=(current-1)%26
    name=String.fromCharCode(65+remainder)+name
    current=Math.floor((current-1)/26)
  }
  return name
}

function worksheetCell(value,rowIndex,columnIndex,styleId=0){
  const reference=columnName(columnIndex)+rowIndex
  return '<c r="'+reference+'" t="inlineStr" s="'+styleId+'"><is><t xml:space="preserve">'+
    escapeXml(value,32767)+'</t></is></c>'
}

export async function createXlsxBlob(rows){
  const zip=new JSZip()
  const normalized=Array.isArray(rows)&&rows.length?rows:[['AS Workspace Gold','']]
  const sheetRows=normalized.map((row,index)=>{
    const values=Array.isArray(row)?row:[row]
    const width=Math.max(2,values.length)
    const cells=Array.from({length:width},(_,column)=>worksheetCell(values[column]??'',index+1,column,index===0?1:0)).join('')
    return '<row r="'+(index+1)+'"'+(index===0?' ht="24" customHeight="1"':'')+'>'+cells+'</row>'
  }).join('')
  const lastRow=Math.max(1,normalized.length)

  zip.file('[Content_Types].xml',XML_HEADER+
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'+
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'+
    '<Default Extension="xml" ContentType="application/xml"/>'+
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'+
    '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'+
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+
    '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>'+
    '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>'+
    '</Types>')
  zip.file('_rels/.rels',rootRelationships('xl/workbook.xml'))
  zip.file('docProps/core.xml',coreProperties(cleanXmlText(normalized[0]?.[0]||'AS Workspace Gold',255)))
  zip.file('docProps/app.xml',XML_HEADER+
    '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" '+
    'xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">'+
    '<Application>AS Workspace Gold</Application><DocSecurity>0</DocSecurity><ScaleCrop>false</ScaleCrop>'+
    '<Company></Company><LinksUpToDate>false</LinksUpToDate><SharedDoc>false</SharedDoc>'+
    '<HyperlinksChanged>false</HyperlinksChanged><AppVersion>1.0</AppVersion></Properties>')
  zip.file('xl/workbook.xml',XML_HEADER+
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="'+OFFICE_REL_NS+'">'+
    '<bookViews><workbookView xWindow="0" yWindow="0" windowWidth="24000" windowHeight="12000"/></bookViews>'+
    '<sheets><sheet name="AS Workspace Gold" sheetId="1" r:id="rId1"/></sheets><calcPr calcId="0"/></workbook>')
  zip.file('xl/_rels/workbook.xml.rels',XML_HEADER+'<Relationships xmlns="'+RELATIONSHIP_NS+'">'+
    '<Relationship Id="rId1" Type="'+OFFICE_REL_NS+'/worksheet" Target="worksheets/sheet1.xml"/>'+
    '<Relationship Id="rId2" Type="'+OFFICE_REL_NS+'/styles" Target="styles.xml"/>'+
    '</Relationships>')
  zip.file('xl/styles.xml',XML_HEADER+
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'+
    '<fonts count="2"><font><sz val="11"/><color theme="1"/><name val="Aptos"/></font>'+
    '<font><b/><sz val="16"/><color rgb="FF1F2937"/><name val="Aptos Display"/></font></fonts>'+
    '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>'+
    '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>'+
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'+
    '<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment wrapText="1"/></xf>'+
    '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment wrapText="1"/></xf></cellXfs>'+
    '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>'+
    '</styleSheet>')
  zip.file('xl/worksheets/sheet1.xml',XML_HEADER+
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'+
    '<dimension ref="A1:B'+lastRow+'"/><sheetViews><sheetView workbookViewId="0"/></sheetViews>'+
    '<sheetFormatPr defaultRowHeight="18"/><cols><col min="1" max="1" width="28" customWidth="1"/>'+
    '<col min="2" max="2" width="80" customWidth="1"/></cols><sheetData>'+sheetRows+'</sheetData>'+
    '<mergeCells count="1"><mergeCell ref="A1:B1"/></mergeCells><pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/>'+
    '</worksheet>')

  return zipBlob(zip,'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
}

function emu(inches){
  return Math.round(Number(inches)*914400)
}

function slideRuns(value,fontSize,bold,color){
  const runProperties='<a:rPr lang="de-DE" sz="'+Math.round(fontSize*100)+'"'+(bold?' b="1"':'')+' dirty="0">'+
    '<a:solidFill><a:srgbClr val="'+color+'"/></a:solidFill><a:latin typeface="Aptos"/></a:rPr>'
  return cleanXmlText(value,12000).split(/\r?\n/).map((part,index)=>{
    return (index?'<a:br/>':'')+'<a:r>'+runProperties+'<a:t xml:space="preserve">'+escapeXml(part,12000)+'</a:t></a:r>'
  }).join('')
}

function textShape(id,name,text,x,y,width,height,fontSize,bold=false,color='1F2937'){
  return '<p:sp><p:nvSpPr><p:cNvPr id="'+id+'" name="'+escapeXml(name,80)+'"/>'+
    '<p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm>'+
    '<a:off x="'+emu(x)+'" y="'+emu(y)+'"/><a:ext cx="'+emu(width)+'" cy="'+emu(height)+'"/>'+
    '</a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr>'+
    '<p:txBody><a:bodyPr wrap="square" rtlCol="0" anchor="t" lIns="0" tIns="0" rIns="0" bIns="0"><a:normAutofit/></a:bodyPr>'+
    '<a:lstStyle/><a:p><a:pPr marL="0" indent="0"><a:buNone/></a:pPr>'+
    slideRuns(text,fontSize,bold,color)+'<a:endParaRPr lang="de-DE" sz="'+Math.round(fontSize*100)+'"/></a:p>'+
    '</p:txBody></p:sp>'
}

function slideXml(slideNumber,shapes){
  return XML_HEADER+'<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '+
    'xmlns:r="'+OFFICE_REL_NS+'" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'+
    '<p:cSld name="Slide '+slideNumber+'"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/>'+
    '<p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/>'+
    '<a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>'+
    shapes+'</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>'
}

function presentationTheme(){
  return XML_HEADER+'<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="AS Workspace Gold">'+
    '<a:themeElements><a:clrScheme name="AS Workspace Gold">'+
    '<a:dk1><a:sysClr val="windowText" lastClr="1F2937"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1>'+
    '<a:dk2><a:srgbClr val="111827"/></a:dk2><a:lt2><a:srgbClr val="F8FAFC"/></a:lt2>'+
    '<a:accent1><a:srgbClr val="9A7414"/></a:accent1><a:accent2><a:srgbClr val="C9A227"/></a:accent2>'+
    '<a:accent3><a:srgbClr val="355070"/></a:accent3><a:accent4><a:srgbClr val="6D597A"/></a:accent4>'+
    '<a:accent5><a:srgbClr val="4F772D"/></a:accent5><a:accent6><a:srgbClr val="B56576"/></a:accent6>'+
    '<a:hlink><a:srgbClr val="0563C1"/></a:hlink><a:folHlink><a:srgbClr val="954F72"/></a:folHlink>'+
    '</a:clrScheme><a:fontScheme name="Aptos"><a:majorFont><a:latin typeface="Aptos Display"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont>'+
    '<a:minorFont><a:latin typeface="Aptos"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme>'+
    '<a:fmtScheme name="AS Workspace Gold"><a:fillStyleLst>'+
    '<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>'+
    '<a:gradFill rotWithShape="1"><a:gsLst><a:gs pos="0"><a:schemeClr val="phClr"><a:tint val="50000"/><a:satMod val="300000"/></a:schemeClr></a:gs>'+
    '<a:gs pos="100000"><a:schemeClr val="phClr"><a:shade val="80000"/><a:satMod val="200000"/></a:schemeClr></a:gs></a:gsLst><a:lin ang="16200000" scaled="1"/></a:gradFill>'+
    '<a:solidFill><a:schemeClr val="phClr"><a:alpha val="100000"/></a:schemeClr></a:solidFill></a:fillStyleLst>'+
    '<a:lnStyleLst><a:ln w="6350" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln>'+
    '<a:ln w="12700" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln>'+
    '<a:ln w="19050" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln></a:lnStyleLst>'+
    '<a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>'+
    '<a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"><a:tint val="95000"/></a:schemeClr></a:solidFill>'+
    '<a:solidFill><a:schemeClr val="phClr"><a:shade val="80000"/></a:schemeClr></a:solidFill></a:bgFillStyleLst>'+
    '</a:fmtScheme></a:themeElements><a:objectDefaults/><a:extraClrSchemeLst/></a:theme>'
}

function slideMaster(){
  return XML_HEADER+'<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="'+OFFICE_REL_NS+'" '+
    'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:bg><p:bgPr>'+
    '<a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:effectLst/></p:bgPr></p:bg><p:spTree>'+
    '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>'+
    '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>'+
    '</p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" '+
    'accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>'+
    '<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst><p:hf sldNum="0" hdr="0" ftr="0" dt="0"/>'+
    '<p:txStyles><p:titleStyle><a:lvl1pPr algn="l"><a:defRPr sz="3200" b="1"/></a:lvl1pPr></p:titleStyle>'+
    '<p:bodyStyle><a:lvl1pPr algn="l"><a:defRPr sz="1800"/></a:lvl1pPr></p:bodyStyle>'+
    '<p:otherStyle><a:defPPr><a:defRPr lang="de-DE"/></a:defPPr><a:lvl1pPr algn="l"><a:defRPr sz="1800"/></a:lvl1pPr></p:otherStyle>'+
    '</p:txStyles></p:sldMaster>'
}

function slideLayout(){
  return XML_HEADER+'<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="'+OFFICE_REL_NS+'" '+
    'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" preserve="1"><p:cSld name="AS Workspace Gold">'+
    '<p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>'+
    '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>'+
    '</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>'
}

export async function createPptxBlob(rows){
  const normalized=Array.isArray(rows)&&rows.length?rows:[['AS Workspace Gold','']]
  const detailRows=normalized.slice(1)
  const groups=[]
  for(let index=0;index<detailRows.length;index+=4) groups.push(detailRows.slice(index,index+4))
  if(!groups.length) groups.push([])

  const slides=[]
  let titleShapes=textShape(2,'Title',normalized[0]?.[0]||'AS Workspace Gold',0.7,0.7,11.8,0.7,26,true,'1F2937')
  titleShapes+=textShape(3,'Subtitle',normalized[1]?.[1]||'',0.7,1.65,11.8,1.1,20,false,'9A7414')
  slides.push(slideXml(1,titleShapes))
  groups.forEach((group,groupIndex)=>{
    let id=2
    let shapes=textShape(id++,'Header','AS Workspace Gold',0.6,0.35,2.5,0.4,14,true,'9A7414')
    group.forEach((row,rowIndex)=>{
      const y=1+1.35*rowIndex
      shapes+=textShape(id++,'Label '+(rowIndex+1),row?.[0]||'',0.7,y,2.2,0.45,14,true,'1F2937')
      shapes+=textShape(id++,'Value '+(rowIndex+1),row?.[1]||'',3,y,9.2,1.05,13,false,'374151')
    })
    slides.push(slideXml(groupIndex+2,shapes))
  })

  const zip=new JSZip()
  const slideOverrides=slides.map((_,index)=>
    '<Override PartName="/ppt/slides/slide'+(index+1)+'.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>'
  ).join('')
  zip.file('[Content_Types].xml',XML_HEADER+
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'+
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'+
    '<Default Extension="xml" ContentType="application/xml"/>'+
    '<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>'+
    '<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>'+
    '<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>'+
    '<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>'+
    '<Override PartName="/ppt/presProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presProps+xml"/>'+
    '<Override PartName="/ppt/viewProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.viewProps+xml"/>'+
    '<Override PartName="/ppt/tableStyles.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml"/>'+
    slideOverrides+
    '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>'+
    '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>'+
    '</Types>')
  zip.file('_rels/.rels',rootRelationships('ppt/presentation.xml'))
  zip.file('docProps/core.xml',coreProperties(cleanXmlText(normalized[0]?.[0]||'AS Workspace Gold',255)))
  zip.file('docProps/app.xml',XML_HEADER+
    '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" '+
    'xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">'+
    '<Application>AS Workspace Gold</Application><PresentationFormat>Widescreen</PresentationFormat>'+
    '<Slides>'+slides.length+'</Slides><Notes>0</Notes><HiddenSlides>0</HiddenSlides><MMClips>0</MMClips>'+
    '<ScaleCrop>false</ScaleCrop><Company></Company><LinksUpToDate>false</LinksUpToDate><SharedDoc>false</SharedDoc>'+
    '<HyperlinksChanged>false</HyperlinksChanged><AppVersion>1.0</AppVersion></Properties>')

  const slideIds=slides.map((_,index)=>'<p:sldId id="'+(256+index)+'" r:id="rId'+(index+2)+'"/>').join('')
  zip.file('ppt/presentation.xml',XML_HEADER+
    '<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="'+OFFICE_REL_NS+'" '+
    'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" saveSubsetFonts="1">'+
    '<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>'+
    '<p:sldIdLst>'+slideIds+'</p:sldIdLst><p:sldSz cx="12192000" cy="6858000" type="screen16x9"/>'+
    '<p:notesSz cx="6858000" cy="9144000"/><p:defaultTextStyle><a:defPPr><a:defRPr lang="de-DE"/></a:defPPr>'+
    '<a:lvl1pPr marL="0" algn="l"><a:defRPr sz="1800"/></a:lvl1pPr></p:defaultTextStyle></p:presentation>')

  const extraStart=slides.length+2
  let presentationRels='<Relationship Id="rId1" Type="'+OFFICE_REL_NS+'/slideMaster" Target="slideMasters/slideMaster1.xml"/>'
  slides.forEach((_,index)=>{
    presentationRels+='<Relationship Id="rId'+(index+2)+'" Type="'+OFFICE_REL_NS+'/slide" Target="slides/slide'+(index+1)+'.xml"/>'
  })
  presentationRels+='<Relationship Id="rId'+extraStart+'" Type="'+OFFICE_REL_NS+'/presProps" Target="presProps.xml"/>'+
    '<Relationship Id="rId'+(extraStart+1)+'" Type="'+OFFICE_REL_NS+'/viewProps" Target="viewProps.xml"/>'+
    '<Relationship Id="rId'+(extraStart+2)+'" Type="'+OFFICE_REL_NS+'/theme" Target="theme/theme1.xml"/>'+
    '<Relationship Id="rId'+(extraStart+3)+'" Type="'+OFFICE_REL_NS+'/tableStyles" Target="tableStyles.xml"/>'
  zip.file('ppt/_rels/presentation.xml.rels',XML_HEADER+'<Relationships xmlns="'+RELATIONSHIP_NS+'">'+presentationRels+'</Relationships>')
  zip.file('ppt/theme/theme1.xml',presentationTheme())
  zip.file('ppt/slideMasters/slideMaster1.xml',slideMaster())
  zip.file('ppt/slideMasters/_rels/slideMaster1.xml.rels',XML_HEADER+'<Relationships xmlns="'+RELATIONSHIP_NS+'">'+
    '<Relationship Id="rId1" Type="'+OFFICE_REL_NS+'/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>'+
    '<Relationship Id="rId2" Type="'+OFFICE_REL_NS+'/theme" Target="../theme/theme1.xml"/></Relationships>')
  zip.file('ppt/slideLayouts/slideLayout1.xml',slideLayout())
  zip.file('ppt/slideLayouts/_rels/slideLayout1.xml.rels',XML_HEADER+'<Relationships xmlns="'+RELATIONSHIP_NS+'">'+
    '<Relationship Id="rId1" Type="'+OFFICE_REL_NS+'/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>')
  slides.forEach((slide,index)=>{
    zip.file('ppt/slides/slide'+(index+1)+'.xml',slide)
    zip.file('ppt/slides/_rels/slide'+(index+1)+'.xml.rels',XML_HEADER+'<Relationships xmlns="'+RELATIONSHIP_NS+'">'+
      '<Relationship Id="rId1" Type="'+OFFICE_REL_NS+'/slideLayout" Target="../slideLayouts/slideLayout1.xml"/></Relationships>')
  })
  zip.file('ppt/presProps.xml',XML_HEADER+'<p:presentationPr xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '+
    'xmlns:r="'+OFFICE_REL_NS+'" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"/>')
  zip.file('ppt/viewProps.xml',XML_HEADER+'<p:viewPr xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '+
    'xmlns:r="'+OFFICE_REL_NS+'" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'+
    '<p:normalViewPr/><p:slideViewPr><p:cSldViewPr><p:cViewPr><p:scale><a:sx n="1" d="1"/><a:sy n="1" d="1"/></p:scale>'+
    '<p:origin x="0" y="0"/></p:cViewPr><p:guideLst/></p:cSldViewPr></p:slideViewPr><p:gridSpacing cx="76200" cy="76200"/></p:viewPr>')
  zip.file('ppt/tableStyles.xml',XML_HEADER+'<a:tblStyleLst xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '+
    'def="{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}"/>')

  return zipBlob(zip,'application/vnd.openxmlformats-officedocument.presentationml.presentation')
}
